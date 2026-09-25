// Wiring smoke test for the dev reward multiplier (testing/balance cycle tool).
//
// WHY THIS EXISTS: the multiplier is a single scalar threaded through the ONE
// reward seam (`applyKillRewardsToPlayer`). The invariants worth pinning are
// structural: the default must be a true no-op (production runs at 1x), the
// scalar must reach every kill reward (essence, biome XP, and catalyst progress),
// catalyst threshold crossings must mint and carry their remainder, and garbage
// input must not poison later kills with NaN.
//
// Deliberately NOT asserted: any balance number. Kill payouts change with every
// tuning pass — this compares boosted-vs-baseline on the same fixture instead.
//
// Run: pnpm --filter @mmo-idle/server exec tsx --conditions=development test/rewardMultiplier.test.ts

import {
  DEBUG_REWARD_MULT_DEFAULT,
  DEBUG_REWARD_MULT_MAX,
  DEBUG_REWARD_MULT_MIN,
  GAME_CONFIG,
  catalystProgressPerUnit,
  clampRewardMultiplier,
  emptyEquipment,
} from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import { grantMonsterRewards } from "../src/systems/player/progression/rewards";
import { World } from "../src/world/World";
import { displayedCatalystProgress } from "../../client/src/hud/catalystProgress";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function makePlayer(id: string, playerTier = 4): PersistedPlayerSlices {
  return {
    isPlayer: { id, name: id },
    hasPosition: {
      current: { x: 400, y: 400 },
      nodeId: "node-clearing",
      speed: GAME_CONFIG.PLAYER_SPEED,
    },
    hasHealth: {
      hp: GAME_CONFIG.PLAYER_MAX_HP,
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
      playerTier,
      currentSkillTier: 0,
      bossesCleared: [],
      clearedNodes: [],
      runesOwned: [],
      runeRecipesCrafted: [],
      runesEquipped: [],
      knownAbilities: [],
      attunedAbilities: { technique: null, guard: null },
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

const FARM_NODE = "node-t1-forest-01";
const BIOME_GROUP = "forest";
const FAMILY = "alacrity";

interface Payout {
  essence: number;
  biomeXp: number;
  catalystProgress: number;
}

/**
 * Run `kills` wolf kills on a fresh world at `multiplier` and total the payout.
 * The fixture is a tier-4 player so the T1 forest biome-level cap stays far away
 * — see the cap case below, which pins that the cap still binds.
 */
function farm(id: string, multiplier: number, kills: number, playerTier = 4): Payout {
  const world = new World();
  world.rewardMultiplier = multiplier;
  const player = world.attachPlayerEntity(makePlayer(id, playerTier), id);
  const wolf = world.createMonster(FARM_NODE, "wolf", { x: 800, y: 800 })!;
  for (let i = 0; i < kills; i++) grantMonsterRewards(world, id, wolf);
  const prog = player.tracksProgression;
  const per = catalystProgressPerUnit();
  return {
    essence: Object.values(prog.essences).reduce((a, b) => a + b, 0),
    biomeXp: prog.biomeXP[BIOME_GROUP] ?? 0,
    // Minted catalysts and the carried remainder are the same accumulator.
    catalystProgress:
      (prog.catalysts[FAMILY] ?? 0) * per + (prog.catalystProgress[FAMILY] ?? 0),
  };
}

// ── A fresh world is a no-op: production must be untouched ────────────────────

assert(
  new World().rewardMultiplier === DEBUG_REWARD_MULT_DEFAULT,
  "a world with no DEBUG_REWARD_MULT env must default to shipped rates",
);

// ── The scalar reaches the complete kill payout ───────────────────────────────

// Keep the comparison below the current tier-4 forest cap even at 10x. The
// separate cap case later in this file covers the intentional saturation path.
const KILLS = 5;
const MULT = 10;
const base = farm("p-base", 1, KILLS);
const boosted = farm("p-boost", MULT, KILLS);

assert(base.essence > 0, "baseline farm must earn essence for the comparison to mean anything");
assert(base.biomeXp > 0, "baseline farm must earn biome XP");
assert(base.catalystProgress > 0, "baseline farm must earn catalyst progress");

// NOT an exact `base * MULT`: every kill rounds its own payout to an integer, so
// a 4.2-essence wolf pays 4 at 1x but 42 at 10x — the boosted run loses less to
// rounding, which is correct, not a bug. The band pins "all three scale together,
// by roughly the multiplier" without re-implementing the reward formula.
function assertScales(label: string, boostedValue: number, baseValue: number): void {
  const ratio = boostedValue / baseValue;
  assert(
    ratio > MULT * 0.85 && ratio < MULT * 1.15,
    `${label} must scale by about ${MULT}x (got ${boostedValue} vs ${baseValue} = ${ratio.toFixed(2)}x)`,
  );
}

assertScales("essence", boosted.essence, base.essence);
assertScales("biome XP", boosted.biomeXp, base.biomeXp);
assertScales("catalyst progress", boosted.catalystProgress, base.catalystProgress);

// ── A boss kill's catalyst grant is on the same rule ──────────────────────────

function bossCatalystProgress(id: string, multiplier: number): number {
  const world = new World();
  world.rewardMultiplier = multiplier;
  const player = world.attachPlayerEntity(makePlayer(id), id);
  const boss = world.createMonster(FARM_NODE, "gnarled-greatbear", { x: 800, y: 800 })!;
  assert(boss.isMonster.isBoss, "greatbear is a boss");
  grantMonsterRewards(world, id, boss);
  const prog = player.tracksProgression;
  const per = catalystProgressPerUnit();
  return (prog.catalysts[FAMILY] ?? 0) * per + (prog.catalystProgress[FAMILY] ?? 0);
}

const baseBossProgress = bossCatalystProgress("p-boss-base", 1);
assert(baseBossProgress > 0, "baseline boss clear must grant catalyst progress");
assertScales("boss catalyst progress", bossCatalystProgress("p-boss-boost", MULT), baseBossProgress);

// A single accelerated kill may cross the threshold multiple times. Every whole
// unit must mint and the stored progress must remain a true remainder.
{
  const world = new World();
  world.rewardMultiplier = 100;
  const player = world.attachPlayerEntity(makePlayer("p-multi-mint"), "p-multi-mint");
  const wolf = world.createMonster(FARM_NODE, "wolf", { x: 800, y: 800 })!;
  grantMonsterRewards(world, "p-multi-mint", wolf);
  const prog = player.tracksProgression;
  const per = catalystProgressPerUnit();
  assert((prog.catalysts[FAMILY] ?? 0) >= 2, "an accelerated kill must mint every crossed catalyst unit");
  assert(Number.isInteger((prog.catalystProgress[FAMILY] ?? 0) * 2), "T1 catalyst progress must use exact half-points");
  assert((prog.catalystProgress[FAMILY] ?? 0) < per, "accelerated catalyst progress must reset to a remainder below the threshold");
}

assert(displayedCatalystProgress(2.5) === 2, "the HUD must hide fractional half-progress");
assert(displayedCatalystProgress(99.5) === 99, "the HUD must not display 100 before a catalyst actually mints");

// ── The node modifier premium still applies to catalysts ──────────────────────
// `modifierRewardMult` is real economy: a harder node still pays a catalyst
// premium underneath the debug scalar.
{
  const world = new World();
  const player = world.attachPlayerEntity(makePlayer("p-modifier"), "p-modifier");
  const wolf = world.createMonster(FARM_NODE, "wolf", { x: 800, y: 800 })!;
  grantMonsterRewards(world, "p-modifier", wolf);
  const prog = player.tracksProgression;
  const granted =
    (prog.catalysts[FAMILY] ?? 0) * catalystProgressPerUnit() +
    (prog.catalystProgress[FAMILY] ?? 0);
  assert(granted > 0, "an Alacrity node must grant Alacrity progress on an ordinary kill");
}

// ── Every tier mints at the same player-facing threshold ──────────────────────

assert(
  catalystProgressPerUnit() === 100,
  "every tier must mint a catalyst at 100 progress",
);

// ── The biome level cap still binds: the multiplier is not a cap bypass ───────
// Worth pinning because it is the one place a boosted run behaves qualitatively
// differently: a tier-gated player hits their cap and the extra XP is discarded,
// so 10x XP does NOT mean 10x biome levels.

const cappedBase = farm("p-cap-base", 1, KILLS, 1);
const cappedBoost = farm("p-cap-boost", MULT, KILLS, 1);
assert(
  cappedBoost.biomeXp < cappedBase.biomeXp * MULT,
  "a tier-gated player must stop earning biome XP at the cap even at high multipliers",
);
assert(
  cappedBoost.essence > cappedBase.essence,
  "the biome XP cap must not stop essence from scaling",
);

// ── Clamping: garbage in must never become NaN out ────────────────────────────

for (const bad of [NaN, Infinity, -Infinity, undefined, null, "abc", {}]) {
  assert(
    clampRewardMultiplier(bad) === DEBUG_REWARD_MULT_DEFAULT,
    `non-numeric input (${String(bad)}) must fall back to ${DEBUG_REWARD_MULT_DEFAULT}x, not NaN`,
  );
}
assert(clampRewardMultiplier(0) === DEBUG_REWARD_MULT_MIN, "below-range clamps up to the minimum");
assert(clampRewardMultiplier(-50) === DEBUG_REWARD_MULT_MIN, "negatives clamp up to the minimum");
assert(clampRewardMultiplier(1e9) === DEBUG_REWARD_MULT_MAX, "above-range clamps to the maximum");
assert(clampRewardMultiplier("25") === 25, "numeric strings off the wire are accepted");
assert(clampRewardMultiplier(2.5) === 2.5, "fractional multipliers survive");
assert(clampRewardMultiplier(1.23456) === 1.23, "multipliers round to 2 decimals");

console.log("rewardMultiplier.test: ok");

// Biome correction is mastery-only; other currencies and earlier tiers stay independent.
{
  const factors = GAME_CONFIG.BIOME_XP_BIOME_TIER_MULT as Record<number, Record<string, number>>;
  const sample = (node: string, type: string) => {
    const world = new World();
    const player = world.attachPlayerEntity(makePlayer('biome-factor'), 'biome-factor');
    const monster = world.createMonster(node, type, {x:800,y:800})!;
    grantMonsterRewards(world, 'biome-factor', monster);
    const p = player.tracksProgression;
    return {xp:Object.values(p.biomeXP).reduce((a,b)=>a+b,0), essence:JSON.stringify(p.essences), catalysts:JSON.stringify([p.catalysts,p.catalystProgress])};
  };
  for (const [node,type,factor] of [
    ['node-t4-desert-03','sand-viper',2.4],
    ['node-t4-tundra-01','hoarfrost-yeti',1.8],
    ['node-t3-desert-01','dune-stalker',1],
    ['node-t4-volcanic-01','ember-skink',1],
  ] as const) {
    const saved = factors[4];
    try {
      factors[4] = {}; const base = sample(node,type);
      factors[4] = saved; const adjusted = sample(node,type);
      assert(base.xp > 0 && Math.abs(adjusted.xp-base.xp*factor)<=1, node+' mastery factor');
      assert(adjusted.essence===base.essence, node+' essence unchanged');
      assert(adjusted.catalysts===base.catalysts, node+' catalysts unchanged');
    } finally { factors[4] = saved; }
  }
  console.log('biome XP factor isolation: ok');
}
