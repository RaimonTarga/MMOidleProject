/**
 * Client FX ids that ride a combat event's `effects` list.
 *
 * The server tags an exchange via `pushClientEffect(ctx, id)`; the id reaches the
 * client as `ev.effects` and is dispatched by the effects loop in combatFx.
 *
 * These live in shared for the same reason the socket maps do: the string IS the
 * contract. The older archetype tags (`swiftblade`, `void-discharge`, …) predate
 * this module and are still declared twice — once in the archetype's server-side
 * `core/constants.ts` and once as a literal in combatFx — which is exactly the
 * drift this file exists to prevent. Migrate them here when they are next
 * touched; do not add new ones the old way.
 */

// ── tier-4 path thresholds ─────────────────────────────────────────────────

/** Pyromancer: a hit landing on an already-full stack bar pays out as direct damage. */
export const DOT_MAXSTACK_BURST_FX = 'dot-maxstack-burst';
/** Icebreaker: max frost stacks flip conversion off — the shell breaks outward. */
export const DOT_RIMESHATTER_FX = 'dot-rimeshatter';
/** Winter Warden: chill cap converts to Frozen — the shell closes inward. */
export const DOT_FROZEN_FX = 'dot-frozen';
/** Berserker: Rampage hits its cap and crashes to zero. */
export const CADENCE_OVERLOAD_FX = 'cadence-overload';
/** Scrapper: the Cursed Finale brands the target and permanently strips plating. */
export const CADENCE_CURSED_FINALE_FX = 'cadence-cursed-finale';
/** Sunderer: the execution shatters plating and opens the pierce window. */
export const COOLDOWN_SUNDER_FX = 'cooldown-sunder';
/** Justicar: the banked Verdict executes the target outright. */
export const CADENCE_VERDICT_EXECUTE_FX = 'verdict-execute';

/**
 * Destroyer: a regular attack that was zeroed out by Singular Extraction. Tagged
 * rather than inferred from `ev.damage === 0`, because a hit can legitimately be
 * reduced to 0 by mitigation and should still look like a real blow.
 */
export const COOLDOWN_HOLLOW_FX = 'cooldown-hollow';
