import {
  GAME_CONFIG,
  NODE_MODIFIERS,
  RECIPE_DATABASE,
  checkReconstruct,
  emptyEquipment,
  modifierRewardMult,
  type EssenceType,
} from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import { grantMonsterRewards } from "../src/systems/player/progression/rewards";
import { World } from "../src/world/World";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function makePlayer(id: string): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: {
      current: { x: 400, y: 400 },
      nodeId: "node-clearing",
      speed: GAME_CONFIG.PLAYER_SPEED,
    },
    hasHealth: {
      hp: GAME_CONFIG.PLAYER_MAX_HP,
      maxHp: GAME_CONFIG.PLAYER_MAX_HP,
      recovery: GAME_CONFIG.PLAYER_RECOVERY,
    },
    tracksProgression: {
      level: 0,
      skillPoints: 0,
      essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      catalysts: {},
      catalystProgress: {},
      biomeXP: {},
      biomeLevel: {},
      unlockedRecipes: [],
      questProgress: {},
      playerTier: 0,
      currentSkillTier: 0,
      bossesCleared: [],
      clearedNodes: [],
      runesOwned: [],
      runeRecipesCrafted: [],
      runesEquipped: [],
      knownAbilities: [],
      equippedAbilities: { technique: null, guard: null },
      knownStances: [],
      equippedStances: { default: null },
      activeStance: null,
      knownRites: [],
      equippedRites: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: [],
      passives: {},
      selectedClass: null,
      selectedSubVariant: null,
      selectedRange: null,
      combatArchetype: null,
    },
  };
}

const world = new World();

// ── Kills grant catalyst progress under the NODE's modifier, and mint ─────────
const alacP = world.attachPlayerEntity(makePlayer("p-alac"), "p-alac");
const FARM_NODE = "node-t1-forest-01";
const farmModifier = NODE_MODIFIERS[FARM_NODE]?.modifier;
assert(farmModifier === "alacrity", "the farm node under test is an alacrity node");
const wolf = world.createMonster(FARM_NODE, "wolf", { x: 800, y: 800 })!;
// Wolf's essence reward (no explicit catalystWeight), scaled by the node modifier's
// reward premium — modifiers are net difficulty increases and pay for themselves.
const weight = Math.round(4 * modifierRewardMult(farmModifier));
const per = GAME_CONFIG.CATALYST_PROGRESS_PER_UNIT;
const kills = 30;
for (let i = 0; i < kills; i++) grantMonsterRewards(world, "p-alac", wolf);
const prog = alacP.tracksProgression;
const total = weight * kills;
assert(prog.catalysts["alacrity"] === Math.floor(total / per), "mints alacrity catalysts");
assert(
  prog.catalystProgress["alacrity"] === total - Math.floor(total / per) * per,
  "carries the alacrity remainder",
);
assert(prog.catalysts["forest"] === undefined, "no biome-keyed catalyst");
assert(prog.catalystProgress["forest"] === undefined, "no biome-keyed progress");

// ── A node without a modifier grants no catalyst ───────────────────────────────
const noneP = world.attachPlayerEntity(makePlayer("p-none"), "p-none");
const clearingWolf = world.createMonster("node-clearing", "wolf", { x: 800, y: 800 })!;
grantMonsterRewards(world, "p-none", clearingWolf);
assert(
  Object.keys(noneP.tracksProgression.catalystProgress).length === 0,
  "clearing kill grants no catalyst progress",
);
assert(
  Object.keys(noneP.tracksProgression.catalysts).length === 0,
  "clearing kill mints no catalyst",
);

// ── Boss first-clear bundle keys by the node's family (when the node has one) ───
const bossP = world.attachPlayerEntity(makePlayer("p-boss"), "p-boss");
const boss = world.createMonster("node-t1-forest-01", "gnarled-greatbear", { x: 800, y: 800 })!;
assert(boss.isMonster.isBoss, "greatbear is a boss");
grantMonsterRewards(world, "p-boss", boss);
const bp = bossP.tracksProgression;
assert((bp.catalysts["alacrity"] ?? 0) >= 5, "boss bundle (5) minted under the family key");
assert(bp.catalysts["forest"] === undefined, "boss bundle not keyed by biome");
assert(bp.bossesCleared.length > 0, "boss clear recorded");

// ── A boss in a dungeon (excluded node) grants no catalyst at all ──────────────
const dbossP = world.attachPlayerEntity(makePlayer("p-dboss"), "p-dboss");
const dboss = world.createMonster("node-t1-forest-dungeon", "gnarled-greatbear", { x: 800, y: 800 })!;
grantMonsterRewards(world, "p-dboss", dboss);
const dbp = dbossP.tracksProgression;
assert(Object.keys(dbp.catalysts).length === 0, "dungeon boss mints no catalyst");
assert(Object.keys(dbp.catalystProgress).length === 0, "dungeon boss adds no catalyst progress");
assert(dbp.bossesCleared.length > 0, "dungeon boss clear still recorded");

// ── A family-keyed catalyst cost blocks and spends correctly ──────────────────
const gale = RECIPE_DATABASE.get("gale-needle")!;
assert(gale.reconstructCatalystCost?.["alacrity"] === 5, "gale-needle reconstruct costs alacrity");
const fullGreen: Record<EssenceType, number> = { red: 0, blue: 0, green: 240, yellow: 0, purple: 0 };
const blocked = checkReconstruct({ recipe: gale, essences: fullGreen, catalysts: {} });
assert(!blocked.ok, "reconstruct blocked without the family catalyst");
const allowed = checkReconstruct({
  recipe: gale,
  essences: fullGreen,
  catalysts: { alacrity: 5 },
});
assert(allowed.ok, "reconstruct allowed once the family catalyst is held");

console.log("catalystRekey.test: ok");
