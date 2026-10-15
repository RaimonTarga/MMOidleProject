/**
 * Client FX ids that ride a combat event's `effects` list.
 *
 * The server tags an exchange via `pushClientEffect(ctx, id)`; the id reaches the
 * client as `ev.effects` and is dispatched by the effects loop in combatFx.
 *
 * These live in shared for the same reason the socket maps do: the string IS the
 * contract. The older archetype tags (`void-discharge`, …) predate
 * this module and are still declared twice — once in the archetype's server-side
 * `core/constants.ts` and once as a literal in combatFx — which is exactly the
 * drift this file exists to prevent. Migrate them here when they are next
 * touched; do not add new ones the old way.
 */

// ── tier-4 path thresholds ─────────────────────────────────────────────────

/** Icebreaker: max frost stacks flip conversion off — the shell breaks outward. */
export const DOT_RIMESHATTER_FX = 'dot-rimeshatter';
/** Winter Warden: chill cap converts to Frozen — the shell closes inward. */
export const DOT_FROZEN_FX = 'dot-frozen';
/** Sunderer: the execution shatters plating and opens the pierce window. */
export const COOLDOWN_SUNDER_FX = 'cooldown-sunder';

/**
 * Reverb: this hit is the execution's ECHO (design §22.5), landing at half strength
 * at the recharge's halfway mark — not the execution itself. Both are execution
 * hits on the wire, so the tag is what lets the path draw the bell answering
 * rather than a second strike of it.
 */
export const COOLDOWN_REVERB_ECHO_FX = 'reverb-echo';
