// The per-tier player pool raise (progression rework Phase 0 call four, design
// bible §20): `GAME_CONFIG.PLAYER_POOL_FACTOR_BY_TIER` scales the authored flat
// max-HP pool once at recalc.
//
// Two things are worth pinning, and they are the two a mistake would make
// invisible. First, that the factor lands on the WHOLE flat pool — base HP plus
// the armor's `maxHp` and its upgrade steps — exactly once, rather than on the
// base alone or twice over. Second, and this is the point of the feature, that
// RECOVERY DOES NOT MOVE WITH IT: under the flat model (§15) the pool is a
// budget and the rate is a choice, so a bigger pool has to buy attrition and
// not healing. Re-coupling the two is precisely what made the Phase 0a pool
// sweep a wash.
//
// Numbers are derived from the config and the item database, never written down.
//
// Run: node --conditions=development --import tsx test/playerPoolFactor.test.ts

import {
  GAME_CONFIG,
  ITEM_DATABASE,
  STARTER_RUNE_IDS,
  baseRecoveryForTier,
  emptyEquipment,
  poolFactorForTier,
  upgradeStatBonusTotal,
} from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import { recalculatePlayerEntityStats } from "../src/ecs/playerEntityFormulas";
import { recoveryPerSecond } from "../src/systems/defense/regen/recovery";
import { World } from "../src/world/World";

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

/** The armor whose flat `maxHp` the equipped arms measure. */
const ARMOR_ID = "plains-vest-t1";
const PLUS = 3;

function makePlayerSlices(id: string, tier: number, armor: string | null): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: "Pool Tester" },
    hasPosition: { current: { x: 400, y: 400 }, nodeId: "node-5-5", speed: GAME_CONFIG.PLAYER_SPEED },
    hasHealth: { hp: 1, maxHp: 1, recovery: baseRecoveryForTier(tier) },
    tracksProgression: {
      level: 0,
      skillPoints: 0,
      essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      shards: {}, capstones: {},
      biomeXP: {},
      biomeLevel: {},
      unlockedRecipes: [],
      questProgress: {},
      playerTier: tier,
      currentSkillTier: 0,
      bossesCleared: [],
      clearedNodes: [],
      runesOwned: [...STARTER_RUNE_IDS],
      runeRecipesCrafted: [],
      runesEquipped: [],
      knownAbilities: [],
      attunedAbilities: { techniques: [], guards: [] },
      knownStances: [],
      equippedStances: { default: null },
      activeStance: null,
      knownRites: [],
      equippedRites: [],
    },
    holdsInventory: {
      inventory: armor ? [armor] : [],
      equipment: { ...emptyEquipment(), ...(armor ? { armor } : {}) },
      itemUpgrades: armor ? { [armor]: PLUS } : {},
    },
    // No skills: every class node authors `maxHpPct`, and a percentage layer on
    // top of the fold would stop the expectation being an exact integer.
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
function build(tier: number, armor: string | null) {
  const id = `pool-${seq++}`;
  const player = world.attachPlayerEntity(makePlayerSlices(id, tier, armor), id);
  recalculatePlayerEntityStats(world, player);
  return player;
}

/** The authored flat pool before the factor: base HP plus the armor's own maxHp. */
function flatPool(armor: string | null): number {
  if (!armor) return GAME_CONFIG.PLAYER_MAX_HP;
  const def = ITEM_DATABASE.get(armor);
  assert(def !== undefined, `the test needs ${armor} in the item database`);
  const base = def!.statModifiers.maxHp ?? 0;
  assert(base > 0, `${armor} should author a flat maxHp for this test to mean anything`);
  return GAME_CONFIG.PLAYER_MAX_HP + base + (upgradeStatBonusTotal(def!, PLUS).maxHp ?? 0);
}

