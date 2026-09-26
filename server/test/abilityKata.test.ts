/**
 * KATA — the Desert technique staff's rhythm (2026-09-26).
 *
 * Three strike Techniques build stacks, the fourth spends them and resolves with
 * `technique.kata-power-pct` extra Technique Power, the fifth starts over. The
 * Sunmonk's Warstaff must actually grant the passives when equipped.
 *
 * Run: pnpm --filter @mmo-idle/server exec tsx --conditions=development test/abilityKata.test.ts
 */
import {
  GAME_CONFIG,
  STARTER_RUNE_IDS,
  emptyEquipment,
  getStatusEffect,
  setCooldown,
} from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import { syncArchetypeSlices } from "../src/ecs/archetypeSliceSync";
import { recalculatePlayerEntityStats } from "../src/ecs/playerEntityFormulas";
import { setAttackTarget } from "../src/systems/combat/ai/targeting";
import { initCombatSystems } from "../src/systems/combatBootstrap";
import { updateAbilityCasts } from "../src/systems/player/abilities/abilityCasting";
import { abilityCooldownKey } from "../src/systems/player/abilities/abilityCooldowns";
import { KATA_EFFECT_ID } from "../src/systems/player/abilities/abilityKata";
import { fireWithReferenceWiring } from "./fixtures/abilityWiring";
import { World } from "../src/world/World";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function slices(id: string, weapon: string | null): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: "node-5-5", speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: GAME_CONFIG.PLAYER_MAX_HP, maxHp: GAME_CONFIG.PLAYER_MAX_HP, recovery: GAME_CONFIG.PLAYER_RECOVERY },
    tracksProgression: {
      level: 0, skillPoints: 0,
      essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      catalysts: {}, catalystProgress: {}, biomeXP: {}, biomeLevel: {}, unlockedRecipes: [], questProgress: {},
      playerTier: 4, currentSkillTier: 4, bossesCleared: [], clearedNodes: [],
      runesOwned: [...STARTER_RUNE_IDS], runeRecipesCrafted: [], runesEquipped: [],
      knownAbilities: ["power-strike"], attunedAbilities: { techniques: ["power-strike"], guards: [] },
      knownStances: [], equippedStances: { default: null }, activeStance: null, knownRites: [], equippedRites: [],
    },
    holdsInventory: {
      inventory: weapon ? [weapon] : [],
      equipment: { ...emptyEquipment(), weapon },
      itemUpgrades: {},
    },
    usesSkills: {
      unlockedSkills: [], passives: {}, selectedClass: null, selectedSubVariant: null, selectedRange: null, combatArchetype: null,
    },
  };
}

initCombatSystems();

// ── 1. The Warstaff grants Kata; its T3 parent does not ─────────────────────
{
  const world = new World();
  const staff = world.attachPlayerEntity(slices("kata-equip", "desert-sunmonk-warstaff"), "kata-equip");
  recalculatePlayerEntityStats(world, staff);
  assert((staff.usesSkills.passives["technique.kata-power-pct"] ?? 0) > 0, "the Warstaff must grant Kata power");
  assert(staff.usesSkills.passives["technique.kata-stacks"] === 3, "the Warstaff must set a 3-stack Kata");

  const t3 = world.attachPlayerEntity(slices("kata-t3", "desert-pilgrim-quarterstaff"), "kata-t3");
  recalculatePlayerEntityStats(world, t3);
  assert((t3.usesSkills.passives["technique.kata-power-pct"] ?? 0) === 0, "Kata is the T4 heir's mechanic only");
  assert((t3.usesSkills.passives["technique.power-pct"] ?? 0) > 0, "the Quarterstaff carries Technique Power");
}

// ── 2. The rhythm: three ordinary strikes, the fourth empowered ──────────────
{
  const world = new World();
  const player = world.attachPlayerEntity(slices("kata-rhythm", null), "kata-rhythm");
  player.usesAutocombat.auto = true;
  syncArchetypeSlices(world, player);
  player.dealsDamage.attack = 100;
  const KATA = 0.8;
  player.usesSkills.passives["technique.kata-power-pct"] = KATA;
  player.usesSkills.passives["technique.kata-stacks"] = 3;

  const target = world.createMonster("node-5-5", "plains-slime", { x: 430, y: 400 });
  if (!target) throw new Error("failed to create target");
  target.hasHealth.hp = target.hasHealth.maxHp = 1_000_000;
  target.mitigatesDamage.plating = 0;
  target.mitigatesDamage.damageReduction = 0;
  target.mitigatesDamage.evasion = 0;
  setAttackTarget(world, player, target.isMonster.id);

  let now = 1_000;
  const damages: number[] = [];
  const stacksAfter: number[] = [];
  for (let i = 0; i < 5; i++) {
    setCooldown(player.tracksCombat, abilityCooldownKey("power-strike"), 0);
    fireWithReferenceWiring(world, now);
    assert(player.isCastingAbility?.abilityId === "power-strike", `cast ${i + 1} must begin`);
    const before = target.hasHealth.hp;
    now += player.isCastingAbility!.castMs;
    updateAbilityCasts(world, now);
    damages.push(before - target.hasHealth.hp);
    stacksAfter.push(getStatusEffect(player.tracksCombat, KATA_EFFECT_ID)?.stacks ?? 0);
    now += 100;
  }

  assert(damages[0] > 0 && damages[0] === damages[1] && damages[1] === damages[2],
    `the first three strikes are ordinary (${damages.join(", ")})`);
  assert(stacksAfter.slice(0, 3).join(",") === "1,2,3", `stacks build 1,2,3 (got ${stacksAfter.join(",")})`);
  // Power Strike's payload multiplier is a Technique Power field: +80% power -> 1.8x.
  assert(Math.abs(damages[3] - damages[0] * (1 + KATA)) <= 2,
    `the fourth strike lands with +${KATA * 100}% Technique Power (${damages[3]} vs ${damages[0]})`);
  assert(stacksAfter[3] === 0, "the empowered strike spends the stacks");
  assert(damages[4] === damages[0] && stacksAfter[4] === 1, "the fifth strike starts the rhythm over");
}

// ── 3. No Kata power, no Kata stacks ────────────────────────────────────────
{
  const world = new World();
  const player = world.attachPlayerEntity(slices("kata-none", null), "kata-none");
  player.usesAutocombat.auto = true;
  syncArchetypeSlices(world, player);
  const target = world.createMonster("node-5-5", "plains-slime", { x: 430, y: 400 });
  if (!target) throw new Error("failed to create target");
  target.hasHealth.hp = target.hasHealth.maxHp = 1_000_000;
  setAttackTarget(world, player, target.isMonster.id);
  fireWithReferenceWiring(world, 1_000);
  updateAbilityCasts(world, 1_000 + (player.isCastingAbility?.castMs ?? 0));
  assert(getStatusEffect(player.tracksCombat, KATA_EFFECT_ID) === undefined, "without the Warstaff, Kata never stacks");
}

console.log("abilityKata: ok");
