import assert from 'node:assert/strict';
import {MONSTER_DATABASE} from '@mmo-idle/shared';
import {NIGHT5_BLOCKS,type Night5Cell} from './night5Spec';
export const DURABILITY24_SEEDS=[50021,52009,54001] as const;
export const DURABILITY24_HP=[
 ['gravewright',2851,5702],['bone-crawler',2059,1235],
 ['plague-hound',3168,1901],['carrion-vulture',2693,1616],['plague-rat',1584,950],
] as const;
const bases=[...NIGHT5_BLOCKS.t4a.cells.filter(c=>c.role==='graveyard'),
 ...NIGHT5_BLOCKS.t4b.cells.filter(c=>c.role==='graveyard'&&c.className==='slinger')];
const cells:Night5Cell[]=bases.flatMap(c=>['control-normal','control-focus','redistributed-normal','redistributed-focus'].map(treatment=>{
 const id=c.id.replace('night5','dur24').replace(/baseline$/,treatment);
 return {...c,id,treatment,focusElites:treatment.endsWith('-focus'),build:{...c.build,id,skillPath:[...c.build.skillPath],gearItemIds:{...c.build.gearItemIds}}};
}));
export const DURABILITY24_BLOCKS={graveyard:{cells,durationMs:900000,pilotIds:cells.filter(c=>c.nodeId.endsWith('03')).map(c=>c.id)}};
export function installDurability24Treatment(cell:Night5Cell){
 const saved=DURABILITY24_HP.map(([type,before,after])=>{
  const d=MONSTER_DATABASE.get(type)!;assert.equal(d.stats.hp,before,'Definition drift');
  return {type,before,after,beforeAttack:d.stats.attack,afterAttack:d.stats.attack};
 });
 const changes=cell.treatment.startsWith('redistributed-')?saved:[];
 for(const c of changes)MONSTER_DATABASE.get(c.type)!.stats.hp=c.after;
 return {changes,restore(){for(const s of saved)MONSTER_DATABASE.get(s.type)!.stats.hp=s.before;}};
}
