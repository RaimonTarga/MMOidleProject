import {
  CLEARING_NODE_ID,
  GAME_CONFIG,
  emptyEquipment,
  emptyEquippedAbilities,
  emptyEquippedRites,
  emptyEquippedStances,
  worldNodeExits,
} from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import { setEntityMotion } from "../src/systems/world/movement";
import { updateTransitions } from "../src/systems/world/transitions";
import { World } from "../src/world/World";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const slices: PersistedPlayerSlices = {
  isPlayer: { id: "travel-discovery-player", name: "Traveler" },
  hasPosition: {
    current: {
      x: GAME_CONFIG.NODE_WIDTH - 1,
      y: GAME_CONFIG.NODE_HEIGHT / 2,
    },
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
    equippedRites: emptyEquippedRites(),
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

const eastNodeId = worldNodeExits(CLEARING_NODE_ID).east;
if (!eastNodeId) throw new Error("clearing must have an east exit for this smoke test");

const world = new World();
const player = world.attachPlayerEntity(slices, slices.isPlayer.id);
setEntityMotion(
  world,
  player,
  { x: GAME_CONFIG.NODE_WIDTH + 100, y: GAME_CONFIG.NODE_HEIGHT / 2 },
  { mode: "direct" },
);

updateTransitions(world);

assert(player.hasPosition.nodeId === eastNodeId, "crossing should move the player east");
assert(
  player.tracksProgression.visitedNodes?.includes(eastNodeId) === true,
  "crossing into another zone should persist the visited node that unlocks the map",
);

console.log("travelDiscovery: ok");
