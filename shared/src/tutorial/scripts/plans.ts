/**
 * The two facts every class's later tutorial shares: which Tier-1 zones exist,
 * and which two of them are the seals. Per-class gear, rune and weapon-page
 * plans used to live here; those lessons left with the class script.
 */

export type T1Biome = 'plains' | 'forest' | 'swamp' | 'mountain' | 'cave';

export const T1_BIOME_ORDER: readonly T1Biome[] = ['plains', 'forest', 'swamp', 'mountain', 'cave'];

/**
 * The two bosses the guide fights, in order; two seals promote to Tier 2.
 * Designer decision 2026-09-29: Plains + Mountain (was Forest, until the bot
 * showed the Greatbear walling a GM-30 Striker and Apprentice while the
 * Mountain boss fell first try; docs/guided-tutorial-plan.md, Findings).
 * Changing a seal is this one line; the seal route reads it.
 */
export const TUTORIAL_SEALS: readonly [T1Biome, T1Biome] = ['plains', 'mountain'];
