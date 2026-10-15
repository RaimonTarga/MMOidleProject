/**
 * Every effect id the bleed tick driver owns.
 *
 * One driver, a list of ids: `updateHemorrhages` ticks every id here and the
 * `hasHemorrhage` marker means "carries some bleed". The cadence root's
 * Hemorrhage is the only bleed left since the lineage bleed went with the
 * lineage trees (class-first rework D1).
 *
 * A leaf module so the tick driver and the marker invariants can both import it
 * without a cycle.
 */

/** The Striker's bleed (Rend; the old cadence Hemorrhage), stacks = remaining ticks. */
export const CADENCE_BLEED_ID = 'cadence-hemorrhage';

/** Festering Cut's rot: the finisher's wound, dealing part of its damage again. */
export const STRIKER_ROT_ID = 'striker-rot';

/**
 * How a bleed's `stacks` field behaves, carried in the effect's own data under
 * `bleedMode` so one driver can serve both shapes.
 *
 * - `ticks` — one stack is one remaining tick; the driver consumes one per tick
 *   and the effect is pruned at zero. The target frame reads it as a countdown.
 * - `intensity` — stacks multiply the per-tick damage and are not consumed; the
 *   effect ends when `remainingMs` runs out, like any other timed debuff. No
 *   current writer.
 */
export type BleedMode = 'ticks' | 'intensity';

export const BLEED_EFFECT_IDS: readonly string[] = [
  CADENCE_BLEED_ID,
  STRIKER_ROT_ID,
];

/** Whether this monster state carries any bleed the driver owns. */
export function hasAnyBleed(
  state: { statusEffects: Array<{ id: string }> },
): boolean {
  return state.statusEffects.some((e) => BLEED_EFFECT_IDS.includes(e.id));
}
