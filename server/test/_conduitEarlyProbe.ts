// Throwaway probe (leading `_` = skipped by the test runner).
// Early-game Conduit vs the other class roots: sustained damage, Plains groups
// of three, and the Forest wolf pack. Arrival builds come from the balance bench.
//
// Usage: pnpm --filter @mmo-idle/server exec tsx --conditions=development test/_conduitEarlyProbe.ts

import { NODE_BIOMES, SUMMONER_CORE_TUNING, SUMMONER_FRAME_TUNING } from "@mmo-idle/shared";
import { BENCH_DT_MS } from "../bench/harness";
import { createFarmWorld } from "../bench/balance/worldFactory";
import { setupArena, BOT_SPAWN } from "../bench/balance/arena";
import { materializeBot } from "../bench/balance/botFactory";
import { farmTargetForNode } from "../bench/balance/farmTargets";
import { representativeBuildsPerClass } from "../bench/balance/progression";

const ROOTS = ["cadence-root", "cooldown-root", "reload-root", "energy-root", "dot-root", "summoner-root"];
const SEEDS = 4;

function t1Node(biome: string) {
  const id = Object.entries(NODE_BIOMES)
    .filter(([, i]) => i.biomeGroup === biome && i.biomeTier === 1 && i.kind === "normal")
    .map(([nodeId]) => nodeId).sort()[0]!;
  return farmTargetForNode(id);
}
const PLAINS = t1Node("plains");
const FOREST = t1Node("forest");

interface Variant {
  name: string;
  /** null = live code (summons inherit owner armor); 0 = old unarmored summons. */
  forcePlating: number | null;
  offenseMult: number;
  hpMult: number;
}
const LIVE: Variant = { name: "new (inherit armor)", forcePlating: null, offenseMult: 1, hpMult: 1 };
const OLD: Variant = { name: "old (no armor)", forcePlating: 0, offenseMult: 1, hpMult: 1 };

const baseRootHp = SUMMONER_FRAME_TUNING.root.totalSummonHpPct;
const baseOffense = SUMMONER_CORE_TUNING.formationOffenseMult;

function applyVariant(v: Variant) {
  (SUMMONER_FRAME_TUNING.root as { totalSummonHpPct: number }).totalSummonHpPct = baseRootHp * v.hpMult;
  (SUMMONER_CORE_TUNING as { formationOffenseMult: number }).formationOffenseMult = baseOffense * v.offenseMult;
}

function run(
  target: ReturnType<typeof t1Node>,
  classRoot: string,
  pack: string[],
  v: Variant,
  seed: number,
  opts: { dummy?: boolean; limitMs?: number } = {},
) {
  applyVariant(v);
  const build = representativeBuildsPerClass(target.contentTier, target.biomeGroup, { classRoot })[0]!;
  const world = createFarmWorld();
  world.suppressRepopulation = true;
  setupArena(world, target);
  for (const m of [...world.monsterEntitiesInNode(target.nodeId)]) world.removeMonsterEntity(m.entityId);
  const bot = materializeBot(world, build, target, BOT_SPAWN);
  bot.usesAutocombat.auto = true;

  const mons = pack.map((t, i) => world.createMonster(target.nodeId, t, {
    x: BOT_SPAWN.x - 60 + i * 60 + (seed % 3) * 5,
    y: BOT_SPAWN.y - 130,
  })!).filter(Boolean);
  // Pack alphas spawn their own followers; count everything that is actually there.
  const all = [...world.monsterEntitiesInNode(target.nodeId)];
  if (opts.dummy) {
    for (const m of all) {
      m.hasHealth.hp = m.hasHealth.maxHp = 1_000_000;
      m.dealsDamage.attack = 0;
    }
  }
  const startHp = all.reduce((s, m) => s + m.hasHealth.hp, 0);

  const dt = BENCH_DT_MS;
  const limit = opts.limitMs ?? 90_000;
  let now = 0;
  let summonDeaths = 0;
  let minHpPct = 1;
  const seenDead = new Set<string>();
  const seenPinned = new WeakSet<object>();
  let clearedAt = -1;
  let died = false;
  for (let tick = 0; tick < limit / dt; tick++) {
    if (v.forcePlating !== null && bot.summonsMinions) {
      for (const id of bot.summonsMinions.minionIds) {
        const mn = id ? world.getMinionEntity(id) : undefined;
        if (mn && !seenPinned.has(mn)) {
          // Pin the old unarmored summon: the live per-tick sync can't overwrite it.
          const forced = v.forcePlating;
          Object.defineProperty(mn.mitigatesDamage, "plating", { get: () => forced, set: () => {}, configurable: true });
          Object.defineProperty(mn.mitigatesDamage, "damageReduction", { get: () => 0, set: () => {}, configurable: true });
          seenPinned.add(mn);
        }
      }
    }
    world.tick(dt, now);
    world.pendingDeaths = [];
    world.clearNodeEvents(target.nodeId);
    now += dt;
    if (bot.summonsMinions) {
      for (const id of bot.summonsMinions.minionIds) {
        const mn = id ? world.getMinionEntity(id) : undefined;
        if (id && (!mn || mn.hasHealth.hp <= 0) && !seenDead.has(id)) { seenDead.add(id); summonDeaths++; }
      }
    }
    minHpPct = Math.min(minHpPct, bot.hasHealth.hp / bot.hasHealth.maxHp);
    if (bot.isDead !== undefined || bot.hasHealth.hp <= 0) { died = true; break; }
    if (!opts.dummy && all.every((m) => m.hasHealth.hp <= 0 || !world.monsterById.has(m.entityId))) {
      clearedAt = now; break;
    }
  }
  const endHp = all.reduce((s, m) => s + (world.monsterById.has(m.entityId) ? Math.max(0, m.hasHealth.hp) : 0), 0);
  applyVariant({ ...LIVE });
  void mons;
  return {
    died, clearedS: clearedAt < 0 ? null : clearedAt / 1000, summonDeaths, minHpPct,
    dps: (startHp - endHp) / (now / 1000), packHp: startHp,
    ownerHp: bot.hasHealth.maxHp, plating: bot.mitigatesDamage.plating, attack: bot.dealsDamage.attack,
    cd: bot.performsAttack.attackCooldown,
  };
}

