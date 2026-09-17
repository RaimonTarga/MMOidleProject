import assert from 'node:assert/strict';
import {MONSTER_DATABASE} from '@mmo-idle/shared';
import {DURABILITY30_BLOCKS,installDurability30Treatment} from '../bench/balance/durability30Spec';
const snap=()=>JSON.stringify([...MONSTER_DATABASE]);const before=snap();
assert.deepEqual(Object.values(DURABILITY30_BLOCKS).map(b=>b.cells.length),[24,4]);
for(const b of Object.values(DURABILITY30_BLOCKS))for(const c of b.cells){
 const o=installDurability30Treatment(c);
 if(c.role==='jungle')assert.equal(snap(),before);
 else {
  assert.equal(MONSTER_DATABASE.get('hadal-stalker')!.stats.hp,c.treatment==='candidate'?21000:16800);
  assert.equal(MONSTER_DATABASE.get('elder-leviathan')!.stats.hp,17640);
 }
 o.restore();assert.equal(snap(),before);
}
console.log('durability30 selected Trench and unchanged Jungle: passed');
