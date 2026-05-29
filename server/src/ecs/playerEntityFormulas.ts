/**
 * Entity-native wrappers for shared formula helpers.
 */
import { canUnlockSkill, recalculatePlayerStats } from '@mmo-idle/shared';
import type { World } from '../world/World';
import type { PlayerEntity } from './entity';
import { attachComponent, detachComponent } from './markerHelpers';
import { markSliceDirty } from './dirtyHelpers';
import { hitboxEqual, resolvePlayerHitbox } from '../hitbox/resolve';
import { syncDevInvulnerability } from '../dev/syncDevInvulnerability';

export function recalculatePlayerEntityStats(world: World, entity: PlayerEntity): void {
  const evadesHits = entity.evadesHits
    ? { ...entity.evadesHits }
    : { threshold: 0, count: 0 };
  const { cannotAttack } = recalculatePlayerStats({
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
  markSliceDirty(world, entity, 'dealsDamage');
  markSliceDirty(world, entity, 'mitigatesDamage');
  markSliceDirty(world, entity, 'performsAttack');
  markSliceDirty(world, entity, 'hasHealth');
  markSliceDirty(world, entity, 'hasPosition');
  markSliceDirty(world, entity, 'usesSkills');
  if (entity.usesCadence) markSliceDirty(world, entity, 'usesCadence');
  if (evadesHits.threshold > 0) {
    attachComponent(world, entity, 'evadesHits', evadesHits);
  } else {
    detachComponent(world, entity, 'evadesHits');
  }

  if (cannotAttack) {
    attachComponent(world, entity, 'cannotAttack', {});
  } else {
    detachComponent(world, entity, 'cannotAttack');
  }

  syncDevInvulnerability(world, entity);

  const nextHitbox = resolvePlayerHitbox(entity);
  if (!hitboxEqual(entity.hasHitbox?.rects, nextHitbox.rects)) {
    attachComponent(world, entity, 'hasHitbox', nextHitbox);
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
