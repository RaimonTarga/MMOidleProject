import { getStatusEffects, pruneStatusEffects } from '@mmo-idle/shared';
import type { World } from '../../../../../../world/World';
import { detachMarkerIfNoEffects } from '../../../../../../ecs/markerHelpers';
import { grantMonsterRewards } from '../../../../../player/progression/rewards';
import {
  buildSimpleBreakdown,
  recordMonsterDamagedByPlayer,
  recordPlayerKillMonster,
} from '../../../../../../world/worldLogCombat';
import { actorFromSourceId } from '../../../../../../world/worldLogActors';
import { isInvulnerableMonster } from '../../../../../combat/invulnerability';
import { pushDotTickEvent } from '../../../../../combat/damage/dotTickEvent';
import { emitPlayerMonsterOnKill } from '../../../../../combat/damage/killHooks';
import { applyMonsterDamageTakenDebuffs } from '../../../../shared/debuffs';

export function updateHemorrhages(world: World, dt: number): void {
  const toKill: Array<{ monsterId: string; sourceId: string; damage: number }> = [];

  for (const entity of world.hemorrhagedMonsters) {
    const monsterId = entity.isMonster.id;
    const state     = entity.tracksCombat;
    if (isInvulnerableMonster(entity)) continue;
    const bleeds = getStatusEffects(state, 'cadence-hemorrhage');
    if (bleeds.length === 0) continue;

    let lastSourceId = '';
    let lastTickDamage = 0;

    for (const bleed of bleeds) {
      bleed.data['nextTickIn'] -= dt;
      if (bleed.data['nextTickIn'] > 0) continue;

      bleed.data['nextTickIn'] = bleed.data['tickIntervalMs'];
      bleed.stacks--; // consume a stack — drives the target-frame countdown
      const tickDmg = applyMonsterDamageTakenDebuffs(state, bleed.data['damagePerTick']);
      recordMonsterDamagedByPlayer(
        world,
        bleed.sourceId,
        actorFromSourceId(world, bleed.sourceId),
        entity,
        tickDmg,
        'dot',
        buildSimpleBreakdown(tickDmg, tickDmg),
      );
      entity.hasHealth.hp -= tickDmg;
      pushDotTickEvent(world, entity, 'bleed', tickDmg, { sourceType: 'special' }); // bleed-red number + 🩸 glyph
      lastSourceId = bleed.sourceId;
      lastTickDamage = tickDmg;
    }

    pruneStatusEffects(state, e => e.id === 'cadence-hemorrhage' && e.stacks <= 0);
    detachMarkerIfNoEffects(world, entity, 'hasHemorrhage', state, 'cadence-hemorrhage');

    if (entity.hasHealth.hp <= 0) {
      toKill.push({ monsterId, sourceId: lastSourceId, damage: lastTickDamage });
    }
  }

  for (const { monsterId, sourceId, damage } of toKill) {
    const monster = world.getMonsterEntity(monsterId);
    if (monster && sourceId) {
      emitPlayerMonsterOnKill(world, sourceId, monster, damage, 'dot');
      const rewardInfo = grantMonsterRewards(world, sourceId, monster);
      recordPlayerKillMonster(world, sourceId, monster, damage, rewardInfo);
    }
    world.removeMonsterEntity(monsterId);
  }
}
