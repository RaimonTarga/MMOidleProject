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
  for(const [type,d] of MONSTER_DATABASE){
   const expected=selected.get(type)!;
   if(affected.includes(type))expected.stats.attack=Math.round(expected.stats.attack*0.8);
   assert.deepEqual(d,expected,type);
  }
  p.restore();assert.equal(snap(),before);
 }
}
console.log('durability29 attack-only pairing and full restoration: passed');
