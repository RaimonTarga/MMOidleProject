// The Crafting panel's evolution preview promises the player three things about
// an evolution before they spend on it: which item is consumed, where the result
// lands, and what +level it arrives at. Those are server facts, so the preview's
// model is checked HERE, against a real `evolveItem` on a real World, rather than
// trusted to stay true on its own. A mechanic change that moves any of them
// fails this test instead of quietly making the panel lie.
import assert from "node:assert/strict";
import {
  GAME_CONFIG, RECIPE_DATABASE, STARTER_RUNE_IDS, emptyEquipment, previewEquipmentStats,
  requiredPlusFor,
} from "@mmo-idle/shared";
import type { EssenceType, Recipe } from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import { World } from "../src/world/World";
import { evolveItem } from "../src/systems/player/economy/itemEvolution";
import { equipItem } from "../src/systems/player/economy/inventory";
import { initCombatSystems } from "../src/systems/combatBootstrap";
import { evolutionPlan } from "../../client/src/ui/crafting/evolutionPlan";

function makePlayerSlices(id: string): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: "Preview" },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: "node-5-5", speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: GAME_CONFIG.PLAYER_MAX_HP, maxHp: GAME_CONFIG.PLAYER_MAX_HP, recovery: GAME_CONFIG.PLAYER_RECOVERY },
    tracksProgression: {
      level: 0, skillPoints: 0,
      essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      catalysts: {}, catalystProgress: {}, biomeXP: {}, biomeLevel: {},
      unlockedRecipes: [], questProgress: {}, playerTier: 4, currentSkillTier: 0,
      bossesCleared: [], clearedNodes: [],
      runesOwned: [...STARTER_RUNE_IDS], runeRecipesCrafted: [], runesEquipped: [],
      knownAbilities: [], attunedAbilities: { techniques: [], guards: [] },
      knownStances: [], equippedStances: { default: null }, activeStance: null,
      knownRites: [], equippedRites: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: [], passives: {},
      selectedClass: null, selectedSubVariant: null, selectedRange: null, combatArchetype: null,
    },
  };
}

initCombatSystems();
const world = new World();
let serial = 0;
function player() {
  const slices = makePlayerSlices(`preview-${serial++}`);
  return world.attachPlayerEntity(slices, slices.isPlayer.id);
}

/** Enough of both wallets for either path, so the test never fails on economy. */
function fund(p: ReturnType<typeof player>, recipe: Recipe) {
  for (const k of Object.keys(p.tracksProgression.essences)) {
    p.tracksProgression.essences[k as EssenceType] = 1_000_000;
  }
  for (const k of Object.keys({ ...recipe.catalystCost, ...recipe.reconstructCatalystCost })) {
    p.tracksProgression.catalysts[k] = 1_000_000;
  }
}

/** One evolution per slot, so a non-weapon lineage is covered as well as a weapon. */
const lineages = (['weapon', 'armor', 'recovery', 'mobility'] as const).map((slot) => {
  const recipe = [...RECIPE_DATABASE.values()].find(r => r.slot === slot && r.evolvesFrom);
  assert(recipe, `an evolution exists for ${slot}`);
  return recipe;
});

const plan = (p: ReturnType<typeof player>, recipe: Recipe) => {
  const found = evolutionPlan({
    recipe,
    inventory: p.holdsInventory.inventory,
    equipment: p.holdsInventory.equipment,
    itemUpgrades: p.holdsInventory.itemUpgrades,
  });
  assert(found, `plan for ${recipe.id}`);
  return found;
};

