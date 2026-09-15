import assert from 'node:assert/strict';
import { MONSTER_DATABASE, NODE_BIOMES } from '@mmo-idle/shared';
import { SURVEY_CELLS, type SurveyCell } from './ttkSurveySpec';
import { DURABILITY8_CELLS } from './durability8Spec';

export const NIGHT4_SURVEY: SurveyCell[] = Object.keys(NODE_BIOMES)
  .filter(id => /^node-t[23]-.+-(03|05)$/.test(id)).sort().flatMap(nodeId => {
    const tier = Number(nodeId.split('-')[1].slice(1));
    const group = nodeId.split('-')[2];
    return SURVEY_CELLS.filter(c => c.tier === tier && c.role === 'solo' && !c.alternate).map(c => {
      const id = `night4-survey-${nodeId}-${c.className}`;
      return { ...c, id, nodeId, role: group, build: { ...c.build, id,
        gearItemIds: { ...c.build.gearItemIds, armor: `${group}-vest-t${tier}`, recovery: `${group}-charm-t${tier}` } } };
    });
  });

export const NIGHT4_AOE = NIGHT4_SURVEY
  .filter(c => (c.tier === 2 && ['plains','jungle'].includes(c.role)) ||
    (c.tier === 3 && ['jungle','volcanic'].includes(c.role)))
  .flatMap(c => (['sweep','slam'] as const).map(technique => ({
    ...c, id: c.id.replace('survey', 'aoe') + '-' + technique, technique,
  })));

export const NIGHT4_FOLLOWUP = DURABILITY8_CELLS.filter(c => c.treatment === 'control')
  .flatMap(c => (c.role === 'desert'
    ? ['hp2', 'hp2-dealer80', 'hp3-dealer80']
    : ['hp1.5-fixed', 'hp2-fixed', 'hp2.5-fixed']).map(treatment => ({
      ...c, id: c.id.replace(/^dur8-/, 'night4-followup-').replace(/-control$/, '-' + treatment), treatment,
    })));
export type Night4Followup = typeof NIGHT4_FOLLOWUP[number];

export function installNight4Treatment(cell: Night4Followup) {
  const types = cell.role === 'desert' ? [...cell.targetTypes, 'sandweaver'] : cell.targetTypes;
  const saved = types.map(type => {
    const def = MONSTER_DATABASE.get(type)!;
    return { type, stats: { ...def.stats }, shieldPct: def.enemyShield?.shieldPct };
  });
  const changes = saved.map(({ type, stats, shieldPct }) => {
    const def = MONSTER_DATABASE.get(type)!;
    if (type === 'sandweaver') {
      if (cell.treatment.endsWith('dealer80')) def.stats.attack = Math.round(stats.attack * 0.8);
    } else {
      const factor = cell.role === 'desert' ? (cell.treatment.startsWith('hp3') ? 3 : 2)
        : cell.treatment.startsWith('hp1.5') ? 1.5 : cell.treatment.startsWith('hp2.5') ? 2.5 : 2;
      def.stats.hp = Math.round(stats.hp * factor);
      if (cell.role === 'tundra') {
        assert(def.enemyShield && shieldPct !== undefined);
        def.enemyShield.shieldPct = shieldPct * stats.hp / def.stats.hp;
      }
    }
    return { type, before: stats.hp, after: def.stats.hp, beforeAttack: stats.attack,
      afterAttack: def.stats.attack, beforeShieldPct: shieldPct, afterShieldPct: def.enemyShield?.shieldPct };
  });
  return { changes, restore() {
    for (const { type, stats, shieldPct } of saved) {
      const def = MONSTER_DATABASE.get(type)!;
      Object.assign(def.stats, stats);
      if (def.enemyShield && shieldPct !== undefined) def.enemyShield.shieldPct = shieldPct;
    }
  } };
}
