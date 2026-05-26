/**
 * Unified buff / debuff API built on TracksCombat.statusEffects.
 *
 * Two application modes:
 *   Stacked   (instanced: false) — re-applying the same id adds a stack to the
 *             existing entry (up to maxStacks). A single entry represents the full
 *             effect. Used for DoT poison, slow stacks, etc.
 *
 *   Instanced (instanced: true)  — each application always creates a new independent
 *             entry, even when the id already exists. Used for effects whose instances
 *             have independent timers (Ashbrand burns, separate damage-over-time sources).
 *
 * Tick management:
 *   Per-effect tick timers live in effect.data (nextTickIn, tickIntervalMs, ticksLeft).
 *   Each archetype system handles its own tick loop — decrement data.nextTickIn, deal
 *   damage, reset the timer, and call pruneStatusEffects to remove exhausted instances.
 *
 * Duration management:
 *   effect.remainingMs is decremented automatically by updateTracksCombat each world tick.
 *   When it reaches 0 the effect is removed. Set remainingMs = -1 for permanent effects.
 */

import type { StatusEffect } from './effects';
import type { TracksCombat, StatusEffectConfig } from './tracksCombat';

// ── Apply ─────────────────────────────────────────────────────────────────────

/**
 * Apply a buff or debuff to a TracksCombat.
 *
 * Stacked mode: if an effect with the same id exists and stacks < maxStacks (or
 * maxStacks === 0), increments stacks. If refreshable, also resets remainingMs.
 * If the cap is already reached, only refreshes duration (if refreshable).
 * Creates a new entry when none exists.
 *
 * Instanced mode: always pushes a new entry regardless of existing effects.
 *
 * Returns the mutated (or newly created) StatusEffect.
 */
export function applyStatusEffect(
  state: TracksCombat,
  config: StatusEffectConfig,
): StatusEffect {
  const instanced   = config.instanced   ?? false;
  const maxStacks   = config.maxStacks   ?? 0;
  const remainingMs = config.remainingMs ?? -1;
  const refreshable = config.refreshable ?? false;

  if (!instanced) {
    const existing = state.statusEffects.find(e => e.id === config.id);
    if (existing) {
      if (maxStacks === 0 || existing.stacks < maxStacks) {
        existing.stacks++;
      }
      if (refreshable) {
        existing.remainingMs = remainingMs;
      }
      existing.sourceId = config.sourceId; // latest attacker gets kill credit
      return existing;
    }
  }

  const effect: StatusEffect = {
    id:           config.id,
    stacks:       1,
    maxStacks,
    remainingMs,
    refreshable,
    instanced,
    sourceId:     config.sourceId,
    data:         { ...(config.data ?? {}) },
  };
  state.statusEffects.push(effect);
  return effect;
}

// ── Remove / cleanse ──────────────────────────────────────────────────────────

/** Remove ALL instances of an effect by id (full cleanse). */
export function removeStatusEffect(state: TracksCombat, id: string): void {
  state.statusEffects = state.statusEffects.filter(e => e.id !== id);
}

/**
 * Reduce stacks on a stacked (non-instanced) effect by n.
 * Removes the effect entirely if stacks reach 0.
 */
export function removeStatusEffectStacks(
  state: TracksCombat,
  id: string,
  n: number,
): void {
  const effect = state.statusEffects.find(e => e.id === id && !e.instanced);
  if (!effect) return;
  effect.stacks = Math.max(0, effect.stacks - n);
  if (effect.stacks === 0) {
    state.statusEffects = state.statusEffects.filter(e => e !== effect);
  }
}

/**
 * Remove instances matching a custom predicate.
 * Use this to prune exhausted instanced effects (e.g. burns with ticksLeft === 0).
 */
export function pruneStatusEffects(
  state: TracksCombat,
  predicate: (e: StatusEffect) => boolean,
): void {
  state.statusEffects = state.statusEffects.filter(e => !predicate(e));
}

// ── Renew ─────────────────────────────────────────────────────────────────────

/** Reset the remaining duration on all active instances of an effect. */
export function renewStatusEffect(
  state: TracksCombat,
  id: string,
  ms: number,
): void {
  for (const e of state.statusEffects) {
    if (e.id === id) e.remainingMs = ms;
  }
}

// ── Query ─────────────────────────────────────────────────────────────────────

/** All active instances of an effect id. */
export function getStatusEffects(state: TracksCombat, id: string): StatusEffect[] {
  return state.statusEffects.filter(e => e.id === id);
}

/** The first (and for stacked effects, only) instance of an effect. */
export function getStatusEffect(state: TracksCombat, id: string): StatusEffect | undefined {
  return state.statusEffects.find(e => e.id === id);
}

/** Sum of stacks across all instances of an effect id. */
export function getTotalStacks(state: TracksCombat, id: string): number {
  return state.statusEffects
    .filter(e => e.id === id)
    .reduce((sum, e) => sum + e.stacks, 0);
}

/** True if at least one instance of the effect is active. */
export function hasStatusEffect(state: TracksCombat, id: string): boolean {
  return state.statusEffects.some(e => e.id === id);
}
