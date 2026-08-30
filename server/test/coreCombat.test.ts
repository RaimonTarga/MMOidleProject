// Integration wiring for the core mechanics that need a real World: where
// core.recovery-mult lands, the Duelist same-target listener, and both
// mobility clauses.
//
// Run: pnpm --filter @mmo-idle/server exec tsx --conditions=development test/coreCombat.test.ts

import {
  ABILITY_DATABASE,
  abilityCooldownMs,
  GAME_CONFIG,
  STARTER_RUNE_IDS,
  applyStatusEffect,
  emptyEquipment,
  getCounter,
  getCooldown,
  getResource,
  getString,
  setCounter,
  setCooldown,
  setResource,
  setString,
} from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import { World } from "../src/world/World";
import { initCombatSystems } from "../src/systems/combatBootstrap";
import { applyHealToPlayer } from "../src/systems/defense/regen/healing";
import { recalculatePlayerEntityStats } from "../src/ecs/playerEntityFormulas";
import { emitCombatEvent, type CombatContext } from "../src/systems/combat/engine/combatPipeline";
import { runMonsterAttack, runPlayerAttack } from "../src/systems/combat/engine/combat";
import {
  abilityCooldownKey,
  techniqueCooldownMs,
} from "../src/systems/player/abilities/abilityCooldowns";
import { equipItem } from "../src/systems/player/economy/inventory";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function makePlayerSlices(id: string): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: "Core Tester" },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: "node-5-5", speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: {
      hp: GAME_CONFIG.PLAYER_MAX_HP,
      maxHp: GAME_CONFIG.PLAYER_MAX_HP,
      recovery: GAME_CONFIG.PLAYER_RECOVERY,
    },
    tracksProgression: {
      level: 0, skillPoints: 0,
      essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      catalysts: {}, catalystProgress: {}, biomeXP: {}, biomeLevel: {},
      unlockedRecipes: [], questProgress: {}, playerTier: 4, currentSkillTier: 0,
      bossesCleared: [], clearedNodes: [],
      runesOwned: [...STARTER_RUNE_IDS], runeRecipesCrafted: [], runesEquipped: [],
      knownAbilities: [], equippedAbilities: { technique: null, guard: null },
      knownStances: [], equippedStances: { default: null }, activeStance: null,
      knownRites: [], equippedRites: [],
    },
    holdsInventory: { inventory: [], equipment: { ...emptyEquipment() }, itemUpgrades: {} },
    usesSkills: {
      unlockedSkills: [], passives: {}, selectedClass: null,
      selectedSubVariant: null, selectedRange: null, combatArchetype: null,
    },
  };
}

initCombatSystems();
const world = new World();

// ── core.recovery-mult lands on the Recovery STAT, never on the heal funnel ──
//
// Recovery is the canonical restoration rate and every in-combat regen effect
// activates a fraction of it, so multiplying the rate already covers all of them.
// Applying it a second time per-heal would compound it (a +25% core landing as
// +56%), so applyHealToPlayer must stay neutral.

{
  const player = world.attachPlayerEntity(makePlayerSlices("heal-player"), "heal-player");
  player.hasHealth.maxHp = 1000;

  player.hasHealth.hp = 500;
  applyHealToPlayer(player, player.tracksCombat, 100);
  const baseline = player.hasHealth.hp - 500;
  assert(baseline === 100, `expected an unmodified heal of 100, got ${baseline}`);

  player.usesSkills.passives["core.recovery-mult"] = 0.25;
  player.hasHealth.maxHp = 1000;
  player.hasHealth.hp = 500;
  applyHealToPlayer(player, player.tracksCombat, 100);
  const scaled = player.hasHealth.hp - 500;
  assert(
    scaled === 100,
    `the heal funnel must not re-apply core.recovery-mult, got ${scaled}`,
  );
}

{
  // The same core DOES scale the rate itself, once, during recalc.
  const player = world.attachPlayerEntity(makePlayerSlices("recovery-stat"), "recovery-stat");
  recalculatePlayerEntityStats(world, player);
  const base = player.hasHealth.recovery ?? 0;
  assert(
    base === GAME_CONFIG.PLAYER_RECOVERY,
    `expected the naked baseline Recovery ${GAME_CONFIG.PLAYER_RECOVERY}, got ${base}`,
  );

  player.usesSkills.unlockedSkills = [];
  player.holdsInventory.equipment.core = "core-survivalist";
  recalculatePlayerEntityStats(world, player);
  const boosted = player.hasHealth.recovery ?? 0;
  assert(
    boosted > base,
    `a recovery-mult core should raise the Recovery stat, got ${boosted} vs ${base}`,
  );
}

// ── Duelist Focus rewards consecutive direct hits, not monster categories ──

