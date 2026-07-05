import {
  GAME_CONFIG,
  STARTER_RUNE_IDS,
  applyStatusEffect,
  emptyEquipment,
  getStatusEffect,
  validRiteIds,
} from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import { recalculatePlayerEntityStats } from "../src/ecs/playerEntityFormulas";
import { updateCombatState } from "../src/systems/combat/engine/combatState";
import { FOREST_HASTE } from "../src/systems/world/mobility/mobilityBoots";
import {
  oocRegenDelay,
  runRiteOoc,
} from "../src/systems/player/rites/riteOoc";
import { World } from "../src/world/World";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function makePlayerSlices(): PersistedPlayerSlices {
  return {
    isPlayer: { id: "rite-player", name: "Rite Tester" },
    hasPosition: {
      current: { x: 400, y: 400 },
      nodeId: "node-5-5",
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
      knownRites: ["cleansing-breath", "lingering-momentum", "quickened-breath"],
      equippedRites: ["cleansing-breath", "lingering-momentum"],
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
const player = world.attachPlayerEntity(makePlayerSlices(), "rite-player");

// Equipping rites folds their `rite.*` mechanicEffects into passives via
// recalculatePlayerStats, the same recalc path craft/equip already use.
recalculatePlayerEntityStats(world, player);
assert(
  player.usesSkills.passives["rite.ooc-cleanse-stacks"] === 1,
  "Cleansing Breath should fold its cleanse-stacks passive",
);
assert(
  player.usesSkills.passives["rite.ooc-cleanse-interval-ms"] === 1000,
  "Cleansing Breath should fold its cleanse-interval passive",
);
assert(
  player.usesSkills.passives["rite.ooc-buff-decay-slowdown-pct"] === 0.5,
  "Lingering Momentum should fold its buff-decay-slowdown passive",
);
assert(
  player.usesSkills.passives["rite.ooc-regen-delay-reduction-pct"] === undefined,
  "an unequipped rite (Quickened Breath) should not fold its passives",
);

// Cleansing Breath: pulse-strips a harmful debuff's stacks on an interval while
// out of combat, gated by its own cooldown (not just presence of the passive).
applyStatusEffect(player.tracksCombat, {
  id: "slow",
  maxStacks: 5,
  remainingMs: -1,
  data: {},
});
applyStatusEffect(player.tracksCombat, { id: "slow", maxStacks: 5, remainingMs: -1, data: {} });
applyStatusEffect(player.tracksCombat, { id: "slow", maxStacks: 5, remainingMs: -1, data: {} });
assert(getStatusEffect(player.tracksCombat, "slow")?.stacks === 3, "setup: slow should carry 3 stacks");

let now = 0;
function advance(ms: number): void {
  now += ms;
  updateCombatState(world, ms);
}

runRiteOoc(world, player, 500, now);
assert(
  getStatusEffect(player.tracksCombat, "slow")?.stacks === 2,
  "Cleansing Breath should strip a stack the first time it runs",
);

advance(500);
runRiteOoc(world, player, 500, now);
assert(
  getStatusEffect(player.tracksCombat, "slow")?.stacks === 2,
  "Cleansing Breath should respect its own pulse cooldown between strips",
);

advance(600);
runRiteOoc(world, player, 600, now);
assert(
  getStatusEffect(player.tracksCombat, "slow")?.stacks === 1,
  "Cleansing Breath should strip another stack once its cooldown clears",
);

// Lingering Momentum: slows the OOC decay of a beneficial, non-harmful timed
// buff by adding back a fraction of the elapsed dt after the duration ticks
// down (net decay = (1 - slowdown) * dt).
applyStatusEffect(player.tracksCombat, {
  id: FOREST_HASTE,
  maxStacks: 1,
  remainingMs: 1000,
  refreshable: true,
  sourceId: player.isPlayer.id,
  data: { speedPct: 0.3, totalMs: 1000 },
});
advance(400);
runRiteOoc(world, player, 400, now);
const haste = getStatusEffect(player.tracksCombat, FOREST_HASTE);
assert(
  haste !== undefined && Math.abs(haste.remainingMs - 800) < 0.001,
  `Lingering Momentum should net-decay the buff by (1 - 0.5) * 400ms (got ${haste?.remainingMs})`,
);

// Quickened Breath: shortens the OOC regen delay read by combat.ts. Swap the
// loadout (both rites share the same folding path) and recalc.
player.tracksProgression.equippedRites = ["quickened-breath"];
recalculatePlayerEntityStats(world, player);
assert(
  player.usesSkills.passives["rite.ooc-regen-delay-reduction-pct"] === 0.5,
  "Quickened Breath should fold its regen-delay-reduction passive",
);
assert(
  Math.abs(oocRegenDelay(player) - GAME_CONFIG.COMBAT_REGEN_DELAY * 0.5) < 0.001,
  "Quickened Breath should halve the effective OOC regen delay",
);

// Persistence: knownRites/equippedRites are filtered through validRiteIds on
// hydrate (server/src/db/playerRepo.ts) so a stale/removed id from an old save
// is dropped instead of surviving the round-trip.
const storedKnown = ["cleansing-breath", "some-retired-rite-id"];
const storedEquipped = ["cleansing-breath", "some-retired-rite-id"];
assert(
  JSON.stringify(validRiteIds(storedKnown)) === JSON.stringify(["cleansing-breath"]),
  "hydrate should drop unknown/retired rite ids from knownRites",
);
assert(
  JSON.stringify(validRiteIds(storedEquipped)) === JSON.stringify(["cleansing-breath"]),
  "hydrate should drop unknown/retired rite ids from equippedRites",
);
assert(
  JSON.stringify(validRiteIds([])) === JSON.stringify([]),
  "hydrate should default a missing/empty rite list to an empty array",
);

console.log("rites.test.ts: ok");
