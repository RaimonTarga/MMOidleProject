/**
 * Complements abilitySecondWind.test.ts (Guard heal-over-time + rune-suppression
 * of the built-in trigger) and abilityTechniqueRune.test.ts (Technique armed via
 * a rune override + on-hit consumption). This file covers what neither does:
 * a Guard ability firing on its BUILT-IN trigger (no rune override equipped) and
 * the cooldown lifecycle across a full period — blocked while active, then
 * re-firable once it clears.
 */
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
import { updateAbilityFiring } from "../src/systems/player/abilities/abilityFiring";
import { abilityCooldownKey } from "../src/systems/player/abilities/abilityCooldowns";
import { World } from "../src/world/World";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function makePlayerSlices(): PersistedPlayerSlices {
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
      // No fire-guard rune equipped: Brace must fire on its own built-in trigger.
      runesEquipped: [],
      knownAbilities: ["brace"],
      equippedAbilities: { techniques: [], guards: ["brace"] },
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
const player = world.attachPlayerEntity(makePlayerSlices(), "abilities-player");
// Cooldowns are keyed PER ABILITY (two Guard slots can be equipped), not per slot.
const GUARD_CD_KEY = abilityCooldownKey("brace");
const BRACE_COOLDOWN_MS = 7000;

// Full HP: Brace's `hp-below 0.5` trigger should not fire.
updateAbilityFiring(world, Date.now());
assert(
  getStatusEffect(player.tracksCombat, ABILITY_GUARD_EFFECT_ID) === undefined,
  "Brace should not fire on its built-in trigger above the hp-below threshold",
);

// Drop below 50% HP: the built-in trigger (no rune override equipped) should fire.
player.hasHealth.hp = player.hasHealth.maxHp * 0.4;
updateAbilityFiring(world, Date.now());
const firstBuff = getStatusEffect(player.tracksCombat, ABILITY_GUARD_EFFECT_ID);
assert(!!firstBuff, "Brace should fire on its built-in hp-below trigger with no rune override");
assert(firstBuff.data.drPct === 0.4, "Brace should apply its 40% damage-reduction magnitude");
assert(
  getCooldown(player.tracksCombat, GUARD_CD_KEY) === BRACE_COOLDOWN_MS,
  "firing Brace should start its full 7s cooldown",
);

// Still below the threshold, but the cooldown is active: firing again this tick
// must not happen (the cooldown should not reset to a fresh value).
updateCombatState(world, 100);
const cooldownAfterOneTick = getCooldown(player.tracksCombat, GUARD_CD_KEY);
updateAbilityFiring(world, Date.now());
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
updateAbilityFiring(world, Date.now());
assert(
  getCooldown(player.tracksCombat, GUARD_CD_KEY) === BRACE_COOLDOWN_MS,
  "Brace should be able to fire again once its cooldown has fully elapsed",
);

console.log("abilities.test.ts: ok");
