import type { World } from '../world/World';
import { NODE_REGISTRY } from '../world/nodeRegistry';

interface Movable {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
}

function moveToward(entity: Movable, dt: number, speed: number) {
  const dx = entity.targetX - entity.x;
  const dy = entity.targetY - entity.y;
  const distSq = dx * dx + dy * dy;

  if (distSq < 1) {
    entity.x = entity.targetX;
    entity.y = entity.targetY;
    return;
  }

  const dist = Math.sqrt(distSq);
  const step = speed * (dt / 1000);

  if (step >= dist) {
    entity.x = entity.targetX;
    entity.y = entity.targetY;
  } else {
    entity.x += (dx / dist) * step;
    entity.y += (dy / dist) * step;
  }
}

// Monsters stay this many pixels from the node edge at all times.
const MONSTER_MARGIN = 40;

export function updateMovement(world: World, dt: number) {
  for (const p of world.players.values()) {
    if (p.isChanneling) {
      // Lock position in place — cancel any pending move target each tick
      p.targetX = p.x;
      p.targetY = p.y;
      continue;
    }
    const pcs   = world.playerCombatState.get(p.id);
    const slow  = pcs?.statusEffects.find(e => e.id === 'slow');
    const speed = slow ? p.speed * (slow.data['speedMult'] ?? 1) : p.speed;
    moveToward(p, dt, speed);
  }

  for (const m of world.monsters.values()) {
    moveToward(m, dt, m.speed);

    const node = NODE_REGISTRY.get(m.nodeId);
    if (node) {
      m.x = Math.max(MONSTER_MARGIN, Math.min(node.width  - MONSTER_MARGIN, m.x));
      m.y = Math.max(MONSTER_MARGIN, Math.min(node.height - MONSTER_MARGIN, m.y));
    }
  }
}
