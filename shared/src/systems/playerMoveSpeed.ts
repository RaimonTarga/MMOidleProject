/**
 * The single authority for collapsing every move-speed multiplier on a player into
 * one number (Biome Ecology Pass 2, Session 5).
 *
 * Player speed used to be a bare product — `slow.speedMult × frostRampMult ×
 * bootMult`. Same-id effects overwrite, but DIFFERENT ids multiply, and the biome
 * ecology pass keeps adding ids: a hazard slow, a tundra frost ramp, and (Session 6)
 * an ambient chill can all be live at once. Three unrelated 0.6s multiply to 0.216
 * — a soft root nobody authored, from three effects each of which reads as
 * "slowed a bit" in the HUD.
 *
 * So: SLOWS multiply against each other and are then clamped at
 * {@link MIN_PLAYER_MOVE_SLOW_MULT}; hastes multiply on top of the clamp, so mobility
 * boots always still help. A hard stop is NOT a slow — a root (`speedMult` 0) is
 * absolute and passes straight through, or the clamp would hand rooted players 35%
 * of their speed back.
 *
 * Both the server movement pass and the client's own-player extrapolation call this
 * with their respective inputs (status effects / `PlayerBuff.speedMult`), so the two
 * cannot drift apart the way an inlined clamp on one side would.
 */

/**
 * Floor on the compounded SLOW product — the slowest any stack of partial slows can
 * leave a player. Placeholder — user balance pass.
 */
export const MIN_PLAYER_MOVE_SLOW_MULT = 0.35;

/**
 * Collapse move-speed multipliers into the effective multiplier. Order-independent.
 *
 * @param mults every multiplier in play: <1 slows, >1 hastes, exactly 0 a root.
 */
export function playerMoveSpeedMult(mults: readonly number[]): number {
  let slow = 1;
  let haste = 1;
  for (const mult of mults) {
    if (mult <= 0) return 0;
    if (mult < 1) slow *= mult;
    else if (mult > 1) haste *= mult;
  }
  return Math.max(MIN_PLAYER_MOVE_SLOW_MULT, slow) * haste;
}
