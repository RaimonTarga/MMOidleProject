import assert from 'node:assert/strict';
import { MONSTER_DATABASE } from '@mmo-idle/shared';
import { SURVEY_CELLS } from './ttkSurveySpec';

// Combined confirmation of the selected authored patch. No treatment installer:
// reusing a previous durability overlay would multiply the buffs a second time.
export const DURABILITY5_SEEDS = [173, 947, 2027, 4093, 5579];
export const DURABILITY5_CELLS = SURVEY_CELLS
  .filter(c => c.tier >= 2 && c.role !== 'swarm')
  .map(c => ({ ...c, id: c.id.replace(/^ttk-/, 'dur5-'), treatment: 'selected-patch',
    eliteType: c.role === 'solo'
      ? (c.tier === 2 ? 'cave-troll' : 'cavern-troll')
      : (c.tier === 2 ? 'granite-titan' : 'mountain-colossus'),
  }));

export function assertDurability5Definitions() {
  for (const [id, hp, attack, plating, dr] of [
    ['cave-troll', 1320, 86, 1, 0.264],
    ['cavern-troll', 3780, 124, 2, 0.28],
    ['granite-titan', 1380, 105, 0, 0],
    ['mountain-colossus', 4250, 130, 0, 0],
  ] as const) {
    const stats = MONSTER_DATABASE.get(id)!.stats;
    assert.deepEqual([stats.hp, stats.attack, stats.plating, stats.damageReduction],
      [hp, attack, plating, dr], `Selected patch drift: ${id}`);
  }
  const eagle = MONSTER_DATABASE.get('stone-eagle')!;
  assert.equal(eagle.stats.attack, 75);
  assert(eagle.engageSequence?.kind === 'cast-charge-strike');
  assert.equal(eagle.engageSequence.damageMultiplier, 1.25);
}
