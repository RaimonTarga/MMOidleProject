import assert from 'node:assert/strict';
import {MONSTER_DATABASE} from '@mmo-idle/shared';
import {DURABILITY29_BLOCKS,installDurability29Treatment} from '../bench/balance/durability29Spec';
const snap=()=>JSON.stringify([...MONSTER_DATABASE]);const before=snap();
for(const b of Object.values(DURABILITY29_BLOCKS)){
 assert.equal(b.cells.length,24);assert.equal(new Set(b.cells.map(c=>c.id)).size,24);
 for(const c of b.cells.filter(c=>c.treatment==='control')){
  const o=installDurability29Treatment(c);
  const selected=new Map([...MONSTER_DATABASE].map(([k,d])=>[k,structuredClone(d)]));o.restore();assert.equal(snap(),before);
  const p=installDurability29Treatment({...c,treatment:'candidate'});
  const affected=c.tier===2?['granite-titan']:['granite-mammoth','cragback-rhino','cliffside-roc','avalanche-tyrant'];
  // REBASED 2026-09-18: this second 0.8 cut is authored source now (granite-titan
  // carries BOTH cuts at 54; granite-mammoth 147, cragback-rhino 90, cliffside-roc
  // 143, avalanche-tyrant 116), so the overlay is retired to reporting only.
  // Re-applying it would reach 43/118/72/114/93. Control and candidate therefore
  // describe the SAME database, which is exactly what this test now asserts.
  for(const [type,d] of MONSTER_DATABASE){
   assert.deepEqual(d,selected.get(type)!,type);
  }
  for(const type of affected){
   assert.equal(MONSTER_DATABASE.get(type)!.stats.attack,
    ({'granite-titan':54,'granite-mammoth':147,'cragback-rhino':90,'cliffside-roc':143,'avalanche-tyrant':116} as Record<string,number>)[type],
    type+': the adopted attack must be live and uncut by the retired overlay');
  }
  p.restore();assert.equal(snap(),before);
 }
}
console.log('durability29 attack-only pairing and full restoration: passed');
