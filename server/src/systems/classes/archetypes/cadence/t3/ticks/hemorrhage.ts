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

export function updateHemorrhages(world: World, dt: number): void {
  const toKill: Array<{ monsterId: string; sourceId: string }> = [];

  for (const entity of world.hemorrhagedMonsters) {
    const monsterId = entity.isMonster.id;
    const state     = entity.tracksCombat;
    if (isInvulnerableMonster(entity)) continue;
    const bleeds = getStatusEffects(state, 'cadence-hemorrhage');
    if (bleeds.length === 0) continue;

    let lastSourceId = '';

    for (const bleed of bleeds) {
      bleed.data['nextTickIn'] -= dt;
      if (bleed.data['nextTickIn'] > 0) continue;

      bleed.data['nextTickIn'] = bleed.data['tickIntervalMs'];
      bleed.stacks--; // consume a stack — drives the target-frame countdown
      const tickDmg = bleed.data['damagePerTick'];
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
      pushDotTickEvent(world, entity, 'bleed', tickDmg); // bleed-red number + 🩸 glyph
      lastSourceId = bleed.sourceId;
    }

    pruneStatusEffects(state, e => e.id === 'cadence-hemorrhage' && e.stacks <= 0);
    detachMarkerIfNoEffects(world, entity, 'hasHemorrhage', state, 'cadence-hemorrhage');

    if (entity.hasHealth.hp <= 0) {
      toKill.push({ monsterId, sourceId: lastSourceId });
    }
  }

  for (const { monsterId, sourceId } of toKill) {
    const monster = world.getMonsterEntity(monsterId);
    if (monster && sourceId) {
      const rewardInfo = grantMonsterRewards(world, sourceId, monster);
      recordPlayerKillMonster(world, sourceId, monster, 0, rewardInfo);
    }
    world.removeMonsterEntity(monsterId);
  }
}
