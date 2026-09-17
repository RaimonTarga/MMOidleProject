import assert from 'node:assert/strict';
import {MONSTER_DATABASE} from '@mmo-idle/shared';
import {DURABILITY28_BLOCKS,installDurability28Treatment} from '../bench/balance/durability28Spec';
const snap=()=>JSON.stringify([...MONSTER_DATABASE]);const before=snap();
for(const b of Object.values(DURABILITY28_BLOCKS)){
 assert.equal(b.cells.length,8);assert.equal(new Set(b.cells.map(c=>c.id)).size,8);
 for(const c of b.cells.filter(c=>c.treatment==='offensive')){
  const d=b.cells.find(d=>d.nodeId===c.nodeId&&d.className===c.className&&d.treatment==='defensive')!;
  assert.deepEqual({...c.build,id:''},{...d.build,id:''});
  const o=installDurability28Treatment(c);const selected=snap();o.restore();assert.equal(snap(),before);
  const p=installDurability28Treatment(d);assert.equal(snap(),selected);p.restore();assert.equal(snap(),before);
  assert.equal(c.stance,'offensive-stance');assert.equal(d.stance,'defensive-stance');
 }
}
console.log('durability28 stance pairs, identical mob packages and restoration: passed');
