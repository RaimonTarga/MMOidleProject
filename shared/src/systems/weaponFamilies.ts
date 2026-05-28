/**
 * Weapon family constants and lookup maps.
 * Shared between server combat logic and client display — edit here to
 * change both behavior and the stat-sheet description at the same time.
 */

// ── Chaotic family (Chaotic Axe / Frenzied Greataxe) ────────────────────────

/** Every Nth player hit deals 0 damage (on-hit effects still fire). */
export const CHAOTIC_MISS_EVERY  = 3;
export const FRENZIED_MISS_EVERY = 4;

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
export const ASHBRAND_MAX_STACKS  = 5;
/** Burn-stack tick interval (ms), shared across the whole family. */
export const ASHBRAND_TICK_MS     = 1_000;
/** Burn-stack duration without a refreshing hit (ms). */
export const ASHBRAND_DURATION_MS = 4_500;

export const CINDERFANG_CONV_PCT   = 0.30;
export const CINDERFANG_MAX_STACKS = 7;

export const FROSTMOURNE_CONV_PCT   = 0.50;
export const FROSTMOURNE_MAX_STACKS = 3;

export interface BurnWeaponEntry {
  weaponId:  string;
  effectId:  string;
  convPct:   number;
  maxStacks: number;
}

export const BURN_FAMILY: BurnWeaponEntry[] = [
  { weaponId: 'ashbrand-blade',   effectId: 'ashbrand-burn',   convPct: ASHBRAND_CONV_PCT,   maxStacks: ASHBRAND_MAX_STACKS   },
  { weaponId: 'cinderfang-saber', effectId: 'cinderfang-burn', convPct: CINDERFANG_CONV_PCT, maxStacks: CINDERFANG_MAX_STACKS },
  { weaponId: 'frostmourne-mace', effectId: 'frostmourne-burn',      convPct: FROSTMOURNE_CONV_PCT, maxStacks: FROSTMOURNE_MAX_STACKS },
];
