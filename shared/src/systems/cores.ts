import type { CoreRange } from '../items';

/**
 * Cores (system rework Step 9) — the 5th equipment slot's role/range amplifier.
 *
 * A core's effect is gated by its range tag against the player's `selectedRange`:
 *  - close/mid/far → FULL effect only when the tag matches the selected range; OFF otherwise.
 *  - universal/party → always active (universal is the weaker always-on alternative;
 *    party is role-flavored, treated as always-on in v1).
 *
 * This is the single authority for the gate — the stat rebuild (systems/stats.ts) uses it
 * to decide whether to apply an equipped core's statModifiers/mechanicEffects, and the
 * client UI uses it to show a core as active/inactive. Keep both reading from here so they
 * never disagree.
 */
export function coreIsActive(
  rangeTag: CoreRange | undefined,
  selectedRange: string | null,
): boolean {
  if (!rangeTag || rangeTag === 'universal' || rangeTag === 'party') return true;
  return rangeTag === selectedRange;
}

/** Whether a range tag is directional (gated by range match). */
export function isDirectionalCore(rangeTag: CoreRange | undefined): boolean {
  return rangeTag === 'close' || rangeTag === 'mid' || rangeTag === 'far';
}
