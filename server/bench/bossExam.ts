/**
 * Boss exam bench — measures a dungeon BOSS FIGHT in isolation.
 *
 * Why this exists rather than `--mode boss`:
 *
 *   `--mode boss` thaws the dungeon node and fights whatever is standing in it.
 *   A dungeon node standing idle holds only its GUARD; the boss is spawned by
 *   `activateDungeonAltar` (a player interaction) followed by a wake-up delay.
 *   The bench bot never touches the altar, and the run loop stops the moment the
 *   node is empty — so `--mode boss` has only ever measured the dungeon guard.
 *   Every "boss" row it has ever printed is a guard row.
 *
 * This runner strips the guard and forces the boss to wake immediately, so the
 * numbers describe the BOSS ENCOUNTER and nothing else: its script phases,
 * charged casts, pools, adds and shields, against one bot.
 *
 * Measurement notes:
 *
 * - HP lost is sampled as per-tick HP DECREASES, not the combat pipeline's
 *   `damageTaken`. Monster DoT, ground-zone pools and AoE splash all bypass that
 *   pipeline (the same finding the concurrency sampler documents), and three of
 *   the five T1 bosses deal much of their damage through exactly those paths.
 * - `ttk` is extrapolated when the bot dies or times out: `elapsed / bossHpFrac`.
 *   That assumes constant player DPS, so it is optimistic for a boss whose late
 *   phase hardens (Behemoth / Broodmother shields). Rows carry their outcome.
 * - Gear biome is a PARAMETER, not the boss's own biome. T1 biome armour provides
 *   wildly unequal counterplay (see the mitigation handoff), so scoring each boss
 *   only in its native set would let a broken armour decide the boss's numbers.
 *   The default sweeps every T1 armour set against every boss and reports means.
 */
import { DUNGEON_DEFS, MONSTER_DATABASE } from '@mmo-idle/shared';
import { BENCH_DT_MS, ensureBenchHitboxCache } from './harness';
import type { World } from '../src/world/World';
import type { MonsterEntity } from '../src/ecs/entity';
import { createBalanceWorld } from './balance/worldFactory';
import { setupArena, teardownArena, BOT_SPAWN } from './balance/arena';
import { materializeBot, BENCH_BOT_ID } from './balance/botFactory';
import { enumerateBuildsForContentTier } from './balance/progression';
import { ensureDungeon } from '../src/systems/world/dungeons/dungeon';
import {
  registerCombatListener,
  unregisterCombatListener,
  type CombatEventHandler,
} from '../src/systems/combat/engine/combatPipeline';
import type { BuildSpec, ContentTarget } from './balance/types';

// ── CLI ──────────────────────────────────────────────────────────────────────

const ARGV = process.argv.slice(2);
const argOf = (name: string): string | null => {
  const i = ARGV.indexOf(name);
  return i >= 0 && ARGV[i + 1] ? ARGV[i + 1] : null;
};
const TIER = Number(argOf('--tier') ?? 1);
const TIME_SCALE = Number(argOf('--time-scale') ?? 1);
const MAX_SECONDS = Number(argOf('--max-seconds') ?? 240);
const GEAR_BIOMES = (argOf('--gear-biomes') ?? 'plains,forest,swamp,mountain,cave').split(',');
const ONLY_BOSS = argOf('--boss');
const JSON_OUT = ARGV.includes('--json');

// ── Encounter setup ──────────────────────────────────────────────────────────

interface BossNode {
  nodeId: string;
  biomeGroup: string;
  bossId: string;
}

/**
 * Every dungeon node at `tier` holding a normal (non-overlord) boss.
 *
 * Read from `DUNGEON_DEFS`, not `NODE_BIOMES[id].bossTypeId` — most dungeon nodes
 * leave that field unset and inherit their boss from the biome's `bossPoolByTier`,
 * so the node record alone finds almost nothing.
 */
function bossNodes(tier: number): BossNode[] {
  const out: BossNode[] = [];
  for (const def of DUNGEON_DEFS.values()) {
    if (def.biomeTier !== tier) continue;
    const bossId = def.boss.bossId;
    if (!MONSTER_DATABASE.get(bossId)?.isBoss) continue;
    out.push({ nodeId: def.nodeId, biomeGroup: def.biomeGroup, bossId });
  }
  return out;
}

/**
 * Clear the guard and wake the boss now.
 *
 * The guard is separate content with its own budget (`BIOME_GUARD_POSTURE`) and
 * varies far more between biomes than the bosses do. Leaving it in would make
 * every boss row a guard-plus-boss row, and the bot would meet the boss at
 * whatever HP the guard happened to leave it on.
 */
function forceBossPhase(world: World, nodeId: string): void {
  ensureDungeon(world, nodeId);
  const state = world.dungeons.get(nodeId);
  if (!state) throw new Error(`no dungeon state for ${nodeId}`);
  for (const id of state.guardianIds) world.removeMonsterEntity(id);
  state.guardianIds = [];
  state.guardiansEngaged = true;
  state.status = 'bossAwakening';
  state.bossAwakensAtMs = -1; // wakes on the next tick
}

