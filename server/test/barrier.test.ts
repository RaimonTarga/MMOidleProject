// The barrier is a permanent pool that refills only after a quiet window, so the
// things worth pinning are the ones a wiring mistake would silently break: that
// the pool is sized from gear at recalc (and only there), that wards spend ahead
// of it, and that taking damage RESTARTS the delay rather than pausing it.
//
// Numbers here are mechanic invariants (does it drain, does it stop, does it
// refill), never balance values — every expectation is derived from whatever the
// items and config actually say.

import {
  GAME_CONFIG,
  ITEM_DATABASE,
  STARTER_RUNE_IDS,
  emptyEquipment,
} from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import { recalculatePlayerEntityStats } from "../src/ecs/playerEntityFormulas";
import { initCombatSystems } from "../src/systems/combatBootstrap";
import { runMonsterAttack } from "../src/systems/combat/engine/combat";
import {
  runBarrierRecharge,
  stampBarrierDamage,
} from "../src/systems/defense/barrier/barrier";
import { applyWard } from "../src/systems/defense/barrier/wards";
import { World } from "../src/world/World";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function makePlayerSlices(): PersistedPlayerSlices {
  return {
    isPlayer: { id: "barrier-player", name: "Barrier Tester" },
    hasPosition: {
      current: { x: 400, y: 400 },
      nodeId: "node-5-5",
      speed: GAME_CONFIG.PLAYER_SPEED,
    },
    hasHealth: { hp: 1_000, maxHp: 1_000, recovery: 0 },
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
      runesEquipped: [],
      knownAbilities: [],
      equippedAbilities: { technique: null, guard: null },
      knownStances: [],
      equippedStances: { default: null },
      activeStance: null,
      knownRites: [],
      equippedRites: [],
    },
    holdsInventory: { inventory: [], equipment: emptyEquipment(), itemUpgrades: {} },
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
const player = world.attachPlayerEntity(makePlayerSlices(), "barrier-player");

// ── Sizing lives only at recalc, and presence is gated by the passive ─────────
//
// The passive comes from a real equipped charm rather than being written into the
// map, because recalc REBUILDS `usesSkills.passives` from scratch — a test that
// poked the key in directly would prove nothing about the wiring. maxHp is moved
// with a real armor piece for the same reason.

assert(player.hasBarrier === undefined, "no barrier-pct means no HasBarrier component");

const CHARM = "mountain-charm-t1";
const ARMOR = "mountain-vest-t1";
const charm = ITEM_DATABASE.get(CHARM);
const armor = ITEM_DATABASE.get(ARMOR);
assert(charm !== undefined, `test needs '${CHARM}' in the item database`);
assert(armor !== undefined, `test needs '${ARMOR}' in the item database`);

const charmPct = charm!.mechanicEffects?.["defense.barrier-pct"] ?? 0;
assert(charmPct > 0, `'${CHARM}' should author defense.barrier-pct (got ${charmPct})`);
assert(
  (armor!.statModifiers.maxHp ?? 0) > 0,
  `'${ARMOR}' should add maxHp so the resize path can be exercised`,
);

const expectedMax = () => Math.round(player.hasHealth.maxHp * charmPct);

player.holdsInventory.equipment.recovery = CHARM;
recalculatePlayerEntityStats(world, player);
assert(player.hasBarrier !== undefined, "an equipped barrier charm must attach HasBarrier");
assert(
  player.hasBarrier!.max === expectedMax(),
  `barrier should be ${charmPct * 100}% of maxHp (got ${player.hasBarrier!.max}, want ${expectedMax()})`,
);
assert(player.hasBarrier!.current === player.hasBarrier!.max, "a new barrier starts full");

// More maxHp → a bigger pool, still exactly the authored fraction.
const smallMax = player.hasBarrier!.max;
player.holdsInventory.equipment.armor = ARMOR;
recalculatePlayerEntityStats(world, player);
assert(
  player.hasBarrier!.max > smallMax && player.hasBarrier!.max === expectedMax(),
  `more maxHp should grow the pool to ${expectedMax()} (got ${player.hasBarrier!.max}, was ${smallMax})`,
);

// Losing that maxHp again shrinks the pool AND clamps what is sitting in it.
player.hasBarrier!.current = player.hasBarrier!.max;
player.holdsInventory.equipment.armor = null;
recalculatePlayerEntityStats(world, player);
assert(
  player.hasBarrier!.max === smallMax,
  `unequipping should return the pool to ${smallMax} (got ${player.hasBarrier!.max})`,
);
assert(
  player.hasBarrier!.current === player.hasBarrier!.max,
  `current must be clamped to the smaller max (got ${player.hasBarrier!.current})`,
);

// ── A direct hit drains the barrier before HP ─────────────────────────────────
//
// Pool size below is runtime state, not a derived stat, so setting it directly is
// the honest way to get round numbers without asserting on balance values.

player.mitigatesDamage.plating = 0;
player.mitigatesDamage.damageReduction = 0;
player.hasHealth.hp = player.hasHealth.maxHp;
player.hasBarrier!.max = 200;
player.hasBarrier!.current = 200;

const monster = world.createMonster("node-5-5", "plains-slime", { x: 410, y: 400 });
assert(monster !== null, "test needs a monster; 'plains-slime' is not in the database");
monster!.dealsDamage.attack = 50;

const hpBefore = player.hasHealth.hp;
runMonsterAttack(world, monster!, player, 2_000);
assert(
  player.hasHealth.hp === hpBefore,
  `the barrier should have eaten the whole hit (hp ${hpBefore} → ${player.hasHealth.hp})`,
);
assert(
  player.hasBarrier!.current === 150,
  `barrier should be down 50 (got ${player.hasBarrier!.current})`,
);

// ── Recharge waits out the full delay, then refills at the configured rate ────

// Start well below max so one second of recharge lands short of full and the
// partial-fill state is actually observable.
player.hasBarrier!.current = 20;

// One tick short of the delay: still nothing.
runBarrierRecharge(world, player, GAME_CONFIG.BARRIER_DELAY_MS - 100);
assert(
  player.hasBarrier!.current === 20,
  `barrier must not refill before the delay elapses (got ${player.hasBarrier!.current})`,
);
assert(!player.hasBarrier!.recharging, "recharging must stay false inside the delay window");

// Crossing the delay: one second of recharge is BARRIER_RECHARGE_PCT of MAX
// (not of what is missing), so the refill rate does not sag as the pool fills.
runBarrierRecharge(world, player, 1_000);
const expected = 20 + 200 * GAME_CONFIG.BARRIER_RECHARGE_PCT;
assert(
  Math.abs(player.hasBarrier!.current - expected) < 1e-9,
  `one second of recharge should add ${expected - 20} (got ${player.hasBarrier!.current - 20})`,
);
assert(player.hasBarrier!.recharging, "a partially-filled barrier reports as recharging");

// It stops at max and clears the flag rather than overfilling.
runBarrierRecharge(world, player, 10_000);
assert(player.hasBarrier!.current === 200, "recharge must clamp at max");
assert(!player.hasBarrier!.recharging, "a full barrier is not recharging");

// ── Taking damage RESTARTS the delay rather than pausing it ───────────────────

player.hasBarrier!.current = 100;
runBarrierRecharge(world, player, GAME_CONFIG.BARRIER_DELAY_MS);
assert(player.hasBarrier!.current > 100, "sanity: the barrier was refilling");

const mid = player.hasBarrier!.current;
stampBarrierDamage(world, player); // stands in for any damage path
runBarrierRecharge(world, player, 1_000);
assert(
  player.hasBarrier!.current === mid,
  `damage must restart the delay, not pause it (got ${player.hasBarrier!.current}, was ${mid})`,
);
assert(!player.hasBarrier!.recharging, "the recharging flag clears the moment damage lands");

// ── Wards spend before the barrier ────────────────────────────────────────────

player.hasBarrier!.current = 200;
applyWard(world, player, 30, 5_000);
assert(player.holdsWards !== undefined, "applyWard must attach HoldsWards");

runMonsterAttack(world, monster!, player, 3_000); // 50 damage
assert(
  player.holdsWards === undefined || player.holdsWards.wards.length === 0,
  "the 30-point ward should be fully spent by a 50-point hit",
);
assert(
  player.hasBarrier!.current === 180,
  `the barrier should absorb only the 20 the ward could not (got ${player.hasBarrier!.current})`,
);

// ── Dropping the source detaches the component ────────────────────────────────

player.holdsInventory.equipment.recovery = null;
recalculatePlayerEntityStats(world, player);
assert(player.hasBarrier === undefined, "unequipping the charm must detach HasBarrier");

console.log("barrier: ok");
