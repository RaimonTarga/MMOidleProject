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

export function updateDetonations(world: World, dt: number): void {
  const toKill: Array<{ monsterId: string; sourceId: string }> = [];

  for (const entity of world.detonatedMonsters) {
    const monsterId = entity.isMonster.id;
    const state     = entity.tracksCombat;
    const tags = getStatusEffects(state, 'cadence-detonation');
    if (tags.length === 0) continue;

    let lastSourceId = '';

    for (const tag of tags) {
      tag.data['fuseMs'] -= dt;
      if (tag.data['fuseMs'] > 0) continue;

      const dmg = tag.data['damage'];
      recordMonsterDamagedByPlayer(
        world,
        tag.sourceId,
        actorFromSourceId(world, tag.sourceId),
        entity,
        dmg,
        'proc',
        buildSimpleBreakdown(dmg, dmg),
      );
      entity.hasHealth.hp -= dmg;
      lastSourceId = tag.sourceId;
      console.log(`[Detonation] ${monsterId}: ${tag.data['damage']} damage, hp=${Math.max(0, entity.hasHealth.hp)}`);
    }

    pruneStatusEffects(state, e => e.id === 'cadence-detonation' && e.data['fuseMs'] <= 0);
    detachMarkerIfNoEffects(world, entity, 'hasDetonation', state, 'cadence-detonation');

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
