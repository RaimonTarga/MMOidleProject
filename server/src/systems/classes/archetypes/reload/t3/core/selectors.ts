import type { World } from '../../../../../../world/World';
import type { PlayerEntity } from '../../../../../../ecs/entity';
import { FULL_HP_THRESHOLD } from './constants';

export function getSnipeReady(entity: PlayerEntity, world: World): boolean {
  if ((entity.usesSkills.passives['reload.snipe'] ?? 0) <= 0) return false;
  const targetId = entity.hasAttackTarget?.targetId;
  const target = targetId ? world.getMonsterEntity(targetId) : undefined;
  return !!target && target.hasHealth.hp >= target.hasHealth.maxHp * FULL_HP_THRESHOLD;
}
