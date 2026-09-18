import {MONSTER_DATABASE} from '@mmo-idle/shared';
import {DURABILITY25_BLOCKS} from './durability25Spec';
import {installDurability27Treatment} from './durability27Spec';
import {installDurability26Treatment} from './durability26Spec';
import type {Night5Cell} from './night5Spec';
export const DURABILITY29_SEEDS=[80021,82003,84011] as const;
export const DURABILITY29_BLOCKS=Object.fromEntries(['mountain2','mountain4'].map(block=>{
 const tier=Number(block.slice(-1));
 const cells=DURABILITY25_BLOCKS.mountain.cells.filter(c=>c.tier===tier).flatMap(c=>['control','candidate'].map(treatment=>{
  const id=`dur29-${block}-${c.nodeId.slice(-2)}-${c.className}-${treatment}`;
  return {...c,id,treatment,stance:'offensive-stance',build:{...c.build,id,skillPath:[...c.build.skillPath],gearItemIds:{...c.build.gearItemIds}}};
 }));
 return [block,{cells,durationMs:600000,pilotIds:cells.filter(c=>c.nodeId.endsWith('03')).map(c=>c.id)}];
}));
export function installDurability29Treatment(cell:Night5Cell){
 const ids=cell.tier===2?['granite-titan']:['granite-mammoth','cragback-rhino','cliffside-roc','avalanche-tyrant'];
 const original=ids.map(type=>({type,attack:MONSTER_DATABASE.get(type)!.stats.attack}));
 const base=cell.tier===2?installDurability27Treatment({...cell,treatment:'candidate'}):installDurability26Treatment({...cell,treatment:'candidate'});
 // RETIRED 2026-09-18: this second 0.8 cut is authored source now -- granite-titan
 // carries BOTH cuts (84 -> 67 -> 54) and the T4 quartet carries this one
 // (granite-mammoth 184 -> 147, cragback-rhino 113 -> 90, cliffside-roc 179 -> 143,
 // avalanche-tyrant 145 -> 116). Re-applying it would reach 43/118/72/114/93.
 // Report only; the historical experiment stays reproducible at its own revision.
 if(cell.treatment==='candidate')for(const type of ids){
  const d=MONSTER_DATABASE.get(type)!;
  const change=base.changes.find(c=>c.type===type)!;change.afterAttack=d.stats.attack;
 }
 return {changes:base.changes,restore(){base.restore();for(const s of original)MONSTER_DATABASE.get(s.type)!.stats.attack=s.attack;}};
}