function findBoss(world: World, nodeId: string, bossId: string): MonsterEntity | null {
  for (const m of world.monsterEntitiesInNode(nodeId)) {
    if (m.isMonster.monsterTypeId === bossId) return m;
  }
  return null;
}

// ── One fight ────────────────────────────────────────────────────────────────

interface FightRow {
  bossId: string;
  bossName: string;
  biomeGroup: string;
  gearBiome: string;
  classRoot: string;
  outcome: 'boss_killed' | 'bot_died' | 'timeout';
  elapsedS: number;
  maxHp: number;
  bossMaxHp: number;
  /** Fraction of the boss's HP the bot removed. */
  bossHpFrac: number;
  /** Seconds for a full kill; extrapolated from bossHpFrac when incomplete. */
  ttkS: number;
  hpLost: number;
  /** HP lost per second, as a fraction of the bot's pool. */
  poolPerS: number;
  /** Health bars the FULL fight costs: poolPerS x ttkS. */
  costBars: number;
  /** Worst single second of the fight, as a fraction of the bot's pool. */
  peakBurst: number;
  /** Share of hp lost that arrived as charged/empowered pipeline hits. */
  spikeShare: number;
  /** Share of hp lost that bypassed the combat pipeline (DoT, pools, splash). */
  attritionShare: number;
  /** Adds alive at the end (the Razorback swarm). */
  addsAtEnd: number;
}

function runFight(build: BuildSpec, node: BossNode, gearBiome: string): FightRow {
  const world = createBalanceWorld();
  const dt = BENCH_DT_MS * TIME_SCALE;
  const target: ContentTarget = {
    nodeId: node.nodeId,
    biomeGroup: node.biomeGroup,
    contentTier: TIER,
    isDungeon: true,
  };

  let pipelineTotal = 0;
  let pipelineSpike = 0;
  const onDamageTaken: CombatEventHandler = (ctx) => {
    if (ctx.defenderType !== 'player') return;
    if (ctx.defender.isPlayer.id !== BENCH_BOT_ID) return;
    pipelineTotal += ctx.damage;
    if (ctx.metadata['empoweredAttack']) pipelineSpike += ctx.damage;
  };
  registerCombatListener('onDamageTaken', onDamageTaken);

  try {
    setupArena(world, target);
    forceBossPhase(world, node.nodeId);
    const bot = materializeBot(world, build, target, BOT_SPAWN);

    let now = 0;
    let ticks = 0;
    const maxTicks = Math.ceil((MAX_SECONDS * 1000) / dt);
    let hpLost = 0;
    let lastHp = bot.hasHealth.hp;
    let boss: MonsterEntity | null = null;
    let bossMaxHp = MONSTER_DATABASE.get(node.bossId)?.stats.hp ?? 1;
    let bossHp = bossMaxHp;
    let bossSeen = false;
    let outcome: FightRow['outcome'] = 'timeout';

    // Rolling one-second window of per-tick HP loss, for the burst reading.
    const windowTicks = Math.max(1, Math.round(1000 / dt));
    const window: number[] = [];
    let windowSum = 0;
    let peakWindow = 0;

    while (ticks < maxTicks) {
      world.tick(dt, now);
      world.pendingDeaths = [];
      now += dt;
      ticks++;

      const hp = bot.hasHealth.hp;
      const tickLoss = hp < lastHp ? lastHp - hp : 0;
      hpLost += tickLoss;
      lastHp = hp;
      window.push(tickLoss);
      windowSum += tickLoss;
      if (window.length > windowTicks) windowSum -= window.shift() ?? 0;
      if (windowSum > peakWindow) peakWindow = windowSum;

      boss = findBoss(world, node.nodeId, node.bossId);
      if (boss) {
        bossSeen = true;
        bossMaxHp = boss.hasHealth.maxHp;
        bossHp = boss.hasHealth.hp;
      }

      if (bot.hasHealth.hp <= 0) {
        outcome = 'bot_died';
        break;
      }
      if (bossSeen && !boss) {
        bossHp = 0;
        outcome = 'boss_killed';
        break;
      }
    }

    let addsAtEnd = 0;
    for (const m of world.monsterEntitiesInNode(node.nodeId)) {
      if (m.isMonster.monsterTypeId !== node.bossId) addsAtEnd++;
    }

    const elapsedS = (ticks * dt) / 1000;
    const bossHpFrac = Math.max(0.001, 1 - bossHp / bossMaxHp);
    const ttkS = elapsedS / bossHpFrac;
    const maxHp = bot.hasHealth.maxHp;
    const poolPerS = elapsedS > 0 ? hpLost / elapsedS / maxHp : 0;

    return {
      bossId: node.bossId,
      bossName: MONSTER_DATABASE.get(node.bossId)?.name ?? node.bossId,
      biomeGroup: node.biomeGroup,
      gearBiome,
      classRoot: build.classRoot,
      outcome,
      elapsedS,
      maxHp,
      bossMaxHp,
      bossHpFrac,
      ttkS,
      hpLost,
      poolPerS,
      costBars: poolPerS * ttkS,
      peakBurst: peakWindow / maxHp,
      spikeShare: hpLost > 0 ? pipelineSpike / hpLost : 0,
      attritionShare: hpLost > 0 ? Math.max(0, hpLost - pipelineTotal) / hpLost : 0,
      addsAtEnd,
    };
  } finally {
    unregisterCombatListener('onDamageTaken', onDamageTaken);
    teardownArena(world);
  }
}

