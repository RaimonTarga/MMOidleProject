import assert from 'node:assert/strict';
import { MONSTER_DATABASE } from '@mmo-idle/shared';
import { DURABILITY13_SWARM } from './durability13Spec';
import type { SurveyCell } from './ttkSurveySpec';

export const DURABILITY15_SEEDS = [3911, 6151, 8089] as const;
export const DURABILITY15_TREATMENTS = ['control', 'pressure80', 'anchor150', 'anchor150-pressure80'] as const;
export interface Durability15Cell extends SurveyCell {
  treatment: typeof DURABILITY15_TREATMENTS[number];
  targetTypes: string[];
}

// Fix the technique across all stat arms. This is a mob trial, not ability tuning.
export const DURABILITY15_CELLS: Durability15Cell[] = DURABILITY13_SWARM
  .filter(c => c.technique === 'sweep')
  .flatMap(c => DURABILITY15_TREATMENTS.map(treatment => ({
    ...c, id: c.id.replace('dur13', 'dur15') + '-' + treatment,
    treatment, targetTypes: ['magma-brute', 'ash-slinger'],
  })));

export function assertDurability15Definitions(): void {
  // REBASED 2026-09-25: ash-slinger 84 -> 70 (Volcano area nerf) is authored source.
  // REBASED 2026-09-18: magma-brute 2000/145 -> 3000/116 and ash-slinger 105 -> 84
  // are now authored source, so every overlay below writes the value already live
  // and is inert. The historical experiment stays reproducible at its own revision.
  const tortoise = MONSTER_DATABASE.get('magma-brute')!;
  const salamander = MONSTER_DATABASE.get('ash-slinger')!;
  assert.equal(tortoise.stats.hp, 3000);
  assert.equal(tortoise.stats.attack, 116);
  assert.equal(tortoise.stats.plating, 4);
  assert.equal(salamander.stats.hp, 1330);
  assert.equal(salamander.stats.attack, 70);
  assert.equal(salamander.stats.plating, 2);
}

/** Process-local overlays only; restore the exact baseline after every case. */
export function installDurability15Treatment(cell: Durability15Cell) {
  assertDurability15Definitions();
  const saved = cell.targetTypes.map(type => ({type, stats: {...MONSTER_DATABASE.get(type)!.stats}}));
  const pressure = cell.treatment === 'pressure80' || cell.treatment === 'anchor150-pressure80';
  const durable = cell.treatment === 'anchor150' || cell.treatment === 'anchor150-pressure80';
  if (durable) MONSTER_DATABASE.get('magma-brute')!.stats.hp = 3000;
  if (pressure) {
    MONSTER_DATABASE.get('magma-brute')!.stats.attack = 116;
    MONSTER_DATABASE.get('ash-slinger')!.stats.attack = 70;
  }
  return {
    changes: saved.map(({type, stats}) => ({type, before: stats.hp,
      after: MONSTER_DATABASE.get(type)!.stats.hp, beforeAttack: stats.attack,
      afterAttack: MONSTER_DATABASE.get(type)!.stats.attack})),
    restore() { for (const {type, stats} of saved) Object.assign(MONSTER_DATABASE.get(type)!.stats, stats); },
  };
}
