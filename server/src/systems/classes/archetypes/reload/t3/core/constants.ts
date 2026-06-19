export const DEFAULT_LASER_DAMAGE_PER_TICK_PCT = 0.18;
export const DEFAULT_LASER_HEAT_PER_TICK = 2;
export const DEFAULT_LASER_COOL_PER_TICK = 2.5;
// Snipe cadence (reload.snipe-cadence-ms) and attack-speed→damage conversion
// (reload.snipe-as-to-dmg) are applied in recalculatePlayerStats (shared); their
// defaults live there. Only the full-HP bonus is read at combat time.
export const DEFAULT_SNIPE_FULL_HP_MULT = 2;
export const FULL_HP_THRESHOLD = 0.95;
export const GATLING_KNOCKBACK_DISTANCE = 20;
export const GATLING_KNOCKBACK_MS = 150;
export const SERVER_TICK_MS = 100;

// ── Light / Balanced T3 ───────────────────────────────────────────────────────

export const DEATH_MARK_EFFECT_ID = 'death-mark';
export const SUPPRESS_SHRED_EFFECT_ID = 'reload-suppress-shred';
export const COVER_FIRE_EFFECT_ID = 'reload-cover-fire';
export const EXPLODING_CLIP_CLIENT_EFFECT = 'reload-exploding-clip';
export const ALT_ONHIT_CLIENT_EFFECT = 'reload-alt-onhit';

export const DEFAULT_EXPLODING_CLIP_MULT = 3.5;
export const DEFAULT_EXPLODING_AOE_MULT = 0.6;
export const DEFAULT_HAIR_TRIGGER_PCT = 0.07;
export const DEFAULT_HAIR_TRIGGER_MAX = 5;
export const DEFAULT_BLUNDERBUSS_SPREAD_RAD = 0.55;
export const DEFAULT_BLUNDERBUSS_KNOCKBACK_DIST_PER_PELLET = 7;
export const DEFAULT_BLUNDERBUSS_KNOCKBACK_MS_PER_PELLET = 14;
// Fixed recoil the shooter takes, opposite the firing direction, per volley.
export const DEFAULT_BLUNDERBUSS_SELF_KNOCKBACK_DIST = 110;
export const BLUNDERBUSS_VOLLEY_HITS_COUNTER = 'blunderbussVolleyHits';
export const DEFAULT_RELOAD_TIME_MULT = 1;
export const DEFAULT_DEATH_MARK_MAX = 10;
export const DEFAULT_DEATH_MARK_DETONATE_MULT = 0.65;
export const DEFAULT_DEATH_MARK_DURATION_MS = 8000;
export const DEATH_MARK_DETONATE_DELAY_MS = 1000; // reload arms the blast; it fires 1s later
export const DEATH_MARK_BLAST_EFFECT = 'death-mark-blast'; // client explosion FX id
export const DEFAULT_SUPPRESS_SHRED = 4;
export const DEFAULT_SUPPRESS_MAX = 5;
export const DEFAULT_COVER_FIRE_DR = 0.45;
export const COVER_FIRE_DR_CAP = 0.9;

// ── T4 specs (placeholder constants — replaced at the balance pass) ───────────

// Alternating Cadence (reload-balanced-t3-c)
export const ALT_CADENCE_ATTACK_MULT = 2;  // even shots: 2× attack (on-hit zeroed)
export const ALT_CADENCE_ONHIT_MULT  = 2;  // odd shots: 2× on-hit (attack zeroed)

// Momentum (reload-light-t3-b)
export const DEFAULT_MOMENTUM_APS_PER_STACK = 0.06; // +6% APS per stack
export const DEFAULT_MOMENTUM_MAX_STACKS    = 5;
export const MOMENTUM_DECAY_INTERVAL_MS     = 4_000; // OOC: shed 1 stack per interval
export const DEFAULT_MOMENTUM_RELOAD_REDUCTION = 0.10; // -10% reload time per stack
export const MOMENTUM_RELOAD_REDUCTION_FLOOR   = 0.30; // never cut reload below 30% of base

// Cannon (reload-heavy-t3-c)
export const DEFAULT_CANNON_DAMAGE_PER_SHOT = 0.5;  // each shot banks attack × this
export const CANNON_CHARGE_FRACTION = 0.5;          // charge time = reload × this
export const CANNON_BLAST_EFFECT = 'reload-cannon-blast'; // client explosion FX id
