import assert from 'node:assert/strict';
import {MONSTER_DATABASE} from '@mmo-idle/shared';
import {DURABILITY25_BLOCKS,installDurability25Treatment} from '../bench/balance/durability25Spec';
const snap=()=>JSON.stringify([...MONSTER_DATABASE]);const before=snap();
for(const block of Object.values(DURABILITY25_BLOCKS)){
 assert.equal(block.cells.length,36);assert.equal(new Set(block.cells.map(c=>c.id)).size,36);
 for(const tier of [2,3,4])assert.equal(block.cells.filter(c=>c.tier===tier).length,12);
 for(const c of block.cells){
  assert.equal(c.focusElites,false);
  assert.equal(c.build.skillPath.length,c.tier);
  const o=installDurability25Treatment(c);
  assert.equal(o.changes.length,c.tier===4?14:0);
  if(c.tier!==4)assert.equal(snap(),before);
  o.restore();assert.equal(snap(),before);
 }
}
console.log('durability25 ladder and restoration: passed');
