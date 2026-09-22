import assert from 'node:assert/strict';
import { runicPointLoadoutCost } from '@mmo-idle/shared';
import {
  TUNDRA_CLASS_FRAME_BASES, TUNDRA_CLASS_FRAME_CELLS, TUNDRA_CLASS_FRAME_SEEDS,
} from '../bench/balance/tundraClassFrameSpec';

assert.equal(TUNDRA_CLASS_FRAME_BASES.length, 18);
assert.equal(TUNDRA_CLASS_FRAME_CELLS.length, 52);
assert.equal(new Set(TUNDRA_CLASS_FRAME_CELLS.map(c => c.id)).size, 52);
assert.deepEqual([...new Set(TUNDRA_CLASS_FRAME_CELLS.map(c => c.seed))], [...TUNDRA_CLASS_FRAME_SEEDS]);
assert.equal(TUNDRA_CLASS_FRAME_CELLS.filter(c => c.block === 'primary').length, 36);
assert.equal(TUNDRA_CLASS_FRAME_CELLS.filter(c => c.block === 'alternative').length, 16);
assert(!TUNDRA_CLASS_FRAME_CELLS.some(c => c.abilities?.techniques.includes('slam')), 'User correction excludes Slam completely');
assert(!TUNDRA_CLASS_FRAME_CELLS.some(c => c.build.gearItemIds.armor === 'tundra-vest-t3'), 'Glacial Bulwark is excluded');
assert(!TUNDRA_CLASS_FRAME_CELLS.some(c => c.runeRules?.some(r => r.actionId === 'flee')), 'No generic Flee');

for (const c of TUNDRA_CLASS_FRAME_CELLS) {
  assert.equal(c.nodeId, 'node-t3-tundra-03');
  assert.equal(c.tier, 3); assert.equal(c.role, 'farm'); assert.equal(c.upgradeLevel, 5);
  assert.equal(c.abilities?.guards.includes('break-free'), !(c.className === 'apprentice' && c.frame === 'balanced'));
  assert(c.runeRules?.some(r => r.actionId === 'auto-path-enemy'));
  assert(c.runeRules?.some(r => r.actionId === 'step-back'));
  assert(c.runeRules?.some(r => r.actionId === 'avoid-hazards'));
  assert(c.runeRules?.some(r => r.actionId === 'wait-for-regen'));
  assert.equal(c.runeRules?.some(r => r.actionId === 'orbit'), c.range === 'mid');
  const cost = runicPointLoadoutCost({ abilities: c.abilities!, rules: c.runeRules!, stances: [c.stance!], rites: [] });
  assert(cost <= 38, `${c.id} costs ${cost}/38 RP`);
  if (c.className === 'squire') assert(c.abilities?.techniques.includes('power-strike'));
}

for (const comparisonId of new Set(TUNDRA_CLASS_FRAME_CELLS.filter(c => c.alternativeId).map(c => c.comparisonId))) {
  const pair = TUNDRA_CLASS_FRAME_CELLS.filter(c => c.comparisonId === comparisonId);
  assert.equal(pair.length, 2, comparisonId);
  const primary = pair.find(c => c.arm === 'primary')!, alt = pair.find(c => c.arm !== 'primary')!;
  assert.deepEqual(pair.map(c => c.arm), primary.seed === 101009 ? ['primary', alt.arm] : [alt.arm, 'primary']);
  assert.deepEqual({ ...primary.build.gearItemIds, weapon: '' }, { ...alt.build.gearItemIds, weapon: '' });
  assert.equal(primary.build.gearItemIds.core, alt.build.gearItemIds.core);
  assert.equal(primary.stance, alt.stance);
  assert.deepEqual(primary.abilities?.guards, alt.abilities?.guards);
  if (alt.arm.startsWith('W')) {
    assert.deepEqual(primary.abilities, alt.abilities);
    assert.deepEqual(primary.runeRules, alt.runeRules);
  }
  if (alt.arm === 'A2') {
    assert.deepEqual(primary.abilities?.techniques, ['frenzy', 'hamstring']);
    assert.deepEqual(alt.abilities?.techniques, ['detonate', 'hamstring']);
    assert(alt.runeRules?.some(r => r.conditionId === 'target-max-stacks' && r.actionId === 'use-ability' && r.targetAbilityId === 'detonate'));
  }
  if (alt.arm === 'A3') {
    assert.deepEqual(primary.abilities?.techniques, ['frenzy', 'hamstring']);
    assert.deepEqual(alt.abilities?.techniques, ['frenzy', 'binding-strike']);
  }
}

console.log('tundraClassFramePacket: 36 primary + 16 alternatives, Slam excluded, legal RP, fixed pairs and reversed seed order; zero combat');
