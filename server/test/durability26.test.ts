import assert from 'node:assert/strict';
import {MONSTER_DATABASE} from '@mmo-idle/shared';
import {DURABILITY26_BLOCKS,installDurability26Treatment} from '../bench/balance/durability26Spec';
const snap=()=>JSON.stringify([...MONSTER_DATABASE]);const before=snap();
const mammoth=MONSTER_DATABASE.get('granite-mammoth')!;
const ward=mammoth.stats.hp*mammoth.lowHealthWard!.wardPct;
for(const b of Object.values(DURABILITY26_BLOCKS)){
 assert.equal(b.cells.length,24);assert.equal(new Set(b.cells.map(c=>c.id)).size,24);
 for(const c of b.cells){
  // REBASED 2026-09-18: granite-mammoth 13800 and dune-basilisk 9006 (the RETAINED
  // Desert selection, not the other branch's 4503) are authored source now, and the
  // Durability26 doubling plus its ward halving are retired to a no-op. What this
  // test guards now is that the ward's ABSOLUTE budget is what the adoption wrote,
  // and that no arm moves the database.
  const o=installDurability26Treatment(c);
  assert.equal(mammoth.stats.hp,13800);
  assert.equal(MONSTER_DATABASE.get('dune-basilisk')!.stats.hp,9006);
  assert(Math.abs(mammoth.stats.hp*mammoth.lowHealthWard!.wardPct-ward)<1e-8);
  assert(Math.abs(ward-0.25*1150)<0.51,'the ward must hold its pre-adoption absolute budget of 287.5');
  o.restore();assert.equal(snap(),before);
 }
}
console.log('durability26 matrix, fixed ward and restoration: passed');