// ── Reporting ────────────────────────────────────────────────────────────────

const f = (v: number, d = 2): string => v.toFixed(d);
const mean = (xs: number[]): number =>
  xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length;

function report(rows: FightRow[]): string {
  const byBoss = new Map<string, FightRow[]>();
  for (const r of rows) {
    const list = byBoss.get(r.bossId) ?? [];
    list.push(r);
    byBoss.set(r.bossId, list);
  }
  const roots = [...new Set(rows.map((r) => r.classRoot))];
  const order = [...byBoss.entries()].sort(
    (a, b) => mean(b[1].map((r) => r.costBars)) - mean(a[1].map((r) => r.costBars)),
  );

  const lines: string[] = [];
  lines.push(`# Tier ${TIER} boss exam\n`);
  lines.push(
    `Guard stripped, boss woken immediately. ${GEAR_BIOMES.length} armour set(s) x ` +
      `${roots.length} class roots per boss, gear fully upgraded, ` +
      `time-scale ${TIME_SCALE}, cap ${MAX_SECONDS}s.\n`,
  );
  lines.push(
    '`cost` = health bars the full fight costs (`hp lost/s / pool` x `ttk`). ' +
      '`ttk` is extrapolated from boss HP removed when the fight did not finish. ' +
      '`burst` is the worst single second as a share of the pool.\n',
  );
  lines.push(
    '| boss | biome | win | ttk s | cost bars | hp/s %pool | burst %pool | spike% | attrition% |',
  );
  lines.push('|---|---|---:|---:|---:|---:|---:|---:|---:|');
  for (const [, list] of order) {
    const r0 = list[0];
    const wins = list.filter((r) => r.outcome === 'boss_killed').length;
    lines.push(
      `| ${r0.bossName} | ${r0.biomeGroup} | ${wins}/${list.length} | ` +
        `${f(mean(list.map((r) => r.ttkS)), 1)} | ${f(mean(list.map((r) => r.costBars)))} | ` +
        `${f(mean(list.map((r) => r.poolPerS)) * 100, 1)} | ` +
        `${f(mean(list.map((r) => r.peakBurst)) * 100, 1)} | ` +
        `${f(mean(list.map((r) => r.spikeShare)) * 100, 0)} | ` +
        `${f(mean(list.map((r) => r.attritionShare)) * 100, 0)} |`,
    );
  }

  lines.push('\n## Per class root (cost bars)\n');
  lines.push(`| boss | ${roots.map((r) => r.replace('-root', '')).join(' | ')} |`);
  lines.push(`|---|${roots.map(() => '---:').join('|')}|`);
  for (const [, list] of order) {
    const cells = roots.map((root) =>
      f(mean(list.filter((r) => r.classRoot === root).map((r) => r.costBars))),
    );
    lines.push(`| ${list[0].bossName} | ${cells.join(' | ')} |`);
  }

  lines.push('\n## Per armour set (cost bars)\n');
  lines.push(`| boss | ${GEAR_BIOMES.join(' | ')} |`);
  lines.push(`|---|${GEAR_BIOMES.map(() => '---:').join('|')}|`);
  for (const [, list] of order) {
    const cells = GEAR_BIOMES.map((g) =>
      f(mean(list.filter((r) => r.gearBiome === g).map((r) => r.costBars))),
    );
    lines.push(`| ${list[0].bossName} | ${cells.join(' | ')} |`);
  }

  lines.push('\n## Every fight\n');
  lines.push(
    '| boss | gear | class | outcome | elapsed s | boss hp removed | ttk s | cost bars | burst %pool |',
  );
  lines.push('|---|---|---|---|---:|---:|---:|---:|---:|');
  for (const r of rows) {
    lines.push(
      `| ${r.bossName} | ${r.gearBiome} | ${r.classRoot.replace('-root', '')} | ${r.outcome} | ` +
        `${f(r.elapsedS, 1)} | ${f(r.bossHpFrac * 100, 0)}% | ${f(r.ttkS, 1)} | ` +
        `${f(r.costBars)} | ${f(r.peakBurst * 100, 1)} |`,
    );
  }
  return lines.join('\n') + '\n';
}

async function main(): Promise<void> {
  await ensureBenchHitboxCache();
  const nodes = bossNodes(TIER).filter((n) => !ONLY_BOSS || n.bossId === ONLY_BOSS);
  const rows: FightRow[] = [];
  for (const node of nodes) {
    for (const gearBiome of GEAR_BIOMES) {
      for (const build of enumerateBuildsForContentTier(TIER, gearBiome)) {
        rows.push(runFight(build, node, gearBiome));
      }
    }
  }
  if (JSON_OUT) {
    console.log(JSON.stringify(rows, null, 2));
    return;
  }
  process.stdout.write(report(rows));
}

void main();
