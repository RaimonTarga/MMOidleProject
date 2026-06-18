/**
 * Weapon family constants and lookup maps.
 * Shared between server combat logic and client display — edit here to
 * change both behavior and the stat-sheet description at the same time.
 */
import type { DamageElement } from './dotElements';

// ── Abyss ultimate weapon ───────────────────────────────────────────────────

export const EDGE_OF_OBLIVION_ID = 'edge-of-oblivion';

/** Status effect id for Edge of Oblivion corruption stacks. */
export const VOID_CORRUPTION_EFFECT_ID = 'void-corruption';

/** Fraction of attack converted into per-stack tick damage (÷ max stacks). */
export const CORRUPTION_CONV_PCT = 0.40;
export const CORRUPTION_TICK_MS = 1_000;
export const CORRUPTION_DURATION_MS = 4_500;
export const CORRUPTION_DOT_MULT = 1.35;
/** Movement speed multiplier reduction per stack (additive on mult: 1 − stacks × rate). */
export const CORRUPTION_SLOW_PER_STACK = 0.05;
export const CORRUPTION_MIN_SPEED_MULT = 0.35;

// ── Brittle (Tundra weapon armor-shred) ─────────────────────────────────────

/**
 * Player-applied debuff that reduces the target monster's plating and damage
 * reduction. Driven by the `weapon.brittle-plating` / `weapon.brittle-dr` /
 * `weapon.brittle-stacks` passives, so any item granting them gains the effect.
 * Stacks on each hit (capped at brittle-stacks), refreshing the timer; read at
 * damage time in effectivePlating.ts (no DoT tick). data: { platingPerStack, drPerStack }.
 */
export const BRITTLE_EFFECT_ID = 'brittle';
/** Duration refreshed on each brittle application, matching other on-hit debuffs. */
export const BRITTLE_DURATION_MS = 4_500;
/**
 * Brittle-shatter DR strip: while this effect is on a monster, its damage
 * reduction is treated as 0. Applied by weapons with `weapon.brittle-shatter-*`
 * when brittle reaches the shatter threshold; read in effectivePlating.ts.
 */
export const DR_SHATTER_EFFECT_ID = 'dr-shatter';

// ── Chaotic family (Chaotic Axe / Frenzied Greataxe) ────────────────────────

/** Every Nth player hit deals 0 damage (on-hit effects still fire). */
export const CHAOTIC_MISS_EVERY  = 3;
export const FRENZIED_MISS_EVERY = 4;

/** tracksCombat counter key tracking the chaotic hit cycle (server-only). */
export const CHAOTIC_HIT_COUNTER_KEY = 'chaoticHits';

export const CHAOTIC_FAMILY: Record<string, number> = {
  'chaotic-axe':       CHAOTIC_MISS_EVERY,
  'frenzied-greataxe': FRENZIED_MISS_EVERY,
};

// ── Sacred family (Sacred Cross / Consecrated Cross) ────────────────────────

/** Cooldown between burst procs (ms). */
export const SACRED_CD_MS        = 6_000;
/** Burst window duration (ms). */
export const SACRED_BUFF_MS      = 2_000;
export const CONSECRATED_CD_MS   = 7_000;
export const CONSECRATED_BUFF_MS = 4_000;
/** Damage multiplier during burst window. */
export const SACRED_DMG_MULT  = 3;
/** Attack-speed multiplier during burst window (cooldown divided by this). */
export const SACRED_APS_MULT  = 2;

export const SACRED_FAMILY: Record<string, { cdMs: number; buffMs: number }> = {
  'sacred-cross':      { cdMs: SACRED_CD_MS,      buffMs: SACRED_BUFF_MS      },
  'consecrated-cross': { cdMs: CONSECRATED_CD_MS, buffMs: CONSECRATED_BUFF_MS },
};

// ── Burn family (Ashbrand / Cinderfang / Frostmourne) ────────────────────────

export const ASHBRAND_CONV_PCT    = 0.30;
/** Burn-stack tick interval (ms), shared across the whole family. */
export const ASHBRAND_TICK_MS     = 1_000;
/** Burn-stack duration without a refreshing hit (ms). */
export const ASHBRAND_DURATION_MS = 4_500;
export const ASHBRAND_DOT_MULT    = 1.15;

