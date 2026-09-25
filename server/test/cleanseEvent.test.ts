/**
 * Wiring smoke test for the `player-cleansed` combat event.
 *
 * The HUD uses it to tell a cleanse apart from an ordinary expiry, so it must fire
 * from every active strip (Cleanse guard, Break Free, the passive cleanse pulse)
 * and must NOT fire when nothing actually came off — otherwise the buff bar plays
 * the loud shatter over a quiet expiry.
 *
 * Run: pnpm --filter @mmo-idle/server exec tsx --conditions=development test/cleanseEvent.test.ts
 */
import {
  GAME_CONFIG,
  STARTER_RUNE_IDS,
  VOLCANIC_HEAT_EFFECT_ID,
  applyStatusEffect,
  emptyAttunedAbilities,
  emptyEquipment,
  getStatusEffect,
  isCleanseable,
  type TracksCombat,
} from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import { initCombatSystems } from "../src/systems/combatBootstrap";
import { requestManualAbilityUse } from "../src/systems/player/abilities/abilityFiring";
import { runDebuffCleanse } from "../src/systems/defense/mitigation/debuffCleanse";
import { STUN_EFFECT } from "../src/systems/combat/status/stun";
import { World } from "../src/world/World";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const NODE = "node-5-5";

function makePlayerSlices(id: string, guards: string[], playerTier: number): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: "Cleanse" },
    hasPosition: {
      current: { x: 400, y: 400 },
      nodeId: NODE,
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
      playerTier,
      currentSkillTier: 0,
      bossesCleared: [],
      clearedNodes: [],
      runesOwned: [...STARTER_RUNE_IDS],
      runeRecipesCrafted: [],
      runesEquipped: [],
      knownAbilities: [...guards],
      attunedAbilities: { ...emptyAttunedAbilities(), techniques: [], guards: [...guards] },
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

function paintSlow(cs: TracksCombat): void {
  applyStatusEffect(cs, {
    id: "slow",
    maxStacks: 1,
    remainingMs: 4_000,
    refreshable: true,
    sourceId: "test-monster",
    data: { speedMult: 0.6, totalMs: 4_000 },
  });
}

function cleansedEvents(world: World, playerId: string): number {
  return world
    .takeNodeEvents(NODE)
    .filter((event) => event.kind === "player-cleansed" && event.playerId === playerId).length;
}

initCombatSystems();

// ── Cleanse guard strips a cleanseable debuff → one event ──────────────────────
{
  const world = new World();
  const player = world.attachPlayerEntity(makePlayerSlices("cg", ["cleanse"], 1), "cg");
  paintSlow(player.tracksCombat);
  world.takeNodeEvents(NODE);

  // Manual use, not auto-fire: it enters the same Guard path without depending on
  // how automatic triggers are configured.
  const result = requestManualAbilityUse(world, player, "cleanse", Date.now());
  assert(result.success && result.state === "activated", `Cleanse should activate, got ${JSON.stringify(result)}`);

  assert(!getStatusEffect(player.tracksCombat, "slow"), "Cleanse should strip the slow");
  assert(cleansedEvents(world, "cg") === 1, "a Cleanse that removed stacks must emit exactly one player-cleansed");
}

// ── Cleanse guard facing only an immune effect removes nothing → no event ──────
{
  assert(
    !isCleanseable(VOLCANIC_HEAT_EFFECT_ID, {}),
    "fixture assumes Volcanic Heat is cleanse-immune",
  );
  const world = new World();
  const player = world.attachPlayerEntity(makePlayerSlices("cg-immune", ["cleanse"], 1), "cg-immune");
  applyStatusEffect(player.tracksCombat, {
    id: VOLCANIC_HEAT_EFFECT_ID,
    maxStacks: 99,
    remainingMs: -1,
    refreshable: true,
    sourceId: "biome",
    data: {},
  });
  world.takeNodeEvents(NODE);

  // Whether Cleanse refuses to fire or fires and strips nothing, the event must not appear.
  requestManualAbilityUse(world, player, "cleanse", Date.now());

  assert(cleansedEvents(world, "cg-immune") === 0, "nothing removed must mean no player-cleansed");
}

// ── Break Free removes hard control → one event ────────────────────────────────
{
  const world = new World();
  const player = world.attachPlayerEntity(makePlayerSlices("bf", ["break-free"], 3), "bf");
  applyStatusEffect(player.tracksCombat, {
    id: STUN_EFFECT,
    maxStacks: 1,
    remainingMs: 2_000,
    refreshable: true,
    sourceId: "test-monster",
    data: { totalMs: 2_000 },
  });
  world.takeNodeEvents(NODE);

  const result = requestManualAbilityUse(world, player, "break-free", Date.now());
  assert(result.success && result.state === "activated", `Break Free should activate, got ${JSON.stringify(result)}`);

  assert(!getStatusEffect(player.tracksCombat, STUN_EFFECT), "Break Free should remove the stun");
  assert(cleansedEvents(world, "bf") === 1, "Break Free removing control must emit player-cleansed");
}

// ── Passive cleanse pulse: event only when a stack actually came off ───────────
{
  const world = new World();
  const player = world.attachPlayerEntity(makePlayerSlices("pulse", [], 1), "pulse");
  player.usesSkills.passives["defense.cleanse-stacks"] = 1;
  player.usesSkills.passives["defense.cleanse-interval-ms"] = 1_000;
  world.takeNodeEvents(NODE);

  runDebuffCleanse(world, player);
  assert(cleansedEvents(world, "pulse") === 0, "an empty pulse must not emit player-cleansed");

  player.tracksCombat.cooldowns = {};
  paintSlow(player.tracksCombat);
  runDebuffCleanse(world, player);
  assert(!getStatusEffect(player.tracksCombat, "slow"), "the pulse should strip the slow");
  assert(cleansedEvents(world, "pulse") === 1, "a pulse that removed a stack must emit player-cleansed");
}

console.log("cleanseEvent: ok");
