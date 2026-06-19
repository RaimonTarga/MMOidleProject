// ── Cross-path constants for DoT T3 ──────────────────────────────────────────
// Constants that are read by more than one path or by the shared selectors /
// mirroring layer. Path-local constants stay inside their path file.

// ── Shared with dotPrototype.ts ──────────────────────────────────────────────
export const DOT_EFFECT_ID      = 'dot';
export const DOT_MAX_STACKS     = 6;
export const DOT_TICK_MS        = 1_000;
/** Fallback conversion fraction when no T1 path is unlocked (mirrors dotPrototype.ts). */
export const DOT_CONVERSION_PCT = 0.40;
/** Default DoT duration — refreshed on every hit (mirrors dotPrototype.ts). */
export const DOT_DURATION_MS    = 4_500;

// ── Status effect IDs ────────────────────────────────────────────────────────
export const SMOLDER_EFFECT = 'dot-smolder';
export const CHILL_EFFECT   = 'dot-chill';
export const FROZEN_EFFECT  = 'dot-frozen';
export const CONF_EFFECT_ID = 'dot-conf';
export const FROSTBITE_EFFECT = 'dot-frostbite';

// ── Cross-path damage modifiers ──────────────────────────────────────────────
/** Smoldering Ember — % increased damage taken per stack. */
export const SE_VULN_PER_STACK = 0.03;
/** Freezing Cold — direct-attack damage bonus while frozen. */
export const FREEZE_BONUS = 0.35;
/** Freezing Cold — frozen duration in ms. */
export const FREEZE_MS    = 2_000;
/** Wind Spirit — increased damage-over-time taken per Frostbite stack. */
export const FROSTBITE_DOT_TAKEN_PER_STACK = 0.03;
/** Wind Spirit — Frostbite duration in ms. */
export const FROSTBITE_MS = 4_000;

// ── Conflagration — referenced by selectors for remaining-pct UI. */
export const CONF_TICKS  = 10;  // fast-cadence burn (was 5); paired with CONF_TICK_MS 250 + CONF_DMG_FACTOR 1 → same total/duration

// ── Status-effect → client effect-id mapping (mirroring.ts) ─────────────────
export const STATUS_EFFECT_TO_CLIENT_ID: Array<[string, string]> = [
  [FROZEN_EFFECT, 'freeze'],
];

// ── Client effect-frame IDs (mirroring.ts) ───────────────────────────────────
export const GLACIAL_FRACTURE_EFFECT_ID       = 'glacial-fracture';
export const GLACIAL_FRACTURE_BUILDUP_FRAMES  = 10;
export const PERMAFROST_EFFECT_ID             = 'permafrost';
export const PERMAFROST_TIERS                 = 5;
export const PERMAFROST_FRAMES_PER_TIER       = 5;
