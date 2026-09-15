/**
 * Sunlight — the Desert Falchion's "alpha window".
 *
 * The Falchion lineage used to be a pure ALPHA STRIKE: one enormous multiplier on
 * the literal first hit against a fresh monster, then an ordinary weapon. That
 * shape is maximally polarized — it is decided in one instant, it scales with how
 * big a single swing is rather than with how the fight goes, and it needs an ever
 * larger multiplier each tier just to stay noticeable.
 *
 * The alpha WINDOW keeps the identity ("strongest right after you engage") and
 * spreads the payoff over a few seconds: a modest opener multiplier
 * (`weapon.first-strike-mult`) PLUS a short outgoing-damage window
 * (`weapon.first-strike-buff-damage-pct` for `weapon.first-strike-buff-duration-ms`).
 *
 * Deliberate rules:
 *  - The window NEVER refreshes or extends. Opening on a second fresh target while
 *    Sunlight is up still gives that target its own opener multiplier, but the
 *    window keeps its original expiry. Without this, swarm nodes would turn a
 *    4-second window into permanent uptime by target-swapping.
 *  - It never stacks, and no future window is queued.
 *  - It is a FINAL damage-dealt layer, not an Attack buff, so it reaches every
 *    player-owned channel that already routes through `outgoingFinalDamage`.
 *
 * The magnitude lives in `data[FINAL_DAMAGE_DEALT_PCT_KEY]` (see finalDamage.ts),
 * the same key the stance burst windows use, so `resolveFinalDamageMultipliers`
 * folds all three in one place. It is deliberately NOT `DAMAGE_DEALT_PCT_KEY`
 * (playerAmplifiers): that key is summed separately in the direct-attack path and
 * would double-apply here.
 */

/** Status id of the Falchion's offensive window, on the WIELDER. */
export const SUNLIGHT_EFFECT_ID = 'sunlight';
