import type { SkillNode } from './types';
import { rootEntries } from './roots';
import { classFirstTreeEntries } from './classFirst';
export { isMeleeArchetype, isRangedCombatant, type RangedCombatantInput } from './roots';
export { leafTreeTier } from './classFirst';

/**
 * The Passive Tree: the six class roots, then each class's disciplines, specializations and
 * leaves, built from its kit (class-first build plan §3.5). The old frames, range nodes and
 * paths are gone; they live on at the tag `pre-rework-2026-10-13`.
 */
export const SKILL_TREE: Map<string, SkillNode> = new Map<string, SkillNode>([
  ...rootEntries,
  ...classFirstTreeEntries(),
]);

export type { SkillNode, StatEffects, SubVariant } from './types';
