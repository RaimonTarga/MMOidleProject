import type { SkillNode } from './types';
import { rootsAndFramesEntries } from './rootsAndFrames';
export { isMeleeArchetype, isRangedCombatant, type RangedCombatantInput } from './rootsAndFrames';
import { t3CombatEntriesA } from './t3CombatA';
import { t3CombatEntriesB } from './t3CombatB';
import { t3SummonerEntries } from './t3Summoner';
import { addGeneratedPlaceholderNodes } from './generated';

const skillEntries: [string, SkillNode][] = [
  ...rootsAndFramesEntries,
  ...t3CombatEntriesA,
  ...t3CombatEntriesB,
  ...t3SummonerEntries,
];

export const SKILL_TREE: Map<string, SkillNode> = new Map<string, SkillNode>(skillEntries);
addGeneratedPlaceholderNodes(SKILL_TREE);

export type { SkillNode, StatEffects, SubVariant } from './types';
