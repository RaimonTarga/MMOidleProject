import { SKILL_TREE, type SkillNode } from '@mmo-idle/shared';

/** Preview the choice at its own tier, without a later owned branch masking it. */
export function skillPreviewInput(node: SkillNode, owned: string[]) {
  const unlockedSkills = owned.filter(id => {
    const prior = SKILL_TREE.get(id);
    return prior && prior.classId === node.classId && prior.tier < node.tier;
  });
  unlockedSkills.push(node.id);
  return { combatArchetype: (node.classId ?? node.id).replace(/-root$/, ''), unlockedSkills };
}

