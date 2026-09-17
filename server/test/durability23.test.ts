import assert from 'node:assert/strict';
import {MONSTER_DATABASE} from '@mmo-idle/shared';
import {DURABILITY23_BLOCKS,installDurability23Treatment} from '../bench/balance/durability23Spec';
const snap=()=>JSON.stringify([...MONSTER_DATABASE]);const before=snap();
assert.deepEqual(Object.values(DURABILITY23_BLOCKS).map(b=>b.cells.length),[24,28,12]);
for(const b of Object.values(DURABILITY23_BLOCKS))for(const c of b.cells){
 assert.equal(c.focusElites,c.role==='graveyard'&&c.treatment==='candidate');
 const overlay=installDurability23Treatment(c);
 assert.equal(overlay.changes.length,c.role==='volcanic'&&c.treatment==='candidate'?2:0);
 if(!overlay.changes.length)assert.equal(snap(),before);
 overlay.restore();assert.equal(snap(),before);
}
console.log('durability23 matrix and restoration: passed');
