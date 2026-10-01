// Wiring smoke test for the dev reward multiplier (testing/balance cycle tool).
//
// WHY THIS EXISTS: the multiplier is a single scalar threaded through the ONE
// reward seam (`applyKillRewardsToPlayer`). The invariants worth pinning are
// structural: the default must be a true no-op (production runs at 1x), the
// scalar must reach every kill reward (essence, biome XP, and lineage shards),
// a boss clear's capstone grant is on the same rule, and garbage input must
// not poison later kills with NaN.
//
// Deliberately NOT asserted: any balance number. Kill payouts change with every
// tuning pass — this compares boosted-vs-baseline on the same fixture instead.
//
// Run: pnpm --filter @mmo-idle/server exec tsx --conditions=development test/rewardMultiplier.test.ts

import { baseRecoveryForTier } from '@mmo-idle/shared';
import {
  DEBUG_REWARD_MULT_DEFAULT,
  DEBUG_REWARD_MULT_MAX,
  DEBUG_REWARD_MULT_MIN,
  GAME_CONFIG,
  clampRewardMultiplier,
  emptyEquipment,
} from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import { grantMonsterRewards } from "../src/systems/player/progression/rewards";
import { World } from "../src/world/World";
import { attachComponent } from '../src/ecs/markerHelpers';

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
      recovery: baseRecoveryForTier(0),
    },
    tracksProgression: {
      level: 0,
      skillPoints: 0,
      essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
      shards: {},
      capstones: {},
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
// "wolf" is in the Forest Pack family (shared/src/data/families/index.ts),
// which drops the Tempo shard. "gnarled-greatbear" is the Forest T1 boss and
// drops the Forest capstone ("Warden's Heart") instead of a shard.
const SHARD = "tempo";

interface Payout {
  essence: number;
  biomeXp: number;
  shards: number;
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
  return {
    essence: Object.values(prog.essences).reduce((a, b) => a + b, 0),
    biomeXp: prog.biomeXP[BIOME_GROUP] ?? 0,
    shards: prog.shards[SHARD] ?? 0,
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
assert(base.shards > 0, "baseline farm must earn lineage shards");

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
assertScales("lineage shards", boosted.shards, base.shards);

// ── A boss kill's capstone grant is on the same rule ──────────────────────────
// Bosses are outside the family table: a kill drops the biome's capstone
// material instead of a shard (one per kill, scaled only by the multiplier,
// not by biome tier — see `grantLineageMaterials`).

function bossCapstoneGain(id: string, multiplier: number): number {
  const world = new World();
  world.rewardMultiplier = multiplier;
  const player = world.attachPlayerEntity(makePlayer(id), id);
  const boss = world.createMonster(FARM_NODE, "gnarled-greatbear", { x: 800, y: 800 })!;
  assert(boss.isMonster.isBoss, "greatbear is a boss");
  grantMonsterRewards(world, id, boss);
  return player.tracksProgression.capstones[BIOME_GROUP] ?? 0;
}

const baseBossCapstone = bossCapstoneGain("p-boss-base", 1);
assert(baseBossCapstone > 0, "baseline boss clear must grant a capstone");
assertScales("boss capstone", bossCapstoneGain("p-boss-boost", MULT), baseBossCapstone);

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

// Reward presentation must use the credited amount, including party shares,
// and must never manufacture a drop for a non-rewarding raised monster.
{
  const world = new World();
  world.rewardMultiplier = 7;
  const players = ['mote-killer', 'mote-party', 'mote-away'].map(id =>
    world.attachPlayerEntity(makePlayer(id), id));
  for (const player of players) {
    attachComponent(world, player, 'inParty', { leaderId: 'mote-killer', members: [] });
    player.hasPosition.nodeId = FARM_NODE;
  }
  players[2].hasPosition.nodeId = 'node-clearing';
  const wolf = world.createMonster(FARM_NODE, 'wolf', { x: 800, y: 900 })!;
  world.clearNodeEvents(FARM_NODE);
  grantMonsterRewards(world, 'mote-killer', wolf);
  const drops = world.takeNodeEvents(FARM_NODE).filter(ev => ev.kind === 'essence-drop');
  assert(drops.length === 2, 'one mote event per eligible reward recipient');
  for (const drop of drops) {
    const recipient = players.find(player => player.isPlayer.id === drop.playerId)!;
    assert(drop.amount === recipient.tracksProgression.essences[drop.essenceType], 'motes use actual wallet credit');
    assert(drop.targetId === wolf.isMonster.id && drop.pos.x === 800 && drop.pos.y === 900, 'drop retains death location');
  }
  wolf.hasPosition.current.x = 1200;
  assert(drops[0].pos.x === 800, 'event position is copied, not live entity state');
  attachComponent(world, wolf, 'isRaised', { raiserId: 'test-raiser' });
  assert(grantMonsterRewards(world, 'mote-killer', wolf) === null, 'raised monster has no reward');
  assert(world.takeNodeEvents(FARM_NODE).length === 0, 'raised monster emits no reward cosmetics');
}

// Per-biome XP multipliers are mastery-only: essence and shards ignore them,
// and biomes/tiers without an entry are untouched. (The T3/T4 monsters sampled
// here are outside the T1 family table, so they never earn shards either way —
// this still pins that nothing wires the biome XP factor into the shard grant.)
{
  const factors = GAME_CONFIG.BIOME_XP_MULT_BY_TIER_AND_BIOME as Record<number, Record<string, number>>;
  const sample = (node: string, type: string) => {
    const world = new World();
    const player = world.attachPlayerEntity(makePlayer("biome-factor"), "biome-factor");
    const monster = world.createMonster(node, type, { x: 800, y: 800 })!;
    grantMonsterRewards(world, "biome-factor", monster);
    const p = player.tracksProgression;
    return {
      xp: Object.values(p.biomeXP).reduce((a, b) => a + b, 0),
      essence: JSON.stringify(p.essences),
      shards: JSON.stringify(p.shards),
    };
  };
  const cases = [
    ["node-t4-desert-03", "sand-viper", factors[4]?.desert ?? 1],
    ["node-t4-tundra-01", "hoarfrost-yeti", factors[4]?.tundra ?? 1],
    ["node-t3-desert-01", "dune-stalker", 1],
    ["node-t4-volcanic-01", "ember-skink", 1],
  ] as const;
  const saved = factors[4];
  for (const [node, type, factor] of cases) {
    try {
      factors[4] = {};
      const base = sample(node, type);
      factors[4] = saved;
      const adjusted = sample(node, type);
      assert(base.xp > 0 && Math.abs(adjusted.xp - base.xp * factor) <= 1, `${node}: biome XP factor ${factor}`);
      assert(adjusted.essence === base.essence, `${node}: essence ignores the biome XP factor`);
      assert(adjusted.shards === base.shards, `${node}: shards ignore the biome XP factor`);
    } finally {
      factors[4] = saved;
    }
  }
}

console.log("rewardMultiplier.test: ok");
