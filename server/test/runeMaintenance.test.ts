import {
  DEFAULT_AUTOCOMBAT_CONFIG,
  GAME_CONFIG,
  STARTER_RUNE_IDS,
  deriveAutoConfigFromRunes,
  emptyEquipment,
  getFlag,
} from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import { syncArchetypeSlices } from "../src/ecs/archetypeSliceSync";
import { updateAutoTargets } from "../src/systems/combat/ai/autoTarget";
import { markEngaged } from "../src/systems/combat/ai/engagement";
import { setAttackTarget } from "../src/systems/combat/ai/targeting";
import {
  RUNE_TACTICAL_RELOAD_FLAG,
  RUNE_WAIT_FOR_REGEN_FLAG,
  updateRuneDerivedConfig,
} from "../src/systems/combat/ai/runeConfig";
import { updateReloadArchetype } from "../src/systems/classes/archetypes/reload/reloadPrototype";
import { resolveReloadTimeMs } from "../src/systems/classes/archetypes/reload/reloadLifecycle";
import { setEntityMotion } from "../src/systems/world/movement";
import { World } from "../src/world/World";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function makeReloadPlayerSlices(id: string): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: {
      current: { x: 400, y: 400 },
      nodeId: "node-5-5",
      speed: GAME_CONFIG.PLAYER_SPEED,
    },
    hasHealth: {
      hp: GAME_CONFIG.PLAYER_MAX_HP / 2,
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
      combatArchetype: "reload",
    },
  };
}

const maintenanceRules = [
  { conditionId: "when-idle", actionId: "tactical-reload" },
  { conditionId: "when-idle", actionId: "wait-for-regen" },
];

const folded = deriveAutoConfigFromRunes(maintenanceRules, {
  hpPct: 0.5,
  inCombat: false,
  inParty: false,
  aggroCount: 0,
  combatArchetype: "reload",
});
assert(folded.tacticalReload, "Reload Safely should claim resource maintenance");
assert(folded.waitForRegen, "Cautious should independently claim recovery");

const activeFold = deriveAutoConfigFromRunes(maintenanceRules, {
  hpPct: 0.2,
  inCombat: true,
  inParty: false,
  aggroCount: 1,
  combatArchetype: "reload",
});
assert(!activeFold.tacticalReload, "Reload Safely must not activate during a fight");
assert(!activeFold.waitForRegen, "Cautious must not activate during a fight");

const world = new World();
const player = world.attachPlayerEntity(
  makeReloadPlayerSlices("maintenance-player"),
  "maintenance-player",
);
syncArchetypeSlices(world, player);
if (!player.usesReload) throw new Error("reload slice was not attached");
Object.assign(player.usesAutocombat, DEFAULT_AUTOCOMBAT_CONFIG, {
  auto: true,
  focusLeaderTarget: false,
});
player.tracksProgression.runesEquipped = maintenanceRules;
player.usesReload.ammoMax = 10;
player.usesReload.ammo = 5;
player.usesReload.reloadingMs = 0;

const defeated = world.createMonster(
  "node-5-5",
  "plains-slime",
  { x: 550, y: 400 },
);
if (!defeated) throw new Error("failed to create cleanup target");
setAttackTarget(world, player, defeated.isMonster.id);
world.removeMonsterEntity(defeated.isMonster.id);
assert(
  player.hasAttackTarget === undefined,
  "removing a defeated monster should immediately clear player attack targets",
);

// A recent engagement blocks actual HP regeneration, but should no longer block
// the recovery runes from stopping scouting immediately after threats are gone.
markEngaged(world, player, 1_000);
updateRuneDerivedConfig(world);
assert(
  getFlag(player.tracksCombat, RUNE_TACTICAL_RELOAD_FLAG),
  "Reload Safely runtime flag should be active",
);
assert(
  getFlag(player.tracksCombat, RUNE_WAIT_FOR_REGEN_FLAG),
  "Cautious runtime flag should be active during the regen cooldown",
);

const tacticalReloadMs = resolveReloadTimeMs(player);
updateReloadArchetype(world, 100);
assert(player.usesReload.ammo === 0, "Reload Safely should start a partial reload");
assert(
  player.usesReload.reloadingMs === tacticalReloadMs - 200,
  "Reload Safely should advance twice as fast while out of combat",
);

setEntityMotion(world, player, { x: 800, y: 400 });
assert(player.isMoving !== undefined, "test setup should start player movement");
updateAutoTargets(world, 1_100);
assert(player.isMoving === undefined, "Cautious should stop autonomous movement");
assert(player.hasMovePath === undefined, "Cautious should clear the active move path");

const noRuneWorld = new World();
const noRunePlayer = noRuneWorld.attachPlayerEntity(
  makeReloadPlayerSlices("no-maintenance-player"),
  "no-maintenance-player",
);
syncArchetypeSlices(noRuneWorld, noRunePlayer);
if (!noRunePlayer.usesReload) throw new Error("reload slice was not attached");
Object.assign(noRunePlayer.usesAutocombat, DEFAULT_AUTOCOMBAT_CONFIG, {
  auto: true,
  focusLeaderTarget: false,
});
noRunePlayer.tracksProgression.runesEquipped = [];
noRunePlayer.usesReload.ammoMax = 10;
noRunePlayer.usesReload.ammo = 5;
noRunePlayer.usesReload.reloadingMs = 0;
updateRuneDerivedConfig(noRuneWorld);
updateReloadArchetype(noRuneWorld, 100);
assert(noRunePlayer.usesReload.ammo === 5, "partial clip must remain without the rune");
assert(
  noRunePlayer.usesReload.reloadingMs === 0,
  "partial reload must not start without Reload Safely",
);

// Empty-clip reload remains core class behavior, but without Reload Safely it
// advances at normal speed instead of receiving the OOC acceleration.
noRunePlayer.usesReload.ammo = 0;
noRunePlayer.usesReload.reloadingMs = 1_000;
updateReloadArchetype(noRuneWorld, 100);
assert(
  noRunePlayer.usesReload.reloadingMs === 900,
  "empty-clip reload should continue at normal speed without the rune",
);

const nextTarget = noRuneWorld.createMonster(
  "node-5-5",
  "plains-slime",
  { x: 700, y: 400 },
);
if (!nextTarget) throw new Error("failed to create movement target");
updateAutoTargets(noRuneWorld, 1_200);
assert(
  noRunePlayer.isMoving !== undefined,
  "reloading without Reload Safely should not pause autonomous movement",
);

console.log("runeMaintenance.test.ts: ok");
