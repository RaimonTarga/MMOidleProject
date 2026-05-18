import { getResource, setResource } from './combatState';
import type { CombatState } from './combatState';

// ── Max capacity ──────────────────────────────────────────────────────────────

/** Returns the declared maximum for a resource, or Infinity if none is set. */
export function getMaxResource(state: CombatState, key: string): number {
  return state.resourceMaxes[key] ?? Infinity;
}

/** Declare a maximum capacity. Must be called before the resource is used
 *  if clamping or full/empty checks are needed. */
export function setMaxResource(state: CombatState, key: string, value: number): void {
  state.resourceMaxes[key] = value;
}

// ── Gain / spend ──────────────────────────────────────────────────────────────

/**
 * Add `amount` to a resource, clamping at its declared maximum.
 * If no maximum is set the resource grows without bound.
 * Returns the value after gain.
 */
export function gainResource(state: CombatState, key: string, amount: number): number {
  const current = getResource(state, key);
  const max     = getMaxResource(state, key);
  const next    = max === Infinity ? current + amount : Math.min(current + amount, max);
  setResource(state, key, next);
  return next;
}

/**
 * Remove `amount` from a resource, clamping at 0.
 * Returns true if there was enough to spend (the spend happened),
 * false if the resource was insufficient (no change applied).
 */
export function spendResource(state: CombatState, key: string, amount: number): boolean {
  const current = getResource(state, key);
  if (current < amount) return false;
  setResource(state, key, current - amount);
  return true;
}

// ── Queries ───────────────────────────────────────────────────────────────────

/** True when the resource value is ≥ its declared maximum. */
export function isResourceFull(state: CombatState, key: string): boolean {
  const max = state.resourceMaxes[key];
  if (max === undefined) return false; // uncapped = never full
  return (state.resources[key] ?? 0) >= max;
}

/** True when the resource value is ≤ 0. */
export function isResourceEmpty(state: CombatState, key: string): boolean {
  return (state.resources[key] ?? 0) <= 0;
}

/**
 * Current fill ratio in [0, 1].
 * Returns 0 if no maximum is declared or if maximum is 0.
 */
export function getResourcePercent(state: CombatState, key: string): number {
  const max = state.resourceMaxes[key];
  if (!max) return 0;
  return Math.min(1, (state.resources[key] ?? 0) / max);
}

// ── Reset ─────────────────────────────────────────────────────────────────────

/** Set the resource current value to 0. Does not touch the declared maximum. */
export function resetResource(state: CombatState, key: string): void {
  setResource(state, key, 0);
}
