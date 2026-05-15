import type { World } from '../world/World';
import { GAME_CONFIG } from '@mmo-idle/shared';

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

export function updateMovement(world: World, dt: number) {
  for (const p of world.players.values()) {
    moveToward(p, dt, GAME_CONFIG.PLAYER_SPEED);
  }

  for (const m of world.monsters.values()) {
    moveToward(m, dt, m.speed);
    }
}