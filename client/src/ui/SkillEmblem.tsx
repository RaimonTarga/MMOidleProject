import type { SkillNode } from '@mmo-idle/shared';
import { GameIcon } from './GameIcon';
import { skillVocabularyIconSource } from './conceptIcons';

/** Authored emblems only; later tiers stay empty until their own art is added. */
export function SkillEmblem({ node, size = 56 }: { node: SkillNode; size?: number }) {
  const source = skillVocabularyIconSource(node);
  if (!source) return null;
  return <GameIcon as="span" source={source} size={size} fit="contain" fallback={null} className="skill-emblem" decorative />;
}
