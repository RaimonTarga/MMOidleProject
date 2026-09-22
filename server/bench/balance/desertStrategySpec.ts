import assert from 'node:assert/strict';
import { GUARD_COVERAGE_CELLS } from './guardCoverageSpec';
import { ENDURANCE_CELLS, type EnduranceCell } from './overnightEnduranceSpec';

export const DESERT_IDS = ['breadth-t4-striker-heavy-a', 'breadth-t4-squire-heavy-a',
  'breadth-t4-apprentice-heavy-a', 'breadth-t4-slinger-heavy-a',
  'breadth-t4-conduit-heavy-b', 'breadth-t4-spirit-heavy-a'];
export const DESERT_ENDPOINTS = [300000, 600000];
export const DESERT_BASES = DESERT_IDS.map(identityId => {
  const guard = identityId.includes('striker') || identityId.includes('conduit');
  const charm = identityId.includes('squire') || identityId.includes('slinger') ? 'volcanic' : 'mountain';
  const original = guard
    ? GUARD_COVERAGE_CELLS.find(c => c.identityId === identityId && c.nodeId === 'node-t4-desert-03' && c.seed === 101009 && c.arm === 'inferno-static')
    : ENDURANCE_CELLS.find(c => c.identityId === identityId && c.nodeId === 'node-t4-desert-03' && c.seed === 101009 && c.charm === charm);
  assert(original, identityId);
  assert(!original.runeRules?.some(r => r.actionId === 'focus-lowest-hp'));
  return structuredClone(original);
});
export const DESERT_CELLS: EnduranceCell[] = [101009, 101021].flatMap(seed => DESERT_BASES.flatMap(original =>
  (seed === 101009 ? ['baseline-targeting', 'lowhp-targeting'] : ['lowhp-targeting', 'baseline-targeting']).map(arm => {
    const c = structuredClone(original);
    c.referenceCaseId = original.id;
    c.seed = seed;
    c.arm = arm;
    c.comparisonId = `desert-strategy-01-${c.identityId}-s${seed}`;
    c.id = `${c.comparisonId}-${arm}`;
    c.build.id = c.id;
    if ('sourceObservationId' in c) c.sourceObservationId = null;
    if (arm === 'lowhp-targeting') c.runeRules!.unshift({ conditionId: 'in-combat', actionId: 'focus-lowest-hp' });
    return c;
  })));
assert.equal(DESERT_CELLS.length, 24);
export const DESERT_BLOCKS = Object.fromEntries([
  ...DESERT_CELLS.map(c => [c.id, { cells: [c], durationMs: 600000, pilotIds: [] }]),
  ['qualification', { cells: DESERT_CELLS, durationMs: 600000, pilotIds: [] }],
]);
