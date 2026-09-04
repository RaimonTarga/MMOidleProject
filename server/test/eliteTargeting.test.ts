import {
  DEFAULT_AUTOCOMBAT_CONFIG,
  GAME_CONFIG,
  STARTER_RUNE_IDS,
  emptyEquipment,
} from "@mmo-idle/shared";
import type { EquippedRule } from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import { updateRuneDerivedConfig } from "../src/systems/combat/ai/runeConfig";
import { selectAutoCombatAction } from "../src/systems/combat/ai/targetPriority";
import { setAggroTarget } from "../src/systems/combat/ai/targeting";
import { World } from "../src/world/World";

/**
 * `focus-elites` is a target PREFERENCE, not target ACQUISITION.
 *
 * Until 2026-09-04 this rune was deliberately exempt from the engaged-set
 * narrowing that `focus-lowest-hp` / `focus-highest-max-hp` received, on the
 * argument that reaching a necromancer before it raises the dead is the whole
 * point of the rune. The designer reversed that: an elite across the node is not
 * "the enemy I should be hitting in this fight", it is a DIFFERENT fight, and a
 * preference must never be able to start one the player did not choose.
 *
 * Note that `focus-elites` is a TARGETING rune, and TARGETING actions accept only
 * `in-combat` / `in-party` / `n-aggro-3` (TARGETING_CONDITIONS in
 * shared/src/runeDatabase.ts). It therefore never had a legal "out of combat"
 * loadout at all -- the only reach the old exemption actually bought was the bad
 * case: in combat with one mob, pulled onto a DIFFERENT, unengaged one.
 *
 * These two cases pin both halves of the resulting behaviour:
 *   1. an elite inside the encounter -> still preferred (the rune's real purpose);
 *   2. an elite outside it -> must NOT pull the player off the current fight.
 */

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function makePlayerSlices(id: string, runesEquipped: EquippedRule[]): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: "Elite Focus" },
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
      // "focus-elites" is a T2 rune (cost 2) gated behind a crafted recipe, not a
      // starter rune — attachPlayerEntity re-derives runesOwned from crafted
      // recipes (sanitizing any equipped rule it doesn't own), so the unlock
      // recipe must be present or the equipped rule is silently dropped.
      runesOwned: [...STARTER_RUNE_IDS],
      runeRecipesCrafted: ["rune-recipe-focus-elites"],
      runesEquipped,
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

// ── Case 1: the elite is INSIDE the encounter — still preferred ─────────────
//
// This is what the rune is for: two mobs already on the player, one of them the
// dangerous one. Narrowing to the engaged set must not weaken this.
{
  const world = new World();
  const player = world.attachPlayerEntity(
    makePlayerSlices("elite-focus-fresh", [
      { conditionId: "in-combat", actionId: "focus-elites" },
    ]),
    "elite-focus-fresh",
  );
  Object.assign(player.usesAutocombat, DEFAULT_AUTOCOMBAT_CONFIG, {
    auto: true,
    priorityMode: "nearest",
    acquireRadius: 10_000,
    focusLeaderTarget: false,
  });

  const closerNonElite = world.createMonster("node-5-5", "plains-slime", { x: 500, y: 400 });
  if (!closerNonElite) throw new Error("failed to create closer non-elite target");
  const fartherElite = world.createMonster("node-5-5", "cragback-rhino", { x: 1_200, y: 400 });
  if (!fartherElite) throw new Error("failed to create farther elite target");

  // BOTH mobs are on the player, so both are inside the engaged set.
  const onPlayer = { id: player.isPlayer.id, kind: "player" as const };
  setAggroTarget(world, closerNonElite, onPlayer, 1_100);
  setAggroTarget(world, fartherElite, onPlayer, 1_100);

  // The equipped loadout carries no movement/pathing rules, so
  // updateRuneDerivedConfig re-stamps acquireRadius from the un-ruled default.
  // Re-apply the large test radius afterwards — this call is only here to stamp
  // RUNE_FOCUS_ELITES_FLAG onto tracksCombat.
  updateRuneDerivedConfig(world, 1_100);
  player.usesAutocombat.acquireRadius = 10_000;

  const withinEncounter = selectAutoCombatAction(world, player, player.usesAutocombat, 1_100);
  assert(
    withinEncounter.kind === "attack" &&
      withinEncounter.target.isMonster.id === fartherElite.isMonster.id,
    "an elite inside the encounter should still be preferred over a closer non-elite",
  );
}

// ── Case 2: something engaged — the rune must not start a different fight ───
{
  const world = new World();
  const player = world.attachPlayerEntity(
    makePlayerSlices("elite-focus-engaged", [
      { conditionId: "in-combat", actionId: "focus-elites" },
    ]),
    "elite-focus-engaged",
  );
  Object.assign(player.usesAutocombat, DEFAULT_AUTOCOMBAT_CONFIG, {
    auto: true,
    priorityMode: "nearest",
    acquireRadius: 10_000,
    focusLeaderTarget: false,
  });

  const closerNonElite = world.createMonster("node-5-5", "plains-slime", { x: 500, y: 400 });
  if (!closerNonElite) throw new Error("failed to create closer non-elite target");
  const fartherElite = world.createMonster("node-5-5", "cragback-rhino", { x: 1_200, y: 400 });
  if (!fartherElite) throw new Error("failed to create farther elite target");

  // Baseline: with no focus-elites flag stamped yet, plain "nearest" is a strict
  // distance ordering, so the closer non-elite wins.
  const baseline = selectAutoCombatAction(world, player, player.usesAutocombat, 1_000);
  assert(
    baseline.kind === "attack" && baseline.target.isMonster.id === closerNonElite.isMonster.id,
    "without focus-elites, nearest should still pick the closer non-elite mob",
  );

  // Aggro the closer mob onto the player so `in-combat` holds, then let the
  // focus-elites rune stamp its flag for this tick.
  setAggroTarget(world, closerNonElite, { id: player.isPlayer.id, kind: "player" }, 1_100);
  updateRuneDerivedConfig(world, 1_100);
  player.usesAutocombat.acquireRadius = 10_000;

  const engaged = selectAutoCombatAction(world, player, player.usesAutocombat, 1_100);
  assert(
    engaged.kind === "attack" && engaged.target.isMonster.id === closerNonElite.isMonster.id,
    "with an encounter already running, focus-elites must choose within the engaged set " +
      "and must not pull the player onto an unengaged elite across the node",
  );
}

console.log("eliteTargeting.test.ts: ok");
