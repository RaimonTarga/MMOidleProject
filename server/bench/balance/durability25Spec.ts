import {NIGHT5_BLOCKS,type Night5Cell} from './night5Spec';
import {DURABILITY20_CELLS,installDurability20Treatment} from './durability20Spec';
import {installDurability22Treatment} from './durability22Spec';
export const DURABILITY25_SEEDS=[56003,58013,60013] as const;
export const DURABILITY25_BLOCKS=Object.fromEntries(['mountain','desert'].map(role=>{
 const bases=[...DURABILITY20_CELLS.filter(c=>c.role===role),...NIGHT5_BLOCKS.t4a.cells.filter(c=>c.role===role)];
 const cells:Night5Cell[]=bases.map(c=>{
  const id=`dur25-t${c.tier}-${role}-${c.nodeId.slice(-2)}-${c.className}-selected`;
  const gearItemIds={...c.build.gearItemIds};
  // Keep the weapon strategy consistent across the ladder; tier unlocks still apply.
  if(c.tier<4&&c.className==='conduit')gearItemIds.weapon=c.tier===2?'jungle-stinger-rapier':'jungle-venomthorn-rapier';
  if(c.tier<4&&c.className==='spirit')gearItemIds.weapon=c.tier===2?'gale-needle':'volcanic-cinderlash';
  return {...c,id,treatment:'selected',focusElites:false,targetTypes:[],build:{...c.build,id,skillPath:[...c.build.skillPath],gearItemIds}};
 });
 return [role,{cells,durationMs:600000,pilotIds:cells.filter(c=>c.nodeId.endsWith('03')).map(c=>c.id)}];
}));
export function installDurability25Treatment(cell:Night5Cell){
 if(cell.tier===4)return installDurability22Treatment({...cell,treatment:'candidate'});
 return installDurability20Treatment({...cell,treatment:'selected',technique:'sweep',stance:cell.stance??'offensive-stance'});
}
