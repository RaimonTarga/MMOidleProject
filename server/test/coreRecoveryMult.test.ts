// `core.recovery-mult` pays what it authors.
//
// The four integer core multipliers above it in `recalculatePlayerStats` (attack,
// maxHp, plating, speed) round to a whole number, which is right for integers.
// Recovery was in the same line and became a FRACTIONAL HP/s rate in Phase 0b, so
// `Math.round` was eating most of the core's bonus: the Jungle core's +30% on a naked
// Tier-1 rate of 6.5 HP/s is 8.45, which rounded to 8 and delivered +1.5 of the
// +1.95 it authored — about a quarter of the core's whole payoff, silently.
//
// It is now quantized to a tenth: the same resolution `baseRecoveryForTier` already
// uses and the HUD already shows.
//
// The numbers come from the config and the recipe database, never written down, so
// retuning either moves this test with it.
//
// Run: node --conditions=development --import tsx test/coreRecoveryMult.test.ts

import {
  GAME_CONFIG,
  RECIPE_DATABASE,
  STARTER_RUNE_IDS,
  baseRecoveryForTier,
  emptyEquipment,
} from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import { recalculatePlayerEntityStats } from "../src/ecs/playerEntityFormulas";
import { World } from "../src/world/World";

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

/** The authored core under test — the Survivalist (Jungle) core, the finding's own case. */
const core = [...RECIPE_DATABASE.values()].find(
  (r) => r.slot === "core" && r.mechanicEffects?.["core.recovery-mult"] !== undefined,
);
assert(core !== undefined, "no core authors core.recovery-mult; this test has nothing to measure");
const CORE_ID = core!.id;
const MULT = core!.mechanicEffects!["core.recovery-mult"]!;
assert(MULT > 0, `${CORE_ID} should author a positive core.recovery-mult, got ${MULT}`);

const TIER = 1;

function makePlayerSlices(id: string, withCore: boolean): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: "Core Tester" },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: "node-clearing", speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: 1, maxHp: 1, recovery: baseRecoveryForTier(TIER) },
    tracksProgression: {
      level: 0,
      skillPoints: 0,
      essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      
      biomeXP: {},
      biomeLevel: {},
      unlockedRecipes: [],
      questProgress: {},
      playerTier: TIER,
      currentSkillTier: 0,
      bossesCleared: [],
      clearedNodes: [],
      runesOwned: [...STARTER_RUNE_IDS],
      runesEquipped: [],
      knownAbilities: [],
      attunedAbilities: { techniques: [], guards: [] },
      knownStances: [],
      equippedStances: { default: null },
      activeStance: null,
      knownRites: [],
      equippedRites: [],
    },
    // The core is EQUIPPED rather than its passive written by hand: recalc rebuilds
    // `usesSkills.passives` from scratch, so a hand-set key never reaches the fold.
    holdsInventory: {
      inventory: withCore ? [CORE_ID] : [],
      equipment: { ...emptyEquipment(), ...(withCore ? { core: CORE_ID } : {}) },
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
let seq = 0;
function rateWith(withCore: boolean): number {
  const id = `core-rec-${seq++}`;
  const player = world.attachPlayerEntity(makePlayerSlices(id, withCore), id);
  recalculatePlayerEntityStats(world, player);
  assert(
    (player.usesSkills.passives["core.recovery-mult"] ?? 0) === (withCore ? MULT : 0),
    `fixture: the equipped core should have folded core.recovery-mult into passives`,
  );
  return player.hasHealth.recovery ?? 0;
}

// ── 1. No core: the tier's base rate, untouched ──────────────────────────────
const base = rateWith(false);
assert(
  base === baseRecoveryForTier(TIER),
  `a naked Tier-${TIER} character should sit at ${baseRecoveryForTier(TIER)} HP/s, got ${base}`,
);

// ── 2. With the core: the authored product, to a tenth ───────────────────────
const withCore = rateWith(true);
const expected = Math.round(base * (1 + MULT) * 10) / 10;
assert(
  withCore === expected,
  `+${MULT * 100}% on ${base} HP/s should be ${expected}, got ${withCore}`,
);

// ── 3. The bonus is the authored one, not a rounded-away fraction ────────────
// This is the finding: `Math.round` turned 8.45 into 8, paying +1.5 of +1.95.
const authoredBonus = base * MULT;
const paidBonus = withCore - base;
// Within half a tenth: the rate is quantized to a tenth, so that is the whole
// remaining error. The old whole-number rounding was off by 0.45.
assert(
  Math.abs(paidBonus - authoredBonus) < 0.051,
  `the core should pay about +${authoredBonus.toFixed(2)} HP/s, paid +${paidBonus.toFixed(2)}`,
);
assert(
  paidBonus / authoredBonus > 0.95,
  `the core should pay at least 95% of what it authors, paid ${(paidBonus / authoredBonus * 100).toFixed(0)}%`,
);

// ── 4. And the rate stays a clean tenth, so the HUD has nothing to swallow ───
assert(
  Math.abs(withCore * 10 - Math.round(withCore * 10)) < 1e-9,
  `the rate should be quantized to a tenth, got ${withCore}`,
);

console.log("coreRecoveryMult.test.ts: ok");
