import type { CombatArchetype } from '@mmo-idle/shared';
import { SKILL_TREE, canUnlockSkill } from '@mmo-idle/shared';
import type { World } from '../../../world/World';
import type { PlayerEntity } from '../../../ecs/entity';
import { syncArchetypeSlices } from '../../../ecs/archetypeSliceSync';
import { canUnlockEntitySkill, recalculatePlayerEntityStats } from '../../../ecs/playerEntityFormulas';
import { despawnMinionsForOwner } from '../../classes/archetypes/summoner';

export { canUnlockSkill, canUnlockSkillFromView } from '@mmo-idle/shared';
export type { UnlockResult } from '@mmo-idle/shared';

const CLASS_ARCHETYPES: Record<string, CombatArchetype> = {
  'cadence-root':  'cadence',
  'cooldown-root': 'cooldown',
  'reload-root':   'reload',
  'energy-root':   'energy',
  'dot-root':      'dot',
  'summoner-root': 'summoner',
};

/** Validate and apply a skill unlock. Returns false if validation fails. */
export function unlockSkill(world: World, entity: PlayerEntity, skillId: string): boolean {
  const result = canUnlockEntitySkill(entity, skillId);
  if (!result.ok) return false;

  const node = SKILL_TREE.get(skillId)!;

  entity.tracksProgression.skillPoints -= node.cost;
  entity.usesSkills.unlockedSkills = [...entity.usesSkills.unlockedSkills, skillId];
  entity.tracksProgression.currentSkillTier++;

  if (node.tier === 0) {
    entity.usesSkills.selectedClass   = skillId;
    entity.usesSkills.combatArchetype = CLASS_ARCHETYPES[skillId] ?? null;
  } else if (node.tier === 1) {
    entity.usesSkills.selectedSubVariant = node.subVariantId!;
  } else if (node.tier === 2) {
    entity.usesSkills.selectedRange = skillId;
  }

  recalculatePlayerEntityStats(world, entity);
  syncArchetypeSlices(world, entity);

  if (entity.summonsMinions && node.classId === 'summoner-root') {
    despawnMinionsForOwner(world, entity);
  }

  return true;
}
