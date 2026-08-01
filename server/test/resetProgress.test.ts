import {
  DEFAULT_RUNE_LOADOUT,
  GAME_CONFIG,
  STARTER_RUNE_IDS,
  emptyEquipment,
  emptyEquippedAbilities,
  emptyEquippedRites,
  emptyEquippedStances,
} from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import { resetPlayerProgress } from "../src/admin/gameActions";
import { World } from "../src/world/World";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const equipment = emptyEquipment();
equipment.weapon = "iron-broadsword";

const slices: PersistedPlayerSlices = {
  isPlayer: { id: "reset-player", name: "Reset Tester" },
  hasPosition: {
    current: { x: 400, y: 400 },
    nodeId: "node-5-5",
    speed: GAME_CONFIG.PLAYER_SPEED,
  },
  hasHealth: {
    hp: 1,
    maxHp: GAME_CONFIG.PLAYER_MAX_HP,
    hpRegen: GAME_CONFIG.PLAYER_HP_REGEN,
  },
  tracksProgression: {
    level: 99,
    skillPoints: 7,
    essences: { red: 10, blue: 20, green: 30, yellow: 40, purple: 50 },
    catalysts: { alacrity: 8, brutality: 3 },
    catalystProgress: { alacrity: 91, volatility: 42 },
    biomeXP: { plains: 500 },
    biomeLevel: { plains: 4 },
    unlockedRecipes: ["recipe-a"],
    questProgress: { "tier-0": 3 },
    playerTier: 4,
    currentSkillTier: 3,
    bossesCleared: ["plains:1"],
    clearedNodes: ["node-4-5"],
    visitedNodes: ["node-4-5"],
    runesOwned: [...STARTER_RUNE_IDS, "focus-elites"],
    runeRecipesCrafted: ["rune-recipe-focus-elites"],
    runesEquipped: [{ conditionId: "target-is-elite", actionId: "focus-elites" }],
    knownAbilities: ["whirlwind"],
    equippedAbilities: { techniques: ["whirlwind"], guards: [] },
    knownStances: ["offensive-stance"],
    equippedStances: { default: "offensive-stance", reactive: null },
    activeStance: "offensive-stance",
    knownRites: ["rite-a"],
    equippedRites: ["rite-a"],
  },
  holdsInventory: {
    inventory: ["iron-broadsword"],
    equipment,
    itemUpgrades: { "iron-broadsword": 4 },
  },
  usesSkills: {
    unlockedSkills: ["cadence"],
    passives: { "cadence.threshold": 3 },
    selectedClass: "cadence",
    selectedSubVariant: "balanced",
    selectedRange: "cadence-range-close",
    combatArchetype: "cadence",
  },
};

const world = new World();
const player = world.attachPlayerEntity(slices, "reset-player");
player.usesAutocombat.auto = true;

const result = resetPlayerProgress(world, player);
assert(result.ok, "reset should succeed");

const progression = player.tracksProgression;
assert(progression.level === 0, "level should return to the fresh-character value");
assert(progression.skillPoints === 0, "skill points should reset");
assert(
  Object.values(progression.essences).every((amount) => amount === 0),
  "all essence balances should reset",
);
assert(Object.keys(progression.catalysts).length === 0, "catalysts should reset");
assert(
  Object.keys(progression.catalystProgress).length === 0,
  "catalyst progress should reset",
);
assert(Object.keys(progression.biomeXP).length === 0, "biome XP should reset");
assert(Object.keys(progression.biomeLevel).length === 0, "biome levels should reset");
assert(progression.unlockedRecipes.length === 0, "recipe unlocks should reset");
assert(Object.keys(progression.questProgress).length === 0, "quest progress should reset");
assert(progression.playerTier === 0, "player tier should reset");
assert(progression.currentSkillTier === 0, "skill tier should reset");
assert(progression.bossesCleared.length === 0, "boss clears should reset");
assert(progression.clearedNodes.length === 0, "node clears should reset");
assert(progression.visitedNodes?.length === 0, "visited nodes should reset");
assert(progression.runeRecipesCrafted.length === 0, "crafted rune recipes should reset");
assert(
  progression.runesOwned.length === STARTER_RUNE_IDS.length,
  "only starter rune fragments should remain",
);
assert(
  JSON.stringify(progression.runesEquipped) === JSON.stringify(DEFAULT_RUNE_LOADOUT),
  "the starter rune loadout should be restored",
);
assert(progression.knownAbilities.length === 0, "known abilities should reset");
assert(
  JSON.stringify(progression.equippedAbilities) ===
    JSON.stringify(emptyEquippedAbilities()),
  "equipped abilities should reset",
);
assert(progression.knownStances.length === 0, "known stances should reset");
assert(
  JSON.stringify(progression.equippedStances) === JSON.stringify(emptyEquippedStances()),
  "equipped stances should reset",
);
assert(progression.activeStance === null, "active stance should reset");
assert(progression.knownRites.length === 0, "known rites should reset");
assert(
  JSON.stringify(progression.equippedRites) === JSON.stringify(emptyEquippedRites()),
  "equipped rites should reset",
);

assert(player.holdsInventory.inventory.length === 0, "inventory should reset");
assert(
  JSON.stringify(player.holdsInventory.equipment) === JSON.stringify(emptyEquipment()),
  "equipment should reset",
);
assert(
  Object.keys(player.holdsInventory.itemUpgrades).length === 0,
  "item upgrades should reset",
);
assert(player.usesSkills.unlockedSkills.length === 0, "unlocked skills should reset");
assert(Object.keys(player.usesSkills.passives).length === 0, "passives should reset");
assert(player.usesSkills.combatArchetype === null, "class mechanics should reset");
assert(!player.usesAutocombat.auto, "auto combat should stop");
assert(player.hasHealth.hp === player.hasHealth.maxHp, "health should refill");

console.log("resetProgress: ok");
