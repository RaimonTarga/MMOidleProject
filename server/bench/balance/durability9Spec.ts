import assert from 'node:assert/strict';
import { MONSTER_DATABASE } from '@mmo-idle/shared';
import { NIGHT4_SURVEY } from './night4Spec';
import { SURVEY_CELLS, type SurveyCell } from './ttkSurveySpec';

// Absolute values preserve the old/new comparison after the live patch.
export const DURABILITY9_PATCH: Record<string, { previous: { hp?: number; attack?: number }; selected: { hp?: number; attack?: number } }> = {
  'ancient-wolf': { previous: { hp: 350 }, selected: { hp: 525 } },
  'stampede-bull': { previous: { hp: 330 }, selected: { hp: 495 } },
  'jungle-ape': { previous: { hp: 600 }, selected: { hp: 1200 } },
  silverback: { previous: { hp: 1045 }, selected: { hp: 2090 } },
  'swamp-hydra': { previous: { hp: 340 }, selected: { hp: 680 } },
  'plague-hydra': { previous: { hp: 580 }, selected: { hp: 1160 } },
  'dust-djinn': { previous: { attack: 60 }, selected: { attack: 48 } },
  'dune-stalker': { previous: { hp: 1350 }, selected: { hp: 4050 } },
  'desert-basilisk': { previous: { hp: 1350 }, selected: { hp: 4050 } },
  sandweaver: { previous: { attack: 120 }, selected: { attack: 96 } },
};
const targets: Record<string, string[]> = {
  '2-forest': ['ancient-wolf'], '2-plains': ['stampede-bull'],
  '2-jungle': ['jungle-ape'], '3-jungle': ['silverback'],
  '2-swamp': ['swamp-hydra'], '3-swamp': ['plague-hydra'],
  '2-desert': ['dust-djinn'], '3-desert': ['dune-stalker','desert-basilisk','sandweaver'],
};
export interface Durability9Cell extends SurveyCell { treatment: 'previous' | 'selected' | 'bear-full' | 'bear-soft'; targetTypes: string[]; }
function withAlternates(c: SurveyCell): SurveyCell[] {
  const alts = SURVEY_CELLS.filter(a => a.tier === c.tier && a.role === 'solo' && a.alternate && a.className === c.className);
  return [c, ...alts.map(a => ({ ...c, alternate: true, id: c.id + '-weapon-alt',
    build: { ...c.build, id: c.build.id + '-weapon-alt', gearItemIds: { ...c.build.gearItemIds, weapon: a.build.gearItemIds.weapon } } }))];
}
export const DURABILITY9_ROSTER: Durability9Cell[] = NIGHT4_SURVEY
  .filter(c => targets[`${c.tier}-${c.role}`])
  .flatMap(c => c.tier === 3 && c.role === 'desert' ? withAlternates(c) : [c])
  .flatMap(c => (['previous','selected'] as const).map(treatment => ({ ...c,
    id: c.id.replace('night4-survey','dur9') + '-' + treatment, treatment, targetTypes: targets[`${c.tier}-${c.role}`] })));
export const DURABILITY9_BEAR: Durability9Cell[] = NIGHT4_SURVEY.filter(c => c.role === 'tundra')
  .flatMap(withAlternates).flatMap(c => (['bear-full','bear-soft'] as const).map(treatment => ({ ...c,
    id: c.id.replace('night4-survey','dur9') + '-' + treatment, treatment, targetTypes: ['glacier-bear'] })));

export function assertDurability9Definitions() {
  for (const [type, change] of Object.entries(DURABILITY9_PATCH)) for (const [stat,value] of Object.entries(change.selected))
    assert.equal(MONSTER_DATABASE.get(type)!.stats[stat as 'hp'|'attack'], value, 'Live patch drift: '+type);
  const bear = MONSTER_DATABASE.get('glacier-bear')!;
  assert.equal(bear.stats.hp,1500); assert.equal(bear.stats.attack,185); assert.equal(bear.enemyShield?.shieldPct,0.2);
}
export function installDurability9Treatment(cell: Durability9Cell) {
  const bear = cell.treatment.startsWith('bear-');
  const saved = (bear ? ['glacier-bear'] : Object.keys(DURABILITY9_PATCH)).map(type => {
    const def = MONSTER_DATABASE.get(type)!;
    return { type, stats: { ...def.stats }, shieldPct: def.enemyShield?.shieldPct };
  });
  const changes = saved.map(({type,stats,shieldPct}) => {
    const def = MONSTER_DATABASE.get(type)!;
    if (bear) {
      def.stats.hp = 3750; def.stats.attack = cell.treatment === 'bear-soft' ? 148 : 185;
      def.enemyShield!.shieldPct = 0.08; // 300 authored capacity, before normal node HP scaling.
    } else Object.assign(def.stats, DURABILITY9_PATCH[type][cell.treatment as 'previous'|'selected']);
    return { type, before: stats.hp, after: def.stats.hp, beforeAttack: stats.attack, afterAttack: def.stats.attack,
      beforeShieldPct: shieldPct, afterShieldPct: def.enemyShield?.shieldPct };
  });
  return { changes, restore() { for (const {type,stats,shieldPct} of saved) {
    const def = MONSTER_DATABASE.get(type)!; Object.assign(def.stats,stats);
    if (def.enemyShield && shieldPct !== undefined) def.enemyShield.shieldPct = shieldPct;
  } } };
}
