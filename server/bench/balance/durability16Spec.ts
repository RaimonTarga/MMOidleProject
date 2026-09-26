import assert from 'node:assert/strict';
import { MONSTER_DATABASE } from '@mmo-idle/shared';
import { DURABILITY13_SWARM } from './durability13Spec';
import type { SurveyCell } from './ttkSurveySpec';

export const DURABILITY16_SEEDS = [3911, 6151, 8089] as const;
export const DURABILITY16_TREATMENTS = ['anchor150', 'tortoise80', 'salamander80', 'both80'] as const;
export interface Durability16Cell extends SurveyCell {
  treatment: typeof DURABILITY16_TREATMENTS[number];
  targetTypes: string[];
}

// Fix the technique across all stat arms. This is a mob trial, not ability tuning.
export const DURABILITY16_CELLS: Durability16Cell[] = DURABILITY13_SWARM
  .filter(c => c.technique === 'sweep' && ['conduit', 'apprentice', 'slinger'].includes(c.className))
  .flatMap(c => DURABILITY16_TREATMENTS.map(treatment => ({
    ...c, id: c.id.replace('dur13', 'dur16') + '-' + treatment,
    treatment, targetTypes: ['magma-brute', 'ash-slinger'],
  })));

export function assertDurability16Definitions(): void {
  const tortoise = MONSTER_DATABASE.get('magma-brute')!;
  const salamander = MONSTER_DATABASE.get('ash-slinger')!;
  // REBASED 2026-09-26: magma-brute 116 -> 90, ash-slinger 70 -> 50 (volcanic T3 pass).
  // REBASED 2026-09-25: ash-slinger 84 -> 70 (Volcano area nerf) is authored source.
  // REBASED 2026-09-18: magma-brute 2000/145 -> 3000/116 and ash-slinger 105 -> 84
  // are authored source now, so every overlay below writes the live value and is
  // inert. The historical experiment stays reproducible at its own frozen revision.
  assert.equal(tortoise.stats.hp, 3000);
  assert.equal(tortoise.stats.attack, 90);
  assert.equal(tortoise.stats.plating, 4);
  assert.equal(salamander.stats.hp, 1330);
  assert.equal(salamander.stats.attack, 50);
  assert.equal(salamander.stats.plating, 2);
}

/** Process-local overlays only; restore the exact baseline after every case. */
export function installDurability16Treatment(cell: Durability16Cell) {
  assertDurability16Definitions();
  const saved = cell.targetTypes.map(type => ({type, stats: {...MONSTER_DATABASE.get(type)!.stats}}));
  MONSTER_DATABASE.get('magma-brute')!.stats.hp = 3000;
  if (cell.treatment === 'tortoise80' || cell.treatment === 'both80')
    MONSTER_DATABASE.get('magma-brute')!.stats.attack = 90;
  if (cell.treatment === 'salamander80' || cell.treatment === 'both80')
    MONSTER_DATABASE.get('ash-slinger')!.stats.attack = 50;
  return {
    changes: saved.map(({type, stats}) => ({type, before: stats.hp,
      after: MONSTER_DATABASE.get(type)!.stats.hp, beforeAttack: stats.attack,
      afterAttack: MONSTER_DATABASE.get(type)!.stats.attack})),
    restore() { for (const {type, stats} of saved) Object.assign(MONSTER_DATABASE.get(type)!.stats, stats); },
  };
}

