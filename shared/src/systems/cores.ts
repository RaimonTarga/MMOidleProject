import type { CoreEligibility } from '../items';

/**
 * Cores — the 5th equipment slot's build amplifier.
 *
 * A core's effect is gated by its eligibility category against the player's
 * `selectedRange`:
 *  - `melee`        → CLOSE builds only.
 *  - `ranged`       → MID and FAR builds (one shared pool — "ranged" means non-melee
 *                     positional combat, not maximum distance).
 *  - `unrestricted` → every build.
 *
 * Eligibility is BINARY — full effect or nothing. An ineligible core contributes
 * neither its upsides nor its tradeoffs (the stat rebuild skips it entirely).
 *
 * This is the single authority for the gate: the stat rebuild (systems/stats.ts) uses
 * it to decide whether to apply an equipped core's statModifiers/mechanicEffects, and
 * the client UI uses it to show a core as active/inactive. Keep both reading from here
 * so they can never disagree.
 *
 * See `design_docs/CORE_DESIGN_PHILOSOPHY.md` §3–4.
 */
export function coreIsActive(
  eligibility: CoreEligibility | undefined,
  selectedRange: string | null,
): boolean {
  // Missing eligibility is an AUTHORING bug (see Recipe.coreEligibility), not a
  // design state. Fail open so a bad recipe can't brick a save; the authoring test
  // is what actually guarantees every core declares one.
  if (!eligibility || eligibility === 'unrestricted') return true;

  // `selectedRange` holds the full tier-2 skill id (e.g. `cadence-range-close`), not
  // a bare `close|mid|far` — see progression/skills.ts where it is assigned. Every
  // other consumer matches it with `endsWith('-range-<kind>')`. A strict equality
  // check here once meant EVERY directional core was permanently inactive, and it
  // read as intended behaviour because the server gate and both client indicators
  // agreed with each other. Fixed 2026-08-02; keep the suffix form.
  if (eligibility === 'melee') return selectedRange?.endsWith('-range-close') ?? false;

  return selectedRange?.endsWith('-range-mid') === true
      || selectedRange?.endsWith('-range-far') === true;
}

/**
 * Whether an eligibility category is gated at all (i.e. can ever read as inactive).
 * Drives the dimmed-slot / "needs a melee build" indicators in the inventory UI.
 */
export function isRestrictedCore(eligibility: CoreEligibility | undefined): boolean {
  return eligibility === 'melee' || eligibility === 'ranged';
}

/** Player-facing name for an eligibility category. Shared by every UI surface. */
export function coreEligibilityLabel(eligibility: CoreEligibility | undefined): string {
  if (eligibility === 'melee')  return 'Melee builds only';
  if (eligibility === 'ranged') return 'Mid or Far range builds';
  return 'Any build';
}
