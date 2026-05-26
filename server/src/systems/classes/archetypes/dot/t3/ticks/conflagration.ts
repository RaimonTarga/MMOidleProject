import { getStatusEffect, removeStatusEffect } from '@mmo-idle/shared';
import { detachMarker, detachMarkerIfNoEffect } from '../../../../../../ecs/markerHelpers';
import { grantMonsterRewards } from '../../../../../player/progression/rewards';
import type { World } from '../../../../../../world/World';
import { CONF_EFFECT_ID } from '../core/constants';

/**
 * Conflagration fast-tick DoT. Independent of the normal DoT updater —
 * uses its own `tickIntervalMs` (500ms by default) and `ticksLeft` counter.
 * When `ticksLeft` reaches zero, the effect and marker are removed.
 */
export function updateConflagration(world: World, dt: number): void {
  const toKill: Array<{ monsterId: string; sourceId: string }> = [];

  for (const entity of world.conflagrationMonsters) {
    const monsterId    = entity.isMonster.id;
    const monsterState = entity.tracksCombat;
    const effect = getStatusEffect(monsterState, CONF_EFFECT_ID);
    if (!effect) {
      detachMarkerIfNoEffect(world, entity, 'hasConflagration', monsterState, CONF_EFFECT_ID);
      continue;
    }

    effect.data.nextTickIn -= dt;
    if (effect.data.nextTickIn > 0) continue;

    effect.data.nextTickIn = effect.data.tickIntervalMs;
    effect.data.ticksLeft--;

    entity.hasHealth.hp -= Math.round(effect.data.damagePerTick);
    console.log(`[Conflagration] ${monsterId}: ${effect.data.damagePerTick} tick (${effect.data.ticksLeft} left)`);

    if (entity.hasHealth.hp <= 0) {
      toKill.push({ monsterId, sourceId: effect.sourceId });
      continue;
    }
    if (effect.data.ticksLeft <= 0) {
      removeStatusEffect(monsterState, CONF_EFFECT_ID);
      detachMarker(world, entity, 'hasConflagration');
    }
  }

  for (const { monsterId, sourceId } of toKill) {
    const monster = world.getMonsterEntity(monsterId);
    if (monster && sourceId) grantMonsterRewards(world, sourceId, monster);
    world.removeMonsterEntity(monsterId);
  }
}
