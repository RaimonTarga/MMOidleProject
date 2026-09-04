/**
 * CORPSE VIEWS — the dead, made visible.
 *
 * Necromancy was previously invisible bookkeeping: corpses existed only as a server
 * list, so a player watching a Wasteland fight had no way to know WHICH bodies were
 * about to get up, or that the boss was reaching for them at all. The whole encounter
 * read as "things reappear, somehow".
 *
 * A corpse therefore gets a stable id and a minimal view. `reservedBy` is the
 * load-bearing field: while a Raise Dead is casting, the corpses it has claimed are
 * marked, so "which of these is coming back" is answered on the floor BEFORE the
 * cast lands rather than after it.
 *
 * Runtime-only and never persisted, exactly like the monsters they came from.
 */

import type { Vec2 } from '../systems/spatial';

export interface CorpseView {
  id: string;
  /** Which monster died here, so the client can draw the right silhouette. */
  monsterTypeId: string;
  x: number;
  y: number;
  /** Time left before the corpse decays past raising. Lets the client fade it out. */
  remainingMs: number;
  /**
   * Monster id of a raiser that has CLAIMED this corpse for an in-flight cast.
   * Present means "this one is getting up": the client draws the glow and the
   * boss-to-corpse tether from it. Released if the cast is cancelled.
   */
  reservedBy?: string;
}

/** Position helper so callers do not re-destructure the flattened view. */
export function corpseViewPos(view: CorpseView): Vec2 {
  return { x: view.x, y: view.y };
}
