import {
  GAME_CONFIG,
  ITEM_DATABASE,
  RECIPE_DATABASE,
  RELIC_ITEM_TIER,
  RELIC_RATING_KEYS,
  RELIC_UNLOCK_PLAYER_TIER,
  STARTER_RUNE_IDS,
  TEST_ROOM_NODE_ID,
  biomeLevelCap,
  emptyEquipment,
  getMaxUpgrade,
} from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { equipItem } from '../src/systems/player/economy/inventory';
import { World } from '../src/world/World';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function slices(id: string, tier: number, nodeId = 'node-clearing'): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: { current: { x: 400, y: 400 }, nodeId, speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: {
      hp: GAME_CONFIG.PLAYER_MAX_HP,
      maxHp: GAME_CONFIG.PLAYER_MAX_HP,
      hpRegen: GAME_CONFIG.PLAYER_HP_REGEN,
    },
    tracksProgression: {
      level: 0,
      skillPoints: 0,
      essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      catalysts: {}, catalystProgress: {}, biomeXP: {}, biomeLevel: {},
      unlockedRecipes: [], questProgress: {}, playerTier: tier, currentSkillTier: 0,
      bossesCleared: [], clearedNodes: [],
      runesOwned: [...STARTER_RUNE_IDS], runeRecipesCrafted: [], runesEquipped: [],
      knownAbilities: [], equippedAbilities: { technique: null, guard: null },
      knownStances: [], equippedStances: { default: null }, activeStance: null,
      knownRites: [], equippedRites: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: [], passives: {}, selectedClass: 'cooldown-root',
      selectedSubVariant: 'balanced', selectedRange: null, combatArchetype: 'cooldown',
    },
  };
}

const expectedRelics = {
  'relic-hastebound-dial':     { biome: 'forest',    frequency: 0.35, potency: -0.25, buffEffect: 0,    debuffEffect: 0 },
  'relic-colossus-heart':      { biome: 'mountain',  frequency: -0.30, potency: 0.40, buffEffect: 0,    debuffEffect: 0 },
  'relic-equilibrium-shard':   { biome: 'plains',    frequency: 0.10, potency: 0.10, buffEffect: 0,     debuffEffect: 0 },
  'relic-verdant-flywheel':    { biome: 'jungle',    frequency: 0.20, potency: -0.20, buffEffect: 0.25, debuffEffect: 0 },
  'relic-glacial-bell':        { biome: 'tundra',    frequency: -0.20, potency: 0.25, buffEffect: 0.25, debuffEffect: 0 },
  'relic-virulent-hourglass':  { biome: 'swamp',     frequency: 0.20, potency: -0.20, buffEffect: 0,    debuffEffect: 0.25 },
  'relic-withering-lens':      { biome: 'desert',    frequency: -0.20, potency: 0.25, buffEffect: 0,    debuffEffect: 0.25 },
  'relic-haunted-prism':       { biome: 'graveyard', frequency: -0.10, potency: -0.10, buffEffect: 0.35, debuffEffect: 0.35 },
} as const;

const relics = [...RECIPE_DATABASE.values()].filter((recipe) => recipe.slot === 'relic');
assert(relics.length === 8, 'expected exactly the approved eight-Relic cast');

