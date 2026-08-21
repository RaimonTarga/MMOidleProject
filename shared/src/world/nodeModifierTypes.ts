/**
 * Node modifier vocabulary.
 *
 * Every non-excluded node carries exactly ONE modifier. This replaced the earlier
 * two-axis design (a mandatory "pace family" of five plus an optional, permanently
 * dormant "density" overlay of two) — the split bought nothing and the dormant half
 * meant swarm/elite ground never shipped. Density is now simply two of the five
 * modifiers, so there is one list, one field, and one catalyst per modifier.
 *
 * All five are NET DIFFICULTY INCREASES over an unmodified node (user decision
 * 2026-08-18). The old families were threat-budget-neutral by construction — every
 * one traded something away, so nodes differed in texture but not in difficulty.
 * They now differ in both, and rewards scale to match. Note the consequence: since
 * every combat node carries a modifier, the unmodified baseline is never actually
 * played — it exists only as the reference the multipliers are measured against.
 */
export type NodeModifierFamily =
  | 'alacrity'
  | 'heavy'
  | 'swarming'
  | 'dominion'
  | 'fortified';

/** Canonical order used by world authoring, wallets, legends, and validation. */
export const NODE_MODIFIER_FAMILIES: NodeModifierFamily[] = [
  'alacrity',
  'heavy',
  'swarming',
  'dominion',
  'fortified',
];

export interface NodeModifierInfo {
  modifier: NodeModifierFamily;
}

/**
 * Modifiers a biome may never carry.
 *
 * ⚠ This table also controls the MAP'S NODE COUNT. `buildRegionNodes` emits one node
 * per non-banned modifier plus a second node for the biome's native modifier, so a
 * biome's node count is `(5 - bans) + (native ? 1 : 0)` and the hand-authored region
 * masks are cut to fit exactly. Adding or removing a ban changes how many cells that
 * biome needs and will break its region mask. Keep one ban for each biome listed here
 * and none for any other unless you are also re-cutting masks.
 *
 * Consequence accepted by the user 2026-08-18: biomes with no ban host all five
 * modifiers, so a swarming Caverns and a swarming Trench exist despite their low
 * native density. Variety was preferred over thematic purity.
 */
export const MODIFIER_BANS: Record<string, NodeModifierFamily[]> = {
  forest: ['heavy'],      // fast and light — never ponderous
  mountain: ['alacrity'], // ponderous by identity
  jungle: ['heavy'],
  desert: ['alacrity'],
  tundra: ['alacrity'],
};

/**
 * Each biome's native modifier — the one it carries on an extra node, making it that
 * biome's most common flavour and its catalyst identity. `null` means the
 * deliberately neutral Plains, which has no native and therefore no extra node.
 *
 * A native must not appear in that biome's `MODIFIER_BANS` entry.
 */
export const NATIVE_MODIFIER: Record<string, NodeModifierFamily | null> = {
  plains: null,
  forest: 'alacrity',
  mountain: 'heavy',
  swamp: 'fortified',   // slow, armoured, attritional
  cave: 'dominion',     // few but elite — the biome's whole shape
  jungle: 'alacrity',
  desert: 'dominion',
  tundra: 'heavy',
  volcanic: 'swarming',
  graveyard: 'swarming',
  trench: 'dominion',
};
