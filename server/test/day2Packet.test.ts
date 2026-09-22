import assert from 'node:assert/strict';
import { DAY2_A, DAY2_B } from '../bench/balance/day2Spec';
import { ENDURANCE_CELLS } from '../bench/balance/overnightEnduranceSpec';
import { FARMING_STANCE_CELLS } from '../bench/balance/farmingStanceSpec';
for(const control of DAY2_B.filter(c=>c.arm==='control')) {
  const old=ENDURANCE_CELLS.find(c=>c.id===control.sourceObservationId)!;
  const candidate=DAY2_B.find(c=>c.comparisonId===control.comparisonId && c.arm==='candidate')!;
  const packageOf=(c:typeof control)=>({build:{...c.build,id:''},abilities:c.abilities,runes:c.runeRules,stance:c.stance,range:c.range,upgrade:c.upgradeLevel});
  assert.deepEqual(packageOf(control),packageOf(old as typeof control));
  const expected=structuredClone(control);
  if(expected.tier===3) expected.stance='defensive-stance';
  else expected.build.gearItemIds.recovery='volcanic-charm-t4';
  assert.deepEqual(packageOf(candidate),packageOf(expected));
  if(control.identityId==='breadth-t4-conduit-heavy-b') assert.equal(control.range,'close');
}
for(const c of DAY2_A.filter(c=>c.className==='conduit')) {
  const original=FARMING_STANCE_CELLS.find(x=>x.id===c.referenceCaseId)!;
  assert.equal(c.stance,'defensive-stance');assert.equal(c.range,'mid');
  assert.deepEqual({...c.build,id:''},{...original.build,id:''});
  assert.deepEqual(c.abilities,original.abilities);assert.deepEqual(c.runeRules,original.runeRules);
}
assert.equal(DAY2_A.length+DAY2_B.length,40);
console.log('day2Packet: exact historical packages and bounded single changes; zero combat');
