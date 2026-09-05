import {
  CLEARING_NODE_ID,
  GAME_CONFIG,
  SKILL_TREE,
  STANCE_RECIPE_DATABASE,
  emptyEquipment,
  emptyEquippedAbilities,
  emptyEquippedRites,
  emptyEquippedStances,
  type TierEntryProfile,
} from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import { applyTierEntryProfile } from "../src/admin/gameActions";
import { World } from "../src/world/World";
import { evolveItem } from "../src/systems/player/economy/itemEvolution";
import { craftStanceRecipe, setStanceLoadout } from "../src/systems/player/economy/stanceCrafting";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`assertion failed: ${message}`);
}

const emptyEssences = { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 } as const;

const profile: TierEntryProfile = {
  id: "server-tier-entry-smoke",
  targetTier: 2,
  classRoot: "cadence-root",
  frameId: "cadence-balanced",
  spawnNodeId: "node-t2-sanctuary",
  economyPolicy: "synthetic-combat-progression",
  wallet: {
    essences: { ...emptyEssences, yellow: 123 },
    catalysts: { alacrity: 7 },
    catalystProgress: { alacrity: 2 },
  },
  level: 4,
  skillPoints: 0,
  currentSkillTier: 2,
  biomeLevels: { plains: 6, forest: 6, swamp: 6, mountain: 6, cave: 6 },
  biomeXP: { plains: 999 },
  bossesCleared: ["plains:1", "forest:1", "swamp:1", "mountain:1", "cave:1"],
  clearedNodes: ["plains-01"],
  visitedNodes: ["plains-01", "node-t2-sanctuary"],
  questProgress: { "tier-0": 10, "tier-1": 1 },
  inventory: [],
  equipment: emptyEquipment(),
  itemUpgrades: {},
  knownAbilities: [],
  equippedAbilities: emptyEquippedAbilities(),
  runeRecipesCrafted: [],
  runesEquipped: [],
  knownStances: [],
  equippedStances: emptyEquippedStances(),
  knownRites: [],
  equippedRites: emptyEquippedRites(),
};

