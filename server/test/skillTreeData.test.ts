import { strict as assert } from 'node:assert';
import { PLAYER_FRAMES, SKILL_TREE, finalizePulse, makePulseAccumulator, mergePassives, resolvePlayerFrame, type PassiveMap } from '@mmo-idle/shared';
import { skillPreviewInput } from '../../client/src/ui/skillPreviewInput';
import { formatPassiveValue } from '../../client/src/ui/describe/passiveText';

// Guards authored Striker numbers that the passive tree panel presents.
const root = SKILL_TREE.get('cadence-root')!;
const close = SKILL_TREE.get('cadence-range-close')!;
assert.equal(root.statEffects.maxHpPct, .18);
assert.ok(Math.abs((root.statEffects.maxHpPct ?? 0) + (close.statEffects.maxHpPct ?? 0) - .30) < 1e-9);

const mechanics: PassiveMap = {};
const pulses = makePulseAccumulator();
for (const node of [root, close]) mergePassives(mechanics, node.mechanicEffects, pulses);
finalizePulse(pulses, mechanics);
assert.ok(Math.abs(mechanics['defense.recovery-pulse-pct']! - .30) < 1e-9);
assert.equal(mechanics['defense.recovery-pulse-interval-ms'], 6000);
assert.equal(mechanics['defense.recovery-pulse-duration-ms'], 4000);
assert.equal(mechanics['defense.max-hit-mult'], undefined, 'Striker no longer carries a damage soft cap');

// Every style opens exactly three Tier 4 paths (internal tier 3); the tree panel's
// branch diagram depends on it.
for (const style of [...SKILL_TREE.values()].filter((node) => node.tier === 1)) {
  const paths = [...SKILL_TREE.values()].filter((node) =>
    node.tier === 3 && node.classId === style.classId && node.subVariantId === style.subVariantId);
  assert.equal(paths.length, 3, `${style.id} leads to three paths`);
  // Previewing a path from the style step (only the class owned) shows the
  // path's own sprite, not the generic class body.
  for (const path of paths) {
    const authored = PLAYER_FRAMES[path.id];
    if (!authored) continue;
    assert.equal(resolvePlayerFrame(skillPreviewInput(path, [style.classId!])), authored, `${path.id} previews its own sprite`);
  }
}

assert.equal(formatPassiveValue('cadence.debuff-vuln-pct', 25, { signed: true }), '+25%');
assert.equal(formatPassiveValue('cadence.debuff-vuln-pct', 25), '25%');
console.log('skillTreeData: ok');
