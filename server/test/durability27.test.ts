import assert from 'node:assert/strict';
import {MONSTER_DATABASE} from '@mmo-idle/shared';
import {DURABILITY27_BLOCKS,installDurability27Treatment} from '../bench/balance/durability27Spec';
const snap=()=>JSON.stringify([...MONSTER_DATABASE]);const before=snap();
for(const b of Object.values(DURABILITY27_BLOCKS)){
 assert.equal(b.cells.length,24);assert.equal(new Set(b.cells.map(c=>c.id)).size,24);
 for(const c of b.cells){
  assert.equal(c.tier,2);
  // REBASED 2026-09-18: both treatments are authored source now -- T2 Mountain
  // attack (granite-titan 54, stone-eagle 60, peak-archer 72) and T2 Desert HP
  // (sand-scorpion and stone-basilisk 1365). The overlay is retired to reporting
  // only, so every change row is before == after and no arm moves the database.
  const o=installDurability27Treatment(c);
  assert.equal(o.changes.length,c.treatment==='control'?0:c.role==='mountain'?3:2);
  for(const x of o.changes){
   assert.equal(x.after,x.before,'the retired overlay must not move HP');
   assert.equal(x.afterAttack,x.beforeAttack,'the retired overlay must not move attack');
  }
  o.restore();assert.equal(snap(),before);
 }
}
console.log('durability27 matrix, isolated numeric layers and restoration: passed');
