import {
  advanceMotion,
  getStatusEffect,
  vectorTo,
  VOID_CORRUPTION_EFFECT_ID,
  CORRUPTION_SLOW_PER_STACK,
  CORRUPTION_MIN_SPEED_MULT,
  type Vec2,
} from '@mmo-idle/shared';
import type { World } from '../../world/World';
import { NODE_REGISTRY } from '../../world/nodeRegistry';
import type { ServerEntity } from '../../ecs/entity';
import { attachComponent, detachComponent } from '../../ecs/markerHelpers';
import { resolveObstaclesForNode } from './nodeFeatures';

// Monsters stay this many pixels from the node edge at all times.
const MONSTER_MARGIN = 40;

type MovableEntity = ServerEntity & {
  hasPosition: NonNullable<ServerEntity['hasPosition']>;
};

export function setEntityMotion(world: World, entity: MovableEntity, target: Vec2): void {
  if (entity.isRooted) {
    stopEntity(world, entity);
    return;
  }

  const motion = vectorTo(entity.hasPosition.current, target);
  if (motion.magnitude > 0) {
    attachComponent(world, entity, 'isMoving', { motion });
  } else {
    detachComponent(world, entity, 'isMoving');
  }
}

export function stopEntity(world: World, entity: ServerEntity): void {
  detachComponent(world, entity, 'isMoving');
  detachComponent(world, entity, 'hasManualMoveIntent');
}

export function updateMovement(world: World, dt: number) {
  for (const entity of world.movingPlayers) {
    if (entity.isRooted || entity.isChanneling) {
      stopEntity(world, entity);
      continue;
    }

    const slow = getStatusEffect(entity.tracksCombat, 'slow');
    const slowMult = slow ? Math.max(0, slow.data['speedMult'] ?? 1) : 1;
    const trample = getStatusEffect(entity.tracksCombat, 'summoner-trample-boon');
    const trampleMult = trample ? 1 + (trample.data.speedPct ?? 0.25) : 1;
    const next = advanceMotion(
      entity.hasPosition.current,
      entity.isMoving.motion,
      entity.hasPosition.speed * slowMult * trampleMult * (dt / 1000),
    );
    const resolved = resolveObstaclesForNode(
      world,
      entity.hasPosition.nodeId,
      entity.hasPosition.current,
      next.position,
      'player',
    );
    const blocked = resolved !== next.position;
    entity.hasPosition.current = resolved;
    if (blocked) {
      stopEntity(world, entity);
    } else if (next.motion.magnitude > 0) {
      entity.isMoving.motion = next.motion;
    } else {
      stopEntity(world, entity);
    }
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
          1 - corruption.stacks * (corruption.data.slowPerStack ?? CORRUPTION_SLOW_PER_STACK),
        )
      : 1;
    const next = advanceMotion(
      e.hasPosition.current,
      e.isMoving.motion,
      e.hasPosition.speed * corruptionMult * (dt / 1000),
    );
    const resolved = resolveObstaclesForNode(
      world,
      e.hasPosition.nodeId,
      e.hasPosition.current,
      next.position,
      'monster',
    );
    const blocked = resolved !== next.position;
    e.hasPosition.current = resolved;
    if (blocked) {
      stopEntity(world, e);
    } else if (next.motion.magnitude > 0) {
      e.isMoving.motion = next.motion;
    } else {
      stopEntity(world, e);
    }

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

    const next = advanceMotion(
      e.hasPosition.current,
      e.isMoving.motion,
      e.hasPosition.speed * (dt / 1000),
    );
    const resolved = resolveObstaclesForNode(
      world,
      e.hasPosition.nodeId,
      e.hasPosition.current,
      next.position,
      'monster',
    );
    const blocked = resolved !== next.position;
    e.hasPosition.current = resolved;
    if (blocked) {
      stopEntity(world, e);
    } else if (next.motion.magnitude > 0) {
      e.isMoving.motion = next.motion;
    } else {
      stopEntity(world, e);
    }

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