{
  const player = world.attachPlayerEntity(makePlayerSlices("focus-player"), "focus-player");
  player.usesSkills.passives["core.focus-damage-per-hit-mult"] = 0.1;
  player.usesSkills.passives["core.focus-max-stacks"] = 3;

  const firstTarget = world.createMonster("node-5-5", "plains-slime", { x: 500, y: 400 });
  const secondTarget = world.createMonster("node-5-5", "plains-slime", { x: 600, y: 400 });
  if (!firstTarget || !secondTarget) throw new Error("failed to create focus targets");

  const hit = (defender: typeof firstTarget, metadata: Record<string, unknown> = {}): number => {
    const ctx = {
      attacker: player, attackerType: "player",
      defender, defenderType: "monster",
      damage: 100, platingMult: 1, drPierce: 0, cancelled: false, metadata,
    } as unknown as CombatContext;
    emitCombatEvent("onHit", ctx, world);
    return ctx.damage;
  };

  assert(hit(firstTarget) === 110, "the first direct hit should earn one Focus stack");
  assert(hit(firstTarget) === 120, "a consecutive hit should earn the next Focus stack");
  assert(hit(firstTarget) === 130, "Focus should reach its authored cap");
  assert(hit(firstTarget) === 130, "Focus must remain capped");
  assert(hit(secondTarget) === 110, "switching targets should reset Focus to one stack");

  const summonHit = hit(secondTarget, { aggroSource: { id: "minion-1", kind: "minion" } });
  assert(summonHit === 100, "a summon hit must not receive or advance owner-only Duelist Focus");
  assert(hit(secondTarget) === 120, "the ignored summon hit must not alter the owner's Focus count");
}

// ── Mobility clauses key off the `mobility` ability tag ────────────────────

// Charge is the only ability tagged `mobility` today. If that ever changes, these
// two cores widen automatically — which is the intent, not a gap.
// Core swaps are legal in combat and preserve unrelated live combat state.
{
  const player = world.attachPlayerEntity(makePlayerSlices("swap-player"), "swap-player");
  player.usesSkills.selectedRange = "cadence-range-close";
  player.holdsInventory.equipment.core = "core-duelist";
  player.holdsInventory.inventory = ["core-tempered"];
  setCounter(player.tracksCombat, "class.ramp", 7);
  setResource(player.tracksCombat, "class.resource", 42);
  setCooldown(player.tracksCombat, "ability.cooldown", 3_000);
  setString(player.tracksCombat, "class.mode", "charged");
  setCounter(player.tracksCombat, "core.duelist-focus-stacks", 5);
  setString(player.tracksCombat, "core.duelist-target-id", "old-target");
  applyStatusEffect(player.tracksCombat, {
    id: "test-preserved-status", sourceId: player.isPlayer.id, remainingMs: 2_000,
  });

  assert(equipItem(world, player, "core-tempered"), "Core swap should succeed");
  assert(getCounter(player.tracksCombat, "class.ramp") === 7, "Core swap must preserve class counters");
  assert(getResource(player.tracksCombat, "class.resource") === 42, "Core swap must preserve resources");
  assert(getCooldown(player.tracksCombat, "ability.cooldown") === 3_000, "Core swap must preserve cooldowns");
  assert(getString(player.tracksCombat, "class.mode") === "charged", "Core swap must preserve strings");
  assert(player.tracksCombat.statusEffects.some((effect) => effect.id === "test-preserved-status"), "Core swap must preserve status effects");
  assert(getCounter(player.tracksCombat, "core.duelist-focus-stacks") === 0, "Core swap must clear Duelist stacks");
  assert(getString(player.tracksCombat, "core.duelist-target-id") === "", "Core swap must clear Duelist target state");
}

// Normal DR and the Core DR layer multiply; they never add toward immunity.
{
  const player = world.attachPlayerEntity(makePlayerSlices("dr-player"), "dr-player");
  const monster = world.createMonster("node-5-5", "plains-slime", { x: 700, y: 500 });
  if (!monster) throw new Error("failed to create DR test monster");
  player.hasHealth.maxHp = 1_000;
  player.hasHealth.hp = 1_000;
  player.mitigatesDamage.plating = 0;
  player.mitigatesDamage.damageReduction = 0.5;
  player.usesSkills.passives["core.dr-layer-pct"] = 0.5;
  monster.dealsDamage.attack = 100;
  runMonsterAttack(world, monster, player, 10_000);
  assert(
    player.hasHealth.hp === 975,
    `50% normal DR x 50% Core DR should take 25 damage, got ${1_000 - player.hasHealth.hp}`,
  );
}

