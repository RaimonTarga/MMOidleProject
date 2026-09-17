import assert from 'node:assert/strict';
import {MONSTER_DATABASE} from '@mmo-idle/shared';
import {DURABILITY24_BLOCKS,DURABILITY24_HP,installDurability24Treatment} from '../bench/balance/durability24Spec';
const snap=()=>JSON.stringify([...MONSTER_DATABASE]);const before=snap();
const cells=DURABILITY24_BLOCKS.graveyard.cells;
assert.equal(cells.length,56);assert.equal(new Set(cells.map(c=>c.id)).size,56);
for(const c of cells){
 assert.equal(c.focusElites,c.treatment.endsWith('-focus'));
 const overlay=installDurability24Treatment(c);
 assert.equal(overlay.changes.length,c.treatment.startsWith('redistributed-')?5:0);
 for(const [type,hp,candidate] of DURABILITY24_HP)assert.equal(MONSTER_DATABASE.get(type)!.stats.hp,overlay.changes.length?candidate:hp);
 overlay.restore();assert.equal(snap(),before);
}
for(const c of cells.filter(c=>c.treatment==='control-normal')){
 const quartet=cells.filter(x=>x.nodeId===c.nodeId&&x.className===c.className&&x.build.skillPath.at(-1)===c.build.skillPath.at(-1));
 assert.equal(quartet.length,4);
 for(const x of quartet)assert.deepEqual({...x.build,id:''},{...c.build,id:''});
}
console.log('durability24 factorial matrix and restoration: passed');
