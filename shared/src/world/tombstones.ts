/**
 * TOMBSTONE VIEWS — where somebody died, left standing after they got back up.
 *
 * The grave a dying player turns into is their OWN entity re-skinned, so it walked
 * away with them on respawn and the node forgot anyone had ever fallen there. A
 * tombstone is the durable half of that: a small record planted at the death spot
 * that outlives both the respawn and the node freeze behind it, so walking into a
 * node tells you what happened there recently.
 *
 * Runtime-only and never persisted — same rule as monsters and corpses. Unlike
 * those, it deliberately SURVIVES node freeze (see `world.tombstones`), because a
 * player who dies alone empties the node the instant they respawn and a freeze-swept
 * tombstone would live about one tick.
 */

import type { Vec2 } from '../systems/spatial';

/** How long a tombstone stands before it crumbles. */
export const TOMBSTONE_TTL_MS = 15 * 60_000;

export interface TombstoneView {
  id: string;
  x: number;
  y: number;
  /** Which tomb sprite to draw. Inherited from the dead player's `isDead.graveFrame`
   *  so the grave-to-tombstone handoff at respawn is the same art in the same place. */
  graveFrame: number;
  /** Who fell here. */
  playerName: string;
  /**
   * What killed them, already resolved to a display name server-side ("Gnarled
   * Greatbear", "Berserker Stance"). Absent when nothing nameable did — dying to
   * accumulated damage with no remembered source.
   */
  killerName?: string;
  /** Time left before the tombstone crumbles. Lets the client fade it out. */
  remainingMs: number;
}

/** Position helper so callers do not re-destructure the flattened view. */
export function tombstoneViewPos(view: TombstoneView): Vec2 {
  return { x: view.x, y: view.y };
}

/** The proximity tooltip line: "Kaelin died to Gnarled Greatbear". */
export function tombstoneEpitaph(view: TombstoneView): string {
  return view.killerName
    ? `${view.playerName} died to ${view.killerName}`
    : `${view.playerName} died here`;
}
