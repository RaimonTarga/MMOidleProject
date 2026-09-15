import assert from 'node:assert/strict';
import {MONSTER_DATABASE} from '@mmo-idle/shared';
import {DURABILITY2_CELLS} from './durability2Spec';

export const DURABILITY4_SEEDS=[173,947,2027,4093,5579];
const bases=DURABILITY2_CELLS.filter(c=>c.treatment==='control');
export const DURABILITY4_CELLS=[
 ...bases.filter(c=>c.className==='conduit'&&!c.alternate).flatMap(c=>
  (['axe','on-hit','heavy'] as const).flatMap(weaponProfile=>[0,c.tier===2?4:8,c.tier===2?8:16].map(platingAdd=>{
   const weapon=weaponProfile==='axe'?c.build.gearItemIds.weapon!:weaponProfile==='heavy'?(c.tier===2?'quake-hammer':'mountain-avalanche-maul'):(c.tier===2?'jungle-stinger-rapier':'jungle-venomthorn-rapier');
   const id=`dur4-t${c.tier}-${c.role}-conduit-${weaponProfile}-plate${platingAdd}`;
   return {...c,id,treatment:`plate${platingAdd}`,experiment:'conduit-plating',weaponProfile,platingAdd,diveMultiplier:1.75,
    hpFactor:c.tier===2?2.4:4,attackFactor:c.tier===2&&c.role==='solo'?0.75:1,
    alternate:weaponProfile!=='axe',build:{...c.build,id,gearItemIds:{...c.build.gearItemIds,weapon}}};
  }))),
 ...bases.filter(c=>c.tier===2&&c.role==='small-group').flatMap(c=>[1.75,1.5,1.25].map(diveMultiplier=>{
  const id=`dur4-eagle-${c.className}-${c.alternate?'weapon-alt':'baseline'}-dive${diveMultiplier}`;
  return {...c,id,treatment:`dive${diveMultiplier}`,experiment:'eagle-dive',weaponProfile:c.alternate?'weapon-alt':'baseline',platingAdd:0,diveMultiplier,hpFactor:3,attackFactor:1};
 })),
];
export type Durability4Cell=typeof DURABILITY4_CELLS[number];
export function installDurability4Treatment(cell:Durability4Cell){
 const elite=MONSTER_DATABASE.get(cell.eliteType)!;
 const before={...elite.stats};
 const eagle=MONSTER_DATABASE.get('stone-eagle')!;
 const sequence=eagle.engageSequence;
 assert(sequence?.kind==='cast-charge-strike');
 const originalDive=sequence.damageMultiplier;
 elite.stats.hp=Math.round(before.hp*cell.hpFactor);
 elite.stats.attack=Math.round(before.attack*cell.attackFactor);
 elite.stats.plating=before.plating+cell.platingAdd;
 if(cell.experiment==='eagle-dive')sequence.damageMultiplier=cell.diveMultiplier;
 const changes=[{type:cell.eliteType,before:before.hp,after:elite.stats.hp,beforeAttack:before.attack,afterAttack:elite.stats.attack,beforePlating:before.plating,afterPlating:elite.stats.plating},
  ...(cell.experiment==='eagle-dive'?[{type:'stone-eagle',before:eagle.stats.hp,after:eagle.stats.hp,beforeAttack:eagle.stats.attack,afterAttack:eagle.stats.attack,beforePlating:eagle.stats.plating,afterPlating:eagle.stats.plating,beforeDive:originalDive,afterDive:cell.diveMultiplier}]:[])];
 return {changes,restore(){Object.assign(elite.stats,before);sequence.damageMultiplier=originalDive;}};
}
