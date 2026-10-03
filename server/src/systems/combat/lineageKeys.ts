/**
 * The `TracksCombat` keys the lineage card runtime keeps its moments under.
 *
 * Their own module because two readers need the same spelling: the runtime
 * (`lineageCards.ts`), which writes them, and the rhythm readout
 * (`rhythmReadout.ts`), which surfaces them to the HUD without simulating them.
 */

/** Refreshed by every landed hit; an engagement ends when it lapses. */
export const ENGAGEMENT_CD = 'lineage.engagement';
/** `hit-nth`: hits counted toward the card's next firing. */
export const nthCounter = (key: string): string => `lineage.nth.${key}`;
/** `first-hit`: the opener latch, on the player (per engagement) or the monster (per body). */
export const firstHitFlag = (key: string): string => `lineage.first.${key}`;
/** A moment's rate cap (design §24.2), per card: one landed firing per `capMs`. */
export const capCd = (key: string): string => `lineage.cap.${key}`;
/** `kill` with `carry`: armed by a kill, spent by the next landed hit. */
export const carryFlag = (key: string): string => `lineage.carry.${key}`;
