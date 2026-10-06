import { outgoingFinalDamage } from '../../../combat/damage/finalDamage';
import { mitigatePlayerTickOnMonster } from '../../../combat/damage/monsterTickMitigation';
import { applyMonsterDamageTakenDebuffs } from '../../shared/debuffs';
import { getFrostbiteDotTakenMult, getFrozenMult, getSmolderMult } from './t3/core/selectors';
import type { MonsterEntity } from '../../../../ecs/entity';
import type { World } from '../../../../world/World';

/**
 * What one Apprentice class-DoT tick deals to ONE monster, from the raw tick.
 *
 * The DoT rules (CLAUDE.md, "Combat And Mechanics"): no plating, half the
 * monster's DR, its authored `dotResistance` on top (`mitigatePlayerTickOnMonster`);
 * then the DoT-only vulnerabilities the monster carries (Smoldering Ember, Frozen,
 * Frostbite) and its damage-taken debuffs; then the source player's final-damage
 * layer.
 *
 * One function so the burn's own tick and the fire Radiant throws off it
 * (`t3/ticks/radiant.ts`) can never pay two different rule sets: each body pays
 * for ITSELF, from the same raw number.
 */
export function classDotTickDamage(
  world: World,
  monster: MonsterEntity,
  sourceId: string,
  rawTick: number,
): number {
  const state = monster.tracksCombat;
  let damage = mitigatePlayerTickOnMonster(monster, rawTick, 'dot');
  damage = Math.max(1, Math.round(damage * getSmolderMult(state) * getFrozenMult(state) * getFrostbiteDotTakenMult(state)));
  damage = Math.max(1, applyMonsterDamageTakenDebuffs(state, damage));
  return outgoingFinalDamage(world, sourceId, damage);
}
