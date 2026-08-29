import {
  buildNavGrid,
  cellToWorld,
  distanceSq,
  findPathOnGrid,
  goalsNearEnough,
  MONSTER_DATABASE,
  mountainLedgeFeatureIdsForNode,
  PATH_ARRIVAL_THRESHOLD,
  moverOverlapsBlockShapes,
  vectorTo,
  type FeatureTarget,
  type Vec2,
  type NavGrid,
  type NodeFeatureShape,
} from '@mmo-idle/shared';
import type { World } from '../../world/World';
import type { ServerEntity } from '../../ecs/entity';
import { attachComponent, detachComponent } from '../../ecs/markerHelpers';
import { activeAvoidablePersistentGroundZones } from './groundZones';

const REPLAN_COOLDOWN_MS = 300;

const replanCooldown = new Map<string, number>();

type PathEntity = ServerEntity & {
  hasPosition: NonNullable<ServerEntity['hasPosition']>;
  hasMovePath?: {
    goal: Vec2;
    waypoints: Vec2[];
    mover: FeatureTarget;
    avoidHazards?: boolean;
    dynamicHazardSignature?: string;
  };
};

// The nav grid applies the mover's body pad to every shape. Do not inflate a
// second time here; the escape owner already supplies a small center clearance.
const DYNAMIC_HAZARD_PATH_CLEARANCE = 0;

function dynamicHazardShapes(
  world: World,
  entity: PathEntity,
  now = Date.now(),
): NodeFeatureShape[] {
  if (!entity.isPlayer) return [];
  return activeAvoidablePersistentGroundZones(world, entity.hasPosition.nodeId, now).map((zone) => ({
    kind: 'circle' as const,
    x: zone.pos.x,
    y: zone.pos.y,
    radius: zone.radius + DYNAMIC_HAZARD_PATH_CLEARANCE,
  }));
}

function dynamicHazardSignature(
  world: World,
  entity: PathEntity,
  now = Date.now(),
): string {
  if (!entity.isPlayer) return '';
  return activeAvoidablePersistentGroundZones(world, entity.hasPosition.nodeId, now)
    .map((zone) => `${zone.id}:${zone.pos.x},${zone.pos.y},${zone.radius}`)
    .sort()
    .join('|');
}

function withDynamicHazards(base: NavGrid, shapes: NodeFeatureShape[]): NavGrid {
  if (shapes.length === 0) return base;
  const blocked = base.blocked.slice();
  for (let row = 0; row < base.rows; row++) {
    for (let col = 0; col < base.cols; col++) {
      if (blocked[row * base.cols + col] !== 0) continue;
      const center = cellToWorld(base, col, row);
      if (moverOverlapsBlockShapes(center, shapes, base.pad)) {
        blocked[row * base.cols + col] = 1;
      }
    }
  }
  return { ...base, blocked, shapes: [...base.shapes, ...shapes] };
}

function segmentTouchesDynamicHazard(
  from: Vec2,
  to: Vec2,
  shapes: NodeFeatureShape[],
  pad: Vec2,
): boolean {
  const distance = Math.hypot(to.x - from.x, to.y - from.y);
  const steps = Math.max(2, Math.ceil(distance / 8));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const point = {
      x: from.x + (to.x - from.x) * t,
      y: from.y + (to.y - from.y) * t,
    };
    if (moverOverlapsBlockShapes(point, shapes, pad)) return true;
  }
  return false;
}

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
  // Ledges do not apply to a caprine (it hops them) or to a flyer (it is in the
  // air). Two different fantasies, one pathing consequence.
  const monsterDef = entity.isMonster
    ? MONSTER_DATABASE.get(entity.isMonster.monsterTypeId)
    : undefined;
  if (monsterDef?.vaultsMountainLedges === true || monsterDef?.flies === true) {
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
  const base = buildNavGrid(
    entity.hasPosition.nodeId,
    mover,
    pad,
    suppressedFeatureIdsForEntity(world, entity),
    avoidHazards,
  );
  const grid = avoidHazards
    ? withDynamicHazards(base, dynamicHazardShapes(world, entity))
    : base;
  return findPathOnGrid(grid, entity.hasPosition.current, goal);
}

export function setMovePath(
  world: World,
  entity: PathEntity,
  goal: Vec2,
  waypoints: Vec2[],
  mover: FeatureTarget,
  avoidHazards = false,
  hazardSignature = '',
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
    dynamicHazardSignature: hazardSignature,
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
    (!waypoints || waypoints.length === 0) &&
    path.avoidHazards === true &&
    dynamicHazardSignature(world, entity) === ''
      ? planPath(world, entity, path.goal, path.mover, pad, false)
      : null;
  const nextWaypoints = waypoints && waypoints.length > 0 ? waypoints : fallbackWaypoints;
  if (!nextWaypoints || nextWaypoints.length === 0) return false;

  replanCooldown.set(entity.entityId, now);
  setMovePath(
    world,
    entity,
    path.goal,
    nextWaypoints,
    path.mover,
    path.avoidHazards === true,
    path.avoidHazards === true ? dynamicHazardSignature(world, entity) : '',
  );
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
  const hazardSignature = avoidHazards ? dynamicHazardSignature(world, entity) : '';

  const directHazards = avoidHazards ? dynamicHazardShapes(world, entity) : [];
  if (
    mode === 'direct' &&
    !segmentTouchesDynamicHazard(entity.hasPosition.current, goal, directHazards, pad)
  ) {
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
    && (existing.dynamicHazardSignature ?? '') === hazardSignature
  ) {
    // Pop any waypoint we are already standing on before steering at the head.
    // `advanceMovePath` normally does this, but its only caller is
    // `processMoverStep`, which runs off the `isMoving` query — so a mover that
    // lands exactly on `waypoints[0]` gets a zero-magnitude vector here,
    // `attachMotionToward` detaches `isMoving`, and it drops out of that query
    // for good. The queue then never advances and the entity holds a valid route
    // forever without moving: full HP, valid target, planned path, motionless.
    // (The auto-combat wedge — implementation plan §5.8 cause 2.)
    advanceMovePath(world, entity);
    const advanced = entity.hasMovePath;
    if (advanced) {
      if (advanced.waypoints.length > 0) {
        attachMotionToward(world, entity, advanced.waypoints[0]);
      }
      // else: advanceMovePath already steered at the final goal.
      return;
    }
    // Path completed and cleared — fall through and plan a fresh one.
  }

  const waypoints = planPath(world, entity, goal, mover, pad, avoidHazards);
  const fallbackWaypoints =
    (!waypoints || waypoints.length === 0) && avoidHazards && hazardSignature === ''
      ? planPath(world, entity, goal, mover, pad, false)
      : null;
  const nextWaypoints = waypoints && waypoints.length > 0 ? waypoints : fallbackWaypoints;
  if (!nextWaypoints || nextWaypoints.length === 0) {
    clearMovePath(world, entity);
    detachComponent(world, entity, 'isMoving');
    return;
  }

  setMovePath(world, entity, goal, nextWaypoints, mover, avoidHazards, hazardSignature);
}
