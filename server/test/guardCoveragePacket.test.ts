import assert from 'node:assert/strict';
import { GUARD_COVERAGE_CELLS } from '../bench/balance/guardCoverageSpec';
import { DAY2_B } from '../bench/balance/day2Spec';
import { runicPointLoadoutCost } from '@mmo-idle/shared';

for (const c of GUARD_COVERAGE_CELLS) {
  const original = DAY2_B.find(x => x.id === c.referenceCaseId)!;
  assert(original);
  const expected = structuredClone(original.abilities!);
  if (c.arm.endsWith('-endure')) expected.guards.push('endure');
  assert.deepEqual(c.abilities, expected);
  assert.deepEqual({ ...c.build, id: '' }, { ...original.build, id: '' });
  assert.deepEqual(c.runeRules, original.runeRules);
  assert.equal(c.stance, 'offensive-stance');
  assert.equal(c.range, 'close');
  assert.equal(c.upgradeLevel, 5);
  assert.equal(c.sourceObservationId, null);
  const cost = (abilities: typeof expected) => runicPointLoadoutCost({ abilities, rules: c.runeRules!, stances: [c.stance!], rites: [] });
  assert.equal(cost(expected) - cost(original.abilities!), c.arm.endsWith('-endure') ? 6 : 0);
}
assert.equal(GUARD_COVERAGE_CELLS.filter(c => c.className === 'conduit').length, 16);
assert.equal(GUARD_COVERAGE_CELLS.filter(c => c.className === 'striker').length, 16);
console.log('guardCoveragePacket: exact Day 2 packages, six RP delta, 32 fresh cells; zero combat');
