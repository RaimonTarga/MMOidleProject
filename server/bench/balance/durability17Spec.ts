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
    // REBASED 2026-09-18: ancient-wolf 525/34 -> 1575/22 (the /22/ is Durability19's
  // pressure value) and ironwood-golem 315/31 -> 945/25 are now authored source.
  for(const [type,hp,attack] of [['ancient-wolf',1575,22],['ironwood-golem',945,25],['dire-whelp',155,14],['canopy-sprite',300,31]] as const) {
    const s=MONSTER_DATABASE.get(type)!.stats;
    assert.equal(s.hp,hp);assert.equal(s.attack,attack);assert.equal(s.plating,0);assert.equal(s.damageReduction,0);
  }
}
export function installDurability17Treatment(cell:Durability17Cell) {
  assertDurability17Definitions();
  const saved=cell.targetTypes.map(type=>({type,stats:{...MONSTER_DATABASE.get(type)!.stats}}));
  // RETIRED 2026-09-18: the adults2/adults3 HP multipliers and the 0.8 pressure cut
  // are authored source now, so re-applying them here would MULTIPLY the adopted
  // values (x3 on top of 1575, 0.8 on top of 22). The overlay is a deliberate no-op;
  // the historical experiment stays reproducible at its own frozen revision.
  void cell;
  return {changes:saved.map(({type,stats})=>({type,before:stats.hp,after:MONSTER_DATABASE.get(type)!.stats.hp,
    beforeAttack:stats.attack,afterAttack:MONSTER_DATABASE.get(type)!.stats.attack})),
    restore(){for(const {type,stats} of saved) Object.assign(MONSTER_DATABASE.get(type)!.stats,stats);}};
}
