import assert from 'node:assert/strict';
import {MONSTER_DATABASE} from '@mmo-idle/shared';
import {DURABILITY26_BLOCKS,installDurability26Treatment} from '../bench/balance/durability26Spec';
const snap=()=>JSON.stringify([...MONSTER_DATABASE]);const before=snap();
const mammoth=MONSTER_DATABASE.get('granite-mammoth')!;
const ward=mammoth.stats.hp*mammoth.lowHealthWard!.wardPct;
for(const b of Object.values(DURABILITY26_BLOCKS)){
 assert.equal(b.cells.length,24);assert.equal(new Set(b.cells.map(c=>c.id)).size,24);
 for(const c of b.cells){
  const o=installDurability26Treatment(c);
  assert.equal(mammoth.stats.hp,6900*(c.role==='mountain'&&c.treatment==='candidate'?2:1));
  assert.equal(MONSTER_DATABASE.get('dune-basilisk')!.stats.hp,4503*(c.role==='desert'&&c.treatment==='candidate'?2:1));
  assert(Math.abs(mammoth.stats.hp*mammoth.lowHealthWard!.wardPct-ward)<1e-8);
  o.restore();assert.equal(snap(),before);
 }
}
console.log('durability26 matrix, fixed ward and restoration: passed');
