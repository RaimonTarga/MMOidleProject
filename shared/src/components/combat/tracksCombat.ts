import type { StatusEffect } from './effects';
import type {
  ResolvedLineageCapstone, ResolvedLineageCard,
} from '../../data/lineages/types';

/**
 * The lineage cards actually in play on a player, resolved once at recalc
 * (progression rework Phase 1c).
 *
 * Cached rather than resolved per hit because `resolveActiveLineages` walks every
 * lineage the player has ever opened and re-reads the magnitude table for each
 * active card — work that cannot change between recalcs, and that would otherwise
 * run on every swing of every player in the node.
 */
export interface LineageRuntime {
  cards: ResolvedLineageCard[];
  capstones: ResolvedLineageCapstone[];
}

/** Input shape for applyStatusEffect. All optional fields have sensible defaults. */
export interface StatusEffectConfig {
  id: string;
  maxStacks?: number;    // default: 0 (no cap)
  remainingMs?: number;  // default: -1 (permanent)
  refreshable?: boolean; // default: false
  instanced?: boolean;   // default: false
  sourceId: string;
  damageSource?: StatusEffect['damageSource'];
  data?: Record<string, number>;
}

/**
 * Server-side combat state bag. Never serialized or sent to clients.
 * Lives on `entity.tracksCombat` for players and monsters.
 *
 * Field semantics:
 *   counters      — integer step/hit/combo counts (cadence, charge, etc.)
 *   resources     — float pools (energy, heat, reload progress, etc.)
 *   resourceMaxes — maximum capacity per resource key; absent = uncapped
 *   cooldowns     — remaining milliseconds; decremented each tick; 0 = ready
 *   flags         — boolean states (stunned, shielded, empowered, etc.)
 *   strings       — arbitrary string values; used for attacker attribution, state labels, etc.
 *   statusEffects — unified buff/debuff list; managed via statusEffects.ts API
 *   lineageRuntime — resolved lineage cards in play, refreshed on recalc
 */
export interface TracksCombat {
  counters:      Record<string, number>;
  resources:     Record<string, number>;
  resourceMaxes: Record<string, number>;
  cooldowns:     Record<string, number>;
  flags:         Record<string, boolean>;
  strings:       Record<string, string>;
  statusEffects: StatusEffect[];
  /**
   * Resolved lineage cards, or absent when the player has no tree in play.
   * Read through {@link getLineageRuntime} / written through
   * {@link setLineageRuntime} — never by reaching for the field.
   */
  lineageRuntime?: LineageRuntime;
}

export function makeTracksCombat(): TracksCombat {
  return {
    counters:      {},
    resources:     {},
    resourceMaxes: {},
    cooldowns:     {},
    flags:         {},
    strings:       {},
    statusEffects: [],
  };
}

/** Clear all fields in-place (preserves the object reference). */
export function resetTracksCombat(state: TracksCombat): void {
  state.counters      = {};
  state.resources     = {};
  state.resourceMaxes = {};
  state.cooldowns     = {};
  state.flags         = {};
  state.strings       = {};
  state.statusEffects = [];
  delete state.lineageRuntime;
}

// Lineage runtime (progression rework Phase 1c)

/**
 * The resolved lineage cards in play, or undefined when none are.
 *
 * Undefined and an empty card list mean the same thing to a caller, so the
 * runtime treats a missing cache as "nothing to do" rather than as a signal to
 * resolve lazily: the cache is a recalc product, and resolving it anywhere else
 * would make two sites responsible for the same answer.
 */
export function getLineageRuntime(state: TracksCombat): LineageRuntime | undefined {
  return state.lineageRuntime;
}

/** Replace the cache. Passing nothing (or an empty runtime) clears it. */
export function setLineageRuntime(state: TracksCombat, runtime?: LineageRuntime): void {
  if (!runtime || (runtime.cards.length === 0 && runtime.capstones.length === 0)) {
    delete state.lineageRuntime;
    return;
  }
  state.lineageRuntime = runtime;
}

// Counters

export function getCounter(state: TracksCombat, key: string): number {
  return state.counters[key] ?? 0;
}

export function addCounter(state: TracksCombat, key: string, amount: number): void {
  state.counters[key] = (state.counters[key] ?? 0) + amount;
}

export function setCounter(state: TracksCombat, key: string, value: number): void {
  state.counters[key] = value;
}

export function resetCounter(state: TracksCombat, key: string): void {
  state.counters[key] = 0;
}

// Resources

export function getResource(state: TracksCombat, key: string): number {
  return state.resources[key] ?? 0;
}

export function setResource(state: TracksCombat, key: string, value: number): void {
  state.resources[key] = value;
}

export function addResource(state: TracksCombat, key: string, amount: number): void {
  state.resources[key] = (state.resources[key] ?? 0) + amount;
}

// Flags

export function getFlag(state: TracksCombat, key: string): boolean {
  return state.flags[key] ?? false;
}

export function setFlag(state: TracksCombat, key: string, value: boolean): void {
  state.flags[key] = value;
}

// Strings

export function getString(state: TracksCombat, key: string): string | undefined {
  return state.strings[key];
}

export function setString(state: TracksCombat, key: string, value: string): void {
  state.strings[key] = value;
}

// Cooldowns (remaining ms — 0 means ready/inactive)

export function getCooldown(state: TracksCombat, key: string): number {
  return Math.max(0, state.cooldowns[key] ?? 0);
}

export function setCooldown(state: TracksCombat, key: string, ms: number): void {
  state.cooldowns[key] = Math.max(0, ms);
}

export function isCooldownActive(state: TracksCombat, key: string): boolean {
  return (state.cooldowns[key] ?? 0) > 0;
}

// ── Per-tick updates ──────────────────────────────────────────────────────────

export function tickCooldowns(state: TracksCombat, dt: number): void {
  for (const key of Object.keys(state.cooldowns)) {
    const remaining = state.cooldowns[key] - dt;
    state.cooldowns[key] = remaining > 0 ? remaining : 0;
  }
}

/**
 * Decrement remainingMs on all duration-based status effects and prune expired ones.
 * Permanent effects (remainingMs === -1) are unaffected.
 *
 * Tick-driven effects can opt into a same-step final tick with data.tickOnExpire = 1.
 * This keeps the effect alive only when its next owner-managed tick is due during
 * the same dt that expires the duration.
 */
export function tickStatusEffectDurations(state: TracksCombat, dt: number): void {
  const keepForFinalTick = new Set<StatusEffect>();
  for (const effect of state.statusEffects) {
    if (effect.remainingMs > 0) {
      effect.remainingMs -= dt;
      if (effect.remainingMs < 0) effect.remainingMs = 0;
      if (
        effect.remainingMs === 0 &&
        effect.data['tickOnExpire'] === 1 &&
        (effect.data['nextTickIn'] ?? Infinity) <= dt
      ) {
        keepForFinalTick.add(effect);
      }
    }
  }
  state.statusEffects = state.statusEffects.filter(e =>
    e.remainingMs !== 0 || keepForFinalTick.has(e),
  );
}

