import {
  CLEARING_NODE_ID,
  GAME_CONFIG,
  emptyEquipment,
  emptyAttunedAbilities,
  emptyEquippedRites,
  emptyEquippedStances,
  worldNodeExits,
} from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import { setEntityMotion } from "../src/systems/world/movement";
import { updateTransitions } from "../src/systems/world/transitions";
import { World } from "../src/world/World";
import { startNeighborNavigation, updateAutoTraverse } from '../src/systems/world/autoTraverse';
import { updateMovement } from '../src/systems/world/movement';
import { applyManualMoveIntent } from '../src/systems/world/manualMove';

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
    attunedAbilities: emptyAttunedAbilities(),
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

const clickWorld = new World();
const clickSlices = structuredClone(slices);
clickSlices.isPlayer.id = 'neighbor-click';
clickSlices.hasPosition.nodeId = CLEARING_NODE_ID;
clickSlices.hasPosition.current = { x: GAME_CONFIG.NODE_WIDTH - 40, y: 2400 };
const clickPlayer = clickWorld.attachPlayerEntity(clickSlices, 'neighbor-click');
const requested = { x: 320, y: 2400 };
const order = startNeighborNavigation(clickWorld, clickPlayer, eastNodeId, requested);
assert(order.accepted, 'neighbor point accepted');
assert(!startNeighborNavigation(clickWorld, clickPlayer, CLEARING_NODE_ID, requested).accepted, 'same-node request rejected');
assert(!startNeighborNavigation(clickWorld, clickPlayer, eastNodeId, { x: NaN, y: 0 }).accepted, 'invalid coordinates rejected');
assert(!startNeighborNavigation(clickWorld, clickPlayer, eastNodeId, { x: -1, y: 0 }).accepted, 'outside destination rejected');
assert(clickPlayer.hasAutoTraversePath?.destination?.x === requested.x, 'invalid requests preserve the current order');
let finalGoal: { x: number; y: number } | undefined;
for (let tick = 0; tick < 800; tick++) {
  updateAutoTraverse(clickWorld, tick * 100);
  if (clickPlayer.hasPosition.nodeId === eastNodeId && !clickPlayer.hasAutoTraversePath && clickPlayer.hasMovePath) {
    finalGoal = { ...clickPlayer.hasMovePath.waypoints.at(-1)! };
  }
  updateMovement(clickWorld, 100, tick * 100);
  updateTransitions(clickWorld);
  if (finalGoal && !clickPlayer.isMoving) break;
}
assert(clickPlayer.hasPosition.nodeId === eastNodeId, 'neighbor click crosses using authoritative travel');
assert(!!finalGoal && Math.hypot(clickPlayer.hasPosition.current.x - finalGoal.x, clickPlayer.hasPosition.current.y - finalGoal.y) < 0.02,
  'final path reaches its collision-resolved endpoint without a second client order');
assert(!clickPlayer.hasAutoTraversePath && !clickPlayer.hasManualMoveIntent, 'arrival releases movement ownership');

// Stopping at the current point must cancel the retained destination, even
// though a zero-distance move attaches no manual movement marker.
assert(startNeighborNavigation(clickWorld, clickPlayer, CLEARING_NODE_ID, { x: 4600, y: 2400 }).accepted, 'return click accepted');
applyManualMoveIntent(clickWorld, clickPlayer, clickPlayer.hasPosition.current, { mode: 'direct' });
updateAutoTraverse(clickWorld);
assert(!clickPlayer.hasAutoTraversePath && !clickPlayer.isMoving, 'explicit stop cancels both legs');
console.log("travelDiscovery: ok");
