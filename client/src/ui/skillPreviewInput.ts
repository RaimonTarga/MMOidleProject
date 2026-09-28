import { SKILL_TREE, type SkillNode } from '@mmo-idle/shared';

/**
 * Preview the choice at its own tier, without a later owned branch masking it.
 * A choice that belongs to a style (Tier 4 paths) is previewed with that style,
 * even before the player has taken it — the advanced sprites key off the pair.
 */
export function skillPreviewInput(node: SkillNode, owned: string[]) {
  const unlockedSkills = owned.filter(id => {
    const prior = SKILL_TREE.get(id);
    return prior
      && prior.classId === node.classId
      && prior.tier < node.tier
      && (!node.subVariantId || !prior.subVariantId || prior.subVariantId === node.subVariantId);
  });
  if (node.tier > 1 && node.subVariantId) {
    const style = [...SKILL_TREE.values()].find(candidate =>
      candidate.tier === 1 && candidate.classId === node.classId && candidate.subVariantId === node.subVariantId);
    if (style && !unlockedSkills.includes(style.id)) unlockedSkills.push(style.id);
  }
  unlockedSkills.push(node.id);
  return { combatArchetype: (node.classId ?? node.id).replace(/-root$/, ''), unlockedSkills };
}