// ── 1. The table is a factor per player tier, T0 included and neutral ────────
const factors = GAME_CONFIG.PLAYER_POOL_FACTOR_BY_TIER;
assert(factors.length === 5, "the pool table needs an entry for T0 plus T1–T4");
assert(poolFactorForTier(0) === 1, "a fresh character in the Clearing is not raised");
assert(poolFactorForTier(undefined) === 1, "an absent tier reads as the fresh character");
assert(
  poolFactorForTier(9) === factors[factors.length - 1],
  "tiers past the table hold at the last entry rather than falling through to zero",
);
for (let tier = 1; tier <= 4; tier += 1) {
  assert(poolFactorForTier(tier) >= 1, `T${tier} must not SHRINK the pool`);
}

// ── 2. The factor lands on base HP and on armor maxHp, once ──────────────────
for (const armor of [null, ARMOR_ID]) {
  for (let tier = 0; tier <= 4; tier += 1) {
    const expected = Math.max(1, Math.round(flatPool(armor) * poolFactorForTier(tier)));
    const player = build(tier, armor);
    assert(
      player.hasHealth.maxHp === expected,
      `T${tier} ${armor ?? "naked"}: expected ${expected} max HP, got ${player.hasHealth.maxHp}`,
    );
    // Idempotent: a second recalc rebuilds from base, it does not compound.
    recalculatePlayerEntityStats(world, player);
    assert(
      player.hasHealth.maxHp === expected,
      `T${tier} ${armor ?? "naked"}: recalc compounded the factor (${player.hasHealth.maxHp})`,
    );
  }
}

// The armor arm must actually be bigger than the naked one, or the assertion
// above would pass with the armor silently dropped.
assert(
  build(4, ARMOR_ID).hasHealth.maxHp > build(4, null).hasHealth.maxHp,
  "the equipped arm should carry more HP than the naked one",
);

// ── 3. Recovery does not scale with the pool (§15) ───────────────────────────
// GAME_CONFIG is `as const` for types only; the recalc reads it at call time, so
// overwriting the table here is exactly what committing a different value does.
const cfg = GAME_CONFIG as unknown as Record<string, unknown>;
const originalFactors = factors;
try {
  for (let tier = 1; tier <= 4; tier += 1) {
    const readings = [1, 2].map((factor) => {
      const table = [1, 1, 1, 1, 1];
      table[tier] = factor;
      cfg.PLAYER_POOL_FACTOR_BY_TIER = table;
      const player = build(tier, ARMOR_ID);
      player.hasHealth.hp = 1;
      return {
        maxHp: player.hasHealth.maxHp,
        recovery: player.hasHealth.recovery ?? 0,
        // Fully switched on, so the reading is the rate itself and not a fraction of it.
        perSecond: recoveryPerSecond(player, 1),
      };
    });
    const [plain, doubled] = readings;
    assert(
      doubled.maxHp === plain.maxHp * 2,
      `T${tier}: doubling the factor should double the pool (${plain.maxHp} -> ${doubled.maxHp})`,
    );
    assert(
      doubled.recovery === plain.recovery && plain.recovery === baseRecoveryForTier(tier),
      `T${tier}: Recovery followed the pool (${plain.recovery} -> ${doubled.recovery}); it must stay the tier's flat base`,
    );
    assert(
      doubled.perSecond === plain.perSecond,
      `T${tier}: HP/s followed the pool (${plain.perSecond} -> ${doubled.perSecond})`,
    );
  }
  // The calibration table itself is untouched by the raise, which is what keeps
  // the rate from re-coupling to the pool.
  assert(
    GAME_CONFIG.RECOVERY_REFERENCE_POOL_BY_TIER.every(
      (pool, tier) => baseRecoveryForTier(tier) ===
        Math.round(GAME_CONFIG.RECOVERY_BASE_FRACTION * pool * 10) / 10,
    ),
    "the base rate must stay a fraction of the REFERENCE pool, not of the raised one",
  );
} finally {
  cfg.PLAYER_POOL_FACTOR_BY_TIER = originalFactors;
}

console.log("playerPoolFactor.test.ts: ok");
