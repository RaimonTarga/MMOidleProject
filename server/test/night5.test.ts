import assert from 'node:assert/strict';
import {MONSTER_DATABASE} from '@mmo-idle/shared';
import {NIGHT5_BLOCKS,installNight5Treatment} from '../bench/balance/night5Spec';
const snapshot=()=>JSON.stringify([...MONSTER_DATABASE]);
const before=snapshot();
assert.deepEqual(Object.values(NIGHT5_BLOCKS).map(b=>b.cells.length),[80,84,144,84,48,84]);
const ids=new Set<string>();
for(const [name,block] of Object.entries(NIGHT5_BLOCKS))for(const c of block.cells){
 assert(!ids.has(c.id));ids.add(c.id);
 assert.equal(c.build.skillPath.length,c.tier);
 assert.equal(c.build.skillPath[1],c.build.classRoot.replace('-root','-balanced'));
 if(c.tier===4)assert(c.build.skillPath[3].endsWith(`t3-${name.slice(-1)}`));
 const overlay=installNight5Treatment(c);overlay.restore();assert.equal(snapshot(),before,'Overlay leaked');
}
const arms=NIGHT5_BLOCKS.mountain.cells.filter(c=>c.className==='apprentice'&&c.tier===2&&c.nodeId.endsWith('03'));
assert.equal(arms.length,4);assert.equal(new Set(arms.map(c=>`${c.orbit}:${c.build.gearItemIds.mobility}`)).size,4);
assert.equal(ids.size,524);
console.log('night5 matrix and restoration: ok');
