export interface IsDead {
  /**
   * Which tomb design marks this death. Chosen once at death and carried by the
   * tombstone that outlives the respawn, so the grave the player lies under and the
   * tomb left standing afterwards are the same art in the same place.
   */
  graveFrame: number;
  diedAtMs: number;
}

/**
 * How many tomb designs exist. Must track `TOMB_ART` in the client; the client
 * indexes modulo, so a drift here reads as a repeated design rather than a hole.
 */
export const GRAVE_FRAME_COUNT = 5;
