// ── Per-path constants (consumed by paths/ files and mirroring.ts) ───────────

// Light — Poison Explosion (dot-light-t3-a)
export const PE_MAX_STACKS  = 10;   // design: 10-stack cap (was 20)
/** burst = maxStacks × dmgPerStack × PE_BURST_TICKS = "10 full ticks' worth" */
export const PE_BURST_TICKS = 10;

// ── T4 specs (placeholder constants — replaced at the balance pass) ───────────

// Light — Frenzy (dot-light-t3-c) — APS doubling at max stacks (tick-driven).
export const FRENZY_APS_FACTOR = 2;   // attack speed multiplier while at max stacks

// Balanced — Ignition (dot-balanced-t3-b)
export const IGNITION_VALUE_MULT = 0.6;  // tick value of each front-loaded stack

// Heavy — Rimeshatter (dot-heavy-t3-a)
export const RIMESHATTER_DR_DEBUFF = 0.08;  // DR reduction applied while at max stacks
export const RIMESHATTER_DR_MS     = 2_000; // debuff refresh window

// Heavy — Shatter Strike (dot-heavy-t3-c)
export const SHATTER_STRIKE_BONUS_PER_STACK = 10;  // flat direct bonus per active frost stack

// Light — Eternal Doom (dot-light-t3-b)
export const ED_BASE_STACKS   = 8;
export const ED_DIMINISH_RATE = 0.5;
export const ED_MAX_STACKS    = 50;

// Light — Invigorating Toxins (dot-light-t3-c)
export const IT_ATK_PER_STACK   = 2;     // flat damage bonus per stack on target
export const IT_SPEED_PER_STACK = 0.02;  // attackCooldown reduction per stack (2%)
export const IT_SPEED_CAP       = 0.40;  // maximum 40% reduction

// Balanced — Fan the Flames (dot-balanced-t3-a)
export const FTF_STACKS_PER_HIT = 2;
export const FTF_DMG_MULT       = 0.5;
export const FTF_BONUS_MULT     = 3;     // bonus = maxStacks × basePerStack × FTF_BONUS_MULT

// Balanced — Conflagration (dot-balanced-t3-c)
export const CONF_TICK_MS    = 500;
export const CONF_DMG_FACTOR = 2;

// Heavy — Permafrost (dot-heavy-t3-a)
export const PERM_MAX_STACKS  = 1;
export const PERM_MAX_HITS    = 35;    // hits to reach max damage (35% of ATK)
export const PERM_PCT_PER_HIT = 0.01;  // +1% of ATK per hit

// Heavy — Freezing Cold (dot-heavy-t3-b)
export const CHILL_MAX        = 3;
export const CHILL_SPEED_MULT = 0.12;  // 12% speed reduction per chill stack
export const CHILL_ATK_MULT   = 0.12;  // 12% attackCooldown increase per chill stack
export const CHILL_MS         = 6_000;
export const CHILL_FLAG       = 'dot-chill-applied';

// Heavy — Glacial Fracture (dot-heavy-t3-c)
export const GLACIAL_FRACTURE_KNOCKBACK_PX = 120;
export const GLACIAL_FRACTURE_KNOCKBACK_MS = 350;
