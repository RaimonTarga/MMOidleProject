import type { World } from '../world/World';

// ── Status effects ─────────────────────────────────────────────────────────────

/**
 * A named buff or debuff on an entity. Lives in CombatState.statusEffects.
 * Never sent to the client directly — client-visible state (e.g. DoT stack count)
 * is mirrored to PlayerState/MonsterState in each system's update function.
 */
export interface StatusEffect {
  /** Effect type identifier — e.g. 'dot', 'ashbrand-burn', 'slow'. */
  id: string;
  /** Current stack count. For non-stacking effects, always 1. */
  stacks: number;
  /** Maximum stacks allowed. 0 = no cap. Ignored for instanced effects. */
  maxStacks: number;
  /**
   * Remaining duration in ms. -1 = permanent (never expires by timer).
   * Decremented by tickStatusEffectDurations each world tick.
   * When it reaches 0 the effect is automatically removed.
   */
  remainingMs: number;
  /**
   * If true, re-applying this effect resets remainingMs to the configured value.
   * No effect on instanced effects (each application is always a new entry).
   */
  refreshable: boolean;
  /**
   * If true, every application creates a new independent entry even when one
   * with the same id already exists (used for Ashbrand burns running in parallel).
   * If false, applications add a stack to the existing entry instead.
   */
  instanced: boolean;
  /** Entity that applied this effect — used for kill-credit attribution. */
  sourceId: string;
  /**
   * Effect-specific numeric payload. No enforced schema per-type.
   * Tick-based effects should store:
   *   nextTickIn    — ms until the next tick fires (decremented by the owner system).
   *   tickIntervalMs — reset value for nextTickIn after each tick.
   * Finite-tick effects additionally store:
   *   ticksLeft — remaining ticks; owner system removes the effect when this hits 0.
   */
  data: Record<string, number>;
}

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

// ── Shape ─────────────────────────────────────────────────────────────────────

/**
 * Server-side only. Never serialized or sent to clients.
 * Lives in World.playerCombatState / World.monsterCombatState.
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
export interface CombatState {
  counters:      Record<string, number>;
  resources:     Record<string, number>;
  resourceMaxes: Record<string, number>;
  cooldowns:     Record<string, number>;
  flags:         Record<string, boolean>;
  stacks:        Record<string, number>;
  strings:       Record<string, string>;
  statusEffects: StatusEffect[];
}

// ── Factory ───────────────────────────────────────────────────────────────────

export function makeCombatState(): CombatState {
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
export function resetCombatState(state: CombatState): void {
  state.counters      = {};
  state.resources     = {};
  state.resourceMaxes = {};
  state.cooldowns     = {};
  state.flags         = {};
  state.stacks        = {};
  state.strings       = {};
  state.statusEffects = [];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// Counters

export function getCounter(state: CombatState, key: string): number {
  return state.counters[key] ?? 0;
}

export function addCounter(state: CombatState, key: string, amount: number): void {
  state.counters[key] = (state.counters[key] ?? 0) + amount;
}

export function setCounter(state: CombatState, key: string, value: number): void {
  state.counters[key] = value;
}

export function resetCounter(state: CombatState, key: string): void {
  state.counters[key] = 0;
}

// Resources

export function getResource(state: CombatState, key: string): number {
  return state.resources[key] ?? 0;
}

export function setResource(state: CombatState, key: string, value: number): void {
  state.resources[key] = value;
}

export function addResource(state: CombatState, key: string, amount: number): void {
  state.resources[key] = (state.resources[key] ?? 0) + amount;
}

// Flags

export function getFlag(state: CombatState, key: string): boolean {
  return state.flags[key] ?? false;
}

export function setFlag(state: CombatState, key: string, value: boolean): void {
  state.flags[key] = value;
}

// Stacks (legacy — prefer StatusEffect for new mechanics)

export function getStack(state: CombatState, key: string): number {
  return state.stacks[key] ?? 0;
}

export function addStack(state: CombatState, key: string, amount: number): void {
  state.stacks[key] = Math.max(0, (state.stacks[key] ?? 0) + amount);
}

export function resetStack(state: CombatState, key: string): void {
  state.stacks[key] = 0;
}

// Strings

export function getString(state: CombatState, key: string): string | undefined {
  return state.strings[key];
}

export function setString(state: CombatState, key: string, value: string): void {
  state.strings[key] = value;
}

// Cooldowns (remaining ms — 0 means ready/inactive)

export function getCooldown(state: CombatState, key: string): number {
  return Math.max(0, state.cooldowns[key] ?? 0);
}

export function setCooldown(state: CombatState, key: string, ms: number): void {
  state.cooldowns[key] = Math.max(0, ms);
}

export function isCooldownActive(state: CombatState, key: string): boolean {
  return (state.cooldowns[key] ?? 0) > 0;
}

// ── Per-tick updates ──────────────────────────────────────────────────────────

function tickCooldowns(state: CombatState, dt: number): void {
  for (const key of Object.keys(state.cooldowns)) {
    const remaining = state.cooldowns[key] - dt;
    state.cooldowns[key] = remaining > 0 ? remaining : 0;
  }
}

/**
 * Decrement remainingMs on all duration-based status effects and prune expired ones.
 * Permanent effects (remainingMs === -1) are unaffected.
 * Per-effect tick timers (data.nextTickIn) are NOT touched here —
 * each archetype system is responsible for its own tick logic.
 */
function tickStatusEffectDurations(state: CombatState, dt: number): void {
  for (const effect of state.statusEffects) {
    if (effect.remainingMs > 0) {
      effect.remainingMs -= dt;
      if (effect.remainingMs < 0) effect.remainingMs = 0;
    }
  }
  // remainingMs === 0 means just-expired; -1 means permanent → keep both
  // Wait: after decrement, expired effects have remainingMs === 0.
  // Permanent effects have remainingMs === -1 (never decremented).
  // We remove only those that have expired (reached 0 from a positive starting value).
  // Problem: how do we distinguish "expired" (was positive, became 0) from "no duration" (-1)?
  // The initial value is either > 0 (timed) or -1 (permanent), never 0.
  // So: any effect with remainingMs === 0 has just expired and should be removed.
  state.statusEffects = state.statusEffects.filter(e => e.remainingMs !== 0);
}

/**
 * Run at the top of every world tick so cooldowns and status effect durations are
 * decremented before any combat or AI system reads them.
 */
export function updateCombatState(world: World, dt: number): void {
  for (const state of world.playerCombatState.values()) {
    tickCooldowns(state, dt);
    tickStatusEffectDurations(state, dt);
  }
  for (const state of world.monsterCombatState.values()) {
    tickCooldowns(state, dt);
    tickStatusEffectDurations(state, dt);
  }
}
