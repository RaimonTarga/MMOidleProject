import { getMaxUpgrade } from './itemUpgrades';
import { normalizeEquipment } from '../items';
import { checkEvolve, requiredPlusFor } from './evolution';
import type { Recipe } from '../data/recipes/types';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const oldSave = normalizeEquipment({
  weapon: 'old-weapon',
  armor: null,
  recovery: null,
  mobility: null,
  core: null,
});
assert(oldSave.relic === null, 'pre-relic equipment hydrates with relic: null');
assert(oldSave.weapon === 'old-weapon', 'normalization preserves old slots');

assert(getMaxUpgrade({
  id: 'test-relic',
  name: 'Test Relic',
  slot: 'relic',
  tier: 4,
  statModifiers: {},
}) === 0, 'relics stay off the +N upgrade track');

const evolvedRelic: Recipe = {
  id: 'test-relic-rank-2',
  name: 'Test Relic Rank 2',
  recipeGroup: 'forest',
  requiredBiomeLevel: 18,
  slot: 'relic',
  cost: {},
  stats: {},
  tier: 5,
  lineageId: 'test-relic',
  evolvesFrom: 'test-relic',
};
assert(requiredPlusFor(evolvedRelic) === 0, 'relic evolution consumes a +0 predecessor');
assert(checkEvolve({
  recipe: evolvedRelic,
  inventory: ['test-relic'],
  itemUpgrades: {},
  essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
}).ok, 'relic predecessor evolves without +N upgrades');

console.log('relicEquipment: ok');
