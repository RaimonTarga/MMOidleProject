import {
  ABILITY_GUARD_EFFECT_ID,
  ABILITY_SECOND_WIND_EFFECT_ID,
  GAME_CONFIG,
  STARTER_RUNE_IDS,
  emptyEquipment,
  getResource,
  getStatusEffect,
} from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import { updateRuneDerivedConfig } from "../src/systems/combat/ai/runeConfig";
import { setAttackTarget } from "../src/systems/combat/ai/targeting";
import {
  updateAbilityFiring,
  updateAbilityHealing,
} from "../src/systems/player/abilities/abilityFiring";
import { syncPlayerBuffs } from "../src/systems/combat/buffs/buffSync";
import { World } from "../src/world/World";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function makePlayerSlices(): PersistedPlayerSlices {
  return {
    isPlayer: { id: "second-wind-player", name: "Second Wind" },
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
      runesEquipped: [{ conditionId: "in-combat", actionId: "fire-guard" }],
      knownAbilities: ["second-wind"],
      equippedAbilities: { techniques: [], guards: ["second-wind"] },
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
const player = world.attachPlayerEntity(makePlayerSlices(), "second-wind-player");
const target = world.createMonster("node-5-5", "plains-slime", { x: 430, y: 400 });
if (!target) throw new Error("failed to create target");
setAttackTarget(world, player, target.isMonster.id);

updateRuneDerivedConfig(world, 1_000);
updateAbilityFiring(world, Date.now());
assert(
  getStatusEffect(player.tracksCombat, ABILITY_SECOND_WIND_EFFECT_ID) === undefined,
  "Second Wind should not spend its cooldown at full HP",
);

const maxHp = player.hasHealth.maxHp;
player.hasHealth.hp = maxHp * 0.7;
const hpBefore = player.hasHealth.hp;

updateRuneDerivedConfig(world, 1_100);
updateAbilityFiring(world, Date.now());
const effect = getStatusEffect(player.tracksCombat, ABILITY_SECOND_WIND_EFFECT_ID);
assert(!!effect, "In Combat -> Fire Guard should activate Second Wind when damaged");
assert(effect.data.healPct === 0.3, "Second Wind status carries heal metadata");
assert(effect.data.totalMs === 4000, "Second Wind lasts four seconds");
assert(player.hasHealth.hp === hpBefore, "Second Wind should not heal instantly");
assert(
  getStatusEffect(player.tracksCombat, ABILITY_GUARD_EFFECT_ID) === undefined,
  "Second Wind should not reuse the generic Guard status",
);

syncPlayerBuffs(world, 1_100);
const secondWindBuff = player.hasStatus.activeBuffs?.find(
  (buff) => buff.id === "ability-second-wind",
);
assert(!!secondWindBuff, "Second Wind should project its own buff");
assert(secondWindBuff.iconKey === "second-wind", "Second Wind buff should use its own icon key");
assert(
  !player.hasStatus.activeBuffs?.some((buff) => buff.id === "ability-guard"),
  "Second Wind should not project the generic Guard buff",
);

updateAbilityHealing(world, 1000);
const expectedAfterOneSecond = hpBefore + maxHp * 0.3 * 0.25;
assert(
  Math.abs(player.hasHealth.hp - expectedAfterOneSecond) < 0.001,
  "Second Wind should heal one quarter of its total amount after one second",
);

updateAbilityHealing(world, 3000);
assert(player.hasHealth.hp === maxHp, "Second Wind should finish its heal over four seconds");
assert(
  getResource(player.tracksCombat, "ability.guard.healRemaining") === 0,
  "Second Wind heal pool should be empty after the duration",
);

console.log("abilitySecondWind.test.ts: ok");
