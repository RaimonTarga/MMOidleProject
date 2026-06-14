// Accelerando (legacy speed-stack mechanic — kept for the speedStacks field/buff)
export const CADENCE_SPEED_PER_STACK_MS = 80;
export const CADENCE_MAX_SPEED_STACKS   = 5;

// Rising Tide (cadence-balanced-t3-b)
export const MOMENTUM_ECHO_HITS  = 5;
export const MOMENTUM_ECHO_BONUS = 0.5;

// Verdict (cadence-balanced-t3-c) — each finisher banks execution power into a
// character-side pool; spend it to instantly execute a target whose remaining HP
// is within the stored pool.
export const VERDICT_BANK_PCT = 0.30;   // fraction of each finisher banked into the pool

// Hemorrhage (cadence-heavy-t3-b)
export const HEMORRHAGE_TICKS    = 4;
export const HEMORRHAGE_TICK_MS  = 1_000;
export const HEMORRHAGE_MULT     = 1.5;

// ── T4 specs (placeholder constants — replaced at the balance pass) ───────────

// Aftershock (cadence-light-t3-a)
export const AFTERSHOCK_ATTACKS = 3;             // regular attacks that fire on-hit twice

// Swiftblade (cadence-light-t3-c) — client FX tag for the dual diagonal slash;
// must match the handler id in client/src/render/combatFx.ts.
export const SWIFTBLADE_EFFECT = 'swiftblade';

// Cursed Finale (cadence-light-t3-b)
export const CURSED_FINALE_PLATING_SHRED = 5;    // flat plating stripped per finisher
export const CURSED_FINALE_SHRED_CAP     = 20;   // hard cap on total shred per target

// Metronome (cadence-balanced-t3-a)
export const METRONOME_FLAT_BONUS = 12;          // flat damage each buildup attack adds (per-tier base)
// Internal tier the Maestro node unlocks at (matches the skill node's `tier: 3`).
// Per-tier flat = METRONOME_FLAT_BONUS × (playerTier − METRONOME_UNLOCK_TIER + 1):
// 12 at tier 3, 24 at tier 4, 36 at tier 5, … (never scales below the unlock tier).
export const METRONOME_UNLOCK_TIER = 3;

// Rampage (cadence-heavy-t3-a)
export const RAMPAGE_MAX_STACKS       = 10;      // hard cap; the next finisher overloads → reset to 0
export const RAMPAGE_THRESHOLD_FLOOR  = 2;       // threshold can never drop below this
export const RAMPAGE_APS_PER_STACK_MS = 60;      // attack-cooldown reduction per stack
export const RAMPAGE_ATK_PEN_PER_STACK = 0.08;   // regular-attack damage penalty per stack (frac)
export const RAMPAGE_MULT_PER_STACK    = 0.15;   // empowered-multiplier bonus per stack (frac)
export const RAMPAGE_DECAY_INTERVAL_MS = 8_000;  // OOC: shed 1 stack per interval

// Crescendo (cadence-heavy-t3-c)
export const CRESCENDO_FLAT_PER_STACK = 18;      // flat bonus to the finisher per stack
export const CRESCENDO_TICK_MS        = 1_000;   // in-combat: +1 stack per tick
export const CRESCENDO_DECAY_MS       = 2_000;   // OOC: shed 1 stack per this interval
