import {
  GAME_CONFIG,
  STARTER_RUNE_IDS,
  emptyEquipment,
  setFlag,
} from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import { attachComponent, detachComponent } from "../src/ecs/markerHelpers";
import { setAttackTarget } from "../src/systems/combat/ai/targeting";
import { RUNE_WAIT_FOR_REGEN_FLAG } from "../src/systems/combat/ai/runeConfig";
import { updateAutoIntent } from "../src/systems/world/autoIntent";
import { World } from "../src/world/World";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function playerSlices(): PersistedPlayerSlices {
  return {
    isPlayer: { id: "intent-player", name: "Intent Tester" },
    hasPosition: {
      current: { x: 400, y: 400 },
      nodeId: "node-clearing",
      speed: GAME_CONFIG.PLAYER_SPEED,
    },
    hasHealth: {
      hp: GAME_CONFIG.PLAYER_MAX_HP,
      maxHp: GAME_CONFIG.PLAYER_MAX_HP,
      hpRegen: GAME_CONFIG.PLAYER_HP_REGEN,
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
      equippedStances: { default: null, reactive: null },
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
const player = world.attachPlayerEntity(playerSlices(), "intent-player");

updateAutoIntent(world);
assert(player.hasAutoIntent === undefined, "manual idle should not publish an intent");

const target = world.createMonster(
  player.hasPosition.nodeId,
  "tiny-slime",
  { x: 500, y: 400 },
);
if (!target) throw new Error("failed to create intent target");
setAttackTarget(world, player, target.isMonster.id);
updateAutoIntent(world);
assert(player.hasAutoIntent?.kind === "attack", "engaged combat should publish attack intent");
assert(
  player.hasAutoIntent?.reason === "Locked in battle",
  "manual combat should explain the durable engagement",
);
assert(
  player.hasAutoIntent?.source === "",
  "manual combat should not claim an automation rule",
);

setAttackTarget(world, player, null);
attachComponent(world, player, "hasAutoTraversePath", {
  targetNodeId: "node-t1-forest-01",
  remainingPath: ["node-t1-forest-01"],
});
updateAutoIntent(world);
assert(player.hasAutoIntent?.kind === "travel", "manual map travel should publish travel intent");
assert(
  player.hasAutoIntent?.source === "",
  "manual travel should identify its governing source",
);

detachComponent(world, player, "hasAutoTraversePath");
player.usesAutocombat.auto = true;
player.usesAutocombat.priorityMode = "nearest";
player.tracksProgression.runesEquipped = [
  { conditionId: "in-combat", actionId: "focus-closest" },
];
setAttackTarget(world, player, target.isMonster.id);
updateAutoIntent(world);
assert(player.hasAutoIntent?.kind === "attack", "auto combat should publish attack intent");
assert(
  player.hasAutoIntent?.reason === "Nearest eligible target",
  "auto attack should publish the authoritative targeting reason",
);
assert(
  player.hasAutoIntent?.source === "Pragmatist",
  "auto attack should publish the named governing rule",
);

const stableIntent = player.hasAutoIntent;
updateAutoIntent(world);
assert(
  player.hasAutoIntent === stableIntent,
  "unchanged intent should not churn the networked component",
);

setAttackTarget(world, player, null);
player.hasHealth.hp = player.hasHealth.maxHp / 2;
player.tracksProgression.runesEquipped = [
  { conditionId: "when-idle", actionId: "wait-for-regen" },
];
setFlag(player.tracksCombat, RUNE_WAIT_FOR_REGEN_FLAG, true);
updateAutoIntent(world);
assert(player.hasAutoIntent?.kind === "idle", "maintenance should publish a hold intent");
assert(
  player.hasAutoIntent?.reason === "Waiting to recover to full health",
  "maintenance hold should publish its reason",
);
assert(
  player.hasAutoIntent?.source === "Cautious",
  "maintenance hold should publish its named rune rule",
);

player.usesAutocombat.auto = false;
setFlag(player.tracksCombat, RUNE_WAIT_FOR_REGEN_FLAG, false);
updateAutoIntent(world);
assert(player.hasAutoIntent === undefined, "returning to manual idle should clear intent");

console.log("autoIntent.test.ts: ok");
