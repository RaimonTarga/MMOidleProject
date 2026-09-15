import assert from 'node:assert/strict';
import { MONSTER_DATABASE } from '@mmo-idle/shared';
import { DURABILITY5_CELLS } from './durability5Spec';

export const DURABILITY6_HP = {
  'cave-troll': [1320, 1584],
  'cavern-troll': [3780, 4725],
  'granite-titan': [1380, 1656],
  'mountain-colossus': [4250, 4675],
} as const;
export const DURABILITY6_CELLS = DURABILITY5_CELLS.flatMap(c =>
  (['previous-hp', 'selected-hp'] as const).map(treatment => ({
    ...c, id: c.id.replace(/^dur5-/, 'dur6-') + '-' + treatment, treatment,
    hp: DURABILITY6_HP[c.eliteType as keyof typeof DURABILITY6_HP][treatment === 'previous-hp' ? 0 : 1],
  })));
export type Durability6Cell = typeof DURABILITY6_CELLS[number];

export function assertDurability6Definitions() {
  for (const [id, values] of Object.entries(DURABILITY6_HP)) {
    assert.equal(MONSTER_DATABASE.get(id)!.stats.hp, values[1], `Selected HP drift: ${id}`);
  }
}

// Absolute assignment, never multiply an already-patched definition. Normal
// ecology and max-HP-scaled wards see the same treatment on every repopulation.
export function installDurability6Treatment(cell: Durability6Cell) {
  assertDurability6Definitions();
  const stats = MONSTER_DATABASE.get(cell.eliteType)!.stats;
  const before = stats.hp;
  stats.hp = cell.hp;
  return { changes: [{ type: cell.eliteType, before, after: stats.hp }],
    restore() { stats.hp = before; } };
}
