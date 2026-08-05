import {
  advanceMotion,
  buildNavGrid,
  cellToWorld,
  depenetrateToWalkable,
  distanceSq,
  getFlag,
  getStatusEffect,
  moverOverlapsBlockShapes,
  navigationBodyHalfExtents,
  nearestWalkableCell,
  FROST_RAMP_EFFECT_ID,
  frostRampMoveSlowPct,
  slideMoveAgainstBlocks,
  type FeatureTarget,
  type Vec2,
} from '@mmo-idle/shared';
import type { World } from '../../world/World';
import { NODE_REGISTRY } from '../../world/nodeRegistry';
import type { ServerEntity } from '../../ecs/entity';
import { detachComponent } from '../../ecs/markerHelpers';
import { markSliceDirty } from '../../ecs/dirtyHelpers';
import { resolveObstaclesForNode } from './nodeFeatures';
import { bootSpeedMultiplier } from './mobility/mobilityBoots';
import {
  advanceMovePath,
  clearMovePath,
  inferMoverTarget,
  replanIfBlocked,
  requestNavMotion,
  suppressedFeatureIdsForEntity,
} from './pathMotion';

// Monsters stay this many pixels from the node edge at all times.
const MONSTER_MARGIN = 40;
const PROGRESS_EPS_SQ = 1;
const STUCK_REPLAN_MS = 800;
const STUCK_RECOVER_MS = 1_800;

interface StuckState {
  blockedMs: number;
  replanned: boolean;
}

const stuckByEntity = new Map<string, StuckState>();

type MovableEntity = ServerEntity & {
  hasPosition: NonNullable<ServerEntity['hasPosition']>;
};

export interface SetEntityMotionOptions {
  mover?: FeatureTarget;
  mode?: 'path' | 'direct';
  avoidHazards?: boolean;
}

export function setEntityMotion(
  world: World,
  entity: MovableEntity,
  target: Vec2,
  opts?: SetEntityMotionOptions,
): void {
  if (entity.isRooted) {
    stopEntity(world, entity);
    return;
  }

  const avoidHazards =
    opts?.avoidHazards ??
    (entity.isPlayer !== undefined && entity.tracksCombat !== undefined
      ? getFlag(entity.tracksCombat, 'rune.avoidNodeHazards')
      : false);

  requestNavMotion(world, entity, target, navigationPadForEntity(entity), {
    ...opts,
    avoidHazards,
  });
}

export function stopEntity(world: World, entity: ServerEntity): void {
  clearMovePath(world, entity);
  detachComponent(world, entity, 'isMoving');
  detachComponent(world, entity, 'hasManualMoveIntent');
}

/** Mover half-extents so obstacle collision keeps the body — not just the center
 *  point — clear of block shapes (prevents bounding-box intersection). */
export function navigationPadForEntity(entity: ServerEntity): Vec2 {
  if (entity.isPlayer) return navigationBodyHalfExtents('player');
  if (entity.isMinion) return navigationBodyHalfExtents('minion');
  return navigationBodyHalfExtents('monster', entity.isMonster?.isBoss === true);
}

function depenetrateIfWedged(
  world: World,
  entity: MovableEntity,
  mover: FeatureTarget,
): void {
  const pad = navigationPadForEntity(entity);
  const nodeId = entity.hasPosition.nodeId;
  const suppressed = suppressedFeatureIdsForEntity(world, entity);
  const shapes = suppressed.size > 0
    ? world.collision
        .staticRegions(nodeId)
        .filter(region =>
          region.kind === 'block' &&
          region.data?.blockTarget === mover &&
          (typeof region.data?.featureId !== 'string' ||
            !suppressed.has(region.data.featureId)))
        .map(region => region.shape)
    : world.collision.blockShapes(nodeId, mover);
  const from = entity.hasPosition.current;
  if (entity.controlsMonster && moverOverlapsBlockShapes(entity.controlsMonster.spawn, shapes, pad)) {
    const freedSpawn = depenetrateToWalkable(
      nodeId,
      mover,
      pad,
      entity.controlsMonster.spawn,
      suppressed,
    );
    if (freedSpawn) {
      entity.controlsMonster.spawn = freedSpawn;
    }
  }

  if (!moverOverlapsBlockShapes(from, shapes, pad)) return;

  const freed = depenetrateToWalkable(nodeId, mover, pad, from, suppressed);
  if (!freed) return;

  entity.hasPosition.current = freed;
  markSliceDirty(world, entity, 'hasPosition');
}

function recoverStuckEntity(
  world: World,
  entity: MovableEntity,
  mover: FeatureTarget,
  pad: Vec2,
): boolean {
  const path = entity.hasMovePath;
  const goal = path?.goal;
  const avoidHazards = path?.avoidHazards === true;
  const suppressed = suppressedFeatureIdsForEntity(world, entity);
  const grid = buildNavGrid(
    entity.hasPosition.nodeId,
    mover,
    pad,
    suppressed,
    avoidHazards,
  );
  const cell = nearestWalkableCell(grid, entity.hasPosition.current, 24);
  if (!cell) return false;

  const safe = cellToWorld(grid, cell.col, cell.row);
  if (moverOverlapsBlockShapes(safe, grid.shapes, grid.pad)) return false;

  entity.hasPosition.current = safe;
  markSliceDirty(world, entity, 'hasPosition');
  if (goal) {
    requestNavMotion(world, entity, goal, pad, { mover, avoidHazards });
  } else {
    stopEntity(world, entity);
  }
  return true;
}

