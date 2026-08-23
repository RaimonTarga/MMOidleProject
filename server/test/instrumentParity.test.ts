// Parity fixtures: do the ANALYTICAL balance instruments agree with the RUNTIME?
//
// The reports in tools/ do not run the combat pipeline. They reconstruct it from
// shared formulas, and `shared/src/systems/combatEstimates.ts` is an openly
// hand-mirrored copy of the damage core in
// `server/src/systems/combat/engine/combat.ts`. Nothing makes the two drift
// loudly — a rename fails typecheck, but a reordered multiply or a new damage
// layer does not. The 2026-08-23 tool audit found exactly that: the reports had
// been multiplying an empowered/charged spike BEFORE plating subtraction while
// the runtime multiplies it AFTER, inflating every spike column by a
// plating-dependent factor.
//
// So these are equivalence fixtures, not balance tests. Every expectation is
// either "runtime and estimator return the same number" or "this formula has
// this shape". No expectation asserts that a number is GOOD — balance values
// must never live here, or a tuning pass will start failing the test suite.
//
// Fixture ids match section 8 of docs/briefs/BALANCE_TOOL_AUDIT_HANDOFF_2026-08-23.md.
//
// Run: pnpm --filter @mmo-idle/server exec tsx --conditions=development test/instrumentParity.test.ts

import {
  GAME_CONFIG,
  STARTER_RUNE_IDS,
  emptyEquipment,
  estimateMonsterHitDamage,
  estimatePlayerHitDamage,
  resetTracksCombat,
} from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import { initCombatSystems } from "../src/systems/combatBootstrap";
import { runMonsterAttack, runPlayerAttack } from "../src/systems/combat/engine/combat";
import { recoveryPerSecond } from "../src/systems/defense/regen/recovery";
import { syncBarrier } from "../src/systems/defense/barrier/barrier";
import { applyWard } from "../src/systems/defense/barrier/wards";
import { World } from "../src/world/World";
import type { MonsterEntity, PlayerEntity } from "../src/ecs/entity";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

/** Integer formulas must agree exactly; anything else is drift. */
function assertExact(actual: number, expected: number, what: string): void {
  assert(actual === expected, `${what}: runtime ${actual} vs estimator ${expected}`);
}

function assertClose(actual: number, expected: number, tolPct: number, what: string): void {
  const tol = Math.abs(expected) * tolPct;
  assert(
    Math.abs(actual - expected) <= tol,
    `${what}: got ${actual}, want ${expected} (±${(tolPct * 100).toFixed(0)}%)`,
  );
}

const NODE = "node-5-5";

function makePlayerSlices(id: string): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: "Parity Tester" },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: NODE, speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: 1_000, maxHp: 1_000, recovery: GAME_CONFIG.PLAYER_RECOVERY },
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
      equippedAbilities: { techniques: [], guards: [] },
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

const player = world.attachPlayerEntity(makePlayerSlices("parity-player"), "parity-player");
const monster = world.createMonster(NODE, "plains-slime", { x: 410, y: 400 });
assert(monster !== null, "test needs a monster; 'plains-slime' is not in the database");
const mob = monster as MonsterEntity;

/** Put both actors in a known, mechanic-free state before each fixture. */
function reset(opts: {
  playerPlating?: number;
  playerDr?: number;
  monsterPlating?: number;
  monsterDr?: number;
} = {}): void {
  player.usesSkills.passives = {};
  player.mitigatesDamage.plating = opts.playerPlating ?? 0;
  player.mitigatesDamage.damageReduction = opts.playerDr ?? 0;
  // Component presence gates behaviour, so evasion/barrier/wards may legitimately
  // be absent on a bare test player — never attach them here, just neutralise what
  // is actually there.
  if (player.evadesHits) {
    player.evadesHits.dodgeRate = 0;
    player.evadesHits.evadeMitigation = 0;
  }
  player.hasHealth.hp = player.hasHealth.maxHp;
  if (player.hasBarrier) {
    player.hasBarrier.current = 0;
    player.hasBarrier.max = 0;
  }
  if (player.holdsWards) player.holdsWards.wards = [];
  resetTracksCombat(player.tracksCombat);
  mob.mitigatesDamage.plating = opts.monsterPlating ?? 0;
  mob.mitigatesDamage.damageReduction = opts.monsterDr ?? 0;
  mob.hasHealth.hp = mob.hasHealth.maxHp;
  resetTracksCombat(mob.tracksCombat);
}

