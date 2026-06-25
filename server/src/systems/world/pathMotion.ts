import {
  distanceSq,
  findPathForMover,
  goalsNearEnough,
  MONSTER_DATABASE,
  mountainLedgeFeatureIdsForNode,
  PATH_ARRIVAL_THRESHOLD,
  vectorTo,
  type FeatureTarget,
  type Vec2,
} from '@mmo-idle/shared';
import type { World } from '../../world/World';
import type { ServerEntity } from '../../ecs/entity';
import { attachComponent, detachComponent } from '../../ecs/markerHelpers';

const REPLAN_COOLDOWN_MS = 300;

const replanCooldown = new Map<string, number>();

type PathEntity = ServerEntity & {
  hasPosition: NonNullable<ServerEntity['hasPosition']>;
  hasMovePath?: {
    goal: Vec2;
    waypoints: Vec2[];
    mover: FeatureTarget;
    avoidHazards?: boolean;
  };
};

export function inferMoverTarget(entity: ServerEntity): FeatureTarget {
  return entity.isPlayer ? 'player' : 'monster';
}

export function suppressedFeatureIdsForNode(world: World, nodeId: string): Set<string> {
  const prefix = `${nodeId}:`;
  const ids = new Set<string>();
  for (const key of world.suppressedFeatureBlocks) {
    if (key.startsWith(prefix)) ids.add(key.slice(prefix.length));
  }
  return ids;
}

export function suppressedFeatureIdsForEntity(
  world: World,
  entity: ServerEntity,
): Set<string> {
  const nodeId = entity.hasPosition?.nodeId;
  if (!nodeId) return new Set();
  const ids = suppressedFeatureIdsForNode(world, nodeId);
  if (
    entity.isMonster &&
    MONSTER_DATABASE.get(entity.isMonster.monsterTypeId)?.vaultsMountainLedges === true
  ) {
    for (const id of mountainLedgeFeatureIdsForNode(nodeId)) ids.add(id);
  }
  return ids;
}

export function clearMovePath(world: World, entity: ServerEntity): void {
  detachComponent(world, entity, 'hasMovePath');
  replanCooldown.delete(entity.entityId);
}

function attachMotionToward(
  world: World,
  entity: PathEntity,
  target: Vec2,
): void {
  const motion = vectorTo(entity.hasPosition.current, target);
  if (motion.magnitude > 0) {
    attachComponent(world, entity, 'isMoving', { motion });
  } else {
    detachComponent(world, entity, 'isMoving');
  }
}

function planPath(
  world: World,
  entity: PathEntity,
  goal: Vec2,
  mover: FeatureTarget,
  pad: Vec2,
  avoidHazards: boolean,
): Vec2[] | null {
  return findPathForMover(
    entity.hasPosition.nodeId,
    mover,
    pad,
    entity.hasPosition.current,
    goal,
    suppressedFeatureIdsForEntity(world, entity),
    avoidHazards,
  );
}

export function setMovePath(
  world: World,
  entity: PathEntity,
  goal: Vec2,
  waypoints: Vec2[],
  mover: FeatureTarget,
  avoidHazards = false,
): void {
  if (waypoints.length === 0) {
    clearMovePath(world, entity);
    attachMotionToward(world, entity, goal);
    return;
  }

  attachComponent(world, entity, 'hasMovePath', {
    goal: { x: goal.x, y: goal.y },
    waypoints: waypoints.map(wp => ({ x: wp.x, y: wp.y })),
    mover,
    avoidHazards,
  });
  attachMotionToward(world, entity, waypoints[0]);
}

/**
 * Advance waypoint queue when the entity has reached the current steering target.
 */
export function advanceMovePath(world: World, entity: PathEntity): void {
  const path = entity.hasMovePath;
  if (!path || path.waypoints.length === 0) return;

  const pos = entity.hasPosition.current;
  const current = path.waypoints[0];
  if (distanceSq(pos, current) > PATH_ARRIVAL_THRESHOLD * PATH_ARRIVAL_THRESHOLD) {
    return;
  }

  path.waypoints.shift();
  if (path.waypoints.length === 0) {
    if (goalsNearEnough(pos, path.goal)) {
      clearMovePath(world, entity);
      detachComponent(world, entity, 'isMoving');
      return;
    }
    attachMotionToward(world, entity, path.goal);
    return;
  }

  attachMotionToward(world, entity, path.waypoints[0]);
}

export function replanIfBlocked(
  world: World,
  entity: PathEntity,
  pad: Vec2,
  now: number,
  force = false,
): boolean {
  const path = entity.hasMovePath;
  if (!path) return false;

  if (!force) {
    const last = replanCooldown.get(entity.entityId) ?? 0;
    if (now - last < REPLAN_COOLDOWN_MS) return false;
  }

  const waypoints = planPath(
    world,
    entity,
    path.goal,
    path.mover,
    pad,
    path.avoidHazards === true,
  );
  const fallbackWaypoints =
    (!waypoints || waypoints.length === 0) && path.avoidHazards === true
      ? planPath(world, entity, path.goal, path.mover, pad, false)
      : null;
  const nextWaypoints = waypoints && waypoints.length > 0 ? waypoints : fallbackWaypoints;
  if (!nextWaypoints || nextWaypoints.length === 0) return false;

  replanCooldown.set(entity.entityId, now);
  setMovePath(world, entity, path.goal, nextWaypoints, path.mover, path.avoidHazards === true);
  return true;
}

export function requestNavMotion(
  world: World,
  entity: PathEntity,
  goal: Vec2,
  pad: Vec2,
  opts?: { mover?: FeatureTarget; mode?: 'path' | 'direct'; avoidHazards?: boolean },
): void {
  const mover = opts?.mover ?? inferMoverTarget(entity);
  const mode = opts?.mode ?? 'path';
  const avoidHazards = opts?.avoidHazards === true;

  if (mode === 'direct') {
    clearMovePath(world, entity);
    attachMotionToward(world, entity, goal);
    return;
  }

  const existing = entity.hasMovePath;
  if (
    existing
    && goalsNearEnough(existing.goal, goal)
    && existing.waypoints.length > 0
    && existing.mover === mover
    && (existing.avoidHazards === true) === avoidHazards
  ) {
    attachMotionToward(world, entity, existing.waypoints[0]);
    return;
  }

  const waypoints = planPath(world, entity, goal, mover, pad, avoidHazards);
  const fallbackWaypoints =
    (!waypoints || waypoints.length === 0) && avoidHazards
      ? planPath(world, entity, goal, mover, pad, false)
      : null;
  const nextWaypoints = waypoints && waypoints.length > 0 ? waypoints : fallbackWaypoints;
  if (!nextWaypoints || nextWaypoints.length === 0) {
    clearMovePath(world, entity);
    detachComponent(world, entity, 'isMoving');
    return;
  }

  setMovePath(world, entity, goal, nextWaypoints, mover, avoidHazards);
}
