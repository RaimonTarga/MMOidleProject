/**
 * One rule for four slots (design §24.5): the +N ladder is retired on every slot.
 * An item is crafted at full power, a stale `+N` adds nothing, and an item of
 * tier ≥ 2 is a plain recipe, crafted at its biome level for essence. Since the
 * class-first rework (D1) that includes the weapons: their lineage trees and
 * gates are gone, so a tier-2+ weapon form is a recipe like any other.
 *
 * Run: node --conditions=development --import tsx test/slotRetirement.test.ts
 */
import {
  BIOME_START_TIER_BY_GROUP, GAME_CONFIG, ITEM_DATABASE,
  RECIPE_DATABASE, TEST_ROOM_NODE_ID, UPGRADES_RETIRED_REASON, baseRecoveryForTier,
  biomeLevelCap, checkUpgrade, emptyEquipment, getMaxUpgrade,
} from '@mmo-idle/shared';
import type { EquipmentSlot, EssenceType } from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { World } from '../src/world/World';
import { craftRecipe } from '../src/systems/player/economy/crafting';
import { equipItem } from '../src/systems/player/economy/inventory';
import { upgradeItem } from '../src/systems/player/economy/itemUpgrade';
import { recalculatePlayerEntityStats } from '../src/ecs/playerEntityFormulas';
import { checkRecipeUnlocks } from '../src/systems/player/progression/rewards';

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

const GEAR_SLOTS: readonly EquipmentSlot[] = ['weapon', 'armor', 'recovery', 'mobility'];

function makeSlices(id: string, opts: { essence?: number; nodeId?: string } = {}): PersistedPlayerSlices {
  const e = opts.essence ?? 0;
  return {
    isPlayer: { id, name: id },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: opts.nodeId ?? 'node-t1-forest-01', speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: GAME_CONFIG.PLAYER_MAX_HP, maxHp: GAME_CONFIG.PLAYER_MAX_HP, recovery: baseRecoveryForTier(0) },
    tracksProgression: {
      level: 0, skillPoints: 0,
      essences: { red: e, blue: e, green: e, yellow: e, purple: e },
      
      biomeXP: {}, biomeLevel: {},
      unlockedRecipes: [], questProgress: {}, playerTier: 4, currentSkillTier: 0,
      bossesCleared: [], clearedNodes: [],
      runesOwned: [], runesEquipped: [],
    },
    holdsInventory: { inventory: [], equipment: { ...emptyEquipment() }, itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: [], passives: {}, selectedClass: null,
      selectedSubVariant: null, selectedRange: null, combatArchetype: null,
    },
  };
}

const world = new World();
let serial = 0;
const spawn = (opts: { essence?: number; nodeId?: string } = {}) => {
  const id = `retire-${serial++}`;
  return world.attachPlayerEntity(makeSlices(id, opts), id);
};

// ─── The +N ladder refuses every slot ────────────────────────────────────────

for (const item of ITEM_DATABASE.values()) {
  assert(getMaxUpgrade(item) === 0, `${item.id}: no item has a ladder`);
  const check = checkUpgrade({
    item, currentPlus: 0, biomeLevel: 99,
    essences: { red: 1e9, blue: 1e9, green: 1e9, yellow: 1e9, purple: 1e9 }, globalMastery: 999,
  });
  assert(!check.ok && check.reason === UPGRADES_RETIRED_REASON, `${item.id}: upgrade refused, got ${JSON.stringify(check)}`);
}

{
  // One held, worn item per gear slot, rich, at max levels, in the open world
  // and in the test room: the server refuses, spends nothing, writes no level.
  const bySlot: Record<string, string> = {
    weapon: 'iron-broadsword', armor: 'plains-vest-t1', recovery: 'forest-charm-t1', mobility: 'mountain-boots-t1',
  };
  for (const slot of GEAR_SLOTS) {
    const itemId = bySlot[slot]!;
    assert(ITEM_DATABASE.get(itemId)?.slot === slot, `fixture: ${itemId} is a ${slot}`);
    for (const nodeId of ['node-t1-forest-01', TEST_ROOM_NODE_ID]) {
      const p = spawn({ essence: 1e6, nodeId });
      for (const group of ['plains', 'forest', 'mountain']) p.tracksProgression.biomeLevel[group] = 99;
      p.holdsInventory.inventory.push(itemId);
      assert(equipItem(world, p, itemId), `fixture: wears ${itemId}`);
      const before = JSON.stringify([p.holdsInventory, p.tracksProgression]);
      const result = upgradeItem(world, p, itemId);
      assert(
        !result.success && result.reason === UPGRADES_RETIRED_REASON && result.newLevel === 0,
        `${slot} ${itemId} @${nodeId}: upgrade refused, got ${JSON.stringify(result)}`,
      );
      assert(JSON.stringify([p.holdsInventory, p.tracksProgression]) === before, `${itemId}: a refusal changes nothing`);
    }
  }
}

