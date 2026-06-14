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
// Flow builds while energy > 0 and only resets at 0 — no threshold gate.
// Energy decay RAMPS with how long you've sustained: decay = base + ramp × upkeepSec.
// This is what caps the otherwise-infinite stack scaling — eventually decay outpaces
// your energy gain, energy falls below threshold, and the whole thing resets.
export const UPKEEP_DECAY_BASE        = 12;  // decay/sec at the start of a sustain
export const UPKEEP_DECAY_RAMP_PER_SEC = 1.5; // extra decay/sec added per sustained second
// On-hit scaling lives in shared/systems/energyUpkeep.ts (uncapped, per-tier, DR).

// Balanced — Binary Cycle (energy-balanced-t3-a / Equinox)
// Charge State: slow energy gain, +on-hit (flat per tier), slower attacks, WEAK discharge.
// Discharge State: fast energy gain, +ATK%, faster attacks, STRONG discharge.
export const BINARY_CHARGE_ONHIT_BONUS    = 0.30; // +on-hit% during Charge State
export const BINARY_CHARGE_ONHIT_PER_TIER = 6;    // flat on-hit added per tier in Charge
export const BINARY_DISCHARGE_ATK_BONUS   = 0.30; // +ATK% during Discharge State
export const BINARY_CHARGE_GAIN_MULT    = 0.6;  // SLOW energy gain in Charge State
export const BINARY_DISCHARGE_GAIN_MULT = 1.5;  // FAST energy gain in Discharge State
export const BINARY_CHARGE_SPEED_FACTOR    = 1.25; // attack cooldown ×1.25 (slower) in Charge
export const BINARY_DISCHARGE_SPEED_FACTOR = 0.75; // attack cooldown ×0.75 (faster) in Discharge
export const BINARY_UNLOCK_TIER = 4;               // path specs unlock at playerTier 4 → 1× there
export const BINARY_CHARGE_DISCHARGE_MULT   = 0.8; // WEAK discharge ending Charge State
export const BINARY_DISCHARGE_DISCHARGE_MULT = 1.3; // STRONG discharge ending Discharge State

// Balanced — Awakened Lightning (energy-balanced-t3-b)
export const AWAKENED_N    = 4;   // empowered regular attacks after a discharge
export const AWAKENED_MULT = 1.5; // multiplier on each empowered attack

// Balanced — Charge State (energy-balanced-t3-c)
// Aetherist oscillation: 0.5× at empty → 1.0× at half (neutral) → 2.0× at full.
export const CHARGE_STATE_MIN = 0.5; // attack mult at 0 energy
export const CHARGE_STATE_MAX = 2.0; // attack mult at full energy

// Heavy — Critical Mass (energy-heavy-t3-b)
export const CRITICAL_MASS_MAX           = 3;
export const CRITICAL_MASS_DMG_PER_STACK = 0.20; // +discharge mult per stack
export const CRITICAL_MASS_GAIN_PER_STACK = 0.20; // +energy gain per stack
export const CRITICAL_MASS_RESET_MS      = 5_000; // gap without damage that resets stacks

// Heavy — Endless Storm (energy-heavy-t3-c)
export const STORM_FX           = 'energy-storm';
export const ENDLESS_STORM_DPS  = 40; // legacy flat fallback (unused once attack-scaled)
// The storm carries the whole empowered payload: total = attack × this over the base
// duration. The discharge itself just deals normal damage + applies the storm.
export const ENDLESS_STORM_TOTAL_MULT = 8.0;
export const ENDLESS_STORM_TICK_MS = 1_000;
export const ENDLESS_STORM_DURATION_MS = 4_500; // base duration a discharge applies/refreshes
export const ENDLESS_STORM_EXTEND_MS   = 1_000; // each normal attack extends the storm by this
export const ENDLESS_STORM_MAX_MS      = 7_500; // hard cap on the extended duration
