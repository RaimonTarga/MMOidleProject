// ── Cooldown T3 constants ────────────────────────────────────────────────────
// All values pending balance tuning; serve as defaults when no passive override.

// Overdrive / "Burst" (cooldown-light-T3-a)
export const OVERDRIVE_BUFF_MS         = 2_500; // ~50% uptime with 5 000 ms light CD
// Flat attack-speed buff (same units as the attackSpeedPct stat): 1.0 = +100% =
// double attack rate (attackCooldown halved). Balance TBD.
export const OVERDRIVE_ATTACK_SPEED_PCT = 1.0;

// Eternal Cycle (cooldown-light-T3-b) — additive flat on execution (Version A).
export const ETERNAL_CHARGE_DURATION_MS = 10_000; // stacks fall off after 10 s without hits
export const ETERNAL_CYCLE_FLAT_PER_STACK = 8;    // per-tier base flat bonus per stack (node override: cooldown.eternal-cycle-flat)
// Internal tier the Transcendant node unlocks at (matches the skill node's `tier: 3`).
// Per-stack flat = base × max(1, playerTier − ETERNAL_CYCLE_UNLOCK_TIER + 1): 1× at
// tier 3, 2× at tier 4, … (never scales below the unlock tier).
export const ETERNAL_CYCLE_UNLOCK_TIER = 3;

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
// Design targets (absolute): CD 4000ms, multiplier 5.0. The node applies these as
// deltas on the heavy frame (9000ms / 3.0×): -5000ms and +2.0×.
export const SINGULAR_EXTRACTION_CD_MS = 4_000;
export const SINGULAR_EXTRACTION_MULT  = 5.0;

// ── T4 specs (placeholder constants — replaced at the balance pass) ───────────

// Rupture (cooldown-light-T3-c)
export const RUPTURE_WINDOW_MS      = 2_000; // post-execution 50%-bypass window
export const RUPTURE_WINDOW_PLATING_MULT = 0.5; // plating multiplier during the window
export const RUPTURE_DR_PIERCE      = 0.10;  // window: fraction of target DR ignored (node: cooldown.rupture-dr-pierce)

// Reverb (cooldown-balanced-T3-a)
export const REVERB_BONUS_PER_ATTACK = 0.04; // +4% next-execution damage per attack landed

// Patience Paid (cooldown-balanced-T3-c)
export const PATIENCE_PAID_RAMP_MS  = 7_000; // natural CD; ramp caps here
export const PATIENCE_PAID_ATK_MAX  = 0.50;  // max regular-attack bonus at full ramp
export const PATIENCE_PAID_EXEC_MAX = 0.75;  // max execution bonus at full ramp

// Vengeance (cooldown-heavy-T3-a)
export const VENGEANCE_MULTIPLIER = 1.5;     // execution bonus per point of damage taken
export const VENGEANCE_FLOOR      = 30;      // minimum execution bonus

// Channeled Beam (cooldown-heavy-T3-c)
export const BEAM_DURATION_MS       = 3_000;
export const BEAM_TICK_MS           = 500;
export const BEAM_DMG_PER_TICK_MULT = 1.0; // damage per tick = player.attack × this

// ── Status effect IDs (stack containers on TracksCombat) ────────────────────
export const EC_CHARGE_FX  = 'eternal-cycle-charge';     // per-player charge stacks
export const TE_BUFF_FX    = 'temporal-extension-buff';  // per-player buff w/ duration / flat damage
export const BAT_CHARGE_FX = 'battery-charge';           // per-player charge stacks
export const ENT_DOT_FX    = 'entropy-collapse-dot';     // per-monster DoT
