/**
 * FORCED MOVEMENT — one authoritative way to shove a player around.
 *
 * §4.8: knockback's authoritative path becomes a DIRECTION-NEUTRAL helper, and push
 * and pull are wrappers on it. Most of that machinery already existed —
 * `applyPlayerKnockback` does the bounds clamping, obstacle resolution and
 * move-intent cancellation, and `repositionPlayer` already reflects an anchor to
 * turn a push into a pull. What was missing was the shared entry point that applies
 * the same RESISTANCE and emits the same reason-tagged event whichever direction the
 * player is being moved.
 *
 * That matters because forced movement is one concept to the player. A stat called
 * "knockback resistance" that helps when a boss shoves you and does nothing when one
 * drags you would be a lie in the item text — so pull is resisted by exactly the same
 * number, and mobility gear keeps meaning what it says.
 *
 * No boss ever writes player coordinates directly. Everything comes through here.
 */

import type { Vec2 } from '@mmo-idle/shared';
import type { PlayerEntity } from '../../../ecs/entity';
import type { World } from '../../../world/World';
import { playerForcedMovementResistPct, repositionPlayer } from './knockback';

/**
 * How close a pull may bring the player to its anchor. Arriving exactly on top of
 * the boss would wedge them inside its body; a short margin lands them in melee.
 */
const PULL_ARRIVAL_MARGIN = 40;

/** Why the player was moved. Rides the event so the client can pick its FX. */
export type ForcedMovementReason = 'knockback' | 'pull';

export interface ForcedMovementResult {
  /** Where the player ended up, after clamping and obstacle resolution. */
  destination: Vec2;
  /** Distance actually applied, after resistance. */
  distance: number;
}

/**
 * Move `player` toward or away from `anchor`, resisted and clamped.
 *
 * Returns null when nothing happened — rooted, zero distance, or resistance ate the
 * whole push. Callers treat that as "the beat did not land", never as an error.
 */
export function applyForcedMovement(
  world: World,
  player: PlayerEntity,
  anchor: Vec2,
  baseDistance: number,
  toward: boolean,
  reason: ForcedMovementReason,
): ForcedMovementResult | null {
  if (baseDistance <= 0) return null;

  // ONE resistance for both directions. Splitting it would mean a player geared
  // against being shoved is still dragged at full strength, which reads as the stat
  // being broken rather than as a different mechanic.
  const resist = playerForcedMovementResistPct(player);
  let distance = Math.max(0, Math.round(baseDistance * (1 - resist)));

  if (toward) {
    // NEVER OVERSHOOT. `repositionPlayer` implements a pull by reflecting the anchor
    // and pushing away from the mirror, so a drag longer than the actual gap would
    // fling the player straight THROUGH the boss and out the far side — further away
    // than they started, from a mechanic whose entire job is to close distance.
    // Clamp to the gap, less a small margin so they arrive beside it, not inside it.
    const gap = Math.hypot(
      player.hasPosition.current.x - anchor.x,
      player.hasPosition.current.y - anchor.y,
    );
    distance = Math.min(distance, Math.max(0, gap - PULL_ARRIVAL_MARGIN));
  }
  if (distance <= 0) return null;

  const destination = repositionPlayer(world, player, anchor, distance, toward);
  if (!destination) return null;

  world.pushEvent(player.hasPosition.nodeId, {
    kind: 'player-knockback',
    playerId: player.isPlayer.id,
    pos: destination,
    reason,
  });
  return { destination, distance };
}

/** Shove the player AWAY from `anchor`. */
export function pushPlayer(
  world: World,
  player: PlayerEntity,
  anchor: Vec2,
  baseDistance: number,
): ForcedMovementResult | null {
  return applyForcedMovement(world, player, anchor, baseDistance, false, 'knockback');
}

/**
 * Drag the player TOWARD `anchor` — the Trench Undertow.
 *
 * Deliberately a displacement rather than a speed change or a teleport: §5.10 wants
 * the serpent to CATCH a disengaged player "without permanent speed or teleportation",
 * because a boss that permanently outruns you deletes ranged builds and one that
 * blinks to you cannot be read at all. A bounded, resisted, obstacle-respecting drag
 * is something the player can see coming and answer.
 */
export function pullPlayer(
  world: World,
  player: PlayerEntity,
  anchor: Vec2,
  baseDistance: number,
): ForcedMovementResult | null {
  return applyForcedMovement(world, player, anchor, baseDistance, true, 'pull');
}