{
  // A stale `+N` a save still holds adds nothing at recalc, on any slot. (The
  // hydration refund drops it; this is the belt to that braces — after the
  // ladder fold, a live +5 bonus would double the item's old +5 power.)
  const kit = ['flash-rapier', 'forest-vest-t1', 'forest-charm-t1', 'forest-boots-t1'];
  const statsOf = (plus: number) => {
    const p = spawn();
    p.holdsInventory.inventory.push(...kit);
    for (const id of kit) {
      assert(equipItem(world, p, id), `fixture: wears ${id}`);
      if (plus > 0) p.holdsInventory.itemUpgrades[id] = plus;
    }
    recalculatePlayerEntityStats(world, p);
    return JSON.stringify([
      p.dealsDamage, p.mitigatesDamage, p.evadesHits, p.performsAttack, p.hasHealth.maxHp,
      p.hasHealth.recovery, p.hasPosition.speed, p.usesSkills.passives,
    ]);
  };
  assert(statsOf(5) === statsOf(0), 'a +5 entry on every slot changes no stat and no passive');
}

// ─── A T2 vest crafts from its recipe at its biome level ─────────────────────

{
  const vest = RECIPE_DATABASE.get('forest-vest-t2')!;
  assert(vest.slot === 'armor' && vest.tier === 2, 'fixture: forest-vest-t2 is a T2 armour');

  // One level short: the recipe is not unlocked and the craft is refused.
  const early = spawn({ essence: 1e6 });
  early.tracksProgression.biomeLevel[vest.recipeGroup] = vest.requiredBiomeLevel - 1;
  checkRecipeUnlocks(early);
  assert(!early.tracksProgression.unlockedRecipes.includes(vest.id), `locked below ${vest.recipeGroup} ${vest.requiredBiomeLevel}`);
  assert(!craftRecipe(world, early, vest.id).success, 'and the craft is refused');

  // At its level, with nothing but the essence it costs: crafted, paid, no tree.
  const p = spawn();
  for (const [type, amount] of Object.entries(vest.cost) as [EssenceType, number][]) p.tracksProgression.essences[type] = amount;
  p.tracksProgression.biomeLevel[vest.recipeGroup] = vest.requiredBiomeLevel;
  checkRecipeUnlocks(p);
  assert(p.tracksProgression.unlockedRecipes.includes(vest.id), `unlocked at ${vest.recipeGroup} ${vest.requiredBiomeLevel}`);
  const crafted = craftRecipe(world, p, vest.id);
  assert(crafted.success, `the T2 vest crafts from its recipe: ${crafted.reason}`);
  assert(p.holdsInventory.inventory.includes(vest.id), 'it lands in the bag');
  assert(Object.values(p.tracksProgression.essences).every((v) => v === 0), 'for exactly its recipe cost');
  assert(!p.holdsInventory.inventory.includes('forest-vest-t1'), 'no T1 vest was needed or consumed');
}

// ─── Every T2+ gear item is reachable by its biome level alone ───────────────
//
// Every one must be unlocked by `checkRecipeUnlocks` at a level its biome
// actually reaches at the item's own tier, and must craft — weapons included,
// now that no lineage gate stands in front of their tier-2+ forms.

{
  let walked = 0;
  let weapons = 0;
  for (const recipe of RECIPE_DATABASE.values()) {
    if (!GEAR_SLOTS.includes(recipe.slot) || recipe.tier < 2) continue;
    walked++;
    if (recipe.slot === 'weapon') weapons++;
    assert(!recipe.requiredBossClear, `${recipe.id}: gated by biome level, not a boss clear`);
    const start = BIOME_START_TIER_BY_GROUP[recipe.recipeGroup];
    assert(start !== undefined, `${recipe.id}: '${recipe.recipeGroup}' is a biome with nodes`);
    const cap = biomeLevelCap(Math.max(recipe.tier, start!), recipe.recipeGroup);
    assert(
      recipe.requiredBiomeLevel >= 1 && recipe.requiredBiomeLevel <= cap,
      `${recipe.id}: needs ${recipe.recipeGroup} ${recipe.requiredBiomeLevel}, reachable cap at T${recipe.tier} is ${cap}`,
    );

    const p = spawn({ essence: 1e6 });
    // A class weapon is crafted by its own class (smart loot, class-first build plan §3.6).
    if (recipe.classes) p.usesSkills.combatArchetype = recipe.classes[0];
    p.tracksProgression.biomeLevel[recipe.recipeGroup] = recipe.requiredBiomeLevel;
    checkRecipeUnlocks(p);
    const result = craftRecipe(world, p, recipe.id);
    assert(result.success, `${recipe.id}: crafts at ${recipe.recipeGroup} ${recipe.requiredBiomeLevel}: ${result.reason}`);
  }
  assert(walked >= 90, `fixture: walked only ${walked} T2+ gear recipes`);
  assert(weapons >= 20, `fixture: walked only ${weapons} T2+ weapon recipes`);
}

console.log('slotRetirement.test.ts: ok');
