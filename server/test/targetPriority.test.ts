import {
  DEFAULT_AUTOCOMBAT_CONFIG,
  GAME_CONFIG,
  STARTER_RUNE_IDS,
  emptyEquipment,
} from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import { selectAutoCombatAction } from "../src/systems/combat/ai/targetPriority";
import { setAggroTarget } from "../src/systems/combat/ai/targeting";
import { World } from "../src/world/World";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function makePlayerSlices(): PersistedPlayerSlices {
  return {
    isPlayer: { id: "strict-nearest-player", name: "Strict Nearest" },
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
      runesOwned: [...STARTER_RUNE_IDS],
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
      combatArchetype: null,
    },
  };
}

const world = new World();
const player = world.attachPlayerEntity(
  makePlayerSlices(),
  "strict-nearest-player",
);
Object.assign(player.usesAutocombat, DEFAULT_AUTOCOMBAT_CONFIG, {
  auto: true,
  priorityMode: "nearest",
  acquireRadius: 10_000,
  focusLeaderTarget: false,
});

const farther = world.createMonster(
  "node-5-5",
  "plains-slime",
  { x: 1_200, y: 400 },
);
if (!farther) throw new Error("failed to create farther target");

// Seed the selector's sticky current-target state before a closer monster exists.
const initial = selectAutoCombatAction(
  world,
  player,
  player.usesAutocombat,
  1_000,
);
assert(
  initial.kind === "attack" && initial.target.isMonster.id === farther.isMonster.id,
  "single farther target should be selected initially",
);

const closer = world.createMonster(
  "node-5-5",
  "plains-slime",
  { x: 500, y: 400 },
);
if (!closer) throw new Error("failed to create closer target");

// Threat previously outweighed the entire distance difference, while the 25%
// switch margin also favored the existing farther target. Strict-nearest must
// ignore both and move immediately to the closer reachable monster.
setAggroTarget(
  world,
  farther,
  { id: player.isPlayer.id, kind: "player" },
  1_100,
);
const selected = selectAutoCombatAction(
  world,
  player,
  player.usesAutocombat,
  1_100,
);
assert(selected.kind === "attack", "strict-nearest should produce an attack target");
assert(
  selected.kind === "attack" && selected.target.isMonster.id === closer.isMonster.id,
  "strict-nearest should replace a farther sticky/threat target with the closer target",
);

console.log("targetPriority.test.ts: ok");
