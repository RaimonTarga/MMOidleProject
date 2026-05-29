import { getStatusEffect, removeStatusEffect } from '@mmo-idle/shared';
import { detachMarker, detachMarkerIfNoEffect } from '../../../../../../ecs/markerHelpers';
import { grantMonsterRewards } from '../../../../../player/progression/rewards';
import type { World } from '../../../../../../world/World';
import { CONF_EFFECT_ID } from '../core/constants';
import {
  buildSimpleBreakdown,
  recordMonsterDamagedByPlayer,
  recordPlayerKillMonster,
} from '../../../../../../world/worldLogCombat';
import { actorFromSourceId } from '../../../../../../world/worldLogActors';

/**
 * Conflagration fast-tick DoT. Independent of the normal DoT updater —
 * uses its own `tickIntervalMs` (500ms by default) and `ticksLeft` counter.
 * When `ticksLeft` reaches zero, the effect and marker are removed.
 */
export function updateConflagration(world: World, dt: number): void {
  const toKill: Array<{ monsterId: string; sourceId: string; damage: number }> = [];

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

    const damage = Math.max(1, Math.round(effect.data.damagePerTick));
    const source = actorFromSourceId(world, effect.sourceId);
    recordMonsterDamagedByPlayer(
      world,
      effect.sourceId,
      source,
      entity,
      damage,
      'dot',
      buildSimpleBreakdown(damage, damage),
    );
    entity.hasHealth.hp -= damage;
    console.log(`[Conflagration] ${monsterId}: ${damage} tick (${effect.data.ticksLeft} left)`);

    if (entity.hasHealth.hp <= 0) {
      toKill.push({ monsterId, sourceId: effect.sourceId, damage });
      continue;
    }
    if (effect.data.ticksLeft <= 0) {
      removeStatusEffect(monsterState, CONF_EFFECT_ID);
      detachMarker(world, entity, 'hasConflagration');
    }
  }

  for (const { monsterId, sourceId, damage } of toKill) {
    const monster = world.getMonsterEntity(monsterId);
    if (monster && sourceId) {
      const rewardInfo = grantMonsterRewards(world, sourceId, monster);
      recordPlayerKillMonster(world, sourceId, monster, damage, rewardInfo);
      const player = world.getPlayerEntity(sourceId);
      if (player) {
        world.pushEvent(player.hasPosition.nodeId, {
          kind:          'player-kill',
          playerId:      sourceId,
          targetId:      monster.isMonster.id,
          targetName:    monster.isMonster.name,
          damage,
          biomeXpGained: rewardInfo?.biomeXpGained ?? 0,
          essenceGained: rewardInfo?.essenceGained ?? 0,
          essenceType:   rewardInfo?.essenceType   ?? 'green',
        });
      }
    }
    world.removeMonsterEntity(monsterId);
  }
}