function makePlayerSlices(): PersistedPlayerSlices {
  return {
    isPlayer: { id: "tier-entry-player", name: "Tier Entry" },
    hasPosition: {
      current: { x: 1, y: 1 },
      nodeId: CLEARING_NODE_ID,
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
      essences: { ...emptyEssences },
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
      visitedNodes: [],
      runesOwned: [],
      runeRecipesCrafted: [],
      runesEquipped: [],
      knownAbilities: [],
      equippedAbilities: emptyEquippedAbilities(),
      knownStances: [],
      equippedStances: emptyEquippedStances(),
      activeStance: null,
      knownRites: [],
      equippedRites: [],
    },
    holdsInventory: {
      inventory: [],
      equipment: emptyEquipment(),
      itemUpgrades: {},
    },
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
const player = world.attachPlayerEntity(makePlayerSlices(), "tier-entry-player");
player.hasHealth.hp = 1;
player.usesAutocombat.auto = true;
player.usesAutocombat.autoTraverse = true;
player.tracksCombat.cooldowns.stale = 5_000;
player.tracksCombat.flags.stunned = true;
player.tracksCombat.statusEffects.push({
  id: "stale-effect",
  stacks: 1,
  maxStacks: 1,
  remainingMs: 5_000,
  refreshable: false,
  instanced: false,
  sourceId: "stale-source",
  data: {},
});

const result = applyTierEntryProfile(world, player, profile);
assert(result.success, result.reason ?? "profile should apply");
assert(player.hasPosition.nodeId === profile.spawnNodeId, "profile moves player into T2 Sanctuary");
assert(world.countPlayersInNode(profile.spawnNodeId) === 1, "world occupancy follows the move");
assert(world.countPlayersInNode(CLEARING_NODE_ID) === 0, "old node is vacated");
assert(player.tracksProgression.playerTier === 2, "player tier is authoritative profile tier");
assert(player.tracksProgression.biomeLevel.plains === 6, "T1 biome state is applied");
assert(player.tracksProgression.essences.yellow === 123, "essence wallet is applied exactly");
assert(player.tracksProgression.catalysts.alacrity === 7, "catalyst wallet is applied exactly");
assert(player.usesSkills.selectedClass === profile.classRoot, "root class is selected");
assert(
  player.usesSkills.selectedSubVariant === SKILL_TREE.get(profile.frameId)?.subVariantId,
  "frame is selected",
);
assert(player.usesSkills.unlockedSkills.join(",") === "cadence-root,cadence-balanced", "root and frame are selected only");
assert(player.hasHealth.hp === player.hasHealth.maxHp, "entry starts at full HP");
assert(!player.usesAutocombat.auto && !player.usesAutocombat.autoTraverse, "entry disables auto runtime state");
assert(Object.keys(player.tracksCombat.cooldowns).length === 0, "entry clears cooldowns");
assert(Object.keys(player.tracksCombat.flags).length === 0, "entry clears combat flags");
assert(player.tracksCombat.statusEffects.length === 0, "entry clears transient effects");
assert(player.hasStatus.activeBuffs.length === 0, "entry clears visible buffs");
assert(!player.isDead, "entry cannot inherit a corpse");

// One real T1 -> T2 lineage proves the server path the bot executor calls:
// +5 predecessor, exact evolution spend, predecessor consumption, and +0 child.
player.tracksProgression.unlockedRecipes.push("plains-vest-t2");
player.holdsInventory.inventory = ["plains-vest-t1"];
player.holdsInventory.itemUpgrades["plains-vest-t1"] = 5;
const evolution = evolveItem(world, player, "plains-vest-t2", "evolve");
assert(evolution.success, evolution.reason ?? "legal evolution should succeed");
assert(!player.holdsInventory.inventory.includes("plains-vest-t1"), "evolution consumes the predecessor");
assert(player.holdsInventory.inventory.includes("plains-vest-t2"), "evolution grants the child item");
assert(player.tracksProgression.essences.yellow === 63, "evolution deducts its authored essence cost");

player.holdsInventory.inventory = [];
const missingPredecessor = evolveItem(world, player, "plains-vest-t2", "evolve");
assert(!missingPredecessor.success, "evolution rejects an absent predecessor");
player.holdsInventory.inventory = ["plains-vest-t1"];
player.holdsInventory.itemUpgrades["plains-vest-t1"] = 5;
player.tracksProgression.essences.yellow = 0;
const insufficientResources = evolveItem(world, player, "plains-vest-t2", "evolve");
assert(!insufficientResources.success, "evolution rejects insufficient essence without changing mode");
player.holdsInventory.inventory = [];

// Reconstruction is a distinct path: it does not require an owned predecessor.
player.tracksProgression.unlockedRecipes.push("knight-steelsword");
player.tracksProgression.essences.yellow = 180;
const reconstruction = evolveItem(world, player, "knight-steelsword", "reconstruct");
assert(reconstruction.success, reconstruction.reason ?? "supported reconstruction should succeed");
assert(player.holdsInventory.inventory.includes("knight-steelsword"), "reconstruction grants the child item");
assert(player.tracksProgression.essences.yellow === 0, "reconstruction deducts its authored essence cost");

// Stance craft and default assignment are the player-facing build operations;
// no bot-only active-stance mutation is involved.
const stanceRecipe = STANCE_RECIPE_DATABASE.get("stance-recipe-offensive")!;
player.tracksProgression.biomeLevel.plains = 7;
player.tracksProgression.essences.yellow = stanceRecipe.cost.yellow ?? 0;
player.tracksProgression.catalysts.alacrity = 1;
const stance = craftStanceRecipe(world, player, stanceRecipe.id);
assert(stance.success, stance.reason ?? "stance craft should succeed");
assert(player.tracksProgression.knownStances.includes("offensive-stance"), "stance craft learns the stance");
const stanceLoadout = setStanceLoadout(world, player, "default", "offensive-stance");
assert(stanceLoadout.success, stanceLoadout.reason ?? "known stance should equip");
assert(player.tracksProgression.equippedStances.default === "offensive-stance", "default stance is assigned");
assert(player.tracksProgression.activeStance === "offensive-stance", "active stance follows the default");

const rejected = applyTierEntryProfile(world, player, {
  ...profile,
  id: "wrong-spawn",
  spawnNodeId: CLEARING_NODE_ID,
});
assert(!rejected.success && rejected.reason?.includes("Sanctuary"), "non-Sanctuary entry is rejected");

console.log("tierEntryBootstrap.test.ts: ok");
