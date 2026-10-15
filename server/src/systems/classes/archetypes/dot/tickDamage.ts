import { outgoingFinalDamage } from '../../../combat/damage/finalDamage';
import { mitigatePlayerTickOnMonster } from '../../../combat/damage/monsterTickMitigation';
import { applyMonsterDamageTakenDebuffs } from '../../shared/debuffs';
import type { MonsterEntity } from '../../../../ecs/entity';
import type { World } from '../../../../world/World';

/** Sigil ticks skip plating, pay half DR and DoT resistance, then shared and final damage layers. */
export function classDotTickDamage(
  world: World,
  monster: MonsterEntity,
  sourceId: string,
  rawTick: number,
): number {
  const state = monster.tracksCombat;
  let damage = mitigatePlayerTickOnMonster(monster, rawTick, 'dot');
  damage = Math.max(1, applyMonsterDamageTakenDebuffs(state, damage));
  return outgoingFinalDamage(world, sourceId, damage);
}
