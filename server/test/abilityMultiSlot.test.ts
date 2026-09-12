/**
 * Wiring smoke test for the multi-slot ability engine (abilities evolution §7).
 *
 * Covers the three invariants the second Technique / Guard slot depends on:
 *   1. Techniques share ONE offensive channel — two equipped, at most one armed.
 *      Loadout order is the arbitration priority.
 *   2. Guards layer independently (own effect id per slot) but only ONE
 *      activation resolves per decision window.
 *   3. `normalizeAttunedAbilities` migrates the legacy `{technique, guard}`
 *      shape and drops ids that no longer fit.
 *
 * Behaviour, not balance: no magnitude is asserted.
 */
import {
  GAME_CONFIG,
  STARTER_RUNE_IDS,
  emptyEquipment,
  applyStatusEffect,
  getCooldown,
  getStatusEffect,
  guardEffectIdForAbility,
  normalizeAttunedAbilities,
} from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import { initCombatSystems } from "../src/systems/combatBootstrap";
import { setAttackTarget } from "../src/systems/combat/ai/targeting";
import { updateAbilityFiring } from "../src/systems/player/abilities/abilityFiring";
import { abilityCooldownKey } from "../src/systems/player/abilities/abilityCooldowns";
import { updateCombatState } from "../src/systems/combat/engine/combatState";
import { World } from "../src/world/World";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function makePlayerSlices(): PersistedPlayerSlices {
  return {
    isPlayer: { id: "multislot-player", name: "Multislot" },
    hasPosition: {
      current: { x: 400, y: 400 },
      nodeId: "node-5-5",
      speed: GAME_CONFIG.PLAYER_SPEED,
    },
    hasHealth: {
      // Below Brace's hp-below 0.5 trigger so both Guards want to fire.
      hp: Math.round(GAME_CONFIG.PLAYER_MAX_HP * 0.4),
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
      // T4: both second slots unlocked.
      playerTier: 4,
      currentSkillTier: 0,
      bossesCleared: [],
      clearedNodes: [],
      runesOwned: [...STARTER_RUNE_IDS],
      runeRecipesCrafted: [],
      runesEquipped: [],
      knownAbilities: ["sweep", "expose-weakness", "brace", "cleanse", "endure"],
      attunedAbilities: {
        techniques: ["sweep", "expose-weakness"],
        guards: ["brace", "endure"],
      },
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

// ── 1. Slot counts are tier-gated ────────────────────────────────────────────
const migrated = normalizeAttunedAbilities({ technique: "sweep", guard: "brace" });
assert(
  migrated.techniques.length === 1 && migrated.techniques[0] === "sweep",
  "the legacy `technique` field should migrate into the techniques list",
);
assert(
  migrated.guards.length === 1 && migrated.guards[0] === "brace",
  "the legacy `guard` field should migrate into the guards list",
);

const renamed = normalizeAttunedAbilities({ technique: "heavy-strike", guard: null });
assert(
  renamed.techniques[0] === "expose-weakness",
  "a renamed ability id should map forward on migration, not be dropped",
);

const dirty = normalizeAttunedAbilities({
  // brace is a GUARD — it must not survive in the techniques list; `sweep`
  // appears twice and must collapse; `nonsense` does not resolve at all.
  techniques: ["sweep", "brace", "sweep", "nonsense"],
  guards: ["cleanse"],
});
assert(
  dirty.techniques.length === 1 && dirty.techniques[0] === "sweep",
  "normalize should drop slot mismatches, duplicates and unknown ids",
);

// ── 3. One offensive channel across two Technique slots ──────────────────────
initCombatSystems();

const world = new World();
const player = world.attachPlayerEntity(makePlayerSlices(), "multislot-player");
player.usesAutocombat.auto = true;
const target = world.createMonster("node-5-5", "plains-slime", { x: 430, y: 400 });
if (!target) throw new Error("failed to create target");
setAttackTarget(world, player, target.isMonster.id);

// Both Guards must WANT to fire, or "the second didn't fire" proves nothing about
// the activation window. Brace and Endure both trigger on hp-below (the fixture
// is already at 40%), and both grant a per-slot DR buff, so the two slots are
// directly comparable. A debuff is painted on as well so the harmful-status path
// stays exercised.
applyStatusEffect(player.tracksCombat, {
  id: "antiheal",
  maxStacks: 3,
  remainingMs: 60_000,
  refreshable: true,
  sourceId: target.isMonster.id,
  data: { totalMs: 60_000 },
});

updateAbilityFiring(world, Date.now());
assert(
  player.hasArmedAbility?.abilityId === "sweep",
  "the FIRST Technique in loadout order should win arbitration",
);
assert(
  getCooldown(player.tracksCombat, abilityCooldownKey("expose-weakness")) === 0,
  "the losing Technique must not be put on cooldown — it stays eligible",
);

// Still armed: the second Technique must not also arm on top of it.
updateAbilityFiring(world, Date.now());
assert(
  player.hasArmedAbility?.abilityId === "sweep",
  "a second Technique must never stack on top of an already-armed one",
);

// Consume the charge; Sweep is now cooling, so the second Technique gets its turn.
world.ecs.removeComponent(player, "hasArmedAbility");
updateAbilityFiring(world, Date.now());
assert(
  player.hasArmedAbility?.abilityId === "expose-weakness",
  "once the first Technique is cooling, the second should arm",
);

// ── 4. Guard slots: independent effects, one activation per window ───────────
const guard0 = getStatusEffect(player.tracksCombat, guardEffectIdForAbility("brace"));
const guard1 = getStatusEffect(player.tracksCombat, guardEffectIdForAbility("endure"));
assert(!!guard0, "the first Guard should have activated on its own effect id");
assert(
  !guard1,
  "the second Guard must not activate in the same decision window as the first",
);

// Next window: the second Guard is free to activate, and both layer.
updateCombatState(world, 100);
updateAbilityFiring(world, Date.now());
const guard1After = getStatusEffect(player.tracksCombat, guardEffectIdForAbility("endure"));
assert(
  !!guard1After,
  "the second Guard should activate on a later window",
);
assert(
  !!getStatusEffect(player.tracksCombat, guardEffectIdForAbility("brace")),
  "already-active Guard buffs should keep running while a second one layers on",
);

console.log("abilityMultiSlot.test.ts: ok");