// Catalyst magnifies an existing owner stat and grants no on-hit damage itself.
// Because summons inherit owner stats, the magnitude also flows through a minion
// attack without making that attack an owner-only event.
{
  const player = world.attachPlayerEntity(makePlayerSlices("catalyst-player"), "catalyst-player");
  const target = world.createMonster("node-5-5", "plains-slime", { x: 750, y: 550 });
  if (!target) throw new Error("failed to create Catalyst target");
  target.hasHealth.maxHp = 5_000;
  target.hasHealth.hp = 5_000;
  target.mitigatesDamage.plating = 0;
  target.mitigatesDamage.damageReduction = 0;
  player.dealsDamage.attack = 100;
  player.dealsDamage.onHitDamage = 0;
  player.usesSkills.passives["core.onhit-mult"] = 1.15;

  runPlayerAttack(world, player, target, 1_000, {
    attackOrigin: { ...player.hasPosition.current },
    aggroSource: { id: player.isPlayer.id, kind: "player" },
  });
  assert(5_000 - target.hasHealth.hp === 100, "Catalyst must grant no damage when on-hit is zero");

  target.hasHealth.hp = 5_000;
  player.dealsDamage.onHitDamage = 20;
  runPlayerAttack(world, player, target, 2_000, {
    attackOrigin: { ...player.hasPosition.current },
    aggroSource: { id: "minion-1", kind: "minion" },
  });
  assert(
    5_000 - target.hasHealth.hp === 143,
    `Catalyst should scale inherited on-hit to 43 while leaving 100 direct damage, got ${5_000 - target.hasHealth.hp}`,
  );
}

const mobilityAbility = [...ABILITY_DATABASE.values()].find(
  (a) => a.slot === "technique" && a.tags?.includes("mobility"),
);
assert(!!mobilityAbility, "expected at least one technique tagged `mobility`");
const plainAbility = [...ABILITY_DATABASE.values()].find(
  (a) => a.slot === "technique" && !a.tags?.includes("mobility"),
);
assert(!!plainAbility, "expected at least one technique NOT tagged `mobility`");
// Cooldowns are authored PER RANK, so the expectation has to read the same rank
// the fixture's player tier resolves to.
const FIXTURE_TIER = 4;
const MOB_CD = abilityCooldownMs(mobilityAbility!, FIXTURE_TIER);
const PLAIN_CD = abilityCooldownMs(plainAbility!, FIXTURE_TIER);

{
  const player = world.attachPlayerEntity(makePlayerSlices("mob-player"), "mob-player");
  player.usesSkills.passives["core.mobility-cooldown-reduction-pct"] = 0.2;

  const mobCd = techniqueCooldownMs(player, mobilityAbility!);
  assert(
    mobCd === MOB_CD * 0.8,
    `mobility ability cooldown should be cut 20%, got ${mobCd}`,
  );

  const plainCd = techniqueCooldownMs(player, plainAbility!);
  assert(
    plainCd === PLAIN_CD,
    `a non-mobility technique must be unaffected, got ${plainCd}`,
  );

  // The reduction sums with technique CDR before ONE cap, rather than compounding
  // past it — otherwise a Scout core plus a cooldown weapon makes repositioning free.
  player.usesSkills.passives["technique.cooldown-reduction-pct"] = 0.8;
  const capped = techniqueCooldownMs(player, mobilityAbility!);
  assert(
    Math.abs(capped - MOB_CD * 0.1) < 1e-9,
    `stacked reductions must clamp at the 0.9 cap, got ${capped}`,
  );
}

// ── Kills refund part of the mobility cooldown ─────────────────────────────

{
  const player = world.attachPlayerEntity(makePlayerSlices("kill-player"), "kill-player");
  player.usesSkills.passives["core.mobility-refund-on-kill-pct"] = 0.4;
  player.tracksProgression.equippedAbilities.techniques = [mobilityAbility!.id, plainAbility!.id];

  const victim = world.createMonster("node-5-5", "plains-slime", { x: 700, y: 400 });
  if (!victim) throw new Error("failed to create victim");

  const mobKey = abilityCooldownKey(mobilityAbility!.id);
  const plainKey = abilityCooldownKey(plainAbility!.id);
  setCooldown(player.tracksCombat, mobKey, MOB_CD);
  setCooldown(player.tracksCombat, plainKey, PLAIN_CD);

  const ctx = {
    attacker: player, attackerType: "player",
    defender: victim, defenderType: "monster",
    damage: 999, platingMult: 1, drPierce: 0, cancelled: false, metadata: {},
  } as unknown as CombatContext;
  emitCombatEvent("onKill", ctx, world);

  // Refund is a fraction of the FULL cooldown, not of what remains, so a kill is
  // worth the same whenever it lands.
  const expected = MOB_CD * 0.6;
  assert(
    Math.abs(getCooldown(player.tracksCombat, mobKey) - expected) < 1e-9,
    `mobility cooldown should drop by 40% of full, got ${getCooldown(player.tracksCombat, mobKey)}`,
  );
  assert(
    getCooldown(player.tracksCombat, plainKey) === PLAIN_CD,
    "a non-mobility technique's cooldown must not be refunded",
  );

  setCooldown(player.tracksCombat, mobKey, MOB_CD);
  ctx.metadata.physicalSource = "summon";
  emitCombatEvent("onKill", ctx, world);
  assert(
    getCooldown(player.tracksCombat, mobKey) === MOB_CD,
    "a summon kill must not trigger the owner's Bruiser cooldown refund",
  );
}

console.log("coreCombat: ok");