function handleBlockedMover(
  world: World,
  entity: MovableEntity,
  mover: FeatureTarget,
  pad: Vec2,
  dt: number,
  now: number,
): void {
  const state = stuckByEntity.get(entity.entityId) ?? {
    blockedMs: 0,
    replanned: false,
  };
  state.blockedMs += dt;

  if (!state.replanned && state.blockedMs >= STUCK_REPLAN_MS) {
    state.replanned = true;
    if (replanIfBlocked(world, entity, pad, now, true)) {
      stuckByEntity.set(entity.entityId, state);
      return;
    }
  }

  if (state.blockedMs >= STUCK_RECOVER_MS) {
    recoverStuckEntity(world, entity, mover, pad);
    stuckByEntity.delete(entity.entityId);
    return;
  }

  stuckByEntity.set(entity.entityId, state);
  // Preserve hasMovePath so the watchdog can replan the same goal on the next
  // autonomous steering tick. Clearing it here turns a temporary corner catch
  // into repeated fresh direct motions with no recovery context.
  detachComponent(world, entity, 'isMoving');
  detachComponent(world, entity, 'hasManualMoveIntent');
}

function processMoverStep(
  world: World,
  entity: MovableEntity,
  dt: number,
  speedMult: number,
  mover: FeatureTarget,
  now: number,
): void {
  advanceMovePath(world, entity);

  if (!entity.isMoving) return;

  const from = entity.hasPosition.current;
  const pad = navigationPadForEntity(entity);
  const next = advanceMotion(
    from,
    entity.isMoving.motion,
    entity.hasPosition.speed * speedMult * (dt / 1000),
  );
  let resolved = resolveObstaclesForNode(
    world,
    entity.hasPosition.nodeId,
    from,
    next.position,
    mover,
    pad,
    suppressedFeatureIdsForEntity(world, entity),
  );
  const intendedBlocked = resolved !== next.position;

  if (intendedBlocked && distanceSq(from, resolved) < PROGRESS_EPS_SQ) {
    const suppressed = suppressedFeatureIdsForEntity(world, entity);
    const shapes = suppressed.size > 0
      ? world.collision
          .staticRegions(entity.hasPosition.nodeId)
          .filter(region =>
            region.kind === 'block' &&
            region.data?.blockTarget === mover &&
            (typeof region.data?.featureId !== 'string' ||
              !suppressed.has(region.data.featureId)))
          .map(region => region.shape)
      : world.collision.blockShapes(entity.hasPosition.nodeId, mover);
    const slid = slideMoveAgainstBlocks(from, next.position, shapes, pad);
    if (distanceSq(from, slid) >= PROGRESS_EPS_SQ) {
      resolved = slid;
    }
  }

  const madeProgress = distanceSq(from, resolved) >= PROGRESS_EPS_SQ;
  entity.hasPosition.current = resolved;
  markSliceDirty(world, entity, 'hasPosition');
  if (intendedBlocked && !madeProgress) {
    handleBlockedMover(world, entity, mover, pad, dt, now);
    return;
  }

  if (madeProgress) stuckByEntity.delete(entity.entityId);

  if (next.motion.magnitude > 0) {
    entity.isMoving.motion = next.motion;
    markSliceDirty(world, entity, 'isMoving');
  } else {
    stopEntity(world, entity);
  }
}

export function updateMovement(world: World, dt: number, now: number) {
  for (const entity of world.livePlayers) {
    depenetrateIfWedged(world, entity, 'player');
  }
  for (const entity of world.minionEntities) {
    if (entity.hasHealth.hp <= 0) continue;
    depenetrateIfWedged(world, entity, inferMoverTarget(entity));
  }
  for (const entity of world.monsterEntities) {
    if (entity.hasHealth.hp <= 0) continue;
    depenetrateIfWedged(world, entity, 'monster');
  }

  for (const entity of world.movingPlayers) {
    if (entity.isRooted || entity.isChanneling) {
      stopEntity(world, entity);
      continue;
    }

    const slow = getStatusEffect(entity.tracksCombat, 'slow');
    const slowMult = slow ? Math.max(0, slow.data['speedMult'] ?? 1) : 1;
    const frostRamp = getStatusEffect(entity.tracksCombat, FROST_RAMP_EFFECT_ID);
    const frostRampMult = frostRamp ? 1 - frostRampMoveSlowPct(frostRamp) : 1;
    const bootMult = bootSpeedMultiplier(world, entity, now);
    processMoverStep(
      world,
      entity,
      dt,
      slowMult * frostRampMult * bootMult,
      'player',
      now,
    );
  }

  for (const e of world.movingMonsters) {
    if (e.isRooted) {
      stopEntity(world, e);
      continue;
    }

    processMoverStep(world, e, dt, 1, 'monster', now);

    const node = NODE_REGISTRY.get(e.hasPosition.nodeId);
    if (node) {
      e.hasPosition.current.x = Math.max(
        MONSTER_MARGIN,
        Math.min(node.width - MONSTER_MARGIN, e.hasPosition.current.x),
      );
      e.hasPosition.current.y = Math.max(
        MONSTER_MARGIN,
        Math.min(node.height - MONSTER_MARGIN, e.hasPosition.current.y),
      );
    }
  }

  for (const e of world.movingMinions) {
    if (e.isRooted) {
      stopEntity(world, e);
      continue;
    }

    processMoverStep(world, e, dt, 1, 'monster', now);

    const node = NODE_REGISTRY.get(e.hasPosition.nodeId);
    if (node) {
      e.hasPosition.current.x = Math.max(
        MONSTER_MARGIN,
        Math.min(node.width - MONSTER_MARGIN, e.hasPosition.current.x),
      );
      e.hasPosition.current.y = Math.max(
        MONSTER_MARGIN,
        Math.min(node.height - MONSTER_MARGIN, e.hasPosition.current.y),
      );
    }
  }
}
