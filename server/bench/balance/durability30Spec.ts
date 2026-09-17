import {MONSTER_DATABASE} from '@mmo-idle/shared';
import {DURABILITY22_BLOCKS,installDurability22Treatment} from './durability22Spec';
import {DURABILITY23_BLOCKS} from './durability23Spec';
import type {Night5Cell} from './night5Spec';
export const DURABILITY30_SEEDS=[86011,88001,90001] as const;
export const DURABILITY30_JUNGLE_SEEDS=[44017,46021,48017] as const;
const trench=DURABILITY22_BLOCKS.trench.cells.map(c=>{
 const id=c.id.replace('dur22','dur30');return {...c,id,build:{...c.build,id}};
});
const jungle=DURABILITY23_BLOCKS.jungle.cells.filter(c=>c.nodeId.endsWith('03')?['apprentice','slinger'].includes(c.className):['apprentice','spirit'].includes(c.className)).map(c=>{
 const id=c.id.replace('dur23','dur30');return {...c,id,build:{...c.build,id}};
});
export const DURABILITY30_BLOCKS=Object.fromEntries([['trench',trench,600000],['jungle',jungle,120000]].map(([name,raw,ms])=>{
 const cells=raw as Night5Cell[];return [name,{cells,durationMs:ms as number,pilotIds:cells.filter(c=>c.nodeId.endsWith('03')).map(c=>c.id)}];
}));
export function installDurability30Treatment(cell:Night5Cell){
 if(cell.role==='jungle')return {changes:[] as {type:string;before:number;after:number;beforeAttack:number;afterAttack:number}[],restore(){}};
 const base=installDurability22Treatment({...cell,treatment:'candidate'});
 if(cell.treatment==='candidate'){
  MONSTER_DATABASE.get('hadal-stalker')!.stats.hp=21000;
  base.changes.find(c=>c.type==='hadal-stalker')!.after=21000;
 }
 return base;
}
