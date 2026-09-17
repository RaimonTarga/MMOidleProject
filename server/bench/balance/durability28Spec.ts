import {DURABILITY27_BLOCKS,installDurability27Treatment} from './durability27Spec';
import {DURABILITY26_BLOCKS,installDurability26Treatment} from './durability26Spec';
import type {Night5Cell} from './night5Spec';
export const DURABILITY28_SEEDS=[74017,76001,78007] as const;
export const DURABILITY28_BLOCKS=Object.fromEntries(['mountain2','desert2','mountain4'].map(block=>{
 const role=block.startsWith('mountain')?'mountain':'desert';
 const source=block.endsWith('4')?DURABILITY26_BLOCKS[role]:DURABILITY27_BLOCKS[role];
 const cells=source.cells.filter(c=>c.treatment==='candidate'&&['striker','squire'].includes(c.className)).flatMap(c=>['offensive','defensive'].map(treatment=>{
  const id=`dur28-${block}-${c.nodeId.slice(-2)}-${c.className}-${treatment}`;
  return {...c,id,treatment,stance:`${treatment}-stance`,build:{...c.build,id,skillPath:[...c.build.skillPath],gearItemIds:{...c.build.gearItemIds}}};
 }));
 return [block,{cells,durationMs:600000,pilotIds:cells.filter(c=>c.nodeId.endsWith('03')).map(c=>c.id)}];
}));
export function installDurability28Treatment(cell:Night5Cell){
 return cell.tier===4?installDurability26Treatment({...cell,treatment:'candidate'}):installDurability27Treatment({...cell,treatment:'candidate'});
}
