import assert from 'node:assert/strict';
import {MONSTER_DATABASE} from '@mmo-idle/shared';
import {NIGHT5_BLOCKS,type Night5Cell} from './night5Spec';
export const DURABILITY23_SEEDS=[44017,46021,48017] as const;
export const DURABILITY23_BLOCKS=Object.fromEntries(['volcanic','graveyard','jungle'].map(role=>{
 const bases=[...NIGHT5_BLOCKS.t4a.cells.filter(c=>c.role===role),...(role==='graveyard'?NIGHT5_BLOCKS.t4b.cells.filter(c=>c.role===role&&c.className==='slinger'):[])];
 const cells=bases.flatMap(c=>(role==='jungle'?['baseline']:['control','candidate']).map(treatment=>{
  const id=c.id.replace('night5','dur23').replace(/baseline$/,treatment);
  return {...c,id,treatment,focusElites:role==='graveyard'&&treatment==='candidate',build:{...c.build,id,skillPath:[...c.build.skillPath],gearItemIds:{...c.build.gearItemIds}}};
 }));
 return [role,{cells,durationMs:role==='jungle'?120000:role==='graveyard'?900000:300000,pilotIds:cells.filter(c=>c.nodeId.endsWith('03')).map(c=>c.id)}];
}));
export function installDurability23Treatment(cell:Night5Cell){
 const saved=[['obsidian-tortoise',2244,4488],['magma-salamander',2904,5808]].map(([type,before,after])=>{
  const d=MONSTER_DATABASE.get(type as string)!;assert.equal(d.stats.hp,before,'Definition drift');
  return {type:type as string,before:before as number,after:after as number,beforeAttack:d.stats.attack,afterAttack:d.stats.attack};
 });
 const changes=cell.role==='volcanic'&&cell.treatment==='candidate'?saved:[];
 for(const c of changes)MONSTER_DATABASE.get(c.type)!.stats.hp=c.after;
 return {changes,restore(){for(const s of saved)MONSTER_DATABASE.get(s.type)!.stats.hp=s.before;}};
}
