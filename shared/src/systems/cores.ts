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
  // `selectedRange` holds the full tier-2 skill id (e.g. `cadence-range-close`),
  // not a bare `close|mid|far` — see progression/skills.ts where it is assigned.
  // Every other consumer matches it with `endsWith('-range-<kind>')`; a strict
  // `rangeTag === selectedRange` never matched, so EVERY directional core was
  // permanently inactive (server gate and both client indicators agreed, which
  // is why it read as intended behavior). Fixed 2026-08-02.
  return selectedRange?.endsWith(`-range-${rangeTag}`) ?? false;
}

/** Whether a range tag is directional (gated by range match). */
export function isDirectionalCore(rangeTag: CoreRange | undefined): boolean {
  return rangeTag === 'close' || rangeTag === 'mid' || rangeTag === 'far';
}
