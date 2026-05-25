import { attachComponent, detachComponent } from '../ecs/markerHelpers';
import type { MonsterEntity } from '../ecs/components/monster';
import type { ServerEntity } from '../ecs/entity';
import type { World } from '../world/World';

export function setAggroTarget(
  world: World,
  monster: MonsterEntity,
  playerId: string | null,
  now: number,
): void {
  if (playerId === null) {
    detachComponent(world, monster, 'hasAggroTarget');
    return;
  }

  const sinceMs = monster.hasAggroTarget?.sinceMs ?? now;
  monster.controlsMonster.lastAggroAt = now;
  attachComponent(world, monster, 'hasAggroTarget', {
    playerId,
    lastAggroAt: now,
    sinceMs,
  });
}

export function setAttackTarget(
  world: World,
  entity: ServerEntity,
  targetId: string | null,
): void {
  if (targetId === null) {
    detachComponent(world, entity, 'hasAttackTarget');
  } else {
    attachComponent(world, entity, 'hasAttackTarget', { targetId });
  }
}
