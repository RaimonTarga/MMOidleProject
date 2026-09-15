import assert from 'node:assert/strict';
import { MONSTER_DATABASE } from '@mmo-idle/shared';
import { DURABILITY5_CELLS } from './durability5Spec';

export const DURABILITY7_SEEDS = [173, 947, 2027, 4093, 5579];
export const DURABILITY7_CELLS = DURABILITY5_CELLS
  .filter(c => c.tier === 2 && c.role === 'small-group')
  .flatMap(c => (['control', 'eagle-soft', 'titan-soft'] as const).map(treatment => ({
    ...c, id: c.id.replace(/^dur5-/, 'dur7-') + '-' + treatment, treatment,
    eagleAttack: treatment === 'eagle-soft' ? 60 : 75,
    titanAttack: treatment === 'titan-soft' ? 84 : 105,
  })));
export type Durability7Cell = typeof DURABILITY7_CELLS[number];

export function assertDurability7Definitions() {
  const titan = MONSTER_DATABASE.get('granite-titan')!;
  const eagle = MONSTER_DATABASE.get('stone-eagle')!;
  assert.deepEqual([titan.stats.hp, titan.stats.attack, titan.stats.plating, titan.stats.damageReduction],
    [1656, 105, 0, 0], 'T2 Mountain selected durability/control drift');
  assert.equal(eagle.stats.attack, 75);
  assert(eagle.engageSequence?.kind === 'cast-charge-strike');
  assert.equal(eagle.engageSequence.damageMultiplier, 1.25);
}

// Only one attack value changes per treatment, including all repopulations.
// A base-attack cut also reduces attack-derived specials (dive or slam).
export function installDurability7Treatment(cell: Durability7Cell) {
  assertDurability7Definitions();
  const ids = cell.treatment === 'control' ? [] :
    [cell.treatment === 'eagle-soft' ? 'stone-eagle' : 'granite-titan'];
  const changes = ids.map(type => {
    const stats = MONSTER_DATABASE.get(type)!.stats;
    const beforeAttack = stats.attack;
    stats.attack = type === 'stone-eagle' ? cell.eagleAttack : cell.titanAttack;
    return { type, before: stats.hp, after: stats.hp, beforeAttack, afterAttack: stats.attack };
  });
  return { changes, restore() {
    for (const change of changes) MONSTER_DATABASE.get(change.type)!.stats.attack = change.beforeAttack;
  } };
}
