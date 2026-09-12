/**
 * An in-progress Deathroll Drag: this monster has a player in its jaws and is
 * hauling them back to its lair.
 *
 * Presence of the component is the whole state machine — while it is attached the
 * AI does not chase, the combat loop does not swing, and the drag system is the
 * sole writer of the monster's position, exactly as `HasKnockback` owns a slide.
 * Detaching it releases the monster back to ordinary behaviour.
 *
 * Server-only: the victim's motion already reaches the client as authoritative
 * `player-knockback` events, and the monster's as ordinary position deltas, so
 * nothing here needs to be networked.
 */
import type { Vec2 } from '../../systems/spatial';

export interface DragsPrey {
  /** Player being hauled. */
  targetId: string;
  /** Where the prey is being taken — the lair's centre. */
  destination: Vec2;
  /** How fast the prey is hauled, px/s. */
  speed: number;
  /** Wall-clock ms at which the jaws let go regardless of progress. */
  endsAt: number;
  /** Wall-clock ms of the last wake cue, so the trail cadence is not tick-rate. */
  lastWakeAt: number;
}
