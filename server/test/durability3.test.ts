import assert from 'node:assert/strict';
import {MONSTER_DATABASE} from '@mmo-idle/shared';
import {DURABILITY3_CELLS,installDurability3Treatment} from '../bench/balance/durability3Spec';
assert.equal(DURABILITY3_CELLS.length,152);
const baseline=JSON.stringify([...MONSTER_DATABASE]);
const originals=new Map(JSON.parse(baseline));
for(const c of DURABILITY3_CELLS){
 const overlay=installDurability3Treatment(c);
 try{
  for(const [id,def] of MONSTER_DATABASE){
   const expected=structuredClone(originals.get(id)) as typeof def;
   const elite=id===c.eliteType;
   if(elite){expected.stats.hp=Math.round(expected.stats.hp*c.hpFactor);expected.stats.attack=Math.round(expected.stats.attack*c.attackFactor);
    if(c.treatment==='plating')expected.stats.plating+=c.tier===2?8:16;
    if(c.treatment==='dr')expected.stats.damageReduction=1-(1-expected.stats.damageReduction)*0.8;
   }else if((id==='stone-eagle'&&['eagle-soft','both-soft'].includes(c.treatment))||(id==='peak-archer'&&['thrower-soft','both-soft'].includes(c.treatment)))expected.stats.attack=Math.round(expected.stats.attack*0.75);
   assert.deepEqual(def,expected,'No unplanned mechanics or stats may change');
  }
 }finally{overlay.restore();}
 assert.equal(JSON.stringify([...MONSTER_DATABASE]),baseline);
}
console.log('durability3: ok');
