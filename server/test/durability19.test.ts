import assert from 'node:assert/strict';
import { MONSTER_DATABASE } from '@mmo-idle/shared';
import { DURABILITY19_CELLS, installDurability19Treatment } from '../bench/balance/durability19Spec';
assert.equal(DURABILITY19_CELLS.length,48);
assert.equal(new Set(DURABILITY19_CELLS.map(c=>c.id)).size,48);
const snapshot=JSON.stringify([...MONSTER_DATABASE]);
for(const cell of DURABILITY19_CELLS){
 const expected=new Map<string,any>(JSON.parse(snapshot));
 if(cell.treatment==='candidate'){
  if(cell.tier===2){Object.assign(expected.get('ancient-wolf').stats,{hp:1575,attack:22});Object.assign(expected.get('ironwood-golem').stats,{hp:945,attack:25});}
  else {Object.assign(expected.get('magma-brute').stats,{hp:3000,attack:116});expected.get('ash-slinger').stats.attack=84;}
 }
 const overlay=installDurability19Treatment(cell);
 try{assert.deepEqual([...MONSTER_DATABASE],[...expected]);}finally{overlay.restore();}
 assert.equal(JSON.stringify([...MONSTER_DATABASE]),snapshot);
}
console.log('durability19: ok');
