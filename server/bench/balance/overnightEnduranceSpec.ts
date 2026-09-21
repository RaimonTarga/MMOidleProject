import assert from 'node:assert/strict';
import { BREADTH_CELLS } from './playerBreadthSpec';
import { FARMING_STANCE_CELLS } from './farmingStanceSpec';
import { FARMING_SUSTAIN_CELLS, type FarmingSustainCell } from './farmingSustainSpec';

export const ENDURANCE_SEEDS = [101009, 101021] as const;
export const ENDURANCE_CAP_MS = 1800000;
export const ENDURANCE_ENDPOINTS = [300000, 900000, 1800000];
export const ENDURANCE_PAIRED_IDS = [
  'breadth-t3-striker-balanced', 'breadth-t3-squire-balanced', 'breadth-t3-apprentice-balanced',
  'breadth-t3-striker-heavy', 'breadth-t3-squire-light', 'breadth-t3-apprentice-light',
  'breadth-t4-conduit-heavy-a', 'breadth-t4-squire-heavy-a', 'breadth-t4-striker-heavy-b',
  'breadth-t4-squire-heavy-b', 'breadth-t4-slinger-heavy-a', 'breadth-t4-spirit-balanced-a',
];
export interface EnduranceCell extends FarmingSustainCell { seed: number; block: 'A' | 'B'; referenceCaseId: string; }
const roots = ['striker','squire','apprentice','conduit','slinger','spirit'];
const catalogue = BREADTH_CELLS.filter(c => c.role === 'farm' && !c.controlCaseId && c.tier >= 3 && c.range !== 'far');
assert.equal(catalogue.filter(c => c.tier === 3).length, 18);
assert.equal(catalogue.filter(c => c.tier === 4).length, 54);
// Cycle each root through T3 and its three T4 paths before advancing the frame.
catalogue.sort((a,b) => {
  const slot = (c: typeof a) => ['light','balanced','heavy'].indexOf(c.frame) * 4 +
    (c.tier === 3 ? 0 : 1 + ['a','b','c'].indexOf(c.identityId.slice(-1)));
  return slot(a)-slot(b) || roots.indexOf(a.className)-roots.indexOf(b.className);
});
export const ENDURANCE_CELLS: EnduranceCell[] = ENDURANCE_SEEDS.flatMap((seed, seedIndex) =>
  [0,1].flatMap(fixtureIndex => catalogue.flatMap(original => {
    const fixtures = [...new Set(FARMING_STANCE_CELLS.filter(c => c.tier === original.tier).map(c => c.nodeId))];
    assert.equal(fixtures.length,2);
    const nodeId = fixtures[fixtureIndex];
    const paired = ENDURANCE_PAIRED_IDS.includes(original.identityId);
    const previous = FARMING_SUSTAIN_CELLS.find(c => c.identityId === original.identityId && c.policy === 'static' && c.charm === 'mountain');
    const reference = previous ?? original;
    const arms = paired ? (seedIndex === 0 ? ['volcanic','mountain'] : ['mountain','volcanic']) : ['mountain'];
    return arms.map(charm => {
      const c = structuredClone(reference) as EnduranceCell;
      const comparisonId = `endurance-01-${original.identityId}-${nodeId}-s${seed}`;
      Object.assign(c, { id: `${comparisonId}-${charm}`, comparisonId, nodeId, seed,
        block: paired && charm === 'mountain' ? 'B' : 'A', arm: `${charm}-static`, charm, policy: 'static',
        referenceCaseId: reference.id, originalCaseId: original.id,
        displacedAbility: previous?.displacedAbility ?? null,
        reconstructionPolicy: c.className === 'conduit' ? 'production-r2' : 'not-applicable' });
      c.build.id = c.id;
      if (paired) { c.build.gearItemIds.recovery = `${charm}-charm-t${c.tier}`; c.stance = 'offensive-stance'; }
      assert(!c.additionalStances?.length && !c.runeRules?.some(r => r.actionId === 'switch-stance'));
      return c;
    });
  })));
assert.equal(ENDURANCE_CELLS.length,336);
assert.equal(ENDURANCE_CELLS.filter(c => c.block === 'A').length,288);
assert.equal(ENDURANCE_CELLS.filter(c => c.block === 'B').length,48);
assert.equal(new Set(ENDURANCE_CELLS.map(c => c.id)).size,336);
export const ENDURANCE_BLOCKS = Object.fromEntries([
  ...ENDURANCE_CELLS.map(c => [c.id, { cells: [c], durationMs: ENDURANCE_CAP_MS, pilotIds: [] }] as const),
  ['qualification', { cells: ENDURANCE_CELLS, durationMs: ENDURANCE_CAP_MS, pilotIds: [] }],
]);
