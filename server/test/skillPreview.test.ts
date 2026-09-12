import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { SKILL_TREE, resolvePlayerAccent, resolvePlayerFrame, headAnchorFor } from '@mmo-idle/shared';
import { formatPassiveValue } from '../../client/src/ui/describe/passiveText';
import { skillPreviewInput } from '../../client/src/ui/skillPreviewInput';

const manifest = JSON.parse(readFileSync(new URL('../../client/public/assets/sprites.json', import.meta.url), 'utf8'));
const frames = new Set<string>(manifest.textures[0].frames.map((entry: { filename: string }) => entry.filename));
for (const archetype of ['cadence', 'cooldown', 'reload', 'energy', 'dot', 'summoner']) {
  const root = SKILL_TREE.get(`${archetype}-root`)!;
  for (const style of ['light', 'balanced', 'heavy']) {
    const base = [root.id, `${archetype}-${style}`];
    const later = Array.from(SKILL_TREE.values()).find(n => n.classId === root.id && n.subVariantId === style && n.tier === 3)!;
    const owned = [...base, `${archetype}-range-close`, later.id];
    const rootInput = skillPreviewInput(root, owned);
    assert.equal(rootInput.unlockedSkills.length, 1, 'root preview must not inherit a later body or crest');
    assert.equal(resolvePlayerAccent(rootInput), null);
    for (const range of ['close', 'mid', 'far']) {
      const choice = SKILL_TREE.get(`${archetype}-range-${range}`)!;
      const input = skillPreviewInput(choice, owned);
      const body = resolvePlayerFrame(input)!;
      const accent = resolvePlayerAccent(input)!;
      assert.equal(body, resolvePlayerFrame({ combatArchetype: archetype, unlockedSkills: base }));
      assert.equal(accent.frame, `sprites/accents/crest-${range}-${archetype}.png`);
      assert.ok(frames.has(body), `Missing body ${body}`);
      assert.ok(frames.has(accent.frame), `Missing accent ${accent.frame}`);
      const anchor = headAnchorFor(body);
      assert.ok(anchor.x >= 16 && anchor.x <= 48 && anchor.y >= 0 && anchor.y < 32);
      assert.ok(!input.unlockedSkills.includes(later.id), 'later specialization must not mask range preview');
    }
    const pathInput = skillPreviewInput(later, owned);
    assert.ok(pathInput.unlockedSkills.includes(`${archetype}-range-close`), 'path preview retains chosen range');
    assert.ok(frames.has(resolvePlayerFrame(pathInput)!));
  }
}
console.log('Skill previews: all classes, styles, range accents and path frames passed.');

assert.equal(formatPassiveValue('shared.damage-mult', 0.1), '+10%');
assert.equal(formatPassiveValue('shared.damage-mult', -0.1), '−10%');
assert.equal(formatPassiveValue('cadence.extra-trigger-damage-mult', 0.7), '×0.7');
