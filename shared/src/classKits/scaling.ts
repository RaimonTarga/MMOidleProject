/**
 * Every class piece scales with the class's tier, so a T1 favourite stays fieldable and new
 * lessons add choices instead of replacing old ones (bible §7.2, §8.8, §9.8, §10.8, §11.8,
 * §12.8). One curve for every piece of every class.
 *
 * PLACEHOLDER, anchored on the authored weapon curve (`weaponCurve.test.ts`): the hammer line
 * runs 38 → 85 → 164 → 370 and the broadsword line 19 → 51 → 112 → 212 from T1 to T4, about
 * ×1 / ×2.6 / ×5 / ×10. Pieces scale like weapons until the designer says otherwise.
 */
export const PIECE_TIER_SCALE: Readonly<Record<number, number>> = {
  1: 1,
  2: 2.6,
  3: 5,
  4: 10,
};

const TOP_AUTHORED_TIER = 4;

/** The multiplier a piece's damage-like params take at `tier` (the Clearing counts as T1). */
export function pieceTierScale(tier: number): number {
  const clamped = Math.min(Math.max(Math.floor(tier), 1), TOP_AUTHORED_TIER);
  return PIECE_TIER_SCALE[clamped];
}
