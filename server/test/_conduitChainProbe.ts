// Throwaway probe (leading `_` = skipped by the test runner).
// Chained T1 pulls: pack after pack with a short out-of-combat walk between them,
// the way auto-traverse actually plays. Compares every class root, then Conduit
// with the attrition fixes toggled (area share, out-of-combat rebuild) and the
// formation runes (Step Back, Taunt Target) equipped.
// Env: PROBE_CASES=forest,cave  PROBE_SEEDS=6  PROBE_CONDUIT_ONLY=1
//
// Usage: pnpm --filter @mmo-idle/server exec tsx --conditions=development test/_conduitChainProbe.ts

import { NODE_BIOMES, SUMMONER_CORE_TUNING, type EquippedRule } from "@mmo-idle/shared";
import { BENCH_DT_MS } from "../bench/harness";
import { createFarmWorld } from "../bench/balance/worldFactory";
import { setupArena, BOT_SPAWN } from "../bench/balance/arena";
import { materializeBot } from "../bench/balance/botFactory";
import { farmTargetForNode } from "../bench/balance/farmTargets";
import { representativeBuildsPerClass } from "../bench/balance/progression";

const ROOTS = ["cadence-root", "cooldown-root", "reload-root", "energy-root", "dot-root", "summoner-root"];
const SEEDS = Number(process.env.PROBE_SEEDS ?? 3);
const ONLY = process.env.PROBE_CASES?.split(",");
const ONLY_CONDUIT = process.env.PROBE_CONDUIT_ONLY === "1";
const STEP_BACK: EquippedRule = { conditionId: "inside-telegraph", actionId: "step-back" };
const TAUNT: EquippedRule = { conditionId: "in-combat", actionId: "taunt-current-target" };
const PULLS = 5;
/** Minimum out-of-combat gap between a clear and the next pack arriving. */
const WALK_MS = 4_000;
/** Like the default `wait-for-regen` rune: the next pull waits for this much HP. */
const PULL_AT_HP_PCT = 0.9;
const MAX_WAIT_MS = 60_000;
const PULL_LIMIT_MS = Number(process.env.PROBE_LIMIT_MS ?? 60_000);

function t1Node(biome: string) {
  const id = Object.entries(NODE_BIOMES)
    .filter(([, i]) => i.biomeGroup === biome && i.biomeTier === 1 && i.kind === "normal")
    .map(([nodeId]) => nodeId).sort()[0];
  if (!id) throw new Error(`no T1 ${biome} node`);
  return farmTargetForNode(id);
}

const CASES: { label: string; biome: string; pack: string[] }[] = [
  { label: "Forest wolf pack", biome: "forest", pack: ["young-wolf", "wolf", "young-wolf"] },
  { label: "Forest moss rats", biome: "forest", pack: ["forest-slime", "forest-slime", "forest-slime"] },
  { label: "Mountain titan", biome: "mountain", pack: ["granite-titan"] },
  { label: "Cave brute", biome: "cave", pack: ["cave-brute"] },
];

interface Fixes { name: string; area: boolean; rebuild: boolean; runes?: EquippedRule[] }
const LIVE_EXP = SUMMONER_CORE_TUNING.areaShareExponent;
const LIVE_SPEED = SUMMONER_CORE_TUNING.outOfCombatReconstructionSpeedMult;
function applyFixes(f: Fixes) {
  const t = SUMMONER_CORE_TUNING as { areaShareExponent: number; outOfCombatReconstructionSpeedMult: number };
  t.areaShareExponent = f.area ? LIVE_EXP : 0;
  t.outOfCombatReconstructionSpeedMult = f.rebuild ? LIVE_SPEED : 1;
}
const BOTH: Fixes = { name: "both fixes", area: true, rebuild: true };