export interface BurnWeaponEntry {
  weaponId:  string;
  effectId:  string;
  convPct:   number;
  tickIntervalMs: number;
  drainDurationMs: number;
  dotMultiplier: number;
  /** DoT element for damage-number flavor (color/glyph). */
  element:   DamageElement;
  slowPerStack?: number;
}

// All burn-DoT weapons. convPct mirrors each weapon's recipe dot-conversion key;
// element drives damage-number flavor + target tile.
// effectIds MUST be unique per weapon (the tick loop iterates the id set).
export const BURN_FAMILY: BurnWeaponEntry[] = [
  // Swamp — hot/fire line (ashbrand → mirebrand → blightbrand) and cold/frost line.
  { weaponId: 'ashbrand-blade',    effectId: 'ashbrand-burn',          convPct: ASHBRAND_CONV_PCT, tickIntervalMs: ASHBRAND_TICK_MS, drainDurationMs: ASHBRAND_DURATION_MS, dotMultiplier: ASHBRAND_DOT_MULT, element: 'fire'  },
  { weaponId: 'swamp-mirebrand',   effectId: 'swamp-mirebrand-burn',   convPct: 0.30, tickIntervalMs: ASHBRAND_TICK_MS, drainDurationMs: ASHBRAND_DURATION_MS, dotMultiplier: ASHBRAND_DOT_MULT, element: 'fire'  },
  { weaponId: 'swamp-blightbrand', effectId: 'swamp-blightbrand-burn', convPct: 0.30, tickIntervalMs: ASHBRAND_TICK_MS, drainDurationMs: ASHBRAND_DURATION_MS, dotMultiplier: ASHBRAND_DOT_MULT, element: 'fire'  },
  { weaponId: 'swamp-frostbrand',  effectId: 'swamp-frostbrand-burn',  convPct: 0.45, tickIntervalMs: ASHBRAND_TICK_MS, drainDurationMs: ASHBRAND_DURATION_MS, dotMultiplier: ASHBRAND_DOT_MULT, element: 'frost' },
  { weaponId: 'swamp-rimebrand',   effectId: 'swamp-rimebrand-burn',   convPct: 0.45, tickIntervalMs: ASHBRAND_TICK_MS, drainDurationMs: ASHBRAND_DURATION_MS, dotMultiplier: ASHBRAND_DOT_MULT, element: 'frost' },
  // T4 DoT weapons — same burn mechanic, values mirror their recipe dot-conversion keys.
  { weaponId: 'tundra-glacial-rimebrand', effectId: 'rimebrand-burn',   convPct: 0.45, tickIntervalMs: ASHBRAND_TICK_MS, drainDurationMs: ASHBRAND_DURATION_MS, dotMultiplier: ASHBRAND_DOT_MULT, element: 'frost' },
  { weaponId: 'volcanic-blightbrand',     effectId: 'blightbrand-burn', convPct: 0.30, tickIntervalMs: ASHBRAND_TICK_MS, drainDurationMs: ASHBRAND_DURATION_MS, dotMultiplier: ASHBRAND_DOT_MULT, element: 'fire'  },
  { weaponId: EDGE_OF_OBLIVION_ID, effectId: VOID_CORRUPTION_EFFECT_ID, convPct: CORRUPTION_CONV_PCT, tickIntervalMs: CORRUPTION_TICK_MS, drainDurationMs: CORRUPTION_DURATION_MS, dotMultiplier: CORRUPTION_DOT_MULT, element: 'doom', slowPerStack: CORRUPTION_SLOW_PER_STACK },
];

export function weaponDotProfileForWeapon(weaponId: string): BurnWeaponEntry | undefined {
  return BURN_FAMILY.find((entry) => entry.weaponId === weaponId);
}

export function weaponDotProfileForEffect(effectId: string): BurnWeaponEntry | undefined {
  return BURN_FAMILY.find((entry) => entry.effectId === effectId);
}
