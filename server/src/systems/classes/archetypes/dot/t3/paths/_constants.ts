// ── Per-path constants (consumed by paths/ files and mirroring.ts) ───────────

// Light — Poison Explosion (dot-light-t3-a)
export const PE_MAX_STACKS  = 10;   // design: 10-stack cap (was 20)
/** burst = maxStacks × dmgPerStack × PE_BURST_TICKS = "10 full ticks' worth" */
export const PE_BURST_TICKS = 10;

// ── T4 specs (placeholder constants — replaced at the balance pass) ───────────

// Light — Frenzy (Zealot, dot-light-t3-c). A refreshable self-buff granted on hitting
// a max-stack target: split between attack speed and on-hit damage, both scaling per
// tier (counting from the path unlock tier). Lasts a few seconds, refreshes on hit.
export const FRENZY_FX            = 'dot-frenzy'; // status id on the player
export const FRENZY_DURATION_MS   = 6_000;        // buff duration, refreshed on each max-stack hit
export const FRENZY_UNLOCK_TIER   = 4;            // path specs unlock at playerTier 4 → 1×
export const FRENZY_APS            = 0.30;         // +attack-speed fraction (FLAT — does not scale per tier)
export const FRENZY_ONHIT_PER_TIER = 10;          // +flat on-hit damage per tier (this is the scaling half)

// Balanced — Ignition (dot-balanced-t3-b)
export const IGNITION_VALUE_MULT = 0.6;  // tick value of each front-loaded stack

// Heavy — Rimeshatter (dot-heavy-t3-a)
export const RIMESHATTER_DR_DEBUFF = 0.08;  // DR reduction applied while at max stacks
export const RIMESHATTER_DR_MS     = 2_000; // debuff refresh window

// Heavy — Shatter Strike / Rime Blade (dot-heavy-t3-c)
export const SHATTER_STRIKE_BONUS_PER_STACK = 10;  // flat direct bonus per active frost stack (× tierMult)
export const SHATTER_STRIKE_UNLOCK_TIER     = 4;   // path specs unlock at playerTier 4 → 1×

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
export const FTF_BONUS_MULT     = 2;     // bonus = maxStacks × basePerStack × FTF_BONUS_MULT (was 3, OP)

// Balanced — Conflagration (dot-balanced-t3-c)
// Fast cadence: 10 ticks × 250ms (2.5s total) at factor 1 — same total damage and
// duration as the old 5 × 500ms × factor 2, just a rapid raging burn.
export const CONF_TICK_MS    = 250;
export const CONF_DMG_FACTOR = 1;

// Heavy — Permafrost (dot-heavy-t3-a)
export const PERM_MAX_STACKS  = 1;
export const PERM_MAX_HITS    = 35;    // hits to reach max damage (35% of ATK)
export const PERM_PCT_PER_HIT = 0.01;  // +1% of ATK per hit

// Heavy — Freezing Cold (dot-heavy-t3-b)
export const CHILL_MAX        = 9;     // 9 chill stacks → freeze (longer ramp; avoids perma-freeze)
export const CHILL_SPEED_MULT = 0.05;  // 5% speed reduction per chill stack (45% at max)
export const CHILL_ATK_MULT   = 0.05;  // 5% attackCooldown increase per chill stack (+45% at max)
export const CHILL_MS         = 6_000;
export const CHILL_FLAG       = 'dot-chill-applied';
// Frozen is a SEVERE slow, not full CC (design): the monster still moves and
// attacks, just very slowly. Applied as a strong speed cut + long attack cooldown.
export const FREEZE_SPEED_MULT = 0.80;  // -80% movement speed while frozen
export const FREEZE_ATK_MULT   = 2.0;   // +200% attack cooldown while frozen (×3)

// Heavy — Glacial Fracture (dot-heavy-t3-c)
export const GLACIAL_FRACTURE_KNOCKBACK_PX = 120;
export const GLACIAL_FRACTURE_KNOCKBACK_MS = 350;
