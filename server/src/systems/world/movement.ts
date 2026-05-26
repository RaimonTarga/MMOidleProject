import { advanceMotion, vectorTo, type Vec2 } from '@mmo-idle/shared';
import type { World } from '../../world/World';
import { NODE_REGISTRY } from '../../world/nodeRegistry';
import type { ServerEntity } from '../../ecs/entity';
import { attachComponent, detachComponent } from '../../ecs/markerHelpers';

// Monsters stay this many pixels from the node edge at all times.
const MONSTER_MARGIN = 40;

type MovableEntity = ServerEntity & {
  hasPosition: NonNullable<ServerEntity['hasPosition']>;
};

export function setEntityMotion(world: World, entity: MovableEntity, target: Vec2): void {
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
    if (entity.isChanneling) {
      stopEntity(world, entity);
      continue;
    }

    const next = advanceMotion(
      entity.hasPosition.current,
      entity.isMoving.motion,
      entity.hasPosition.speed * (dt / 1000),
    );
    entity.hasPosition.current = next.position;
    if (next.motion.magnitude > 0) {
      entity.isMoving.motion = next.motion;
    } else {
      stopEntity(world, entity);
    }
  }

  for (const e of world.movingMonsters) {
    const next = advanceMotion(
      e.hasPosition.current,
      e.isMoving.motion,
      e.hasPosition.speed * (dt / 1000),
    );
    e.hasPosition.current = next.position;
    if (next.motion.magnitude > 0) {
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
