import assert from 'node:assert/strict';
import {MONSTER_DATABASE} from '@mmo-idle/shared';
import {DURABILITY27_BLOCKS,installDurability27Treatment} from '../bench/balance/durability27Spec';
const snap=()=>JSON.stringify([...MONSTER_DATABASE]);const before=snap();
for(const b of Object.values(DURABILITY27_BLOCKS)){
 assert.equal(b.cells.length,24);assert.equal(new Set(b.cells.map(c=>c.id)).size,24);
 for(const c of b.cells){
  assert.equal(c.tier,2);
  const o=installDurability27Treatment(c);
  assert.equal(o.changes.length,c.treatment==='control'?0:c.role==='mountain'?3:2);
  for(const x of o.changes){
   assert.equal(x.after,c.role==='mountain'?x.before:Math.round(x.before*1.75));
   assert.equal(x.afterAttack,c.role==='mountain'?Math.round(x.beforeAttack*0.8):x.beforeAttack);
  }
  o.restore();assert.equal(snap(),before);
 }
}
console.log('durability27 matrix, isolated numeric layers and restoration: passed');
