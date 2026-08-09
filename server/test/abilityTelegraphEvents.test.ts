/**
 * Wiring smoke test for the ability telegraph events: arming a Technique queues a
 * `player-technique-armed` node event (armed-text + red cooldown bar on the client)
 * and a firing Guard queues a `player-guard` node event (Guard FX + skill callout).
 */
import { GAME_CONFIG, STARTER_RUNE_IDS, emptyEquipment } from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import { initCombatSystems } from "../src/systems/combatBootstrap";
import { setAttackTarget } from "../src/systems/combat/ai/targeting";
import { updateAbilityFiring } from "../src/systems/player/abilities/abilityFiring";
import { World } from "../src/world/World";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function makePlayerSlices(): PersistedPlayerSlices {
  return {
    isPlayer: { id: "telegraph-player", name: "Telegraph" },
    hasPosition: {
      current: { x: 400, y: 400 },
      nodeId: "node-5-5",
      speed: GAME_CONFIG.PLAYER_SPEED,
    },
    hasHealth: {
      // Below Brace's hp-below 0.5 trigger so the Guard fires this tick.
      hp: Math.round(GAME_CONFIG.PLAYER_MAX_HP * 0.4),
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
      knownAbilities: ["sweep", "brace"],
      equippedAbilities: { techniques: ["sweep"], guards: ["brace"] },
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

initCombatSystems();

const world = new World();
const player = world.attachPlayerEntity(makePlayerSlices(), "telegraph-player");
const target = world.createMonster("node-5-5", "plains-slime", { x: 430, y: 400 });
if (!target) throw new Error("failed to create target");

setAttackTarget(world, player, target.isMonster.id);
updateAbilityFiring(world, Date.now());

assert(
  player.hasArmedAbility?.abilityId === "sweep",
  "in-combat trigger should arm Sweep",
);

const events = world.takeNodeEvents("node-5-5");
const armedEvents = events.filter((e) => e.kind === "player-technique-armed");
assert(
  armedEvents.length === 1,
  `arming a Technique should queue exactly one player-technique-armed event (got ${armedEvents.length})`,
);
assert(
  armedEvents[0].kind === "player-technique-armed" &&
    armedEvents[0].playerId === "telegraph-player" &&
    armedEvents[0].ability === "sweep",
  "player-technique-armed should carry the player id and ability id",
);

const guardEvents = events.filter((e) => e.kind === "player-guard");
assert(
  guardEvents.length === 1,
  `a firing Guard should queue exactly one player-guard event (got ${guardEvents.length})`,
);
assert(
  guardEvents[0].kind === "player-guard" &&
    guardEvents[0].playerId === "telegraph-player" &&
    guardEvents[0].ability === "brace",
  "player-guard should carry the player id and ability id",
);

// While the charge is still armed (and cooldowns run), no duplicate telegraphs.
updateAbilityFiring(world, Date.now());
const repeat = world.takeNodeEvents("node-5-5");
assert(
  repeat.every(
    (e) => e.kind !== "player-technique-armed" && e.kind !== "player-guard",
  ),
  "an already-armed Technique / cooling-down Guard should not re-queue telegraph events",
);

console.log("abilityTelegraphEvents.test.ts: ok");
