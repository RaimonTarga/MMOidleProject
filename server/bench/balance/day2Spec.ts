import assert from 'node:assert/strict';
import { ENDURANCE_CELLS, type EnduranceCell } from './overnightEnduranceSpec';
import { FARMING_STANCE_CELLS } from './farmingStanceSpec';
export interface Day2Cell extends EnduranceCell { sourceObservationId: string | null; }
export const DAY2_SEEDS = [101009, 101021];
const ids = ['breadth-t3-apprentice-light','breadth-t4-striker-heavy-a','breadth-t4-striker-heavy-c','breadth-t4-conduit-heavy-b'];
export const DAY2_B: Day2Cell[] = ENDURANCE_CELLS.filter(c => ids.includes(c.identityId) && c.charm === (c.tier === 3 ? 'volcanic' : 'mountain')).flatMap(original =>
  ['control','candidate'].map(arm => {
    const c = structuredClone(original) as Day2Cell;
    Object.assign(c, {id:`day2-b-${original.id}-${arm}`,block:'B',arm,comparisonId:`day2-b-${original.id}`,sourceObservationId:arm === 'control' ? original.id : null});
    c.build.id=c.id;
    if(arm === 'candidate') {
      if(c.tier === 3) c.stance='defensive-stance';
      else { c.charm='volcanic'; c.build.gearItemIds.recovery='volcanic-charm-t4'; }
    }
    return c;
  }));
export const DAY2_A: Day2Cell[] = [101003,101009].flatMap(seed => ['conduit','slinger'].flatMap(root => {
  const original = root === 'conduit'
    ? FARMING_STANCE_CELLS.find(c=>c.identityId==='breadth-t3-conduit-balanced' && c.arm==='defensive' && c.nodeId==='node-t3-tundra-03')!
    : ENDURANCE_CELLS.find(c=>c.identityId==='breadth-t3-slinger-balanced' && c.nodeId==='node-t3-tundra-03')!;
  return ['control','candidate'].map(arm=> {
    const c=structuredClone(original) as Day2Cell;
    Object.assign(c,{id:`day2-a-${root}-s${seed}-${arm}`,block:'A',seed,arm,comparisonId:`day2-a-${root}-s${seed}`,
      sourceObservationId:null,referenceCaseId:original.id,charm:'mountain',policy:'static',displacedAbility:null});
    c.build.id=c.id; return c;
  });
}));
export const DAY2_CELLS = [...DAY2_A,...DAY2_B];
assert.equal(DAY2_A.length,8); assert.equal(DAY2_B.length,32);
export const DAY2_BLOCKS = Object.fromEntries([
  ...DAY2_CELLS.map(c=>[c.id,{cells:[c],durationMs:c.block==='A'?300000:1800000,pilotIds:[]}]),
  ...['A-control','A-candidate','B'].map(family=>[`qualification-${family}`,{cells:DAY2_CELLS.filter(c=>family==='B'?c.block==='B':`A-${c.arm}`===family && c.block==='A'),durationMs:family==='B'?1800000:300000,pilotIds:[]}]),
]);
