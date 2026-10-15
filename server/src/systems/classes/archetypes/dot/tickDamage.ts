import { getStatusEffect } from '@mmo-idle/shared';
import { DOT_EFFECT_ID, HELD_EFFECT_ID } from './constants';
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
  // Magma Core: on a shelled enemy the sigils tick at full, past its defenses (`magma` is the multiplier).
  const sigils = getStatusEffect(state, DOT_EFFECT_ID);
  const magma = sigils?.data['magma'] ?? 0;
  // Abyssal Censer: the sigils tick harder for each different debuff on their carrier.
  const abyss = rawTick * (sigils?.data['abyss'] ?? 1);
  let damage = magma > 0 ? Math.round(abyss * magma) : mitigatePlayerTickOnMonster(monster, abyss, 'dot');
  damage = Math.max(1, applyMonsterDamageTakenDebuffs(state, damage));
  // Petrify II: the held enemy also takes more from your ticks.
  const held = getStatusEffect(state, HELD_EFFECT_ID);
  if (held && held.remainingMs !== 0 && (held.data['tickPct'] ?? 0) > 0) damage = Math.round(damage * (1 + held.data['tickPct']!));
  return outgoingFinalDamage(world, sourceId, damage);
}
