/**
 * One rule for four slots (design §24.5): the +N ladder and the evolve path are
 * retired on every slot. An item is crafted at full power, a stale `+N` adds
 * nothing, and an armour, charm or boots item of tier ≥ 2 is a plain recipe,
 * crafted at its biome level for essence — never evolved from the item below it.
 * A weapon's tier-2+ forms stay what they were: opened at the lineage gate only
 * (review finding B4), never crafted and never evolved.
 *
 * Run: node --conditions=development --import tsx test/slotRetirement.test.ts
 */
import {
  BIOME_START_TIER_BY_GROUP, EVOLUTION_RETIRED_REASON, GAME_CONFIG, ITEM_DATABASE,
  RECIPE_DATABASE, TEST_ROOM_NODE_ID, UPGRADES_RETIRED_REASON, baseRecoveryForTier,
  biomeLevelCap, checkEvolve, checkReconstruct, checkUpgrade, emptyEquipment, getMaxUpgrade,
  isGatedLineageForm, isLineageParked, lineageForRecipeId,
} from '@mmo-idle/shared';
import type { EquipmentSlot, EssenceType, Recipe } from '@mmo-idle/shared';
import type { PersistedPlayerSlices } from '../src/db/playerRepo';
import { World } from '../src/world/World';
import { craftRecipe } from '../src/systems/player/economy/crafting';
import { equipItem } from '../src/systems/player/economy/inventory';
import { evolveItem } from '../src/systems/player/economy/itemEvolution';
import { upgradeItem } from '../src/systems/player/economy/itemUpgrade';
import { recalculatePlayerEntityStats } from '../src/ecs/playerEntityFormulas';
import { checkRecipeUnlocks } from '../src/systems/player/progression/rewards';

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

const GEAR_SLOTS: readonly EquipmentSlot[] = ['weapon', 'armor', 'recovery', 'mobility'];
const NON_WEAPON: readonly EquipmentSlot[] = ['armor', 'recovery', 'mobility'];