const avg = (xs: number[]) => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN;
function summarize(rs: ReturnType<typeof run>[]) {
  const clr = rs.filter((r) => r.clearedS !== null).map((r) => r.clearedS!);
  return `deaths ${rs.filter((r) => r.died).length}/${rs.length} clear ${clr.length ? avg(clr).toFixed(1) + "s" : "never"}`
    + ` minHP ${(avg(rs.map((r) => r.minHpPct)) * 100).toFixed(0)}% summonDeaths ${avg(rs.map((r) => r.summonDeaths)).toFixed(1)}`;
}

// 1. Sustained damage vs a harmless single target (includes walking/engage time).
console.log(`== Sustained single-target DPS, 30s vs harmless dummy (${PLAINS.nodeId} build) ==`);
for (const root of ROOTS) {
  const rs = Array.from({ length: 2 }, (_, s) => run(PLAINS, root, ["boar"], LIVE, s, { dummy: true, limitMs: 30_000 }));
  const r = rs[0]!;
  console.log(`${root.padEnd(14)} atk=${r.attack}/${r.cd}ms paper=${(r.attack / (r.cd / 1000)).toFixed(1)} measured=${avg(rs.map((x) => x.dps)).toFixed(1)}`);
}

// 2. Plains groups of three.
const PLAINS_PACKS: Record<string, string[]> = {
  "3 hares": ["plains-slime", "plains-slime", "plains-slime"],
  "2 hares + boar": ["plains-slime", "plains-slime", "boar"],
  "3 boars": ["boar", "boar", "boar"],
};
// 3. Forest wolf pack (alpha brings its two young wolves) and a moss-rat trio.
const FOREST_PACKS: Record<string, string[]> = {
  "wolf pack": ["young-wolf", "wolf", "young-wolf"],
  "3 moss rats": ["forest-slime", "forest-slime", "forest-slime"],
};

for (const [label, target, packs] of [
  ["Plains T1", PLAINS, PLAINS_PACKS],
  ["Forest T1", FOREST, FOREST_PACKS],
] as const) {
  console.log(`\n== ${label} (${target.nodeId}) ==`);
  for (const root of ROOTS) {
    for (const [packName, pack] of Object.entries(packs)) {
      const rs = Array.from({ length: SEEDS }, (_, s) => run(target, root, pack, LIVE, s));
      const r = rs[0]!;
      console.log(`${root.padEnd(14)} ${packName.padEnd(15)} hp=${r.ownerHp} plat=${r.plating} packHp=${r.packHp} | ${summarize(rs)}`);
    }
  }
}

console.log(`\n== Conduit variants ==`);
const VARIANTS: Variant[] = [
  OLD,
  LIVE,
  { name: "new + offense x1.15", forcePlating: null, offenseMult: 1.15, hpMult: 1 },
  { name: "new + offense x1.2", forcePlating: null, offenseMult: 1.2, hpMult: 1 },
];
for (const v of VARIANTS) {
  const dummy = run(PLAINS, "summoner-root", ["boar"], v, 0, { dummy: true, limitMs: 30_000 });
  console.log(`${v.name}  dummyDPS=${dummy.dps.toFixed(1)}`);
  for (const [label, target, packs] of [["Plains", PLAINS, PLAINS_PACKS], ["Forest", FOREST, FOREST_PACKS]] as const) {
    for (const [packName, pack] of Object.entries(packs)) {
      const rs = Array.from({ length: SEEDS }, (_, s) => run(target, "summoner-root", pack, v, s));
      console.log(`   ${label.padEnd(7)} ${packName.padEnd(15)} | ${summarize(rs)}`);
    }
  }
}
