// Quick authoritative tutorial smoke: the existing Tiny Wisp reward should
// move a fresh player through the dedicated Clearing table without changing
// the First Blood quest or unrelated reward currencies.

import {
  CLEARING_MASTERY_XP_THRESHOLDS,
  GAME_CONFIG,
  emptyEquipment,
} from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import { grantMonsterRewards } from "../src/systems/player/progression/rewards";
import { World } from "../src/world/World";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function freshPlayer(id: string): PersistedPlayerSlices {
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
const player = world.attachPlayerEntity(freshPlayer("clearing-tutorial"), "clearing-tutorial");
const tinyWisp = world.createMonster("node-clearing", "tiny-slime", { x: 800, y: 800 });
assert(tinyWisp !== null, "Clearing should spawn a Tiny Wisp for the tutorial smoke");
if (!tinyWisp) throw new Error("unreachable");

for (let kill = 1; kill <= 20; kill++) {
  const reward = grantMonsterRewards(world, player.isPlayer.id, tinyWisp);
  assert(reward?.biomeXpGained === 43, `Tiny Wisp kill ${kill} keeps its 43 XP reward`);
  if (kill === 10) {
    assert(
      player.tracksProgression.questProgress["tier-0"] === 10,
      "First Blood completes at ten Tiny Wisp kills",
    );
    assert(player.tracksProgression.playerTier === 1, "First Blood still advances the player to T1");
    assert(player.tracksProgression.biomeLevel.clearing === 3, "First Blood lands at Clearing level 3");
  }
}

const progression = player.tracksProgression;
assert(progression.biomeXP.clearing === CLEARING_MASTERY_XP_THRESHOLDS[4], "twenty kills reach the Clearing cap XP");
assert(progression.biomeLevel.clearing === 4, "twenty kills reach Clearing mastery level 4");
assert(progression.essences.green === 20, "existing Tiny Wisp essence rewards remain unchanged");
assert(progression.level === 20, "existing Tiny Wisp player-level rewards remain unchanged");
assert(Object.keys(progression.catalysts).length === 0, "Clearing still grants no catalysts");
console.log("clearingMastery.test.ts: all passed");
