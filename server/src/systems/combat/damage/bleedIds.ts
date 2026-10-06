/**
 * Every effect id the bleed tick driver owns.
 *
 * A lineage card's damage-over-time payoff has its OWN id (design §18.1) rather
 * than sharing the cadence root's record: `applyStatusEffect` does not update
 * `data` on an existing entry, so a shared bleed meant whichever source landed
 * first owned the per-tick damage, and the old "take the better of both" guard
 * against that turned into a ratchet — one big hit's bleed maintained forever by
 * chip hits.
 *
 * Separate ids, one driver. `updateHemorrhages` ticks every id here, the
 * `hasHemorrhage` marker means "carries some bleed", and the DoT inventory
 * enumerates them so Contagion, Detonate and the stack-count rune condition see
 * them and sum the sources.
 *
 * ONE LINEAGE BLEED (design §26.2). The verbs-that-fire run split the lineage
 * bleed in two — the heavy payload refreshed, the Affliction lean's light bleed
 * was a reservoir — and `poison-stack` kept a third record of its own. A target
 * showed up to three records for one weapon. They are now ONE id,
 * {@link LINEAGE_BLEED_ID}, a reservoir every source ADDS to
 * (`lineageAffliction.ts`), and on a weapon that owns a reservoir of its own none
 * of them is written at all: they add to that reservoir instead.
 *
 * A leaf module so the tick driver, the marker invariants and the card runtime can
 * all import it without a cycle.
 */
import { LINEAGE_BLEED_STATUS_ID } from '@mmo-idle/shared';

/** The cadence root's Hemorrhage, stacks = remaining ticks. */
export const CADENCE_BLEED_ID = 'cadence-hemorrhage';

/**
 * THE lineage bleed (design §26.2), stacks = remaining ticks. Every lineage
 * damage-over-time source on a weapon with no reservoir — the Affliction lean's
 * light bleed, the heavy `hemorrhage` payload, the `redose`, `poison-stack` —
 * adds what it owes to this one record. Retired ids: `lineage.hemorrhage`,
 * `lineage.lean-bleed`, `lineage.poison`.
 */
export const LINEAGE_BLEED_ID = LINEAGE_BLEED_STATUS_ID;

/**
 * How a bleed's `stacks` field behaves, carried in the effect's own data under
 * `bleedMode` so one driver can serve both shapes.
 *
 * - `ticks` — one stack is one remaining tick; the driver consumes one per tick
 *   and the effect is pruned at zero. The target frame reads it as a countdown.
 * - `intensity` — stacks multiply the per-tick damage and are not consumed; the
 *   effect ends when `remainingMs` runs out, like any other timed debuff. No
 *   current writer: `poison-stack` was its only one, and since design §26.2 it
 *   adds to the one reservoir like every other lineage DoT.
 */
export type BleedMode = 'ticks' | 'intensity';

export const BLEED_EFFECT_IDS: readonly string[] = [
  CADENCE_BLEED_ID,
  LINEAGE_BLEED_ID,
];

/** Whether this monster state carries any bleed the driver owns. */
export function hasAnyBleed(
  state: { statusEffects: Array<{ id: string }> },
): boolean {
  return state.statusEffects.some((e) => BLEED_EFFECT_IDS.includes(e.id));
}
