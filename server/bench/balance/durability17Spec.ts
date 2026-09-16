import assert from 'node:assert/strict';
import { MONSTER_DATABASE } from '@mmo-idle/shared';
import { NIGHT4_SURVEY } from './night4Spec';

export const DURABILITY17_SEEDS = [9029,10427,12007] as const;
export const DURABILITY17_TREATMENTS = ['control','adults2','adults3','adults3-pressure80'] as const;
export const DURABILITY17_CELLS = NIGHT4_SURVEY.filter(c=>c.tier===2&&c.role==='forest')
  .flatMap(c=>DURABILITY17_TREATMENTS.map(treatment=>({...c,
    id:c.id.replace('night4-survey','dur17')+'-'+treatment,technique:'sweep' as const,treatment,
    targetTypes:['ancient-wolf','ironwood-golem']})));
export type Durability17Cell = typeof DURABILITY17_CELLS[number];
export function assertDurability17Definitions() {
  for(const [type,hp,attack] of [['ancient-wolf',525,34],['ironwood-golem',315,31],['dire-whelp',155,14],['canopy-sprite',300,31]] as const) {
    const s=MONSTER_DATABASE.get(type)!.stats;
    assert.equal(s.hp,hp);assert.equal(s.attack,attack);assert.equal(s.plating,0);assert.equal(s.damageReduction,0);
  }
}
export function installDurability17Treatment(cell:Durability17Cell) {
  assertDurability17Definitions();
  const saved=cell.targetTypes.map(type=>({type,stats:{...MONSTER_DATABASE.get(type)!.stats}}));
  for(const {type,stats} of saved) {
    const s=MONSTER_DATABASE.get(type)!.stats;
    s.hp=stats.hp*(cell.treatment==='control'?1:cell.treatment==='adults2'?2:3);
    if(cell.treatment==='adults3-pressure80') s.attack=Math.round(stats.attack*0.8);
  }
  return {changes:saved.map(({type,stats})=>({type,before:stats.hp,after:MONSTER_DATABASE.get(type)!.stats.hp,
    beforeAttack:stats.attack,afterAttack:MONSTER_DATABASE.get(type)!.stats.attack})),
    restore(){for(const {type,stats} of saved) Object.assign(MONSTER_DATABASE.get(type)!.stats,stats);}};
}
