import assert from 'node:assert/strict';
import {MONSTER_DATABASE} from '@mmo-idle/shared';
import {DURABILITY25_BLOCKS} from './durability25Spec';
import type {Night5Cell} from './night5Spec';
export const DURABILITY27_SEEDS=[68023,70001,72019] as const;
export const DURABILITY27_BLOCKS=Object.fromEntries(['mountain','desert'].map(role=>{
 const cells=DURABILITY25_BLOCKS[role].cells.filter(c=>c.tier===2).flatMap(c=>['control','candidate'].map(treatment=>{
  const id=c.id.replace('dur25','dur27').replace(/selected$/,treatment);
  return {...c,id,treatment,build:{...c.build,id,skillPath:[...c.build.skillPath],gearItemIds:{...c.build.gearItemIds}}};
 }));
 return [role,{cells,durationMs:600000,pilotIds:cells.filter(c=>c.nodeId.endsWith('03')).map(c=>c.id)}];
}));
export function installDurability27Treatment(cell:Night5Cell){
 const ids=cell.role==='mountain'?['granite-titan','stone-eagle','peak-archer']:['sand-scorpion','stone-basilisk'];
 const saved=ids.map(type=>{const d=MONSTER_DATABASE.get(type);assert(d,`Missing ${type}`);return {type,stats:{...d.stats}};});
 // RETIRED 2026-09-18: both treatments are authored source now -- T2 Mountain
 // attack (granite-titan 84 -> 54 across D27+D29, stone-eagle 75 -> 60, peak-archer
 // 90 -> 72) and T2 Desert HP (sand-scorpion and stone-basilisk 780 -> 1365).
 // Re-applying x0.8 / x1.75 would compound onto the adopted values. The overlay
 // now only REPORTS them; the historical experiment stays reproducible at its own
 // frozen revision.
 const changes=cell.treatment==='candidate'?saved.map(({type,stats})=>{
  const d=MONSTER_DATABASE.get(type)!;
  return {type,before:stats.hp,after:d.stats.hp,beforeAttack:stats.attack,afterAttack:d.stats.attack};
 }):[];
 return {changes,restore(){for(const {type,stats} of saved)Object.assign(MONSTER_DATABASE.get(type)!.stats,stats);}};
}
