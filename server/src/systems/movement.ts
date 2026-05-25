import { advanceMotion, zeroMotion } from '@mmo-idle/shared';
import type { World } from '../world/World';
import { NODE_REGISTRY } from '../world/nodeRegistry';

// Monsters stay this many pixels from the node edge at all times.
const MONSTER_MARGIN = 40;

export function updateMovement(world: World, dt: number) {
  for (const entity of world.playerEntities) {
    if (entity.usesCooldown?.isChanneling) {
      // Lock position in place — cancel any pending move target each tick
      entity.isMoving.motion = zeroMotion();
      continue;
    }

    const next = advanceMotion(
      entity.hasPosition.current,
      entity.isMoving.motion,
      entity.hasPosition.speed * (dt / 1000),
    );
    entity.hasPosition.current = next.position;
    entity.isMoving.motion     = next.motion;
  }

  for (const e of world.monsterEntities) {
    const next = advanceMotion(
      e.hasPosition.current,
      e.isMoving.motion,
      e.hasPosition.speed * (dt / 1000),
    );
    e.hasPosition.current = next.position;
    e.isMoving.motion     = next.motion;

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
