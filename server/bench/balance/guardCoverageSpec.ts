import assert from 'node:assert/strict';
import { DAY2_B, type Day2Cell } from './day2Spec';

// Fixed practical packages, cloned from the exact Day 2 declarations.
export const GUARD_COVERAGE_CELLS: Day2Cell[] = [
  'breadth-t4-striker-heavy-a', 'breadth-t4-striker-heavy-c', 'breadth-t4-conduit-heavy-b',
].flatMap(identityId => ['node-t4-desert-03', 'node-t4-graveyard-03'].flatMap(nodeId =>
  [101009, 101021].flatMap(seed => {
    const charms = identityId.includes('conduit') ? ['mountain', 'inferno'] : ['inferno'];
    return charms.flatMap(charm => [false, true].map(endure => {
      const original = DAY2_B.find(c => c.identityId === identityId && c.nodeId === nodeId && c.seed === seed && c.arm === (charm === 'mountain' ? 'control' : 'candidate'))!;
      assert(original);
      const c = structuredClone(original);
      c.referenceCaseId = original.id;
      c.sourceObservationId = null; // All controls are fresh on the corrected source.
      c.arm = `${charm}-${endure ? 'endure' : 'static'}`;
      c.comparisonId = `guard-coverage-01-${identityId}-${nodeId}-s${seed}`;
      c.id = `${c.comparisonId}-${c.arm}`;
      c.build.id = c.id;
      if (endure) c.abilities!.guards.push('endure');
      return c;
    }));
  })));
assert.equal(GUARD_COVERAGE_CELLS.length, 32);
assert.equal(new Set(GUARD_COVERAGE_CELLS.map(c => c.id)).size, 32);
export const GUARD_COVERAGE_BLOCKS = Object.fromEntries([
  ...GUARD_COVERAGE_CELLS.map(c => [c.id, { cells: [c], durationMs: 1800000, pilotIds: [] }]),
  ['qualification', { cells: GUARD_COVERAGE_CELLS, durationMs: 1800000, pilotIds: [] }],
]);
