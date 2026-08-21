import { GAME_CONFIG, emptyEquipment } from "@mmo-idle/shared";
import type { PersistedPlayerSlices } from "../src/db/playerRepo";
import { World } from "../src/world/World";
import { setAggroTarget } from "../src/systems/combat/ai/targeting";
import { ConcurrencySampler } from "../bench/balance/concurrency";

// Wiring smoke test for the farm bench's concurrency telemetry. It measures the
// load-bearing input of the encounter model — the mean number of monsters actually
// on the player — so the counting itself needs to be trustworthy.
//
// Deliberately does NOT run the bench (that needs Postgres for the hitbox cache).
// This drives the sampler against a hand-built World instead.

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(msg);
}

function makePlayer(id: string): PersistedPlayerSlices {
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
      hpRegen: GAME_CONFIG.PLAYER_HP_REGEN,
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
      playerTier: 0,
      currentSkillTier: 0,
      bossesCleared: [],
      clearedNodes: [],
      runesOwned: [],
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


const NODE = "node-t1-plains-01";
const world = new World();
const player = world.attachPlayerEntity(makePlayer("p1"), "p1");
player.hasPosition.nodeId = NODE;
player.hasPosition.current = { x: 800, y: 800 };

// Three monsters: two stacked on the player, one far away.
const near1 = world.createMonster(NODE, "boar", { x: 800, y: 800 })!;
const near2 = world.createMonster(NODE, "boar", { x: 802, y: 800 })!;
const far = world.createMonster(NODE, "boar", { x: 4000, y: 4000 })!;
const unaggroed = world.createMonster(NODE, "boar", { x: 805, y: 800 })!;

const now = 1_000;
for (const m of [near1, near2, far]) {
  setAggroTarget(world, m, { id: player.entityId, kind: "player" }, now);
}

// ── Counts split aggroed from in-range ───────────────────────────────────────
const sampler = new ConcurrencySampler();
sampler.sample(world, NODE, player);
let stats = sampler.result(1);

assert(stats.meanAggroed === 3, `3 monsters aggroed, got ${stats.meanAggroed}`);
assert(stats.meanInRange === 2, `only 2 are in reach, got ${stats.meanInRange}`);
assert(stats.peakAggroed === 3, "peak aggroed tracks the max");
assert(stats.peakInRange === 2, "peak in-range tracks the max");
assert(stats.combatUptime === 1, "the one sampled tick was in combat");
assert(stats.contactUptime === 1, "and had contact");
void unaggroed; // present in the node but never aggroed — must not be counted.

// ── Time-weighting: an idle tick halves the all-tick mean ────────────────────
for (const m of [near1, near2, far]) setAggroTarget(world, m, null, now);
sampler.sample(world, NODE, player);
stats = sampler.result(1);

assert(stats.meanAggroed === 1.5, `mean over both ticks is 1.5, got ${stats.meanAggroed}`);
assert(stats.meanInRange === 1, `mean in-range over both ticks is 1, got ${stats.meanInRange}`);
// In-combat means exclude the idle tick, so they keep the engaged reading.
assert(stats.meanAggroedInCombat === 3, "in-combat mean ignores idle ticks");
assert(stats.meanInRangeInCombat === 2, "in-contact mean ignores idle ticks");
assert(stats.combatUptime === 0.5, "half the ticks were in combat");

// ── Histogram is a distribution over ticks ───────────────────────────────────
const hist = stats.inRangeHistogram;
assert(hist.length === 7, "histogram has 0..6+ buckets");
assert(hist[0] === 0.5, "half the ticks had nobody in range");
assert(hist[2] === 0.5, "half the ticks had exactly 2 in range");
const total = hist.reduce((a, b) => a + b, 0);
assert(Math.abs(total - 1) < 1e-9, `histogram sums to 1, got ${total}`);

// ── aggroPerKill counts distinct monsters, not tick-samples ──────────────────
assert(stats.aggroPerKill === 3, `3 distinct monsters over 1 kill, got ${stats.aggroPerKill}`);
const perTwoKills = sampler.result(2);
assert(perTwoKills.aggroPerKill === 1.5, "aggroPerKill divides by kills");

// ── A dead player is counted as zero, not skipped ────────────────────────────
const deadSampler = new ConcurrencySampler();
for (const m of [near1, near2]) {
  setAggroTarget(world, m, { id: player.entityId, kind: "player" }, now);
}
world.ecs.addComponent(player, "isDead", { diedAt: now, cause: "monster" });
deadSampler.sample(world, NODE, player);
const deadStats = deadSampler.result(0);
assert(deadStats.meanInRange === 0, "a dead player takes no contact");
assert(deadStats.inRangeHistogram[0] === 1, "the death tick lands in bucket 0");

console.log("concurrencySampler.test: ok");