function makeSlices(id: string, opts: { essence?: number; nodeId?: string } = {}): PersistedPlayerSlices {
  const e = opts.essence ?? 0;
  return {
    isPlayer: { id, name: id },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: opts.nodeId ?? 'node-t1-forest-01', speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: GAME_CONFIG.PLAYER_MAX_HP, maxHp: GAME_CONFIG.PLAYER_MAX_HP, recovery: baseRecoveryForTier(0) },
    tracksProgression: {
      level: 0, skillPoints: 0,
      essences: { red: e, blue: e, green: e, yellow: e, purple: e },
      shards: {}, capstones: {},
      biomeXP: {}, biomeLevel: {},
      unlockedRecipes: [], questProgress: {}, playerTier: 4, currentSkillTier: 0,
      bossesCleared: [], clearedNodes: [],
      runesOwned: [], runeRecipesCrafted: [], runesEquipped: [],
      knownAbilities: [], attunedAbilities: { techniques: [], guards: [] },
      knownStances: [], equippedStances: { default: null }, activeStance: null,
      knownRites: [], equippedRites: [],
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

// ─── `evolvesFrom` survives only as the weapon form graph ────────────────────
//
// Every recipe still carrying it is a live weapon lineage's gated form, so the
// one shared check (`isGatedLineageForm`) is the whole craft guard, server and
// Make tab alike; and no armour, charm or boots recipe has a predecessor.

for (const recipe of RECIPE_DATABASE.values()) {
  if (!recipe.evolvesFrom) continue;
  assert(recipe.slot === 'weapon', `${recipe.id}: only a weapon form keeps evolvesFrom, got a ${recipe.slot}`);
  assert(isGatedLineageForm(recipe.id), `${recipe.id}: a weapon with a predecessor is a gated lineage form`);
}

// ─── The evolve path refuses every slot ──────────────────────────────────────

for (const recipe of RECIPE_DATABASE.values()) {
  const full = Object.fromEntries(['red', 'blue', 'green', 'yellow', 'purple'].map((t) => [t, 1e9])) as Record<EssenceType, number>;
  for (const check of [
    checkEvolve({ recipe, inventory: recipe.evolvesFrom ? [recipe.evolvesFrom] : [], itemUpgrades: {}, essences: full, isTestRoom: true }),
    checkReconstruct({ recipe, essences: full, isTestRoom: true }),
  ]) {
    assert(!check.ok && check.reason === EVOLUTION_RETIRED_REASON, `${recipe.id}: evolve/reconstruct refused, got ${JSON.stringify(check)}`);
  }
}

{
  // One T2 item per gear slot, with what the old path wanted in hand: the T1
  // item equipped (a weapon keeps its predecessor; the others name the slot's
  // T1 item of the same biome), its old +3, the recipe unlocked, full funds.
  const t2BySlot = new Map<EquipmentSlot, Recipe>();
  for (const recipe of RECIPE_DATABASE.values()) {
    if (recipe.tier === 2 && GEAR_SLOTS.includes(recipe.slot) && !t2BySlot.has(recipe.slot)) {
      t2BySlot.set(recipe.slot, recipe);
    }
  }
  assert(t2BySlot.size === GEAR_SLOTS.length, 'fixture: a tier-2 recipe exists for every gear slot');

  for (const [slot, recipe] of t2BySlot) {
    const predecessor = recipe.evolvesFrom
      ?? [...RECIPE_DATABASE.values()].find((r) => r.slot === slot && r.tier === 1 && r.recipeGroup === recipe.recipeGroup)?.id;
    assert(predecessor, `fixture: a tier-1 ${slot} for ${recipe.id}`);
    for (const mode of ['evolve', 'reconstruct'] as const) {
      for (const nodeId of ['node-t1-forest-01', TEST_ROOM_NODE_ID]) {
        const p = spawn({ essence: 1e6, nodeId });
        p.tracksProgression.unlockedRecipes.push(recipe.id);
        p.holdsInventory.inventory.push(predecessor!, predecessor!);
        assert(equipItem(world, p, predecessor!), `fixture: wears ${predecessor}`);
        p.holdsInventory.itemUpgrades[predecessor!] = 3;
        const before = JSON.stringify([p.holdsInventory, p.tracksProgression]);
        const result = evolveItem(world, p, recipe.id, mode);
        assert(
          !result.success && result.reason === EVOLUTION_RETIRED_REASON,
          `${slot} ${recipe.id} ${mode} @${nodeId}: refused, got ${JSON.stringify(result)}`,
        );
        assert(JSON.stringify([p.holdsInventory, p.tracksProgression]) === before, `${recipe.id} ${mode}: a refusal changes nothing`);
      }
    }
  }
}

// ─── A T2 vest crafts from its recipe at its biome level ─────────────────────

{
  const vest = RECIPE_DATABASE.get('forest-vest-t2')!;
  assert(vest.slot === 'armor' && vest.tier === 2, 'fixture: forest-vest-t2 is a T2 armour');
  assert(vest.evolvesFrom === undefined, 'the T2 vest has no predecessor');
  assert(isLineageParked(lineageForRecipeId(vest.id)), 'fixture: its lineage (bindings) is parked');
  assert(!isGatedLineageForm(vest.id), 'so it is a plain recipe, not a gated door');

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
  assert(p.holdsInventory.lineages?.bindings === undefined, 'and no parked tree was born');
}

// ─── Every non-weapon T2+ item is reachable by its biome level alone ─────────
//
// The evolve path was the only door some of these had in the UI; now every one
// must be unlocked by `checkRecipeUnlocks` at a level its biome actually reaches
// at the item's own tier, and must craft.

{
  let walked = 0;
  for (const recipe of RECIPE_DATABASE.values()) {
    if (!NON_WEAPON.includes(recipe.slot) || recipe.tier < 2) continue;
    walked++;
    assert(!recipe.requiredBossClear, `${recipe.id}: gated by biome level, not a boss clear`);
    assert(!isGatedLineageForm(recipe.id), `${recipe.id}: a plain recipe, not a gated door`);
    const start = BIOME_START_TIER_BY_GROUP[recipe.recipeGroup];
    assert(start !== undefined, `${recipe.id}: '${recipe.recipeGroup}' is a biome with nodes`);
    const cap = biomeLevelCap(Math.max(recipe.tier, start!), recipe.recipeGroup);
    assert(
      recipe.requiredBiomeLevel >= 1 && recipe.requiredBiomeLevel <= cap,
      `${recipe.id}: needs ${recipe.recipeGroup} ${recipe.requiredBiomeLevel}, reachable cap at T${recipe.tier} is ${cap}`,
    );

    const p = spawn({ essence: 1e6 });
    p.tracksProgression.biomeLevel[recipe.recipeGroup] = recipe.requiredBiomeLevel;
    checkRecipeUnlocks(p);
    const result = craftRecipe(world, p, recipe.id);
    assert(result.success, `${recipe.id}: crafts at ${recipe.recipeGroup} ${recipe.requiredBiomeLevel}: ${result.reason}`);
  }
  assert(walked >= 70, `fixture: walked only ${walked} non-weapon T2+ recipes`);
}

// ─── Weapon T2+ forms stay behind the gate (B4) ──────────────────────────────

{
  let gated = 0;
  for (const recipe of RECIPE_DATABASE.values()) {
    if (recipe.slot !== 'weapon' || recipe.tier < 2 || !lineageForRecipeId(recipe.id)) continue;
    assert(isGatedLineageForm(recipe.id), `${recipe.id}: a tier-2+ weapon form is gated`);
    const p = spawn({ essence: 1e9 });
    p.tracksProgression.unlockedRecipes.push(recipe.id);
    const result = craftRecipe(world, p, recipe.id);
    assert(!result.success, `${recipe.id}: crafting a gated weapon form is refused`);
    assert(!p.holdsInventory.inventory.includes(recipe.id), `${recipe.id}: and nothing is granted`);
    gated++;
  }
  assert(gated >= 20, `fixture: only ${gated} gated weapon forms walked`);
  assert(ITEM_DATABASE.get('gale-needle')?.slot === 'weapon', 'fixture: Gale Needle is a weapon');
  assert(isGatedLineageForm('gale-needle') && isGatedLineageForm('jungle-stinger-rapier'), 'both Rapier T2 doors stay gated');
}

console.log('slotRetirement.test.ts: ok');
