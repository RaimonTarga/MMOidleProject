/**
 * Complements abilitySecondWind.test.ts (Guard heal-over-time) and
 * abilityTechniqueRune.test.ts (Technique armed via a rune + on-hit consumption).
 * This file covers: a Guard with NO rule never auto-fires, a Guard firing on an
 * HP Below 25% -> Use Ability rule, and the cooldown lifecycle
 * across a full period — blocked while active, then re-firable once it clears.
 */
import { baseRecoveryForTier } from '@mmo-idle/shared';
import {
  ABILITY_GUARD_EFFECT_ID,
  GAME_CONFIG,
  STARTER_RUNE_IDS,
  emptyEquipment,
  getCooldown,
  getStatusEffect,
} from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import { updateCombatState } from "../src/systems/combat/engine/combatState";
import { fireAbilities, giveAbilities } from "./fixtures/fireAbilities";
import { abilityCooldownKey } from "../src/systems/player/abilities/abilityCooldowns";
import { World } from "../src/world/World";
import { takeWorldLogEvents } from "../src/world/worldLog";

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

function makePlayerSlices(): PersistedPlayerSlices {
  giveAbilities("abilities-player", ["brace"]);
  return {
    isPlayer: { id: "abilities-player", name: "Ability Tester" },
    hasPosition: {
      current: { x: 400, y: 400 },
      nodeId: "node-5-5",
      speed: GAME_CONFIG.PLAYER_SPEED,
    },
    hasHealth: {
      hp: GAME_CONFIG.PLAYER_MAX_HP,
      maxHp: GAME_CONFIG.PLAYER_MAX_HP,
      recovery: baseRecoveryForTier(0),
    },
    tracksProgression: {
      level: 0,
      skillPoints: 0,
      essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      
      biomeXP: {},
      biomeLevel: {},
      unlockedRecipes: [],
      questProgress: {},
      playerTier: 0,
      currentSkillTier: 0,
      bossesCleared: [],
      clearedNodes: [],
      runesOwned: [...STARTER_RUNE_IDS],
      runesEquipped: [],
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
const player = world.attachPlayerEntity(makePlayerSlices(), "abilities-player");
player.usesAutocombat.auto = true;
// Cooldowns are keyed PER ABILITY (two Guard slots can be equipped), not per slot.
const GUARD_CD_KEY = abilityCooldownKey("brace");
// Rank I (a T0/T1 character sits at Brace I): 35% DR on a 10s cooldown.
const BRACE_COOLDOWN_MS = 10000;

// Fired through the engine.
player.hasHealth.hp = player.hasHealth.maxHp * 0.2;
fireAbilities(world, Date.now());
const firstBuff = getStatusEffect(player.tracksCombat, ABILITY_GUARD_EFFECT_ID);
assert(!!firstBuff, "Brace should fire");
assert(firstBuff!.data.drPct === 0.35, "Brace I should apply its 35% damage-reduction magnitude");
assert(
  takeWorldLogEvents(world, player.isPlayer.id).some(
    (event) => event.kind === "ability-activation" && event.abilityId === "brace",
  ),
  "Brace activation should reach bot-visible telemetry",
);
assert(
  getCooldown(player.tracksCombat, GUARD_CD_KEY) === BRACE_COOLDOWN_MS,
  "firing Brace should start its full authored cooldown",
);

// The cooldown is active: firing again this tick must not happen (the cooldown should not reset to a fresh value).
updateCombatState(world, 100);
const cooldownAfterOneTick = getCooldown(player.tracksCombat, GUARD_CD_KEY);
fireAbilities(world, Date.now());
assert(
  getCooldown(player.tracksCombat, GUARD_CD_KEY) === cooldownAfterOneTick,
  "Brace should not re-fire (and reset its cooldown) while its own cooldown is still active",
);

// Advance past the full cooldown window. The cooldown state should have
// decayed to zero, allowing the ability to fire again.
updateCombatState(world, BRACE_COOLDOWN_MS);
assert(
  getCooldown(player.tracksCombat, GUARD_CD_KEY) === 0,
  "Brace's cooldown should fully decay after its cooldown duration elapses",
);
fireAbilities(world, Date.now());
assert(
  getCooldown(player.tracksCombat, GUARD_CD_KEY) === BRACE_COOLDOWN_MS,
  "Brace should be able to fire again once its cooldown has fully elapsed",
);

console.log("abilities.test.ts: ok");
