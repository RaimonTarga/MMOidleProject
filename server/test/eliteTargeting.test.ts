import {
  DEFAULT_AUTOCOMBAT_CONFIG,
  GAME_CONFIG,
  STARTER_RUNE_IDS,
  emptyEquipment,
} from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import { updateRuneDerivedConfig } from "../src/systems/combat/ai/runeConfig";
import { selectAutoCombatAction } from "../src/systems/combat/ai/targetPriority";
import { setAggroTarget } from "../src/systems/combat/ai/targeting";
import { World } from "../src/world/World";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function makePlayerSlices(): PersistedPlayerSlices {
  return {
    isPlayer: { id: "elite-focus-player", name: "Elite Focus" },
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
      // "focus-elites" is a T2 rune (cost 2) gated behind a crafted recipe, not a
      // starter rune — attachPlayerEntity re-derives runesOwned from crafted
      // recipes (sanitizing any equipped rule it doesn't own), so the unlock
      // recipe must be present or the equipped rule is silently dropped.
      runesOwned: [...STARTER_RUNE_IDS],
      runeRecipesCrafted: ["rune-recipe-focus-elites"],
      runesEquipped: [{ conditionId: "in-combat", actionId: "focus-elites" }],
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
const player = world.attachPlayerEntity(makePlayerSlices(), "elite-focus-player");
Object.assign(player.usesAutocombat, DEFAULT_AUTOCOMBAT_CONFIG, {
  auto: true,
  priorityMode: "nearest",
  acquireRadius: 10_000,
  focusLeaderTarget: false,
});

const closerNonElite = world.createMonster("node-5-5", "plains-slime", {
  x: 500,
  y: 400,
});
if (!closerNonElite) throw new Error("failed to create closer non-elite target");

const fartherElite = world.createMonster("node-5-5", "cragback-rhino", {
  x: 1_200,
  y: 400,
});
if (!fartherElite) throw new Error("failed to create farther elite target");

// Baseline: with no focus-elites rule active, plain "nearest" is a strict distance
// ordering, so the closer non-elite mob wins.
const baseline = selectAutoCombatAction(world, player, player.usesAutocombat, 1_000);
assert(
  baseline.kind === "attack" && baseline.target.isMonster.id === closerNonElite.isMonster.id,
  "without focus-elites, nearest should still pick the closer non-elite mob",
);

// Aggro the closer mob onto the player so `in-combat` holds, then let the
// focus-elites rune stamp its flag for this tick.
setAggroTarget(
  world,
  closerNonElite,
  { id: player.isPlayer.id, kind: "player" },
  1_100,
);
// The equipped loadout only carries the focus-elites rule (no movement/pathing
// rules), so updateRuneDerivedConfig re-stamps usesAutocombat.acquireRadius from
// the un-ruled baseline default. Re-apply the large test radius afterward — we
// only need this call to stamp the RUNE_FOCUS_ELITES_FLAG onto tracksCombat.
updateRuneDerivedConfig(world, 1_100);
player.usesAutocombat.acquireRadius = 10_000;

const withFocusElites = selectAutoCombatAction(
  world,
  player,
  player.usesAutocombat,
  1_100,
);
assert(
  withFocusElites.kind === "attack" &&
    withFocusElites.target.isMonster.id === fartherElite.isMonster.id,
  "focus-elites should override plain nearest and prefer the farther elite-tagged mob",
);

console.log("eliteTargeting.test.ts: ok");
