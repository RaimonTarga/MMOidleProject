import assert from 'node:assert/strict';
import {
  ABILITY_RECIPE_DATABASE,
  RECIPE_DATABASE,
  WORLD_NODE_LIST,
  type CombatArchetype,
} from '@mmo-idle/shared';
import {
  buildMakeEntries,
  unlockedMakeKinds,
  type MakeSources,
} from '../../client/src/ui/crafting/makeEntries';
import { isNodeCharted } from '../../client/src/ui/map/constants';

// ── Crafting rail: a category appears when its first recipe unlocks ──────────

const fresh: MakeSources = {
  unlockedRecipeIds: [],
  ownedGearIds: new Set(),
  equippedGearIds: new Set(),
  knownAbilities: [],
  knownStances: [],
  knownRites: [],
  ownedRunes: [],
  biomeLevel: {},
  bossesCleared: [],
  isTestRoom: false,
  combatArchetype: 'cadence' as CombatArchetype,
};

const none = unlockedMakeKinds(fresh);
for (const kind of ['core', 'relic', 'stance', 'rite'] as const) {
  assert.ok(!none.has(kind), `${kind} must stay hidden before any of its recipes unlock`);
}

// Gear follows the server's unlocked-recipe list.
const weapon = [...RECIPE_DATABASE.values()].find((recipe) => recipe.slot === 'weapon' && recipe.tier === 1);
assert.ok(weapon, 'fixture: a T1 weapon recipe');
const withWeapon = { ...fresh, unlockedRecipeIds: [weapon.id] };
assert.ok(unlockedMakeKinds(withWeapon).has('weapon'));

// Crafting everything in a category removes its entries but never the category.
const crafted = { ...withWeapon, ownedGearIds: new Set([weapon.id]) };
assert.ok(!buildMakeEntries(crafted).some((entry) => entry.key === `gear:${weapon.id}`));
assert.ok(unlockedMakeKinds(crafted).has('weapon'), 'a crafted-out category stays on the rail');

// Learnable kinds follow their biome-level gate.
const technique = [...ABILITY_RECIPE_DATABASE.values()]
  .filter((recipe) => recipe.recipeGroup && (recipe.requiredBiomeLevel ?? 0) > 0 && !recipe.requiredBossClear)
  .sort((a, b) => (a.requiredBiomeLevel ?? 0) - (b.requiredBiomeLevel ?? 0))[0];
assert.ok(technique?.recipeGroup, 'fixture: a level-gated technique recipe');
if (!none.has('technique')) {
  const below = { ...fresh, biomeLevel: { [technique.recipeGroup]: (technique.requiredBiomeLevel ?? 1) - 1 } };
  const at = { ...fresh, biomeLevel: { [technique.recipeGroup]: technique.requiredBiomeLevel ?? 1 } };
  assert.ok(unlockedMakeKinds(at).has('technique'), 'technique appears at its first recipe level');
  // Another technique recipe might share the lower level; only assert when none does.
  const lowerExists = [...ABILITY_RECIPE_DATABASE.values()].some((recipe) =>
    recipe.recipeGroup === technique.recipeGroup
    && (recipe.requiredBiomeLevel ?? 0) <= (technique.requiredBiomeLevel ?? 1) - 1
    && !recipe.requiredBossClear);
  if (!lowerExists) assert.ok(!unlockedMakeKinds(below).has('technique'));
}

// The dev test room opens every gear slot.
const testRoom = unlockedMakeKinds({ ...fresh, isTestRoom: true });
for (const slot of new Set([...RECIPE_DATABASE.values()].map((recipe) => recipe.slot))) {
  assert.ok(testRoom.has(slot), `test room shows ${slot}`);
}

// ── Map fog: tier gate ───────────────────────────────────────────────────────

assert.equal(isNodeCharted(0, 0), true, 'the Clearing is always charted');
assert.equal(isNodeCharted(1, 0), true, 'a fresh character sees Tier 1');
assert.equal(isNodeCharted(2, 1), false);
assert.equal(isNodeCharted(2, 2), true);
assert.equal(isNodeCharted(3, 2), false);
for (const node of WORLD_NODE_LIST) {
  assert.equal(isNodeCharted(node.biomeTier, 4), true, `T4 charts everything current: ${node.id}`);
}

console.log('craftingRailAndMapFog: ok');