for (const recipe of lineages) {
  const pred = recipe.evolvesFrom!;
  const required = requiredPlusFor(recipe);

  // ── Predecessor in the bag at exactly the required +level ────────────────
  {
    const p = player();
    p.tracksProgression.unlockedRecipes.push(recipe.id);
    p.holdsInventory.inventory.push(pred);
    p.holdsInventory.itemUpgrades[pred] = required;
    fund(p, recipe);

    const preview = plan(p, recipe);
    assert.equal(preview.ownedPlus, required, `${recipe.id}: reads the owned +level`);
    assert.equal(preview.meetsPlus, true);
    assert.equal(preview.equipped, false);
    assert.equal(preview.consumedPlus, required, 'consumed at the level it is held');
    assert.equal(preview.resultPlus, 0, 'a first evolution arrives at +0');
    assert(preview.diff, 'a comparison is offered when both sides resolve');

    assert(evolveItem(world, p, recipe.id, 'evolve').success, recipe.id);
    // What the preview said would happen, against what did.
    assert.deepEqual(p.holdsInventory.inventory, [recipe.id], 'predecessor consumed, result in bag');
    assert.equal(p.holdsInventory.equipment[recipe.slot], null, 'a bagged evolution equips nothing');
    assert.equal(p.holdsInventory.itemUpgrades[recipe.id] ?? 0, preview.resultPlus);
    assert.equal(p.holdsInventory.itemUpgrades[pred], required, 'the spent level is not refunded or moved');
  }

  // ── Predecessor owned BELOW the requirement ───────────────────────────────
  {
    const p = player();
    p.tracksProgression.unlockedRecipes.push(recipe.id);
    p.holdsInventory.inventory.push(pred);
    p.holdsInventory.itemUpgrades[pred] = required - 1;
    fund(p, recipe);

    const preview = plan(p, recipe);
    assert.equal(preview.ownedPlus, required - 1);
    assert.equal(preview.meetsPlus, false, 'the preview knows it is short');
    // The comparison still stands on the state evolution REQUIRES, not the
    // under-levelled one, so the numbers do not shift as the player upgrades.
    assert.equal(preview.consumedPlus, required);
    assert.equal(evolveItem(world, p, recipe.id, 'evolve').success, false, 'and the server agrees');
  }

  // ── No predecessor at all ────────────────────────────────────────────────
  {
    const p = player();
    p.tracksProgression.unlockedRecipes.push(recipe.id);
    fund(p, recipe);

    const preview = plan(p, recipe);
    assert.equal(preview.ownedPlus, null, 'ownership is absent, not zero');
    assert.equal(preview.meetsPlus, false);
    assert.equal(preview.consumedPlus, required, 'the requirement is still describable');
    assert.equal(evolveItem(world, p, recipe.id, 'evolve').success, false);

    // Reconstruction is the route that works here, and it delivers to the bag.
    assert(evolveItem(world, p, recipe.id, 'reconstruct').success, `${recipe.id} reconstructs`);
    assert.deepEqual(p.holdsInventory.inventory, [recipe.id]);
  }

  // ── Predecessor EQUIPPED at the requirement ──────────────────────────────
  {
    const p = player();
    p.tracksProgression.unlockedRecipes.push(recipe.id);
    p.holdsInventory.inventory.push(pred);
    assert(equipItem(world, p, pred));
    p.holdsInventory.itemUpgrades[pred] = required;
    fund(p, recipe);

    const preview = plan(p, recipe);
    assert.equal(preview.equipped, true, 'the preview knows it is worn');
    assert.equal(preview.ownedPlus, required, 'equipped gear counts as owned');

    assert(evolveItem(world, p, recipe.id, 'evolve').success);
    assert.equal(p.holdsInventory.equipment[recipe.slot], recipe.id, 'swapped in place, never unequipped');
    assert.deepEqual(p.holdsInventory.inventory, [], 'and it does not also land in the bag');
  }

  // ── Reconstruction with a predecessor in hand leaves it alone ────────────
  {
    const p = player();
    p.tracksProgression.unlockedRecipes.push(recipe.id);
    p.holdsInventory.inventory.push(pred);
    assert(equipItem(world, p, pred));
    fund(p, recipe);

    assert(evolveItem(world, p, recipe.id, 'reconstruct').success);
    assert.equal(p.holdsInventory.equipment[recipe.slot], pred, 'predecessor untouched by reconstruction');
    assert.deepEqual(p.holdsInventory.inventory, [recipe.id], 'result goes to the bag');
  }

  // ── A definition the account already has levels on arrives at that level ──
  {
    const p = player();
    p.tracksProgression.unlockedRecipes.push(recipe.id);
    p.holdsInventory.inventory.push(pred);
    p.holdsInventory.itemUpgrades[pred] = required;
    p.holdsInventory.itemUpgrades[recipe.id] = 2;
    fund(p, recipe);

    const preview = plan(p, recipe);
    assert.equal(preview.resultPlus, 2, 'upgrade levels are per definition, not per copy');

    assert(evolveItem(world, p, recipe.id, 'evolve').success);
    assert.equal(p.holdsInventory.itemUpgrades[recipe.id], preview.resultPlus);
  }
}

