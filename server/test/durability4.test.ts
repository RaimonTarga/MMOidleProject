import assert from 'node:assert/strict';
import {MONSTER_DATABASE} from '@mmo-idle/shared';
import {DURABILITY4_CELLS,DURABILITY4_SEEDS,installDurability4Treatment} from '../bench/balance/durability4Spec';
assert.equal(DURABILITY4_CELLS.length,60);assert.equal(DURABILITY4_SEEDS.length,5);
const baseline=JSON.stringify([...MONSTER_DATABASE]);
for(const cell of DURABILITY4_CELLS){
 const expected=new Map<string,any>(JSON.parse(baseline));
 const stats=expected.get(cell.eliteType).stats;
 stats.hp=Math.round(stats.hp*cell.hpFactor);stats.attack=Math.round(stats.attack*cell.attackFactor);stats.plating+=cell.platingAdd;
 if(cell.experiment==='eagle-dive')expected.get('stone-eagle').engageSequence.damageMultiplier=cell.diveMultiplier;
 const overlay=installDurability4Treatment(cell);
 try{assert.deepEqual([...MONSTER_DATABASE],[...expected],'Only declared elite stats or dive multiplier may change');}
 finally{overlay.restore();}
 assert.equal(JSON.stringify([...MONSTER_DATABASE]),baseline,'Nested dive state must restore between worlds');
}
console.log('durability4: ok');
