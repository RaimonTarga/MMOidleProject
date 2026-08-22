// Regression: a mover standing exactly on its next waypoint must not lose its
// motion component permanently.
//
// `requestNavMotion`'s "existing path is still valid" fast path steers at
// `waypoints[0]`. When the mover is already ON that waypoint the motion vector
// has zero magnitude, so `attachMotionToward` DETACHES `isMoving`. Because
// `world.movingPlayers` is `livePlayers.with("isMoving")` and `processMoverStep`
// (the only caller of `advanceMovePath`) iterates it, the waypoint queue then
// never advances — every later tick re-steers at the same reached waypoint and
// detaches again. The result is the auto-combat wedge: full HP, a live target, a
// planned route, and a player that never moves again.

import { GAME_CONFIG, emptyEquipment } from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import { navigationPadForEntity } from "../src/systems/world/movement";
import { requestNavMotion, setMovePath } from "../src/systems/world/pathMotion";
import { World } from "../src/world/World";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function playerSlices(id: string, nodeId: string): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: {
      current: { x: 400, y: 400 },
      nodeId,
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
      combatArchetype: "cadence",
    },
  };
}

const nodeId = "node-t1-plains-01";
const world = new World();
const player = world.attachPlayerEntity(playerSlices("wedge-player", nodeId), "wedge-player");

const start = { x: 400, y: 400 };
player.hasPosition.current = { ...start };

// A route whose HEAD is the tile the player already occupies — the state reached
// naturally whenever a mover lands exactly on a waypoint.
const goal = { x: 700, y: 400 };
const waypoints = [{ ...start }, { x: 550, y: 400 }, { ...goal }];
setMovePath(world, player, goal, waypoints, "player", false);

const pad = navigationPadForEntity(player);

// Re-request the SAME goal, as auto-combat steering does every tick.
requestNavMotion(world, player, goal, pad);

assert(
  player.isMoving !== undefined,
  "standing on waypoints[0] must not leave the mover without an isMoving component",
);
assert(
  player.hasMovePath !== undefined && player.hasMovePath.waypoints.length === 2,
  `the reached waypoint must be popped; got ${
    player.hasMovePath ? player.hasMovePath.waypoints.length : "no path"
  } remaining`,
);

// The defect's real signature is that the state is ABSORBING: repeated identical
// steering requests never restore motion. Pin that it now self-heals every tick.
for (let i = 0; i < 20; i++) {
  requestNavMotion(world, player, goal, pad);
  assert(
    player.isMoving !== undefined,
    `repeated steering at an unreached goal must keep the mover in motion (iteration ${i})`,
  );
}

console.log("navWaypointWedge: ok");