const allowedRatingKeys = new Set<string>(Object.values(RELIC_RATING_KEYS));
for (const recipe of relics) {
  const expected = expectedRelics[recipe.id as keyof typeof expectedRelics];
  assert(!!expected, `unexpected Relic recipe ${recipe.id}`);
  assert(recipe.recipeGroup === expected.biome, `${recipe.id} belongs to ${expected.biome}`);
  assert(recipe.tier === RELIC_ITEM_TIER, `${recipe.id} is an item-tier 4 Relic`);
  assert(Object.keys(recipe.stats).length === 0, `${recipe.id} has no ordinary stats`);
  assert((recipe.upgrades?.length ?? 0) === 0, `${recipe.id} has no +N upgrades`);
  assert(recipe.coreEligibility === undefined, `${recipe.id} has no core eligibility`);
  assert(recipe.evolvesFrom === undefined, `${recipe.id} is a base lineage item`);
  assert(recipe.lineageId === recipe.id, `${recipe.id} has a stable lineage id`);
  assert(
    Object.keys(recipe.mechanicEffects ?? {}).every((key) => allowedRatingKeys.has(key)),
    `${recipe.id} authors only approved relic.* ratings`,
  );
  assert(
    recipe.requiredBiomeLevel > biomeLevelCap(RELIC_UNLOCK_PLAYER_TIER - 1, recipe.recipeGroup),
    `${recipe.id} is unreachable before Relics unlock`,
  );
  assert(
    recipe.requiredBiomeLevel <= biomeLevelCap(RELIC_UNLOCK_PLAYER_TIER, recipe.recipeGroup),
    `${recipe.id} is reachable in its Tier 4 mastery band`,
  );
  const effects = recipe.mechanicEffects ?? {};
  assert((effects[RELIC_RATING_KEYS.frequency] ?? 0) === expected.frequency, `${recipe.id} frequency matches the cast`);
  assert((effects[RELIC_RATING_KEYS.potency] ?? 0) === expected.potency, `${recipe.id} potency matches the cast`);
  assert((effects[RELIC_RATING_KEYS.buffEffect] ?? 0) === expected.buffEffect, `${recipe.id} buff rating matches the cast`);
  assert((effects[RELIC_RATING_KEYS.debuffEffect] ?? 0) === expected.debuffEffect, `${recipe.id} debuff rating matches the cast`);
  assert(getMaxUpgrade(ITEM_DATABASE.get(recipe.id)!) === 0, `${recipe.id} stays off the +N track`);
}

for (const biome of ['cave', 'volcanic', 'trench']) {
  assert(!relics.some((recipe) => recipe.recipeGroup === biome), `${biome} intentionally has no launch Relic`);
}

for (const recipe of relics) {
  const world = new World();
  const player = world.attachPlayerEntity(
    slices(`relic-${recipe.id}`, RELIC_UNLOCK_PLAYER_TIER),
    `net-${recipe.id}`,
  );
  player.holdsInventory.inventory = [recipe.id];
  assert(equipItem(world, player, recipe.id), `${recipe.id} equips at exact unlock tier`);
  assert(player.holdsInventory.equipment.relic === recipe.id, `${recipe.id} occupies relic slot`);
  for (const key of Object.values(RELIC_RATING_KEYS)) {
    const authored = recipe.mechanicEffects?.[key];
    if (authored !== undefined) {
      assert(player.usesSkills.passives[key] === authored, `${recipe.id} folds ${key}`);
    }
  }
  world.tick(100, 100);
  assert(!!player.usesCooldown?.initialized, `${recipe.id} survives a real mechanic tick`);
  assert((player.usesCooldown?.executionCooldownMs ?? 0) > 0, `${recipe.id} resolves a safe cooldown`);
}

{
  const recipe = relics[0];
  const world = new World();
  const player = world.attachPlayerEntity(
    slices('relic-locked', RELIC_UNLOCK_PLAYER_TIER - 1),
    'relic-locked',
  );
  player.holdsInventory.inventory = [recipe.id];
  assert(!equipItem(world, player, recipe.id), 'server rejects relic equip below unlock tier');
  assert(player.holdsInventory.inventory.includes(recipe.id), 'rejected relic remains in bag');
}

{
  const recipe = relics[0];
  const world = new World();
  const player = world.attachPlayerEntity(slices('relic-test-room', 0, TEST_ROOM_NODE_ID), 'relic-test-room');
  player.holdsInventory.inventory = [recipe.id];
  assert(equipItem(world, player, recipe.id), 'test room bypasses relic unlock tier');
}

console.log('relics.test.ts: ok');
