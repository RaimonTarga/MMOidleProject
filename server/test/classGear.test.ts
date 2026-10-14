/**
 * Class gear's wiring (class-first build plan §3.6, F5): smart loot keeps another class's
 * recipe out of unlocks, crafting and equipping; a shared base's class line reaches only its
 * own class's passives; the relic slot takes no item (it holds the boss trophy).
 */
import {
  availableToClass,
  baseRecoveryForTier,
  emptyEquipment,
  GAME_CONFIG,
  ITEM_DATABASE,
  RECIPE_DATABASE,
  STARTER_RUNE_IDS,
  type ItemDefinition,
  type Recipe,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { craftRecipe } from '../src/systems/player/economy/crafting';
import { equipItem } from '../src/systems/player/economy/inventory';
import { checkRecipeUnlocks } from '../src/systems/player/progression/rewards';
import { unlockSkill } from '../src/systems/player/progression/skills';
import { World } from '../src/world/World';

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

assert(availableToClass({}, 'cadence') && availableToClass({}, null), 'gear naming no class is for everyone');
assert(availableToClass({ classes: ['cadence'] }, 'cadence'), 'Striker gear is for the Striker');
assert(!availableToClass({ classes: ['cadence'] }, 'cooldown'), 'never for the Squire');
assert(!availableToClass({ classes: ['cadence'] }, null), 'nor before a class is picked');

// Test fixtures: a Striker-only weapon and a shared armor with a Squire line.
const blade: Recipe = {
  id: 'test-class-gear-blade', name: 'Test Blade', recipeGroup: 'plains', requiredBiomeLevel: 1,
  slot: 'weapon', cost: {}, stats: { attack: 1 }, tier: 1, classes: ['cadence'],
};
const plate: Recipe = {
  id: 'test-class-gear-plate', name: 'Test Plate', recipeGroup: 'plains', requiredBiomeLevel: 1,
  slot: 'armor', cost: {}, stats: {}, tier: 1,
  classLines: { cooldown: { name: 'Test Line', text: 'A test line.', effects: { 'defense.dot-resistance': 0.25 } } },
};
const relic: ItemDefinition = { id: 'test-class-gear-relic', name: 'Test Relic', slot: 'relic', tier: 1, statModifiers: {} };
for (const recipe of [blade, plate]) {
  RECIPE_DATABASE.set(recipe.id, recipe);
  ITEM_DATABASE.set(recipe.id, {
    id: recipe.id, name: recipe.name, slot: recipe.slot, tier: recipe.tier, biomeGroup: recipe.recipeGroup,
    statModifiers: { ...recipe.stats } as Record<string, number>,
    classes: recipe.classes, classLines: recipe.classLines,
  });
}
ITEM_DATABASE.set(relic.id, relic);

function makePlayer(id: string): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: 'Class Gear Tester' },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: 'node-clearing', speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: GAME_CONFIG.PLAYER_MAX_HP, maxHp: GAME_CONFIG.PLAYER_MAX_HP, recovery: baseRecoveryForTier(0) },
    tracksProgression: {
      level: 0, skillPoints: 1,
      essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      shards: {}, capstones: {}, biomeXP: {}, biomeLevel: { plains: 1 }, unlockedRecipes: [], questProgress: {},
      playerTier: 1, currentSkillTier: 0, bossesCleared: [], clearedNodes: [],
      runesOwned: [...STARTER_RUNE_IDS], runeRecipesCrafted: [], runesEquipped: [],
      knownAbilities: [], attunedAbilities: { techniques: [], guards: [] },
      knownStances: [], equippedStances: { default: null }, activeStance: null,
      knownRites: [], equippedRites: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: [], passives: {}, selectedClass: null, selectedSubVariant: null,
      selectedRange: null, combatArchetype: null,
    },
  } as PersistedPlayerSlices;
}

const world = new World();
const striker = world.attachPlayerEntity(makePlayer('class-gear-striker'), 'class-gear-striker');
const squire = world.attachPlayerEntity(makePlayer('class-gear-squire'), 'class-gear-squire');
assert(unlockSkill(world, striker, 'cadence-root') && unlockSkill(world, squire, 'cooldown-root'), 'both classes picked');

// Unlocks: picking the class already ran them for the levels reached.
checkRecipeUnlocks(striker);
checkRecipeUnlocks(squire);
assert(striker.tracksProgression.unlockedRecipes.includes(blade.id), 'the Striker is offered its blade');
assert(!squire.tracksProgression.unlockedRecipes.includes(blade.id), 'the Squire never is');
assert(squire.tracksProgression.unlockedRecipes.includes(plate.id), 'shared bases are offered to everyone');

// Crafting and equipping refuse another class's gear.
squire.tracksProgression.unlockedRecipes.push(blade.id);
const crafted = craftRecipe(world, squire, blade.id);
assert(!crafted.success && crafted.reason?.includes('another class'), 'the Squire can\'t craft the Striker\'s blade');
squire.holdsInventory.inventory.push(blade.id);
assert(!equipItem(world, squire, blade.id), 'nor wear it');
striker.holdsInventory.inventory.push(blade.id);
assert(equipItem(world, striker, blade.id), 'the Striker wears it');

// A shared base's class line reaches only its own class.
squire.holdsInventory.inventory.push(plate.id);
striker.holdsInventory.inventory.push(plate.id);
assert(equipItem(world, squire, plate.id) && equipItem(world, striker, plate.id), 'both wear the shared plate');
const squireDotRes = squire.usesSkills.passives['defense.dot-resistance'] ?? 0;
const strikerDotRes = striker.usesSkills.passives['defense.dot-resistance'] ?? 0;
assert(squireDotRes >= 0.25, `the Squire gets its line (dot resistance ${squireDotRes})`);
assert(strikerDotRes < 0.25, `the Striker doesn't (dot resistance ${strikerDotRes})`);

// The relic slot takes no item.
striker.holdsInventory.inventory.push(relic.id);
assert(!equipItem(world, striker, relic.id), 'the relic slot holds the boss trophy, never an item');

console.log('classGear.test.ts: ok');
