import type { PlayerSnapshot, CombatArchetype } from '@mmo-idle/shared';
import { SKILL_TREE, canUnlockSkill, recalculatePlayerStats } from '@mmo-idle/shared';
import type { World } from '../world/World';
import type { PlayerEntity } from '../ecs/components/player';
import { withPlayerSnapshotDraft } from '../ecs/playerSnapshotAdapter';

// Re-export canUnlockSkill from shared so existing server importers don't change paths.
export { canUnlockSkill };
export type { UnlockResult } from '@mmo-idle/shared';

const CLASS_ARCHETYPES: Record<string, CombatArchetype> = {
  'cadence-root':  'cadence',
  'cooldown-root': 'cooldown',
  'reload-root':   'reload',
  'energy-root':   'energy',
  'dot-root':      'dot',
};

/**
 * Validate and apply a skill unlock to the player in-place.
 * Returns false (and does nothing) if validation fails.
 */
export function unlockSkill(world: World, player: PlayerSnapshot | PlayerEntity, skillId: string): boolean {
  if ('entityId' in player) {
    return withPlayerSnapshotDraft(world, player, draft => unlockSkillSnapshot(draft, skillId));
  }
  return unlockSkillSnapshot(player, skillId);
}

function unlockSkillSnapshot(player: PlayerSnapshot, skillId: string): boolean {
  const result = canUnlockSkill(player, skillId);
  if (!result.ok) return false;

  const node = SKILL_TREE.get(skillId)!;

  player.skillPoints    -= node.cost;
  player.unlockedSkills  = [...player.unlockedSkills, skillId];
  player.currentSkillTier++;

  if (node.tier === 0) {
    player.selectedClass    = skillId;
    player.combatArchetype  = CLASS_ARCHETYPES[skillId] ?? null;
  } else if (node.tier === 1) {
    player.selectedSubVariant = node.subVariantId!;
  } else if (node.tier === 2) {
    player.selectedRange = skillId;
  }

  recalculatePlayerStats(player);
  return true;
}
