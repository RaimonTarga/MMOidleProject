import {
  GAME_CONFIG,
  RUNE_RECIPE_DATABASE,
  STARTER_RUNE_IDS,
  emptyEquipment,
  emptyEquippedAbilities,
  emptyEquippedRites,
  emptyEquippedStances,
  runeIdsFromCraftedRecipes,
} from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import { craftRuneRecipe } from "../src/systems/player/economy/runeCrafting";
import { World } from "../src/world/World";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function makeSlices(id: string): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: {
      current: { x: 400, y: 400 },
      nodeId: "node-5-5",
      speed: GAME_CONFIG.PLAYER_SPEED,
    },
    hasHealth: {
      hp: GAME_CONFIG.PLAYER_MAX_HP,
      maxHp: GAME_CONFIG.PLAYER_MAX_HP,
      recovery: GAME_CONFIG.PLAYER_RECOVERY,
    },
    tracksProgression: {
      level: 5,
      skillPoints: 0,
      // Plenty of every essence color, so a craft can only fail on the
      // deprecation check itself, never on affordability.
      essences: { red: 9_999, blue: 9_999, green: 9_999, yellow: 9_999, purple: 9_999 },
      catalysts: {},
      catalystProgress: {},
      biomeXP: {},
      // Cave L3 clears the gate on both `rune-recipe-recover-first` (L3) and
      // `rune-recipe-flee` (L2).
      biomeLevel: { cave: 6 },
      unlockedRecipes: [],
      questProgress: {},
      playerTier: 1,
      currentSkillTier: 1,
      bossesCleared: [],
      clearedNodes: [],
      visitedNodes: [],
      runesOwned: runeIdsFromCraftedRecipes([]),
      runeRecipesCrafted: [],
      runesEquipped: [],
      knownAbilities: [],
      equippedAbilities: emptyEquippedAbilities(),
      knownStances: [],
      equippedStances: emptyEquippedStances(),
      activeStance: null,
      knownRites: [],
      equippedRites: emptyEquippedRites(),
    },
    holdsInventory: {
      inventory: [],
      equipment: emptyEquipment(),
      itemUpgrades: {},
    },
    usesSkills: {
      unlockedSkills: ["cadence"],
      passives: {},
      selectedClass: "cadence",
      selectedSubVariant: "balanced",
      selectedRange: "cadence-range-close",
      combatArchetype: "cadence",
    },
  };
}

// ── 1/2: wait-for-regen and flee are owned from the start, no crafting needed ──

const world = new World();
const player = world.attachPlayerEntity(makeSlices("deprecation-tester"), "deprecation-tester");

assert(
  player.tracksProgression.runesOwned.includes("wait-for-regen"),
  "wait-for-regen must be owned as a starter rune from character creation",
);
assert(
  player.tracksProgression.runesOwned.includes("flee"),
  "flee must be owned as a starter rune from character creation",
);
assert(STARTER_RUNE_IDS.includes("wait-for-regen"), "wait-for-regen is listed in STARTER_RUNE_IDS");
assert(STARTER_RUNE_IDS.includes("flee"), "flee is listed in STARTER_RUNE_IDS");

// ── 5: the obsolete recipe ids still resolve — not deleted, save-compatible ──

const recoverFirstRecipe = RUNE_RECIPE_DATABASE.get("rune-recipe-recover-first");
const fleeRecipe = RUNE_RECIPE_DATABASE.get("rune-recipe-flee");
assert(!!recoverFirstRecipe, "rune-recipe-recover-first must still resolve (save/id stability)");
assert(!!fleeRecipe, "rune-recipe-flee must still resolve (save/id stability)");
assert(recoverFirstRecipe?.deprecated === true, "rune-recipe-recover-first is flagged deprecated");
assert(fleeRecipe?.deprecated === true, "rune-recipe-flee is flagged deprecated");

// ── 3/4: neither obsolete recipe can be crafted as a normal live purchase ──

const essencesBefore = { ...player.tracksProgression.essences };
const craftedBefore = [...player.tracksProgression.runeRecipesCrafted];

const recoverFirstResult = craftRuneRecipe(world, player, "rune-recipe-recover-first");
assert(!recoverFirstResult.success, "crafting the deprecated Recover First recipe must fail");
assert(
  !player.tracksProgression.runeRecipesCrafted.includes("rune-recipe-recover-first"),
  "Recover First must not be recorded as crafted",
);

const fleeResult = craftRuneRecipe(world, player, "rune-recipe-flee");
assert(!fleeResult.success, "crafting the deprecated Flee recipe must fail");
assert(
  !player.tracksProgression.runeRecipesCrafted.includes("rune-recipe-flee"),
  "Flee must not be recorded as crafted",
);

assert(
  JSON.stringify(player.tracksProgression.essences) === JSON.stringify(essencesBefore),
  "no essence may be spent attempting either deprecated recipe",
);
assert(
  JSON.stringify(player.tracksProgression.runeRecipesCrafted) === JSON.stringify(craftedBefore),
  "the crafted-recipes list must be unchanged",
);

// A live, non-deprecated Cave rune recipe must still craft normally, proving
// the deprecation check does not over-fire on ordinary recipes.
const carefulPullingResult = craftRuneRecipe(world, player, "rune-recipe-careful-pulling");
assert(carefulPullingResult.success, "a normal, non-deprecated recipe must still craft successfully");
assert(
  player.tracksProgression.runeRecipesCrafted.includes("rune-recipe-careful-pulling"),
  "Careful Pulling must be recorded as crafted",
);

console.log("runeRecipeDeprecation.test.ts: ok");
