import type { PlayerMoveOptions, PlayerMoveResult, Vec2 } from '@mmo-idle/shared';
import type { PlayerEntity } from '../../ecs/entity';
import { attachComponent } from '../../ecs/markerHelpers';
import type { World } from '../../world/World';
import { directMoveTarget, normalizedMoveDirection, setEntityMotion, stopEntity } from './movement';
import { clampMoveTargetToNode } from './transitions';

/** The testable authority boundary for a single user movement order. */
export function applyManualMoveIntent(
  world: World,
  player: PlayerEntity | undefined,
  position: Vec2,
  options?: PlayerMoveOptions,
): PlayerMoveResult {
  const rejected = (): PlayerMoveResult => ({
    accepted: false,
    nodeId: player?.hasPosition.nodeId ?? '',
    goal: { ...(player?.hasPosition.current ?? { x: 0, y: 0 }) },
  });
  if (!player || player.isDead || player.isRooted || player.isChanneling) return rejected();
  if (!position || !Number.isFinite(position.x) || !Number.isFinite(position.y)) return rejected();
  if (options?.mode === 'direct' && options.direction !== undefined && !normalizedMoveDirection(options.direction)) {
    return rejected();
  }

  const nodeId = player.hasPosition.nodeId;
  const target = clampMoveTargetToNode(nodeId, options?.mode === 'direct'
    ? directMoveTarget(player.hasPosition.current, position, options.direction)
    : position);
  // New user orders are exact. The AI's nearby-goal reuse tolerance is not
  // appropriate when the user clicks a different point a few pixels away.
  stopEntity(world, player);
  setEntityMotion(world, player, target, {
    mode: options?.mode === 'direct' ? 'direct' : 'path',
    avoidHazards: false,
  });
  if (player.isMoving) attachComponent(world, player, 'hasManualMoveIntent', {});
  const route = player.hasMovePath?.waypoints;
  const goal = route?.length ? route[route.length - 1] : player.isMoving ? target : player.hasPosition.current;
  const arrived = Math.hypot(target.x - player.hasPosition.current.x, target.y - player.hasPosition.current.y) <= 0.01;
  return { accepted: !!player.isMoving || arrived, nodeId, goal: { ...goal } };
}
