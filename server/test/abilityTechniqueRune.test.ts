import {
  ABILITY_EXPOSE_WEAKNESS_FX,
  EXPOSE_WEAKNESS_EFFECT_ID,
  GAME_CONFIG,
  STARTER_RUNE_IDS,
  emptyEquipment,
  getStatusEffect,
} from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import { initCombatSystems } from "../src/systems/combatBootstrap";
import { updateRuneDerivedConfig } from "../src/systems/combat/ai/runeConfig";
import { setAttackTarget } from "../src/systems/combat/ai/targeting";
import { runPlayerAttack } from "../src/systems/combat/engine/combat";
import { updateAbilityFiring } from "../src/systems/player/abilities/abilityFiring";
import { World } from "../src/world/World";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function makePlayerSlices(): PersistedPlayerSlices {
  return {
    isPlayer: { id: "technique-rune-player", name: "Technique Rune" },
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
      runesOwned: [...STARTER_RUNE_IDS],
      runeRecipesCrafted: [],
      runesEquipped: [{ conditionId: "in-combat", actionId: "fire-technique" }],
      knownAbilities: ["expose-weakness"],
      equippedAbilities: { techniques: ["expose-weakness"], guards: [] },
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
const player = world.attachPlayerEntity(makePlayerSlices(), "technique-rune-player");
const target = world.createMonster("node-5-5", "plains-slime", { x: 430, y: 400 });
if (!target) throw new Error("failed to create target");

setAttackTarget(world, player, target.isMonster.id);
updateRuneDerivedConfig(world, 1_000);
updateAbilityFiring(world, Date.now());

assert(
  player.hasArmedAbility?.abilityId === "expose-weakness",
  "In Combat -> Fire Technique should arm Expose Weakness when off cooldown",
);

const hpBefore = target.hasHealth.hp;
const baseDamage = player.dealsDamage.attack;
const outcome = runPlayerAttack(world, player, target, 1_100, {
  attackOrigin: player.hasPosition.current,
  aggroSource: { id: player.isPlayer.id, kind: "player" },
});
assert(outcome === "hit" || outcome === "killed", "armed Expose Weakness attack should land");
assert(player.hasArmedAbility === undefined, "Technique should be consumed by the hit");

const dealt = hpBefore - Math.max(0, target.hasHealth.hp);
assert(
  dealt === Math.round(baseDamage * 1.15),
  `Expose Weakness I should increase its landed hit by 15% (${dealt} !== ${Math.round(baseDamage * 1.15)})`,
);

const exposed = getStatusEffect(target.tracksCombat, EXPOSE_WEAKNESS_EFFECT_ID);
assert(!!exposed, "Expose Weakness should apply its target debuff");
assert(
  exposed.remainingMs === 4000 && exposed.data.damageTakenPct === 0.15,
  "Expose Weakness I should last 4s and increase damage taken by 15%",
);

const hit = world
  .takeNodeEvents("node-5-5")
  .find((event) => event.kind === "player-hit");
assert(!!hit && hit.kind === "player-hit", "expected a player-hit event");
assert(
  hit.effects?.includes(ABILITY_EXPOSE_WEAKNESS_FX),
  "Expose Weakness should tag the hit so the client plays its Technique FX",
);

updateRuneDerivedConfig(world, 1_200);
updateAbilityFiring(world, Date.now());
assert(
  player.hasArmedAbility === undefined,
  "Technique should not re-arm again while its cooldown is still running",
);

console.log("abilityTechniqueRune.test.ts: ok");