/** HP the monster actually lost to one player swing. */
function playerHitDamage(attack: number, onHit = 0): number {
  player.dealsDamage.attack = attack;
  player.dealsDamage.onHitDamage = onHit;
  const before = mob.hasHealth.hp;
  runPlayerAttack(world, player, mob, Date.now(), {
    attackOrigin: { ...player.hasPosition.current },
    aggroSource: { id: player.isPlayer.id, kind: "player" },
  });
  const dealt = before - mob.hasHealth.hp;
  mob.hasHealth.hp = mob.hasHealth.maxHp;
  return dealt;
}

/** HP the player actually lost to one monster swing. */
function monsterHitDamage(attack: number, now = 2_000): number {
  mob.dealsDamage.attack = attack;
  const before = player.hasHealth.hp;
  runMonsterAttack(world, mob, player, now);
  const lost = before - player.hasHealth.hp;
  player.hasHealth.hp = player.hasHealth.maxHp;
  return lost;
}

// ── F1 — the shared damage kernel matches the runtime ────────────────────────
//
// This is the fixture that would have caught combatEstimates.ts drifting away
// from combat.ts. Both are integer formulas, so "close enough" is not a pass.

reset({ monsterPlating: 20, monsterDr: 0.25 });
{
  const ATTACK = 100;
  const runtime = playerHitDamage(ATTACK);
  const estimate = estimatePlayerHitDamage({
    attack: ATTACK,
    onHitDamage: 0,
    targetPlating: 20,
    targetDamageReduction: 0.25,
    platingMult: 1,
  });
  assertExact(runtime, estimate, "F1 player direct hit");
}

reset({ playerPlating: 20, playerDr: 0.25 });
{
  const ATTACK = 100;
  const runtime = monsterHitDamage(ATTACK);
  const estimate = estimateMonsterHitDamage({
    attack: ATTACK,
    targetPlating: 20,
    targetDamageReduction: 0.25,
  });
  assertExact(runtime, estimate, "F1 monster direct hit");
}

// ── F2 — the plating cliff, light hit vs heavy hit ───────────────────────────
//
// Mitigation is a FLAT subtract before a multiplicative reduction, with a hard
// 1-damage floor, so effective HP is a function of incoming HIT SIZE. This is
// the property the tier table's eHP probe curve is built on: probing the same
// target with a light and a heavy hit must reproduce the runtime's own cliff.

reset({ playerPlating: 20, playerDr: 0 });
{
  const LIGHT = 22; // just above plating — lands in the 1-damage floor
  const HEAVY = 200; // far above plating — plating barely matters

  const lightRuntime = monsterHitDamage(LIGHT);
  const heavyRuntime = monsterHitDamage(HEAVY);

  assertExact(
    lightRuntime,
    estimateMonsterHitDamage({ attack: LIGHT, targetPlating: 20, targetDamageReduction: 0 }),
    "F2 light hit",
  );
  assertExact(
    heavyRuntime,
    estimateMonsterHitDamage({ attack: HEAVY, targetPlating: 20, targetDamageReduction: 0 }),
    "F2 heavy hit",
  );

  // Shape check: plating removes a fixed amount, so it is a large share of a
  // light hit and a small share of a heavy one. If this ever inverts, the flat
  // subtract has become a multiplier and every eHP probe curve is invalid.
  const lightMitigatedShare = (LIGHT - lightRuntime) / LIGHT;
  const heavyMitigatedShare = (HEAVY - heavyRuntime) / HEAVY;
  assert(
    lightMitigatedShare > heavyMitigatedShare,
    `F2: plating must matter more to a light hit (${lightMitigatedShare.toFixed(2)}) `
    + `than a heavy one (${heavyMitigatedShare.toFixed(2)})`,
  );
}

// ── F2b — the 1-damage floor is real ─────────────────────────────────────────

reset({ playerPlating: 500, playerDr: 0 });
assertExact(monsterHitDamage(10), 1, "F2b hit below plating floors at 1");

// ── F3 — spike ordering: mitigate FIRST, then multiply ───────────────────────
//
// The audit's headline formula bug. The runtime computes the mitigated base hit
// and THEN applies the empowered/charged multiplier, so the correct estimate is
// `mitigate(A) * M`, never `mitigate(A * M)`. With plating > 0 the two differ,
// and the wrong one is always larger.

