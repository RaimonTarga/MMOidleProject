import type { StatusEffect } from '@mmo-idle/shared';

// StatusEffect type lives in @mmo-idle/shared/components/effects so pure DoT
// damage formulas can take it as input. Re-exported here for ECS consumers.
export type { StatusEffect } from '@mmo-idle/shared';

/** Input shape for applyStatusEffect. All optional fields have sensible defaults. */
export interface StatusEffectConfig {
  id: string;
  maxStacks?: number;    // default: 0 (no cap)
  remainingMs?: number;  // default: -1 (permanent)
  refreshable?: boolean; // default: false
  instanced?: boolean;   // default: false
  sourceId: string;
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
 *   stacks        — non-negative accumulations (legacy; prefer statusEffects for new mechanics)
 *   strings       — arbitrary string values; used for attacker attribution, state labels, etc.
 *   statusEffects — unified buff/debuff list; managed via statusEffects.ts API
 */
export interface TracksCombat {
  counters:      Record<string, number>;
  resources:     Record<string, number>;
  resourceMaxes: Record<string, number>;
  cooldowns:     Record<string, number>;
  flags:         Record<string, boolean>;
  stacks:        Record<string, number>;
  strings:       Record<string, string>;
  statusEffects: StatusEffect[];
}

export function makeTracksCombat(): TracksCombat {
  return {
    counters:      {},
    resources:     {},
    resourceMaxes: {},
    cooldowns:     {},
    flags:         {},
    stacks:        {},
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
  state.stacks        = {};
  state.strings       = {};
  state.statusEffects = [];
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

// Stacks (legacy — prefer StatusEffect for new mechanics)

export function getStack(state: TracksCombat, key: string): number {
  return state.stacks[key] ?? 0;
}

export function addStack(state: TracksCombat, key: string, amount: number): void {
  state.stacks[key] = Math.max(0, (state.stacks[key] ?? 0) + amount);
}

export function resetStack(state: TracksCombat, key: string): void {
  state.stacks[key] = 0;
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
 */
export function tickStatusEffectDurations(state: TracksCombat, dt: number): void {
  for (const effect of state.statusEffects) {
    if (effect.remainingMs > 0) {
      effect.remainingMs -= dt;
      if (effect.remainingMs < 0) effect.remainingMs = 0;
    }
  }
  state.statusEffects = state.statusEffects.filter(e => e.remainingMs !== 0);
}

/** @deprecated Use TracksCombat */
export type CombatState = TracksCombat;

/** @deprecated Use makeTracksCombat */
export const makeCombatState = makeTracksCombat;

/** @deprecated Use resetTracksCombat */
export const resetCombatState = resetTracksCombat;
