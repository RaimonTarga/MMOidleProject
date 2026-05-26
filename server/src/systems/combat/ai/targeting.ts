import { attachComponent, detachComponent } from '../../../ecs/markerHelpers';
import { MONSTER_DATABASE } from '@mmo-idle/shared';
import type { MonsterEntity } from '../../../ecs/components/monster';
import type { ServerEntity } from '../../../ecs/entity';
import type { World } from '../../../world/World';

export function setAggroTarget(
  world: World,
  monster: MonsterEntity,
  playerId: string | null,
  now: number,
): void {
  if (playerId === null) {
    detachComponent(world, monster, 'hasAggroTarget');
    monster.controlsMonster.chargeRemainingMs = 0;
    return;
  }

  const hadAggro = monster.hasAggroTarget !== undefined;
  const sinceMs = monster.hasAggroTarget?.sinceMs ?? now;
  monster.controlsMonster.lastAggroAt = now;
  if (!hadAggro) {
    const charge = MONSTER_DATABASE.get(monster.isMonster.monsterTypeId)?.chargeOnAggro;
    if (charge) {
      monster.controlsMonster.chargeRemainingMs = charge.durationMs;
    }
  }
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
