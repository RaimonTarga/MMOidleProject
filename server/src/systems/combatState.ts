import type { World } from '../world/World';

// ── Burn state (Ashbrand Blade weapon effect) ─────────────────────────────────

/** One independent fire burn tick applied by the Ashbrand Blade. */
export interface BurnState {
  /** Damage dealt to the target each tick. */
  damagePerTick: number;
  /** Number of ticks remaining before the burn expires. */
  ticksLeft: number;
  /** Milliseconds until the next tick fires; decremented by dt each world tick. */
  nextTickIn: number;
  /** Player ID to credit if this burn deals the killing blow. */
  attackerId: string;
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
 *   stacks        — non-negative accumulations (burn stacks, poison, etc.)
 */
export interface CombatState {
  counters:      Record<string, number>;
  resources:     Record<string, number>;
  resourceMaxes: Record<string, number>;
  cooldowns:     Record<string, number>;
  flags:         Record<string, boolean>;
  stacks:        Record<string, number>;
  /** Arbitrary string values — used for attacker attribution, state labels, etc. */
  strings:       Record<string, string>;
  /** Active fire burns from the Ashbrand Blade (stored on monster combat state). */
  burns:         BurnState[];
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
    burns:         [],
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
  state.burns         = [];
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

// Stacks

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

// ── Per-tick update ───────────────────────────────────────────────────────────

/** Advance all remaining-duration cooldowns by dt ms. */
function tickCooldowns(state: CombatState, dt: number): void {
  for (const key of Object.keys(state.cooldowns)) {
    const remaining = state.cooldowns[key] - dt;
    state.cooldowns[key] = remaining > 0 ? remaining : 0;
  }
}

/**
 * Run at the top of every world tick so cooldowns are decremented before
 * any combat or AI system reads them.
 */
export function updateCombatState(world: World, dt: number): void {
  for (const state of world.playerCombatState.values()) {
    tickCooldowns(state, dt);
  }
  for (const state of world.monsterCombatState.values()) {
    tickCooldowns(state, dt);
  }
}
