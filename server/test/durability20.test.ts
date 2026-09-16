import assert from 'node:assert/strict';
import { MONSTER_DATABASE } from '@mmo-idle/shared';
import { DURABILITY20_CELLS, installDurability20Treatment } from '../bench/balance/durability20Spec';
assert.equal(DURABILITY20_CELLS.length,168);
assert.equal(new Set(DURABILITY20_CELLS.map(c=>c.id)).size,168);
const snapshot=JSON.stringify([...MONSTER_DATABASE]);
for(const cell of DURABILITY20_CELLS){
 const expected=new Map<string,any>(JSON.parse(snapshot));
 if(cell.tier===2&&cell.role==='forest'){Object.assign(expected.get('ancient-wolf').stats,{hp:1575,attack:22});Object.assign(expected.get('ironwood-golem').stats,{hp:945,attack:25});}
 if(cell.tier===3&&cell.role==='volcanic'){Object.assign(expected.get('magma-brute').stats,{hp:3000,attack:116});expected.get('ash-slinger').stats.attack=84;}
 const overlay=installDurability20Treatment(cell);
 try{assert.deepEqual([...MONSTER_DATABASE],[...expected]);}finally{overlay.restore();}
 assert.equal(JSON.stringify([...MONSTER_DATABASE]),snapshot);
}
console.log('durability20: ok');