// Every evolved recipe must be describable: a preview that silently renders
// nothing is worse than the sentence it replaced.
for (const recipe of RECIPE_DATABASE.values()) {
  if (!recipe.evolvesFrom) continue;
  const preview = evolutionPlan({
    recipe, inventory: [], equipment: emptyEquipment(), itemUpgrades: {},
  });
  assert(preview, `${recipe.id} resolves a plan`);
  assert(preview.diff, `${recipe.id} resolves a comparison`);
  const { rows, gains, losses } = preview.diff;
  assert(
    rows.length + gains.length + losses.length > 0,
    `${recipe.id} changes something worth showing`,
  );
  for (const row of rows) {
    assert.notEqual(row.from, row.to, `${recipe.id}/${row.key} is a real difference`);
    assert(!row.label.startsWith('«'), `${recipe.id}/${row.key} has a real label, not a raw key`);
  }
  for (const line of [...gains, ...losses]) {
    assert(!line.includes('«'), `${recipe.id} describes effects in prose, not raw keys: ${line}`);
  }
}

// ── The DPS row ──────────────────────────────────────────────────────────────
// It is the only row that answers "is this better for MY character", so it must
// be the inventory stat sheet's number and not a second estimate. Both sides are
// hypothetical: the slot may hold something else entirely.
{
  const build = {
    usesSkills: {
      unlockedSkills: [], passives: {}, selectedClass: "cadence-root",
      selectedSubVariant: null, selectedRange: "cadence-range-close", combatArchetype: "cadence",
    },
    playerTier: 2, activeStance: null, equippedRites: [], hpFraction: 1,
  } as const;

  const weapon = RECIPE_DATABASE.get("gale-needle")!;
  const pred = weapon.evolvesFrom!;
  const required = requiredPlusFor(weapon);
  const args = {
    recipe: weapon, inventory: [pred], equipment: emptyEquipment(),
    itemUpgrades: { [pred]: required },
  };

  const withBuild = evolutionPlan({ ...args, build })!;
  const dps = withBuild.diff!.rows.find(r => r.key === "dps");
  assert(dps, "a weapon evolution offers a DPS row when the build is known");
  assert.equal(withBuild.diff!.rows[0].key, "dps", "DPS leads the comparison");

  // The same call the stat sheet makes, with the same equipment and levels.
  const dpsAt = (itemId: string, plus: number) => previewEquipmentStats({
    ...build,
    equipment: { ...emptyEquipment(), weapon: itemId },
    itemUpgrades: { [pred]: required, [weapon.id]: 0, [itemId]: plus },
  }).stats.dps;
  const round = (v: number) => String(Math.round(v * 100) / 100);
  assert.equal(dps.from, round(dpsAt(pred, required)), "before side is the stat sheet's number");
  assert.equal(dps.to, round(dpsAt(weapon.id, 0)), "after side is the stat sheet's number");

  // No build, no row — an unresolvable number is not worth inventing.
  const without = evolutionPlan(args)!;
  assert(!without.diff!.rows.some(r => r.key === "dps"), "no DPS row without a build");

  // Levels must be PINNED to the state evolution consumes, not read raw off the
  // account. Under-levelled is the case that proves it: the player holds the
  // predecessor at +1, but the comparison is owed the +3 it will be spent at, so
  // a row built from the raw map would understate the item being given up.
  {
    const upgrades = { [pred]: 1 };
    const short = evolutionPlan({ ...args, itemUpgrades: upgrades, build })!;
    const row = short.diff!.rows.find(r => r.key === "dps")!;
    assert(row, "an under-levelled predecessor still produces a DPS row");
    assert.equal(short.consumedPlus, required, "compared at the level it must reach");
    assert.equal(row.from, round(previewEquipmentStats({
      ...build,
      equipment: { ...emptyEquipment(), weapon: pred },
      itemUpgrades: { ...upgrades, [pred]: required },
    }).stats.dps), "before side is drawn at the level actually consumed");
    assert.notEqual(row.from, round(previewEquipmentStats({
      ...build, equipment: { ...emptyEquipment(), weapon: pred }, itemUpgrades: upgrades,
    }).stats.dps), "and NOT at the +1 the account happens to hold");
  }

  // A lineage that cannot move DPS must not manufacture a row for it.
  const armor = RECIPE_DATABASE.get("forest-vest-t2")!;
  const armorPlan = evolutionPlan({
    recipe: armor, inventory: [armor.evolvesFrom!], equipment: emptyEquipment(),
    itemUpgrades: { [armor.evolvesFrom!]: requiredPlusFor(armor) }, build,
  })!;
  assert(!armorPlan.diff!.rows.some(r => r.key === "dps"), "armor offers no DPS row");
}

console.log("evolutionPreview: ok");
