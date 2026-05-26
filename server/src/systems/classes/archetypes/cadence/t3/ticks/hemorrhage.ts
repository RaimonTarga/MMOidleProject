import { getStatusEffects, pruneStatusEffects } from '@mmo-idle/shared';
import type { World } from '../../../../../../world/World';
import { detachMarkerIfNoEffects } from '../../../../../../ecs/markerHelpers';
import { grantMonsterRewards } from '../../../../../player/progression/rewards';

export function updateHemorrhages(world: World, dt: number): void {
  const toKill: Array<{ monsterId: string; sourceId: string }> = [];

  for (const entity of world.hemorrhagedMonsters) {
    const monsterId = entity.isMonster.id;
    const state     = entity.tracksCombat;
    const bleeds = getStatusEffects(state, 'cadence-hemorrhage');
    if (bleeds.length === 0) continue;

    let lastSourceId = '';

    for (const bleed of bleeds) {
      bleed.data['nextTickIn'] -= dt;
      if (bleed.data['nextTickIn'] > 0) continue;

      bleed.data['nextTickIn'] = bleed.data['tickIntervalMs'];
      bleed.data['ticksLeft']--;
      entity.hasHealth.hp -= bleed.data['damagePerTick'];
      lastSourceId = bleed.sourceId;
      console.log(
        `[Hemorrhage] ${monsterId}: ${bleed.data['damagePerTick']} bleed dmg, ${bleed.data['ticksLeft']} ticks left`,
      );
    }

    pruneStatusEffects(state, e => e.id === 'cadence-hemorrhage' && e.data['ticksLeft'] <= 0);
    detachMarkerIfNoEffects(world, entity, 'hasHemorrhage', state, 'cadence-hemorrhage');

    if (entity.hasHealth.hp <= 0) {
      toKill.push({ monsterId, sourceId: lastSourceId });
    }
  }

  for (const { monsterId, sourceId } of toKill) {
    const monster = world.getMonsterEntity(monsterId);
    if (monster && sourceId) grantMonsterRewards(world, sourceId, monster);
    world.removeMonsterEntity(monsterId);
  }
}
