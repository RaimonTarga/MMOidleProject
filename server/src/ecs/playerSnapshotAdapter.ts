/**
 * Entity-native wrappers for shared formula helpers.
 */
import { canUnlockSkill, recalculatePlayerStats } from '@mmo-idle/shared';
import type { World } from '../world/World';
import type { PlayerEntity } from './components/player';
import { attachComponent, detachComponent } from './markerHelpers';

export function recalculatePlayerEntityStats(world: World, entity: PlayerEntity): void {
  const evadesHits = entity.evadesHits
    ? { ...entity.evadesHits }
    : { threshold: 0, count: 0 };
  recalculatePlayerStats({
    dealsDamage:     entity.dealsDamage,
    mitigatesDamage: entity.mitigatesDamage,
    evadesHits,
    performsAttack:  entity.performsAttack,
    hasHealth:       entity.hasHealth,
    hasPosition:     entity.hasPosition,
    usesSkills:      entity.usesSkills,
    holdsInventory:  entity.holdsInventory,
    resetCadenceCounters: (threshold) => {
      if (!entity.usesCadence) return;
      entity.usesCadence.speedStacks = 0;
      entity.usesCadence.threshold   = threshold;
      entity.usesCadence.count       = 0;
    },
  });
  if (evadesHits.threshold > 0) {
    attachComponent(world, entity, 'evadesHits', evadesHits);
  } else {
    detachComponent(world, entity, 'evadesHits');
  }
}

export function canUnlockEntitySkill(
  entity: PlayerEntity,
  skillId: string,
): ReturnType<typeof canUnlockSkill> {
  return canUnlockSkill(
    {
      usesSkills:        entity.usesSkills,
      tracksProgression: entity.tracksProgression,
    },
    skillId,
  );
}
