// Integration wiring for the core mechanics that need a real World: where
// core.recovery-mult lands, the Duelist elite/boss damage listener, and both
// mobility clauses.
//
// Run: pnpm --filter @mmo-idle/server exec tsx --conditions=development test/coreCombat.test.ts

import {
  ABILITY_DATABASE,
  GAME_CONFIG,
  MONSTER_DATABASE,
  STARTER_RUNE_IDS,
  emptyEquipment,
  getCooldown,
  setCooldown,
} from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import { World } from "../src/world/World";
import { initCombatSystems } from "../src/systems/combatBootstrap";
import { applyHealToPlayer } from "../src/systems/defense/regen/healing";
import { recalculatePlayerEntityStats } from "../src/ecs/playerEntityFormulas";
import { emitCombatEvent, type CombatContext } from "../src/systems/combat/engine/combatPipeline";
import {
  abilityCooldownKey,
  techniqueCooldownMs,
} from "../src/systems/player/abilities/abilityCooldowns";

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

// ── core.elite-damage-mult applies to elites/bosses only ───────────────────

{
  const player = world.attachPlayerEntity(makePlayerSlices("elite-player"), "elite-player");
  player.usesSkills.passives["core.elite-damage-mult"] = 0.5;

  const elite = world.createMonster("node-5-5", "cragback-rhino", { x: 500, y: 400 });
  const normal = world.createMonster("node-5-5", "plains-slime", { x: 600, y: 400 });
  if (!elite || !normal) throw new Error("failed to create test monsters");

  // Guard the fixture: if the roster ever re-flags these, the test below would pass
  // for the wrong reason.
  assert(
    MONSTER_DATABASE.get(elite.isMonster.monsterTypeId)?.elite === true,
    "fixture expects cragback-rhino to be flagged elite",
  );
  assert(
    !MONSTER_DATABASE.get(normal.isMonster.monsterTypeId)?.elite,
    "fixture expects plains-slime NOT to be flagged elite",
  );

  const hit = (defender: typeof elite): number => {
    const ctx = {
      attacker: player, attackerType: "player",
      defender, defenderType: "monster",
      damage: 100, platingMult: 1, drPierce: 0, cancelled: false, metadata: {},
    } as unknown as CombatContext;
    emitCombatEvent("onHit", ctx, world);
    return ctx.damage;
  };

  assert(hit(elite) === 150, `elite should take +50%, got ${hit(elite)}`);
  assert(hit(normal) === 100, `a normal monster should take base damage, got ${hit(normal)}`);
}

// ── Mobility clauses key off the `mobility` ability tag ────────────────────

// Charge is the only ability tagged `mobility` today. If that ever changes, these
// two cores widen automatically — which is the intent, not a gap.
const mobilityAbility = [...ABILITY_DATABASE.values()].find(
  (a) => a.slot === "technique" && a.tags?.includes("mobility"),
);
assert(!!mobilityAbility, "expected at least one technique tagged `mobility`");
const plainAbility = [...ABILITY_DATABASE.values()].find(
  (a) => a.slot === "technique" && !a.tags?.includes("mobility"),
);
assert(!!plainAbility, "expected at least one technique NOT tagged `mobility`");

{
  const player = world.attachPlayerEntity(makePlayerSlices("mob-player"), "mob-player");
  player.usesSkills.passives["core.mobility-cooldown-reduction-pct"] = 0.2;

  const mobCd = techniqueCooldownMs(player, mobilityAbility!);
  assert(
    mobCd === mobilityAbility!.cooldownMs * 0.8,
    `mobility ability cooldown should be cut 20%, got ${mobCd}`,
  );

  const plainCd = techniqueCooldownMs(player, plainAbility!);
  assert(
    plainCd === plainAbility!.cooldownMs,
    `a non-mobility technique must be unaffected, got ${plainCd}`,
  );

  // The reduction sums with technique CDR before ONE cap, rather than compounding
  // past it — otherwise a Scout core plus a cooldown weapon makes repositioning free.
  player.usesSkills.passives["technique.cooldown-reduction-pct"] = 0.8;
  const capped = techniqueCooldownMs(player, mobilityAbility!);
  assert(
    Math.abs(capped - mobilityAbility!.cooldownMs * 0.1) < 1e-9,
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
  setCooldown(player.tracksCombat, mobKey, mobilityAbility!.cooldownMs);
  setCooldown(player.tracksCombat, plainKey, plainAbility!.cooldownMs);

  const ctx = {
    attacker: player, attackerType: "player",
    defender: victim, defenderType: "monster",
    damage: 999, platingMult: 1, drPierce: 0, cancelled: false, metadata: {},
  } as unknown as CombatContext;
  emitCombatEvent("onKill", ctx, world);

  // Refund is a fraction of the FULL cooldown, not of what remains, so a kill is
  // worth the same whenever it lands.
  const expected = mobilityAbility!.cooldownMs * 0.6;
  assert(
    Math.abs(getCooldown(player.tracksCombat, mobKey) - expected) < 1e-9,
    `mobility cooldown should drop by 40% of full, got ${getCooldown(player.tracksCombat, mobKey)}`,
  );
  assert(
    getCooldown(player.tracksCombat, plainKey) === plainAbility!.cooldownMs,
    "a non-mobility technique's cooldown must not be refunded",
  );
}

console.log("coreCombat: ok");
