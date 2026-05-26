// ── Cooldown T3 constants ────────────────────────────────────────────────────
// All values pending balance tuning; serve as defaults when no passive override.

// Overdrive (cooldown-light-T3-a)
export const OVERDRIVE_BUFF_MS      = 2_500; // ~50% uptime with 5 000 ms light CD
export const OVERDRIVE_SPEED_FACTOR = 2 / 3; // attackCooldown × 2/3 → 1.5× attacks/s

// Eternal Cycle (cooldown-light-T3-b)
export const ETERNAL_COEFF              = 0.65;   // empowered dmg = attack × stacks × coeff
export const ETERNAL_CHARGE_DURATION_MS = 10_000; // stacks fall off after 10 s without hits
export const ETERNAL_FLAT_PER_STACK     = 1.5;    // flat bonus per stack on each normal hit

// Temporal Extension (cooldown-light-T3-c)
export const TEMPORAL_INIT_MS   = 3_000; // initial buff duration on empowered trigger
export const TEMPORAL_MAX_MS    = 4_500; // max buff duration (extension cap)
export const TEMPORAL_FLAT_DMG  = 6;     // flat on-hit bonus per attack while buff active
export const TEMPORAL_EXTEND_MS = 1_000; // buff duration added per normal attack

// Battery (cooldown-balanced-T3-b)
export const BATTERY_ATK_PER_STACK = 2; // flat attack damage added per stack

// Alignment (cooldown-balanced-T3-c)
export const ALIGNMENT_BUFF_MS      = 2_000;
export const ALIGNMENT_SPEED_FACTOR = 2 / 3; // same 1.5× speed factor as Overdrive

// Entropy Collapse (cooldown-heavy-T3-a)
export const ENTROPY_BASE_DMG    = 5;    // base damage per tick at full HP
export const ENTROPY_DURATION_MS = 8_000;
export const ENTROPY_TICK_MS     = 1_000;

// Singular Extraction (cooldown-heavy-T3-b)
export const SINGULAR_NO_TARGET_MS = 4_000; // ms without a target before CD resets

// Channeled Beam (cooldown-heavy-T3-c)
export const BEAM_DURATION_MS       = 3_000;
export const BEAM_TICK_MS           = 500;
export const BEAM_DMG_PER_TICK_MULT = 1.0; // damage per tick = player.attack × this

// ── Status effect IDs (stack containers on TracksCombat) ────────────────────
export const EC_CHARGE_FX  = 'eternal-cycle-charge';     // per-player charge stacks
export const TE_BUFF_FX    = 'temporal-extension-buff';  // per-player buff w/ duration / flat damage
export const BAT_CHARGE_FX = 'battery-charge';           // per-player charge stacks
export const ENT_DOT_FX    = 'entropy-collapse-dot';     // per-monster DoT
