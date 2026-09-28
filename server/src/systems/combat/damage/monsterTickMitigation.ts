import { GAME_CONFIG, MONSTER_DATABASE } from '@mmo-idle/shared';
import type { MonsterEntity } from '../../../ecs/entity';
import { effectiveDamageReductionAfterBrittle } from './effectivePlating';

/**
 * Player damage that skips the hit pipeline (DoT ticks, procs) ignores monster
 * plating but pays GAME_CONFIG.DOT_DR_SHARE of the monster's effective DR, and
 * DoT ticks also pay its authored `dotResistance` — the mirror of how monster
 * DoTs hit players.
 */
export function mitigatePlayerTickOnMonster(monster: MonsterEntity, damage: number, kind: 'dot' | 'proc'): number {
  if (damage <= 0) return damage;
  const dr = effectiveDamageReductionAfterBrittle(monster.mitigatesDamage.damageReduction, monster.tracksCombat);
  const dotResist = kind === 'dot'
    ? Math.min(0.9, MONSTER_DATABASE.get(monster.isMonster.monsterTypeId)?.dotResistance ?? 0)
    : 0;
  return Math.max(1, Math.round(damage * (1 - dr * GAME_CONFIG.DOT_DR_SHARE) * (1 - dotResist)));
}
