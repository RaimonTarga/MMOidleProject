import { getStatusEffect } from '@mmo-idle/shared';
import { detachMarker, detachMarkerIfNoEffect } from '../../../../../../ecs/markerHelpers';
import type { World } from '../../../../../../world/World';
import { CHILL_EFFECT, FROZEN_EFFECT, SMOLDER_EFFECT } from '../core/constants';

/**
 * Chill / freeze MARKER lifecycle.
 *
 * `combat/status/monsterControl.ts` reconciles the strongest slow into final
 * movement/cadence multipliers. This pass only maintains source markers.
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
