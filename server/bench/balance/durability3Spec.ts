import { MONSTER_DATABASE } from '@mmo-idle/shared';
import { DURABILITY2_CELLS } from './durability2Spec';

export const DURABILITY3_CELLS = DURABILITY2_CELLS.filter(c=>c.treatment==='control').flatMap(c=>{
  const referenceHp=c.tier===2?3:5;
  const attackFactor=c.tier===2&&c.role==='solo'?0.75:1;
  const arms=['reference','hp-trim','plating','dr',...(c.tier===2&&c.role==='small-group'?['eagle-soft','thrower-soft','both-soft']:[])];
  return arms.map(treatment=>({...c,id:c.id.replace(/^dur2-/,'dur3-').replace(/-control$/,'-'+treatment),treatment,
    hpFactor:referenceHp*(['hp-trim','plating','dr'].includes(treatment)?0.8:1),attackFactor}));
});
export type Durability3Cell=typeof DURABILITY3_CELLS[number];
export function installDurability3Treatment(cell:Durability3Cell) {
  const ids=[cell.eliteType,...(['eagle-soft','both-soft'].includes(cell.treatment)?['stone-eagle']:[]),...(['thrower-soft','both-soft'].includes(cell.treatment)?['peak-archer']:[])];
  const saved=ids.map(type=>({type,stats:{...MONSTER_DATABASE.get(type)!.stats}}));
  const changes=saved.map(({type,stats})=>{
    const current=MONSTER_DATABASE.get(type)!.stats;
    const elite=type===cell.eliteType;
    current.hp=Math.round(stats.hp*(elite?cell.hpFactor:1));
    current.attack=Math.round(stats.attack*(elite?cell.attackFactor:0.75));
    if(elite&&cell.treatment==='plating')current.plating=stats.plating+(cell.tier===2?8:16);
    if(elite&&cell.treatment==='dr')current.damageReduction=1-(1-stats.damageReduction)*0.8;
    return {type,before:stats.hp,after:current.hp,beforeAttack:stats.attack,afterAttack:current.attack,
      beforePlating:stats.plating,afterPlating:current.plating,beforeDr:stats.damageReduction,afterDr:current.damageReduction};
  });
  return {changes,restore(){for(const {type,stats} of saved)Object.assign(MONSTER_DATABASE.get(type)!.stats,stats);}};
}
