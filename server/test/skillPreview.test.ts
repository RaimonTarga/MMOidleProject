import { strict as assert } from 'node:assert';
import { SKILL_TREE, resolvePlayerAccent } from '@mmo-idle/shared';
import { formatPassiveValue } from '../../client/src/ui/describe/passiveText';
import { skillPreviewInput } from '../../client/src/ui/skillPreviewInput';

for (const archetype of ['cadence', 'cooldown', 'reload', 'energy', 'dot', 'summoner']) {
  const root = SKILL_TREE.get(`${archetype}-root`)!;
  // Everything the class owns past its root (the class-first tree's disciplines,
  // specializations and leaves, where its kit has them).
  const owned = [root.id, ...Array.from(SKILL_TREE.values())
    .filter(n => n.classId === root.id && n.tier > 0).map(n => n.id)];
  const rootInput = skillPreviewInput(root, owned);
  assert.equal(rootInput.unlockedSkills.length, 1, 'root preview must not inherit a later body or crest');
  assert.equal(resolvePlayerAccent(rootInput), null);
}
console.log('Skill previews: every class root previews on its own.');

assert.equal(formatPassiveValue('shared.damage-mult', 0.1), '+10%');
assert.equal(formatPassiveValue('shared.damage-mult', -0.1), '−10%');
assert.equal(formatPassiveValue('cadence.empowered-mult', 0.7), '×0.7');
