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
import type { LineageFxKey } from '../data/lineages/types';

// ── tier-4 path thresholds ─────────────────────────────────────────────────

/**
 * Was Pyromancer's max-stack direct-bonus hit. Design §22.5 removed that bonus
 * (Radiant, the new payoff, lives on the burn TICK and has no hit to ride), so the
 * server no longer pushes this id; the client still draws it if one arrives.
 */
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

// ── lineage payloads (design §24.2, course-correction W2-C) ─────────────────

/**
 * A hit that IS a lineage payload's hit carries `lineage-hit:<fx key>`: the
 * echo's own second hit ("lands twice", through the proc seam), and the hit in
 * flight a `big-hit`, `mechanic-proxy` or `heal-and-load` multiplied. The card-fx
 * says the payload fired; this says which swing it was, so the client can present
 * that swing as the payload's (the echo a beat after the hit it echoes, the lunge
 * at the end of its dash) instead of guessing by matching events.
 */
export const LINEAGE_PAYLOAD_HIT_PREFIX = 'lineage-hit:';

/** The client-effect tag a lineage payload's own hit carries. */
export function lineagePayloadHitFx(fx: LineageFxKey): string {
  return `${LINEAGE_PAYLOAD_HIT_PREFIX}${fx}`;
}

/** The payload fx a hit's client-effect tag names, or undefined for any other tag. */
export function lineagePayloadOfHitFx(effect: string): LineageFxKey | undefined {
  return effect.startsWith(LINEAGE_PAYLOAD_HIT_PREFIX)
    ? effect.slice(LINEAGE_PAYLOAD_HIT_PREFIX.length) as LineageFxKey
    : undefined;
}

/**
 * Destroyer: a regular attack that was zeroed out by Singular Extraction. Tagged
 * rather than inferred from `ev.damage === 0`, because a hit can legitimately be
 * reduced to 0 by mitigation and should still look like a real blow.
 */
export const COOLDOWN_HOLLOW_FX = 'cooldown-hollow';
