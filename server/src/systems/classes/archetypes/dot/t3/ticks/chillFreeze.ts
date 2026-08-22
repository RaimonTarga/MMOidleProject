import { getStatusEffect } from '@mmo-idle/shared';
import { detachMarker, detachMarkerIfNoEffect } from '../../../../../../ecs/markerHelpers';
import type { World } from '../../../../../../world/World';
import { CHILL_EFFECT, FROZEN_EFFECT, SMOLDER_EFFECT } from '../core/constants';

/**
 * Chill / freeze MARKER lifecycle.
 *
 * The speed and attack-cadence writes these effects imply are NOT applied here:
 * they live in `combat/status/monsterControl.ts`, which is the single writer for
 * a monster's slowed stats. Chill, freeze and a Hamstring slow all overwrite the
 * same two fields with absolute values read back from MONSTER_DATABASE, so two
 * independent writers would ratchet against each other — each treating the
 * other's output as the clean base. This tick's only job is keeping the markers
 * honest so that reconciler knows who to look at.
 */
export function updateChillAndFreeze(world: World): void {
  for (const entity of world.frozenMonsters) {
    if (!getStatusEffect(entity.tracksCombat, FROZEN_EFFECT)) {
      detachMarker(world, entity, 'hasFrozen');
    }
  }

  for (const entity of world.chilledMonsters) {
    if (!getStatusEffect(entity.tracksCombat, CHILL_EFFECT)) {
      detachMarker(world, entity, 'hasChill');
    }
  }

  for (const entity of world.smolderMonsters) {
    detachMarkerIfNoEffect(world, entity, 'hasSmolder', entity.tracksCombat, SMOLDER_EFFECT);
  }
}
