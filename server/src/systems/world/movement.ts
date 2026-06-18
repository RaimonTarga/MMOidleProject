import {
  aabbHalfExtents,
  advanceMotion,
  depenetrateToWalkable,
  distanceSq,
  getStatusEffect,
  moverOverlapsBlockShapes,
  posHitboxFromEntity,
  FROST_RAMP_EFFECT_ID,
  frostRampMoveSlowPct,
  slideMoveAgainstBlocks,
  VOID_CORRUPTION_EFFECT_ID,
  CORRUPTION_SLOW_PER_STACK,
  CORRUPTION_MIN_SPEED_MULT,
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
  suppressedFeatureIdsForNode,
} from './pathMotion';

// Monsters stay this many pixels from the node edge at all times.
const MONSTER_MARGIN = 40;
const PROGRESS_EPS_SQ = 1;

type MovableEntity = ServerEntity & {
  hasPosition: NonNullable<ServerEntity['hasPosition']>;
};

export interface SetEntityMotionOptions {
  mover?: FeatureTarget;
  mode?: 'path' | 'direct';
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

  requestNavMotion(world, entity, target, moverPad(entity), opts);
}

export function stopEntity(world: World, entity: ServerEntity): void {
  clearMovePath(world, entity);
  detachComponent(world, entity, 'isMoving');
  detachComponent(world, entity, 'hasManualMoveIntent');
}

/** Mover half-extents so obstacle collision keeps the body — not just the center
 *  point — clear of block shapes (prevents bounding-box intersection). */
function moverPad(entity: MovableEntity): Vec2 {
  return aabbHalfExtents(posHitboxFromEntity(entity).rects);
}

function depenetrateIfWedged(
  world: World,
  entity: MovableEntity,
  mover: FeatureTarget,
): void {
  const pad = moverPad(entity);
  const nodeId = entity.hasPosition.nodeId;
  const shapes = world.collision.blockShapes(nodeId, mover);
  const from = entity.hasPosition.current;
  if (!moverOverlapsBlockShapes(from, shapes, pad)) return;

  const freed = depenetrateToWalkable(
    nodeId,
    mover,
    pad,
    from,
    suppressedFeatureIdsForNode(world, nodeId),
  );
  if (!freed) return;

  entity.hasPosition.current = freed;
  markSliceDirty(world, entity, 'hasPosition');
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
  const pad = moverPad(entity);
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
  );
  const intendedBlocked = resolved !== next.position;

  if (intendedBlocked && distanceSq(from, resolved) < PROGRESS_EPS_SQ) {
    const shapes = world.collision.blockShapes(entity.hasPosition.nodeId, mover);
    const slid = slideMoveAgainstBlocks(from, next.position, shapes, pad);
    if (distanceSq(from, slid) >= PROGRESS_EPS_SQ) {
      resolved = slid;
    }
  }

  const madeProgress = distanceSq(from, resolved) >= PROGRESS_EPS_SQ;
  entity.hasPosition.current = resolved;
  markSliceDirty(world, entity, 'hasPosition');
  if (intendedBlocked && !madeProgress) {
    if (!replanIfBlocked(world, entity, pad, now, true)) {
      stopEntity(world, entity);
    }
    return;
  }

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
    const trample = getStatusEffect(entity.tracksCombat, 'summoner-trample-boon');
    const trampleMult = trample ? 1 + (trample.data.speedPct ?? 0.25) : 1;
    const bootMult = bootSpeedMultiplier(world, entity, now);
    processMoverStep(
      world,
      entity,
      dt,
      slowMult * frostRampMult * trampleMult * bootMult,
      'player',
      now,
    );
  }

  for (const e of world.movingMonsters) {
    if (e.isRooted) {
      stopEntity(world, e);
      continue;
    }

    const corruption = getStatusEffect(e.tracksCombat, VOID_CORRUPTION_EFFECT_ID);
    const corruptionMult = corruption
      ? Math.max(
          CORRUPTION_MIN_SPEED_MULT,
          1 - (corruption.data.slowPerStack ?? CORRUPTION_SLOW_PER_STACK),
        )
      : 1;
    processMoverStep(world, e, dt, corruptionMult, 'monster', now);

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
