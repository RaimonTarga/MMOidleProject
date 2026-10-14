import assert from 'node:assert/strict';
import { EnduranceProgress, endpointIntervals } from '../bench/balance/enduranceProgress';
import type { WorldLogEvent } from '@mmo-idle/shared';
// The overnight packet's own checks went with the frame/path breadth matrix it was cut from
// (class-first tree); the ledger it reads with stays.
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
console.log('overnightEndurance: ledger, post-death null windows, shield-only progress checks; zero combat ticks');
