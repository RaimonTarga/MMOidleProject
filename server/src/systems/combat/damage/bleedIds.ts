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
 * A leaf module so the tick driver, the marker invariants and the card runtime can
 * all import it without a cycle.
 */

/** The cadence root's Hemorrhage, stacks = remaining ticks. */
export const CADENCE_BLEED_ID = 'cadence-hemorrhage';

/** A lineage card's `hemorrhage` payoff, stacks = remaining ticks. */
export const LINEAGE_BLEED_ID = 'lineage.hemorrhage';

/** A lineage card's `poison-stack` payoff, stacks = intensity. */
export const LINEAGE_POISON_ID = 'lineage.poison';

/**
 * How a bleed's `stacks` field behaves, carried in the effect's own data under
 * `bleedMode` so one driver can serve both shapes.
 *
 * - `ticks` — one stack is one remaining tick; the driver consumes one per tick
 *   and the effect is pruned at zero. The target frame reads it as a countdown.
 * - `intensity` — stacks multiply the per-tick damage and are not consumed; the
 *   effect ends when `remainingMs` runs out, like any other timed debuff.
 */
export type BleedMode = 'ticks' | 'intensity';

export const BLEED_EFFECT_IDS: readonly string[] = [
  CADENCE_BLEED_ID,
  LINEAGE_BLEED_ID,
  LINEAGE_POISON_ID,
];

/** Whether this monster state carries any bleed the driver owns. */
export function hasAnyBleed(
  state: { statusEffects: Array<{ id: string }> },
): boolean {
  return state.statusEffects.some((e) => BLEED_EFFECT_IDS.includes(e.id));
}
