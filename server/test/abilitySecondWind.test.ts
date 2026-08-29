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
import { updateAbilityFiring } from "../src/systems/player/abilities/abilityFiring";
import {
  activeRecoveryFraction,
  runRecovery,
} from "../src/systems/defense/regen/recovery";
import { syncPlayerBuffs } from "../src/systems/combat/buffs/buffSync";
import { World } from "../src/world/World";
import { takeWorldLogEvents } from "../src/world/worldLog";

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
      runesEquipped: [{ conditionId: "in-combat", actionId: "fire-guard" }],
      knownAbilities: ["second-wind"],
      equippedAbilities: { techniques: [], guards: ["second-wind"] },
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
assert(effect.data.recoveryPct === 0.5, "Second Wind status carries its Recovery fraction");
assert(effect.data.totalMs === 4000, "Second Wind lasts four seconds");
assert(player.hasHealth.hp === hpBefore, "Second Wind should not heal instantly");
assert(
  takeWorldLogEvents(world, player.isPlayer.id).some(
    (event) => event.kind === "ability-activation" && event.abilityId === "second-wind",
  ),
  "Second Wind activation should reach bot-visible telemetry",
);
assert(
  Math.abs(activeRecoveryFraction(player, true) - 0.5) < 1e-9,
  "Second Wind should switch on 50% of the player's Recovery",
);
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

// Healing is paid out by the Recovery engine, not a bespoke HoT: at Recovery 10
// and 50% active, one second restores maxHp × (10/100) × 0.5 = 5% of max HP.
runRecovery(world, player, 1000, true);
const perSecond = maxHp * (GAME_CONFIG.PLAYER_RECOVERY / 100) * 0.5;
assert(
  Math.abs(player.hasHealth.hp - (hpBefore + perSecond)) < 0.001,
  `Second Wind should restore ${perSecond} HP in its first second, got ${player.hasHealth.hp - hpBefore}`,
);

// Run out the remaining three seconds, then confirm the window has closed and
// the Recovery it was switching on has gone with it.
runRecovery(world, player, 1000, true);
runRecovery(world, player, 1000, true);
runRecovery(world, player, 1000, true);
assert(
  Math.abs(player.hasHealth.hp - (hpBefore + perSecond * 4)) < 0.001,
  "Second Wind should pay out for its full four seconds",
);

runRecovery(world, player, 100, true);
assert(
  activeRecoveryFraction(player, true) === 0,
  "Second Wind's Recovery access should lapse when the window expires",
);
assert(
  getResource(player.tracksCombat, "recovery.skillMs") === 0,
  "the skill Recovery source should be cleared once it expires",
);

console.log("abilitySecondWind.test.ts: ok");
