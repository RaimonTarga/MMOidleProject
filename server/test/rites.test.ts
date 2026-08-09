import {
  GAME_CONFIG,
  STARTER_RUNE_IDS,
  applyStatusEffect,
  emptyEquipment,
  runeBudgetForGlobalMastery,
  runicPointLoadoutCost,
  initUsesEnergy,
  validRiteIds,
} from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import { abilityCooldownKey } from "../src/systems/player/abilities/abilityCooldowns";
import { applyCombatEndRites, combatExitDelay, initRiteListeners } from "../src/systems/player/rites/riteOoc";
import { markEngaged, updateCombatTransitions } from "../src/systems/combat/ai/engagement";
import { World } from "../src/world/World";
import { emitCombatEvent, makeCombatContext } from "../src/systems/combat/engine/combatPipeline";

function assert(condition: boolean, message: string): void { if (!condition) throw new Error(message); }

function makePlayerSlices(): PersistedPlayerSlices {
  return {
    isPlayer: { id: "rite-player", name: "Rite Tester" },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: "node-5-5", speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: GAME_CONFIG.PLAYER_MAX_HP, maxHp: GAME_CONFIG.PLAYER_MAX_HP, hpRegen: GAME_CONFIG.PLAYER_HP_REGEN },
    tracksProgression: {
      level: 0, skillPoints: 0,
      essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 }, catalysts: {}, catalystProgress: {},
      biomeXP: {}, biomeLevel: {}, unlockedRecipes: [], questProgress: {}, playerTier: 0, currentSkillTier: 0,
      bossesCleared: [], clearedNodes: [], runesOwned: [...STARTER_RUNE_IDS], runeRecipesCrafted: [], runesEquipped: [],
      knownAbilities: ["brace"], equippedAbilities: { techniques: [], guards: ["brace"] },
      knownStances: [], equippedStances: { default: null }, activeStance: null,
      knownRites: [...validRiteIds(["lingering-battle", "swift-repose", "purification", "mechanic-renewal", "ability-reprieve", "blood-offering"])],
      equippedRites: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
    usesSkills: { unlockedSkills: [], passives: {}, selectedClass: null, selectedSubVariant: null, selectedRange: null, combatArchetype: "energy" },
  };
}

const world = new World();
const player = world.attachPlayerEntity(makePlayerSlices(), "rite-player");
player.usesEnergy = initUsesEnergy();

player.tracksProgression.equippedRites = ["swift-repose"];
assert(combatExitDelay(player, 5_000) === 2_500, "Swift Repose should halve the shared boundary timer");
player.tracksProgression.equippedRites = ["lingering-battle"];
assert(combatExitDelay(player, 5_000) === 7_500, "Lingering Battle should extend the shared boundary timer");
player.tracksProgression.equippedRites = ["swift-repose", "lingering-battle"];
assert(combatExitDelay(player, 5_000) === 5_000, "opposed timing rites should cancel cleanly");

applyStatusEffect(player.tracksCombat, { id: "slow", maxStacks: 5, remainingMs: -1, sourceId: "monster", data: {} });
applyStatusEffect(player.tracksCombat, { id: "antiheal", maxStacks: 1, remainingMs: -1, sourceId: "monster", data: {} });
applyStatusEffect(player.tracksCombat, { id: "slow", maxStacks: 1, remainingMs: 1_000, sourceId: "node-feature:pool", data: { isNodeFeature: 1 } });
player.tracksProgression.equippedRites = ["purification", "mechanic-renewal", "ability-reprieve"];
player.usesEnergy!.energy = 0;
player.tracksCombat.cooldowns[abilityCooldownKey("brace")] = 10_000;
applyCombatEndRites(world, player);
assert(!player.tracksCombat.statusEffects.some((e) => e.sourceId === "monster"), "Purification should remove all carried harmful instances");
assert(player.tracksCombat.statusEffects.some((e) => e.sourceId.startsWith("node-feature:")), "active source-owned hazards should remain authoritative");
assert(player.usesEnergy!.energy === player.usesEnergy!.energyMax * 0.3, "Mechanic Renewal should restore class readiness");
assert(player.tracksCombat.cooldowns[abilityCooldownKey("brace")] === 7_000, "Ability Reprieve should reduce remaining cooldown by 30%");

// The transition owns one-shot combat-end execution and clears its marker.
player.tracksProgression.equippedRites = ["ability-reprieve"];
player.tracksCombat.cooldowns[abilityCooldownKey("brace")] = 10_000;
markEngaged(world, player, 1_000);
updateCombatTransitions(world, 7_000);
const afterFirst = player.tracksCombat.cooldowns[abilityCooldownKey("brace")];
updateCombatTransitions(world, 8_000);
assert(afterFirst === 7_000 && player.tracksCombat.cooldowns[abilityCooldownKey("brace")] === afterFirst, "combat-end effects should fire exactly once");

const victim = world.createMonster("node-5-5", "plains-slime", { x: 450, y: 400 });
if (!victim) throw new Error("setup: victim missing");
initRiteListeners();
player.tracksProgression.equippedRites = ["blood-offering"];
player.hasHealth.hp = player.hasHealth.maxHp * 0.5;
const beforeOffering = player.hasHealth.hp;
const kill = makeCombatContext(player, "player", victim, "monster");
emitCombatEvent("onKill", kill, world);
assert(player.hasHealth.hp === beforeOffering + player.hasHealth.maxHp * 0.05, "Blood Offering should heal through credited onKill events");

const budget = runeBudgetForGlobalMastery(0);
assert(runicPointLoadoutCost({ rules: [], rites: ["mechanic-renewal", "ability-reprieve"] }) > budget, "expensive rites should compete in the shared RP pool");
assert(JSON.stringify(validRiteIds(["purification", "retired"])) === JSON.stringify(["purification"]), "unknown rites should be filtered");

console.log("rites.test.ts: ok");
