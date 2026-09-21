import assert from 'node:assert/strict';
import { ENDURANCE_CELLS as cells, ENDURANCE_PAIRED_IDS, ENDURANCE_SEEDS } from '../bench/balance/overnightEnduranceSpec';
import { EnduranceProgress, endpointIntervals } from '../bench/balance/enduranceProgress';
import type { WorldLogEvent } from '@mmo-idle/shared';
assert.equal(new Set(cells.map(c=>c.identityId)).size,72);
assert.equal(new Set(ENDURANCE_PAIRED_IDS).size,12);
for(const seed of ENDURANCE_SEEDS) {
  assert.equal(cells.filter(c=>c.seed===seed && c.block==='A').length,144);
  assert.equal(cells.filter(c=>c.seed===seed && c.block==='B').length,24);
}
for(const c of cells.filter(c=>c.block==='B')) {
  const a=cells.find(x=>x.comparisonId===c.comparisonId && x.block==='A')!;
  assert.equal(Math.abs(cells.indexOf(a)-cells.indexOf(c)),1);
  assert.equal(a.charm,'volcanic');assert.equal(c.charm,'mountain');
  const loadout=(x:typeof c)=>({build:{...x.build,id:'',gearItemIds:{...x.build.gearItemIds,recovery:''}},
    abilities:x.abilities,runes:x.runeRules,stance:x.stance,upgrades:x.upgradeLevel,range:x.range});
  assert.deepEqual(loadout(a),loadout(c));
  assert.equal(c.seed===101009,cells.indexOf(a)<cells.indexOf(c));
}
assert.deepEqual(endpointIntervals([{atMs:300000,work:{kills:10}}]).map(x=>x.kills),[10,null,null]);
assert.deepEqual(endpointIntervals([{atMs:300000,work:{kills:10}},{atMs:900000,work:{kills:18}},
  {atMs:1800000,work:{kills:35}}]).map(x=>x.kills),[10,8,17]);
const p=new EnduranceProgress('owner');
const damage={kind:'damage',source:{id:'body',ownerPlayerId:'owner'},target:{id:'bear',actorType:'monster'},hpDamage:0,absorbed:14} as WorldLogEvent;
p.ingest(damage,100);p.ingest(damage,200);
assert.equal(p.snapshot(1000).hpDamage,0);assert.equal(p.snapshot(1000).absorbed,28);
assert.equal(p.snapshot(1000).longestHpProgressGapMs,1000,'Absorption is not useful HP progress');
p.ingest({...damage,hpDamage:5} as WorldLogEvent,1100);
assert.equal(p.snapshot(1500).longestHpProgressGapMs,1100);
assert.equal(p.snapshot(1500).firstKillMs,null);
console.log('overnightEndurance: ledger, paired loadouts/order, post-death null windows, shield-only progress checks; zero combat ticks');
