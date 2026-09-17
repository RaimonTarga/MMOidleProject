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
 if(cell.treatment==='candidate'){
  const type=cell.role==='mountain'?'granite-mammoth':'dune-basilisk';
  const d=MONSTER_DATABASE.get(type)!;
  d.stats.hp*=2;
  if(d.lowHealthWard)d.lowHealthWard.wardPct/=2;
  const change=overlay.changes.find(c=>c.type===type)!;
  change.after=d.stats.hp;
 }
 return overlay;
}
