// ── Energy T3 constants ──────────────────────────────────────────────────────

// Light — Accumulator (energy-light-t3-a)
export const ACC_BASE_DRAIN_PER_SEC = 8;   // energy drained/sec at 0 stacks
export const ACC_DRAIN_PER_STACK    = 3;   // extra drain/sec per stack
export const ACC_FLAT_ATK_PER_STACK = 2;   // flat attack bonus per stack
export const ACC_MAX_STACKS         = 10;
export const ACC_BUFF_FX            = 'energy-acc-buff';

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
