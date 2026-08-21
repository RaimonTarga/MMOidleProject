import {
  MONSTER_DATABASE,
  applyStatusEffect,
  resolveMonsterDotDebuff,
  type MonsterDefinition,
} from '@mmo-idle/shared';
import type { MonsterEntity, PlayerEntity } from '../../../ecs/entity';
import { attachMarker } from '../../../ecs/markerHelpers';
import type { World } from '../../../world/World';

/** Apply one definition-shaped monster DoT stack through the canonical status path. */
export function applyMonsterDotToPlayer(
  world: World,
  monster: MonsterEntity,
  player: PlayerEntity,
  dotEffect: NonNullable<MonsterDefinition['dotEffect']>,
): void {
  const monsterDef = MONSTER_DATABASE.get(monster.isMonster.monsterTypeId);
  const durationMs = dotEffect.durationMs ?? 5_000;
  const debuff = resolveMonsterDotDebuff({ monster: monsterDef, dotEffect });
  const effect = applyStatusEffect(player.tracksCombat, {
    id: debuff.statusEffectId,
    maxStacks: dotEffect.maxStacks,
    instanced: false,
    sourceId: monster.isMonster.id,
    remainingMs: durationMs,
    refreshable: true,
    data: {
      damagePerStack: dotEffect.damagePerStack,
      nextTickIn: dotEffect.tickIntervalMs,
      tickIntervalMs: dotEffect.tickIntervalMs,
      tickOnExpire: 1,
      totalMs: durationMs,
      flavorCode: debuff.code,
      isDot: 1,
      bypassShield: dotEffect.bypassShield ? 1 : 0,
    },
  });
  effect.data.damagePerStack = dotEffect.damagePerStack;
  effect.data.tickIntervalMs = dotEffect.tickIntervalMs;
  effect.data.tickOnExpire = 1;
  effect.data.totalMs = durationMs;
  effect.data.flavorCode = debuff.code;
  effect.data.isDot = 1;
  effect.data.bypassShield = dotEffect.bypassShield ? 1 : 0;
  attachMarker(world, player, 'hasDot');
}
