/**
 * Wiring smoke test for Bramble Guard (abilities evolution §9, T2) — the first
 * reflect mechanic in the game.
 *
 * Asserts:
 *   1. Firing the Guard applies the bramble state.
 *   2. Its plating bonus folds into `mitigatesDamage.plating` while up, and
 *      unwinds EXACTLY once when it expires (a double-unwind would permanently
 *      drain the player's armor).
 *   3. A monster's direct hit takes flat reflect damage back.
 *   4. DoT ticks do NOT reflect — there is no attacker swing to answer.
 *
 * Behaviour, not balance: magnitudes come from the ability def, not this test.
 */
import {
  ABILITY_DATABASE,
  GAME_CONFIG,
  STARTER_RUNE_IDS,
  emptyEquipment,
  getStatusEffect,
} from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import { initCombatSystems } from "../src/systems/combatBootstrap";
import { emitCombatEvent, makeCombatContext } from "../src/systems/combat/engine/combatPipeline";
import { updateCombatState } from "../src/systems/combat/engine/combatState";
import { updateAbilityFiring } from "../src/systems/player/abilities/abilityFiring";
import {
  BRAMBLE_EFFECT_ID,
  runBramblePlating,
} from "../src/systems/player/abilities/abilityBramble";
import { setAggroTarget } from "../src/systems/combat/ai/targeting";
import { World } from "../src/world/World";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function makePlayerSlices(): PersistedPlayerSlices {
  return {
    isPlayer: { id: "bramble-player", name: "Bramble" },
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
      knownAbilities: ["bramble-guard"],
      equippedAbilities: { techniques: [], guards: ["bramble-guard"] },
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

const BRAMBLE = ABILITY_DATABASE.get("bramble-guard");
if (!BRAMBLE || BRAMBLE.effect.kind !== "bramble") {
  throw new Error("bramble-guard ability missing or wrong effect kind");
}

initCombatSystems();

const world = new World();
const player = world.attachPlayerEntity(makePlayerSlices(), "bramble-player");

// Bramble triggers on n-aggro 3, so give it three attackers.
const monsters = [0, 1, 2].map((i) => {
  const m = world.createMonster("node-5-5", "plains-slime", { x: 430 + i * 10, y: 400 });
  if (!m) throw new Error("failed to create monster");
  setAggroTarget(world, m, { id: "bramble-player", kind: "player" }, Date.now());
  return m;
});

const platingBefore = player.mitigatesDamage.plating;

updateAbilityFiring(world, Date.now());
const effect = getStatusEffect(player.tracksCombat, BRAMBLE_EFFECT_ID);
assert(!!effect, "Bramble Guard should apply its state when the n-aggro trigger fires");

// ── Plating folds in, then unwinds exactly once ──────────────────────────────
runBramblePlating(world, player);
assert(
  player.mitigatesDamage.plating > platingBefore,
  "bramble plating should fold into mitigatesDamage while the state is up",
);

// Idempotent: syncing again must not stack the bonus a second time.
const platingDuring = player.mitigatesDamage.plating;
runBramblePlating(world, player);
assert(
  player.mitigatesDamage.plating === platingDuring,
  "re-syncing bramble plating must not apply the bonus twice",
);

// ── Reflect answers a direct monster hit ─────────────────────────────────────
const attacker = monsters[0];
const monsterHpBefore = attacker.hasHealth.hp;
const ctx = makeCombatContext(attacker, "monster", player, "player");
ctx.damage = 25;
emitCombatEvent("afterHit", ctx, world);
assert(
  attacker.hasHealth.hp < monsterHpBefore,
  "a monster landing a direct hit should take bramble reflect damage back",
);

// ── DoT ticks do NOT reflect ─────────────────────────────────────────────────
const dotAttacker = monsters[1];
const dotHpBefore = dotAttacker.hasHealth.hp;
const dotCtx = makeCombatContext(dotAttacker, "monster", player, "player");
dotCtx.damage = 25;
dotCtx.metadata["isDot"] = true;
emitCombatEvent("afterHit", dotCtx, world);
assert(
  dotAttacker.hasHealth.hp === dotHpBefore,
  "a DoT tick has no attacker swing to answer and must not reflect",
);

// ── Expiry unwinds the plating exactly back to baseline ──────────────────────
updateCombatState(world, BRAMBLE.effect.durationMs + 100);
runBramblePlating(world, player);
assert(
  player.mitigatesDamage.plating === platingBefore,
  "expiring bramble should return plating to exactly its pre-buff value",
);

console.log("abilityBramble.test.ts: ok");
