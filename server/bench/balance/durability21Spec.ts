import {NIGHT5_BLOCKS} from './night5Spec';
export const DURABILITY21_SEEDS=[32003,34019,36007] as const;
export const DURABILITY21_BLOCKS=Object.fromEntries(['tundra','volcanic','trench'].map(role=>{
 const cells=NIGHT5_BLOCKS.t4a.cells.filter(c=>c.role===role).map(c=>{
  const id=c.id.replace('night5-t4a','dur21');
  return {...c,id,build:{...c.build,id,skillPath:[...c.build.skillPath],gearItemIds:{...c.build.gearItemIds}}};
 });
 return [role,{cells,durationMs:300000,pilotIds:cells.filter(c=>c.nodeId.endsWith('03')).map(c=>c.id)}];
}));
