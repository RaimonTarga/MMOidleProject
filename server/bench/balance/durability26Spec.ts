import {MONSTER_DATABASE} from '@mmo-idle/shared';
import {DURABILITY25_BLOCKS} from './durability25Spec';
import {installDurability22Treatment} from './durability22Spec';
import type {Night5Cell} from './night5Spec';
export const DURABILITY26_SEEDS=[62003,64007,66029] as const;
export const DURABILITY26_BLOCKS=Object.fromEntries(['mountain','desert'].map(role=>{
 const cells=DURABILITY25_BLOCKS[role].cells.filter(c=>c.tier===4).flatMap(c=>['control','candidate'].map(treatment=>{
  const id=c.id.replace('dur25','dur26').replace(/selected$/,treatment);
  return {...c,id,treatment,build:{...c.build,id,skillPath:[...c.build.skillPath],gearItemIds:{...c.build.gearItemIds}}};
 }));
 return [role,{cells,durationMs:600000,pilotIds:cells.filter(c=>c.nodeId.endsWith('03')).map(c=>c.id)}];
}));
export function installDurability26Treatment(cell:Night5Cell){
 const overlay=installDurability22Treatment({...cell,treatment:'candidate'});
 // RETIRED 2026-09-18: the second doubling (granite-mammoth -> 13800,
 // dune-basilisk -> 9006) and the paired ward halving are authored source now and
 // are already carried by the rebased Durability22 table. Doing them again here
 // would reach 27600 / 18012 and halve the ward a third time. Deliberate no-op;
 // the historical experiment stays reproducible at its own frozen revision.
 void cell;
 return overlay;
}
