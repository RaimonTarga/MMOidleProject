// ── Energy T3 constants ──────────────────────────────────────────────────────

// Light — Flash (energy-light-t3-a)
export const FLASH_OFFSET_MIN_PX = 34;
export const FLASH_OFFSET_MAX_PX = 46;
export const FLASH_OVERSHOOT_SPREAD_RAD = 1.35;
export const FLASH_ENERGY_PER_HIT = 5;
export const FLASH_MAX_DAMAGE_SHIFT_PCT = 0.45;
export const FLASH_MAX_SPEED_BONUS_PCT = 0.45;
export const FLASH_MAX_EVASION_BONUS_PCT = 0.45;
export const FLASH_MIN_ATTACK_COOLDOWN = 200;
export const FLASH_SHIFT_DECAY_MS = 2_000;

// Light — Micro-Venting (energy-light-t3-b)
export const MV_ENERGY_COST = 15;   // energy consumed per vent
export const MV_FLAT_DAMAGE = 20;   // flat bonus damage when venting
export const MV_THRESHOLD   = 0.5;  // must be strictly above 50%

// Light — Polarity Decay (energy-light-t3-c)
export const PD_DISCHARGE_MULT   = 0.7;
export const PD_OVERCHARGE_COUNT = 5;
export const PD_OVERCHARGE_MS    = 8_000;
export const PD_STACK_FLAT_DMG   = 12;
export const PD_OVERCHARGE_FX    = 'energy-overcharge';

// Balanced — Alternating Currents (energy-balanced-t3-a)
export const AC_CHARGE_DMG_MULT    = 1.2;
export const AC_ENERGY_GAIN_MULT   = 2.0;
export const AC_DISCHARGE_TOTAL_MS = 3_000;
export const AC_TICK_INTERVAL_MS   = 500;
export const AC_TICK_DAMAGE_MULT   = 0.5;
export const AC_SPEED_FACTOR       = 2 / 3; // 1.5× attacks/s during discharge

// Balanced — Harmonic Equilibrium (energy-balanced-t3-b)
export const HE_DMG_MULT       = 1.6;
export const HE_LOW_THRESHOLD  = 0.40;
export const HE_HIGH_THRESHOLD = 0.60;

// Balanced — Capacitor Shunt (energy-balanced-t3-c)
export const CS_SPLIT_RATIO     = 0.5;
export const CS_RESERVOIR_MAX   = 500;
export const CS_RESERVOIR_SCALE = 250; // at max reservoir: (1 + 500/250) = 3× on base mult

// Heavy — Singularity Execute (energy-heavy-t3-a)
export const SE_ENERGY_MAX  = 200;
export const SE_ACCEL_SCALE = 0.5; // gain *= (1 + fillPct × SE_ACCEL_SCALE)

// Heavy — Cascading Induction (energy-heavy-t3-b)
export const CI_TAG_FX    = 'energy-ci-tag';
export const CI_TAG_MS    = 15_000;
export const CI_BASE_MULT = 1.3; // burst = player.attack × 1.3^tagCount

// ── T4 specs (placeholder constants — replaced at the balance pass) ───────────

// Light — Overdrive (energy-light-t3-b)
export const ENERGY_OVERDRIVE_ATK_PCT  = 0.40;  // +ATK% while Overdrive is active
export const OVERDRIVE_DECAY_PER_SEC    = 18;    // energy lost per second during Overdrive

// Light — Energy Upkeep (energy-light-t3-c)
export const UPKEEP_THRESHOLD_PCT = 0.20; // energy% above which the upkeep timer runs
export const UPKEEP_DECAY_PER_SEC = 16;   // continuous energy decay (you must keep firing)
// On-hit scaling now lives in shared/systems/energyUpkeep.ts (stack-based, flat add).

// Balanced — Binary Cycle (energy-balanced-t3-a)
export const BINARY_CHARGE_ATK_BONUS    = 0.30; // +ATK% during Charge State
export const BINARY_DISCHARGE_ONHIT_BONUS = 0.30; // +on-hit% during Discharge State
export const BINARY_CHARGE_GAIN_MULT    = 1.5;  // faster energy gain in Charge State
export const BINARY_CHARGE_DISCHARGE_MULT   = 1.3; // big discharge ending Charge State
export const BINARY_DISCHARGE_DISCHARGE_MULT = 0.8; // light discharge ending Discharge State

// Balanced — Awakened Lightning (energy-balanced-t3-b)
export const AWAKENED_N    = 5;   // empowered regular attacks after a discharge
export const AWAKENED_MULT = 1.5; // multiplier on each empowered attack

// Balanced — Charge State (energy-balanced-t3-c)
export const CHARGE_STATE_MIN = 0.5; // attack damage at 0 energy (scales to 1.0 at max)

// Heavy — Critical Mass (energy-heavy-t3-b)
export const CRITICAL_MASS_MAX           = 3;
export const CRITICAL_MASS_DMG_PER_STACK = 0.20; // +discharge mult per stack
export const CRITICAL_MASS_GAIN_PER_STACK = 0.20; // +energy gain per stack
export const CRITICAL_MASS_RESET_MS      = 5_000; // gap without damage that resets stacks

// Heavy — Endless Storm (energy-heavy-t3-c)
export const STORM_FX           = 'energy-storm';
export const ENDLESS_STORM_DPS  = 40;
export const ENDLESS_STORM_TICK_MS = 1_000;
export const ENDLESS_STORM_DURATION_MS = 600_000; // effectively permanent (until death)
