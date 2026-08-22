/**
 * Wiring smoke test for the player casted-Technique lifecycle
 * (abilities evolution §5.2) — the first player-side cast.
 *
 * Asserts the four beats that make a cast a real cost/payoff trade:
 *   1. Firing a `cast`-shaped Technique attaches `isCastingAbility`, NOT
 *      `hasArmedAbility`, and telegraphs `player-cast-start`.
 *   2. The wind-up holds until its duration elapses, then resolves and damages.
 *   3. Hard CC during the wind-up aborts it with no payload and NO cooldown —
 *      an interrupted cast must not be punished twice.
 *   4. `technique.cast-speed-pct` shortens the wind-up.
 *
 * Behaviour, not balance: exact damage is never asserted.
 */
import {
  ABILITY_DATABASE,
  GAME_CONFIG,
  STARTER_RUNE_IDS,
  applyStatusEffect,
  emptyEquipment,
  getCooldown,
} from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import { initCombatSystems } from "../src/systems/combatBootstrap";
import { setAttackTarget } from "../src/systems/combat/ai/targeting";
import { updateAbilityFiring } from "../src/systems/player/abilities/abilityFiring";
import { updateAbilityCasts } from "../src/systems/player/abilities/abilityCasting";
import { abilityCooldownKey } from "../src/systems/player/abilities/abilityCooldowns";
import { STUN_EFFECT } from "../src/systems/combat/status/stun";
import { World } from "../src/world/World";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function makePlayerSlices(id: string): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: "Caster" },
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
      playerTier: 2,
      currentSkillTier: 0,
      bossesCleared: [],
      clearedNodes: [],
      runesOwned: [...STARTER_RUNE_IDS],
      runeRecipesCrafted: [],
      runesEquipped: [],
      knownAbilities: ["charged-strike"],
      equippedAbilities: { techniques: ["charged-strike"], guards: [] },
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

const CHARGED_STRIKE = ABILITY_DATABASE.get("charged-strike");
if (!CHARGED_STRIKE) throw new Error("charged-strike ability missing");
const CAST_MS = CHARGED_STRIKE.castMs ?? 0;
assert(CAST_MS > 0, "a cast-shaped ability must declare a castMs wind-up");

initCombatSystems();

// ── 1. Firing starts a wind-up, not an armed charge ──────────────────────────
const world = new World();
const player = world.attachPlayerEntity(makePlayerSlices("cast-player"), "cast-player");
const target = world.createMonster("node-5-5", "plains-slime", { x: 430, y: 400 });
if (!target) throw new Error("failed to create target");
setAttackTarget(world, player, target.isMonster.id);

const t0 = 1_000_000;
updateAbilityFiring(world, t0);

assert(
  player.isCastingAbility?.abilityId === "charged-strike",
  "firing a cast-shaped Technique should attach isCastingAbility",
);
assert(
  player.hasArmedAbility === undefined,
  "a cast must NOT also arm the next attack — one offensive channel only",
);
assert(
  getCooldown(player.tracksCombat, abilityCooldownKey("charged-strike")) === 0,
  "a cast pays its cooldown on resolve, not on begin",
);

const startEvents = world
  .takeNodeEvents("node-5-5")
  .filter((e) => e.kind === "player-cast-start");
assert(
  startEvents.length === 1,
  `beginning a cast should queue one player-cast-start (got ${startEvents.length})`,
);

// ── 2. The wind-up holds, then resolves ──────────────────────────────────────
updateAbilityCasts(world, t0 + CAST_MS - 1);
assert(
  player.isCastingAbility !== undefined,
  "the cast should still be winding up before its duration elapses",
);

const hpBefore = target.hasHealth.hp;
updateAbilityCasts(world, t0 + CAST_MS);
assert(
  player.isCastingAbility === undefined,
  "the cast should clear once its wind-up completes",
);
assert(
  target.hasHealth.hp < hpBefore,
  "a resolved cast should damage the target it was started against",
);
assert(
  getCooldown(player.tracksCombat, abilityCooldownKey("charged-strike")) > 0,
  "a RESOLVED cast should start its cooldown",
);

const endEvents = world
  .takeNodeEvents("node-5-5")
  .filter((e) => e.kind === "player-cast-end");
assert(
  endEvents.length === 1 && endEvents[0].kind === "player-cast-end" && endEvents[0].fired,
  "a resolved cast should queue one player-cast-end with fired: true",
);

// ── 3. Hard CC interrupts, costs nothing ─────────────────────────────────────
const world2 = new World();
const player2 = world2.attachPlayerEntity(makePlayerSlices("cast-player-2"), "cast-player-2");
const target2 = world2.createMonster("node-5-5", "plains-slime", { x: 430, y: 400 });
if (!target2) throw new Error("failed to create second target");
setAttackTarget(world2, player2, target2.isMonster.id);

updateAbilityFiring(world2, t0);
assert(!!player2.isCastingAbility, "second player should begin a cast");

applyStatusEffect(player2.tracksCombat, {
  id: STUN_EFFECT,
  maxStacks: 1,
  remainingMs: 2000,
  refreshable: true,
  sourceId: target2.isMonster.id,
  data: { totalMs: 2000 },
});

const hp2Before = target2.hasHealth.hp;
updateAbilityCasts(world2, t0 + 10);
assert(
  player2.isCastingAbility === undefined,
  "a stun during the wind-up should abort the cast",
);
assert(
  target2.hasHealth.hp === hp2Before,
  "an interrupted cast must deal no damage",
);
assert(
  getCooldown(player2.tracksCombat, abilityCooldownKey("charged-strike")) === 0,
  "an interrupted cast must NOT burn its cooldown",
);

const abortEvents = world2
  .takeNodeEvents("node-5-5")
  .filter((e) => e.kind === "player-cast-end");
assert(
  abortEvents.length === 1 &&
    abortEvents[0].kind === "player-cast-end" &&
    !abortEvents[0].fired,
  "an interrupted cast should report fired: false so the client clears the bar",
);

// ── 4. Cast speed shortens the wind-up ───────────────────────────────────────
const world3 = new World();
const player3 = world3.attachPlayerEntity(makePlayerSlices("cast-player-3"), "cast-player-3");
const target3 = world3.createMonster("node-5-5", "plains-slime", { x: 430, y: 400 });
if (!target3) throw new Error("failed to create third target");
setAttackTarget(world3, player3, target3.isMonster.id);
player3.usesSkills.passives["technique.cast-speed-pct"] = 0.25;

updateAbilityFiring(world3, t0);
assert(
  (player3.isCastingAbility?.castMs ?? CAST_MS) < CAST_MS,
  "technique.cast-speed-pct should shorten the wind-up",
);

console.log("abilityCast.test.ts: ok");
