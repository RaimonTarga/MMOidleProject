import { DEFAULT_RUNE_LOADOUT } from "@mmo-idle/shared";
import {
  GAME_CONFIG,
  STARTER_RUNE_IDS,
  emptyEquipment,
  setFlag,
} from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import { attachComponent, detachComponent } from "../src/ecs/markerHelpers";
import { setAggroTarget, setAttackTarget } from "../src/systems/combat/ai/targeting";
import { RUNE_WAIT_FOR_REGEN_FLAG, updateRuneDerivedConfig } from "../src/systems/combat/ai/runeConfig";
import { updateAutoTargets } from "../src/systems/combat/ai/autoTarget";
import { updateAutoTraverse } from "../src/systems/world/autoTraverse";
import { findShortestNodePath } from "../src/world/nodePath";
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
      runesEquipped: [...DEFAULT_RUNE_LOADOUT],
      knownAbilities: [],
      attunedAbilities: { technique: null, guard: null },
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
const manualTravelPath = findShortestNodePath(player.hasPosition.nodeId, "node-t1-forest-01");
if (!manualTravelPath || manualTravelPath.length < 2) throw new Error("failed to create travel test path");
attachComponent(world, player, "hasAutoTraversePath", {
  targetNodeId: "node-t1-forest-01",
  remainingPath: manualTravelPath.slice(1),
});
updateRuneDerivedConfig(world, 500);
updateAutoIntent(world);
assert(player.hasAutoIntent?.kind === "travel", "manual map travel should publish travel intent");
assert(
  player.hasAutoIntent?.source === "Fight Back",
  "manual travel should identify its configured travel response",
);

// Fight Back may temporarily use the normal target loop even though a map click
// intentionally disabled permanent auto-combat. The original travel path stays
// attached and resumes once the hostile has cleared.
player.tracksProgression.runesEquipped = [
  { conditionId: "while-traveling", actionId: "fight-back" },
  { conditionId: "in-combat", actionId: "chase-enemy" },
];
setAggroTarget(world, target, { id: player.isPlayer.id, kind: "player" }, 1_000);
updateRuneDerivedConfig(world, 1_000);
updateAutoTraverse(world);
assert(player.fightsWhileTraveling !== undefined, "Fight Back pauses an attacked travel route");
updateAutoTargets(world, 1_000);
assert(
  player.isMoving !== undefined,
  "paused travel uses normal target acquisition",
);
setAttackTarget(world, player, null);
setAggroTarget(world, target, null, 2_000);
updateRuneDerivedConfig(world, 2_000);
updateAutoTraverse(world);
assert(player.fightsWhileTraveling === undefined, "travel pause releases after combat clears");
assert(player.hasAutoTraversePath !== undefined, "Fight Back retains the original travel destination");

detachComponent(world, player, "hasAutoTraversePath");
player.usesAutocombat.auto = true;
player.usesAutocombat.priorityMode = "nearest";
player.tracksProgression.runesEquipped = [
  { conditionId: "in-combat", actionId: "focus-closest" },
];
setAttackTarget(world, player, target.isMonster.id);
setAggroTarget(world, target, { id: player.isPlayer.id, kind: 'player' }, 3000);
updateRuneDerivedConfig(world, 3000);
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
setAggroTarget(world, target, null, 4000);
player.hasHealth.hp = player.hasHealth.maxHp / 2;
player.tracksProgression.runesEquipped = [
  { conditionId: "when-idle", actionId: "wait-for-regen" },
];
setFlag(player.tracksCombat, RUNE_WAIT_FOR_REGEN_FLAG, true);
updateRuneDerivedConfig(world, 100000);
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

// Two conditions may target the same action. Attribution must use the winning
// fold entry rather than the first matching action ID in the equipped list.
player.usesAutocombat.auto = true;
player.tracksProgression.runesEquipped = [
  { conditionId: 'hp-below-25', actionId: 'orbit' },
  { conditionId: 'in-combat', actionId: 'orbit' },
  { conditionId: 'in-combat', actionId: 'focus-closest' },
];
player.hasHealth.hp = player.hasHealth.maxHp;
setAttackTarget(world, player, target.isMonster.id);
setAggroTarget(world, target, { id: player.isPlayer.id, kind: 'player' }, 101000);
updateRuneDerivedConfig(world, 101000);
updateAutoIntent(world);
assert(player.hasAutoIntent?.activeRune?.conditionId === 'in-combat', 'trace identifies the matching condition, not an earlier inactive rule');
assert(player.hasAutoIntent?.matchedRunes?.length === 2, 'independent movement and targeting decisions are reported together');
player.hasHealth.hp = player.hasHealth.maxHp * 0.2;
updateRuneDerivedConfig(world, 101100);
updateAutoIntent(world);
assert(player.hasAutoIntent?.activeRune?.conditionId === 'hp-below-25', 'trace changes when the higher priority condition becomes true');
player.usesAutocombat.auto = false;
updateAutoIntent(world);
assert(!player.hasAutoIntent?.matchedRunes, 'manual combat never advertises matching automation');

console.log("autoIntent.test.ts: ok");
