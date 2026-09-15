import assert from 'node:assert/strict';
import { MONSTER_DATABASE } from '@mmo-idle/shared';
import { SURVEY_CELLS, type SurveyCell } from './ttkSurveySpec';

export type Durability2Cell = SurveyCell & {
  treatment: string; eliteType: string; hpFactor: number; attackFactor: number;
};
export const DURABILITY2_CELLS: Durability2Cell[] = SURVEY_CELLS
  .filter(c => c.tier >= 2 && c.role !== 'swarm')
  .flatMap(c => {
    const eliteType = c.role === 'solo'
      ? (c.tier === 2 ? 'cave-troll' : 'cavern-troll')
      : (c.tier === 2 ? 'granite-titan' : 'mountain-colossus');
    const low = c.tier === 2 ? 2 : 3;
    const high = c.tier === 2 ? 3 : 5;
    return [
      {treatment:'control',hpFactor:1,attackFactor:1},
      {treatment:'hp-low',hpFactor:low,attackFactor:1},
      {treatment:'hp-high',hpFactor:high,attackFactor:1},
      {treatment:'hp-low-soft',hpFactor:low,attackFactor:0.75},
      {treatment:'hp-high-soft',hpFactor:high,attackFactor:0.75},
    ].map(t => ({...c, ...t, eliteType, id:`dur2-${c.id}-${t.treatment}`}));
  });

// Exactly one elite definition per observation. Ordinary companions, defenses,
// cast multipliers and cadence stay untouched. Attack scaling is NOT a universal
// final-damage multiplier: flat damage mechanics would retain their own values.
export function installDurability2Treatment(cell: Durability2Cell) {
  const def = MONSTER_DATABASE.get(cell.eliteType);
  assert(def,`Unknown elite ${cell.eliteType}`);
  const before = def.stats.hp, beforeAttack = def.stats.attack;
  def.stats.hp = Math.round(before * cell.hpFactor);
  def.stats.attack = Math.round(beforeAttack * cell.attackFactor);
  const changes = cell.treatment === 'control' ? [] : [{type:cell.eliteType,
    before, after:def.stats.hp, beforeAttack, afterAttack:def.stats.attack}];
  return {changes,restore() {def.stats.hp=before;def.stats.attack=beforeAttack;}};
}
