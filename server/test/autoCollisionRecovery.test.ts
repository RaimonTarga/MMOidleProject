import {
  GAME_CONFIG,
  aabbHalfExtents,
  emptyEquipment,
  hitboxGap,
  posHitboxFromEntity,
} from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import { steerTowardTarget } from "../src/systems/combat/ai/autoTarget";
import { updateMovement } from "../src/systems/world/movement";
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
      combatArchetype: "cadence",
    },
  };
}

const nodeId = "node-t1-forest-01";
const world = new World();
const player = world.attachPlayerEntity(playerSlices("tree-player", nodeId), "tree-player");
const trunk = world.collision
  .staticRegions(nodeId)
  .filter((region) => region.kind === "block" && region.data?.blockTarget === "player")
  .sort((a, b) => {
    const aWidth = a.shape.kind === "ellipse" ? a.shape.halfW : Number.POSITIVE_INFINITY;
    const bWidth = b.shape.kind === "ellipse" ? b.shape.halfW : Number.POSITIVE_INFINITY;
    return aWidth - bWidth;
  })[0];
if (!trunk || trunk.shape.kind !== "ellipse") throw new Error("forest tree trunk not found");

const playerPad = aabbHalfExtents(posHitboxFromEntity(player).rects);
player.hasPosition.current = {
  x: trunk.shape.x - trunk.shape.halfW - playerPad.x - 9,
  y: trunk.shape.y,
};
const monster = world.createMonster(nodeId, "forest-slime", { x: 400, y: 400 });
if (!monster) throw new Error("failed to create forest target");
const monsterPad = aabbHalfExtents(posHitboxFromEntity(monster).rects);
monster.hasPosition.current = {
  x: trunk.shape.x + trunk.shape.halfW + monsterPad.x + 1,
  y: trunk.shape.y,
};

// Force the close-range branch which previously selected direct steering solely
// from actor distance, despite the trunk occupying the segment between them.
player.performsAttack.attackRange = 40;
steerTowardTarget(world, player, monster, 1_000);

assert(player.isMoving !== undefined, "autoplay should keep moving around a blocking tree");
assert(
  player.hasMovePath !== undefined && player.hasMovePath.waypoints.length > 0,
  "a close target behind a tree must retain an A* route instead of blocked direct steering",
);

let reached = false;
for (let i = 0; i < 250; i++) {
  const now = 1_100 + i * 100;
  steerTowardTarget(world, player, monster, now);
  updateMovement(world, 100, now);
  if (world.collision.canReach(player, monster, player.performsAttack.attackRange)) {
    reached = true;
    break;
  }
}
assert(
  reached,
  `autoplay should finish routing around the tree and reach its target; player=${JSON.stringify(player.hasPosition.current)} target=${JSON.stringify(monster.hasPosition.current)} gap=${hitboxGap(posHitboxFromEntity(player), posHitboxFromEntity(monster))} moving=${!!player.isMoving} path=${JSON.stringify(player.hasMovePath)}`,
);

console.log("autoCollisionRecovery.test.ts: ok");
