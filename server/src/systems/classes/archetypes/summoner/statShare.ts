import type { World } from '../../../../world/World';
import type { MinionEntity, PlayerEntity } from '../../../../ecs/entity';
import { markSliceDirty } from '../../../../ecs/dirtyHelpers';

/**
 * Copies a fraction of the owner's plating and DR onto a minion.
 * Used by Mountain Guardian T3 (future); no-op when passives are absent.
 */
export function applyOwnerStatShare(
  world: World,
  owner: PlayerEntity,
  minion: MinionEntity,
): void {
  const passives = owner.usesSkills.passives;
  const platingShare = passives['summoner.guardian-plating-share-pct'] ?? 0;
  const drShare = passives['summoner.guardian-dr-share-pct'] ?? 0;
  if (platingShare <= 0 && drShare <= 0) return;

  const bonusPlating = Math.round(owner.mitigatesDamage.plating * platingShare);
  const bonusDr = owner.mitigatesDamage.damageReduction * drShare;

  let changed = false;
  if (minion.mitigatesDamage.plating !== bonusPlating) {
    minion.mitigatesDamage.plating = bonusPlating;
    changed = true;
  }
  if (minion.mitigatesDamage.damageReduction !== bonusDr) {
    minion.mitigatesDamage.damageReduction = bonusDr;
    changed = true;
  }
  if (changed) {
    markSliceDirty(world, minion, 'mitigatesDamage');
  }
}