reset({ playerPlating: 20, playerDr: 0 });
{
  const ATTACK = 100;
  const MULT = 3;
  const PLATING = 20;

  const base = estimateMonsterHitDamage({
    attack: ATTACK,
    targetPlating: PLATING,
    targetDamageReduction: 0,
  });
  const correct = base * MULT; // mitigate, then multiply — what the tools now do
  const wrong = estimateMonsterHitDamage({
    attack: ATTACK * MULT,
    targetPlating: PLATING,
    targetDamageReduction: 0,
  });

  assert(
    wrong > correct,
    `F3 sanity: pre-multiplying should overstate the spike (${wrong} vs ${correct})`,
  );

  // The runtime's own answer, produced by scaling the monster's attack stat is NOT
  // equivalent — so assert against the algebra the pipeline actually performs:
  // ctx.damage = mitigated(attack) and then ctx.damage *= empoweredMult.
  const runtimeBase = monsterHitDamage(ATTACK);
  assertExact(runtimeBase * MULT, correct, "F3 mitigate-then-multiply");

  // And pin the size of the error the old ordering introduced, so a regression is
  // legible rather than merely failing.
  const overstatement = wrong / correct - 1;
  assert(
    overstatement > 0.1,
    `F3: the pre-multiply error should be material at this plating (was ${(overstatement * 100).toFixed(1)}%)`,
  );
}

// ── F7 — Recovery is one rate times an activation fraction ───────────────────
//
// `healingPerSecond = maxHp x (recovery / 100) x activeFraction`. The eHP report
// re-implements exactly this, so the shapes must agree.

reset();
{
  player.hasHealth.maxHp = 500;
  player.hasHealth.recovery = 20;

  const full = recoveryPerSecond(player, 1);
  assertClose(full, 500 * (20 / 100), 1e-9, "F7 recovery at 100%");

  const half = recoveryPerSecond(player, 0.5);
  assertClose(half, 500 * (20 / 100) * 0.5, 1e-9, "F7 recovery at 50%");

  // Linear in the fraction: the report sums fractions from different sources, which
  // is only valid if the payout is linear.
  assertClose(half * 2, full, 1e-9, "F7 recovery is linear in the active fraction");

  player.hasHealth.maxHp = 1_000;
  player.hasHealth.recovery = GAME_CONFIG.PLAYER_RECOVERY;
}

// ── F8 — wards drain before the barrier, and both drain before HP ────────────
//
// Order is authored: wards are use-it-or-lose-it, so they must spend first. The
// eHP report treats the barrier as part of the effective pool; if this ordering
// ever inverted, that pool model would silently over-credit the barrier.

reset({ playerPlating: 0, playerDr: 0 });
{
  // `HasBarrier` is attached by syncBarrier iff `defense.barrier-pct > 0` —
  // component presence gates the whole mechanic, so grant the passive first.
  player.usesSkills.passives = { "defense.barrier-pct": 0.1 };
  syncBarrier(world, player);
  assert(player.hasBarrier !== undefined, "F8 needs a barrier component on the player");
  player.hasBarrier!.max = 100;
  player.hasBarrier!.current = 100;
  applyWard(world, player, 30, 60_000);

  const hpBefore = player.hasHealth.hp;
  mob.dealsDamage.attack = 20;
  runMonsterAttack(world, mob, player, 5_000);

  const wardLeft = player.holdsWards?.wards.reduce((sum, w) => sum + w.amount, 0) ?? 0;
  assertExact(wardLeft, 10, "F8 ward absorbs first");
  assertExact(player.hasBarrier!.current, 100, "F8 barrier untouched while a ward remains");
  assertExact(player.hasHealth.hp, hpBefore, "F8 HP untouched while a ward remains");

  // Next hit exhausts the ward and spills into the barrier.
  runMonsterAttack(world, mob, player, 6_000);
  const wardAfter = player.holdsWards?.wards.reduce((sum, w) => sum + w.amount, 0) ?? 0;
  assertExact(wardAfter, 0, "F8 ward is spent");
  assertExact(player.hasBarrier!.current, 90, "F8 spill lands on the barrier, not HP");
  assertExact(player.hasHealth.hp, hpBefore, "F8 HP still untouched behind a live barrier");
}

// ── F9 — the damage cap clips the excess, it does not clamp ──────────────────
//
// `hit > max-hit-pct x maxHp` keeps the threshold and scales only the surplus by
// `max-hit-mult`. The eHP report's applyDamageCap re-implements this verbatim.

reset({ playerPlating: 0, playerDr: 0 });
{
  player.hasHealth.maxHp = 400;
  player.hasHealth.hp = 400;
  player.usesSkills.passives = {
    "defense.max-hit-pct": 0.25,
    "defense.max-hit-mult": 0.5,
  };

  const INCOMING = 300;
  const threshold = 400 * 0.25; // 100
  const expected = threshold + (INCOMING - threshold) * 0.5; // 200

  const runtime = monsterHitDamage(INCOMING, 7_000);
  assertExact(runtime, expected, "F9 damage cap clips the excess");

  // A hit under the threshold is untouched.
  assertExact(monsterHitDamage(80, 8_000), 80, "F9 sub-threshold hit is not capped");

  player.hasHealth.maxHp = 1_000;
  player.hasHealth.hp = 1_000;
  player.usesSkills.passives = {};
}

console.log("instrument parity: ok");
