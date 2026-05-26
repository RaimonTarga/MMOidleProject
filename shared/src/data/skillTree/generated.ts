import type { SkillNode, SubVariant } from './types';

const CLASSES = ['cadence', 'cooldown', 'reload', 'energy', 'dot'] as const;
const SUB_VARIANTS: SubVariant[] = ['light', 'balanced', 'heavy'];
const CHOICES = ['a', 'b', 'c'] as const;

export function addGeneratedPlaceholderNodes(tree: Map<string, SkillNode>): void {
  for (const cls of CLASSES) {
    const classId = `${cls}-root`;
    for (const sub of SUB_VARIANTS) {
      for (let tier = 4; tier <= 7; tier++) {
        for (const choice of CHOICES) {
          const id = `${cls}-${sub}-t${tier}-${choice}`;
          tree.set(id, {
            id,
            name: `[T${tier}] Option ${choice.toUpperCase()}`,
            description: '[Placeholder] To be designed.',
            cost: 1,
            tier,
            classId,
            subVariantId: sub,
            parent: null,
            children: [],
            statEffects: {},
            mechanicEffects: {},
          });
        }
      }
    }
  }
}