function chain(target: ReturnType<typeof t1Node>, classRoot: string, pack: string[], seed: number, runes: EquippedRule[] = []) {
  const build = representativeBuildsPerClass(target.contentTier, target.biomeGroup, { classRoot })[0]!;
  const world = createFarmWorld();
  world.suppressRepopulation = true;
  setupArena(world, target);
  for (const m of [...world.monsterEntitiesInNode(target.nodeId)]) world.removeMonsterEntity(m.entityId);
  const bot = materializeBot(world, build, target, BOT_SPAWN);
  bot.usesAutocombat.auto = true;
  bot.tracksProgression.runesEquipped = [...bot.tracksProgression.runesEquipped, ...runes];

  const dt = BENCH_DT_MS;
  let now = 0;
  let died = false;
  let pullsCleared = 0;
  let fightMs = 0;
  let minHpPct = 1;
  const aliveAtPull: number[] = [];
  const tick = () => {
    world.tick(dt, now);
    world.pendingDeaths = [];
    world.clearNodeEvents(target.nodeId);
    now += dt;
    minHpPct = Math.min(minHpPct, bot.hasHealth.hp / bot.hasHealth.maxHp);
    if (bot.isDead !== undefined || bot.hasHealth.hp <= 0) died = true;
  };
  const livingSummons = () => (bot.summonsMinions?.minionIds ?? [])
    .filter((id) => id && (world.getMinionEntity(id)?.hasHealth.hp ?? 0) > 0).length;

  for (let pull = 0; pull < PULLS && !died; pull++) {
    if (bot.summonsMinions) aliveAtPull.push(livingSummons());
    const all = pack.map((t, i) => world.createMonster(target.nodeId, t, {
      x: BOT_SPAWN.x - 60 + i * 60 + (seed % 3) * 5,
      y: BOT_SPAWN.y - 130,
    })!).filter(Boolean);
    const everyone = [...world.monsterEntitiesInNode(target.nodeId)];
    void all;
    const start = now;
    while (!died && now - start < PULL_LIMIT_MS) {
      tick();
      if (everyone.every((m) => m.hasHealth.hp <= 0 || !world.monsterById.has(m.entityId))) break;
    }
    if (died || now - start >= PULL_LIMIT_MS) break;
    fightMs += now - start;
    pullsCleared++;
    const walkStart = now;
    while (!died && now - walkStart < MAX_WAIT_MS
      && (now - walkStart < WALK_MS || bot.hasHealth.hp < bot.hasHealth.maxHp * PULL_AT_HP_PCT)) tick();
  }
  return { died, pullsCleared, fightMs, totalMs: now, minHpPct, aliveAtPull };
}

const avg = (xs: number[]) => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN;
function summarize(rs: ReturnType<typeof chain>[]) {
  const full = rs.filter((r) => r.pullsCleared === PULLS);
  const perPull = full.length ? (avg(full.map((r) => r.fightMs)) / PULLS / 1000).toFixed(1) + "s" : "—";
  const cycle = full.length ? (avg(full.map((r) => r.totalMs)) / PULLS / 1000).toFixed(1) + "s" : "—";
  const alive = rs.flatMap((r) => r.aliveAtPull.slice(1));
  return `deaths ${rs.filter((r) => r.died).length}/${rs.length} pulls ${avg(rs.map((r) => r.pullsCleared)).toFixed(1)}/${PULLS}`
    + ` fight/pull ${perPull} cycle/pull ${cycle} minHP ${(avg(rs.map((r) => r.minHpPct)) * 100).toFixed(0)}%`
    + (alive.length ? ` summonsAtPull ${avg(alive).toFixed(1)}` : "");
}

const cases = CASES.filter((k) => !ONLY || ONLY.includes(k.biome));
applyFixes(BOTH);
for (const [label, runes] of [["live code", []], ["+ Step Back", [STEP_BACK]]] as const) {
  if (ONLY_CONDUIT) break;
  console.log(`
== All roots, ${label} (${PULLS} pulls, >=${WALK_MS / 1000}s walk, next pull at ${PULL_AT_HP_PCT * 100}% HP) ==`);
  for (const c of cases) {
    const target = t1Node(c.biome);
    console.log(`
-- ${c.label} (${target.nodeId})`);
    for (const root of ROOTS) {
      const rs = Array.from({ length: SEEDS }, (_, s) => chain(target, root, c.pack, s, [...runes]));
      console.log(`${root.padEnd(14)} | ${summarize(rs)}`);
    }
  }
}

console.log(`
== Conduit variants ==`);
const VARIANTS: Fixes[] = [
  { name: "old (no fixes)", area: false, rebuild: false },
  BOTH,
  { ...BOTH, name: "+ Step Back", runes: [STEP_BACK] },
  { ...BOTH, name: "+ Taunt", runes: [TAUNT] },
  { ...BOTH, name: "+ Step Back + Taunt", runes: [STEP_BACK, TAUNT] },
];
for (const c of cases) {
  const target = t1Node(c.biome);
  console.log(`
-- ${c.label}`);
  for (const v of VARIANTS) {
    applyFixes(v);
    const rs = Array.from({ length: SEEDS }, (_, s) => chain(target, "summoner-root", c.pack, s, v.runes ?? []));
    console.log(`${v.name.padEnd(20)} | ${summarize(rs)}`);
  }
}
applyFixes(BOTH);
