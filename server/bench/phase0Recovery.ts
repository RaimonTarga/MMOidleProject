/**
 * Progression rework Phase 0 — coarse HP/recovery pass measurement.
 *
 * In-process stand-in for the live-bot metric while Docker is unavailable:
 * one reference bot per (class, frame, biome) farms an open T1/T2 Plains or
 * Forest node with repopulation on, and every 100 ms tick feeds the SAME
 * `FightHpTracker` the bot recorder uses. Output is per cell: fights, median
 * fight-end HP, share of fight time in the 20–80% band, deaths, kills, and the
 * monsters behind the largest single hits (the burst-lethal list for Phase 4).
 *
 * Fidelity caveat (docs/progression-rework-plan.md Phase 0): this is the
 * `ttkSurvey` bot, not the route bot. It wears +N gear at capped biome mastery,
 * runs reference ability wiring only, and never travels. Treat the numbers as
 * provisional; the phase gate is the live bot's `combat.fights` column.
 *
 *   cd server
 *   node --conditions=development --import tsx bench/phase0Recovery.ts <out-dir>
 *   PHASE0_FILTER=striker PHASE0_CAP_MS=300000 PHASE0_PLUS=3 PHASE0_TIERS=1,2,3,4
 *   PHASE0_MAX_HP / PHASE0_BASE_FRACTION / PHASE0_SW=timed / PHASE0_SW_MULT lever overrides
 */
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, appendFileSync, existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { ABILITY_DATABASE, GAME_CONFIG, MONSTER_DATABASE, NODE_BIOMES, type EquippedRule } from '@mmo-idle/shared';
import { prepareSurveyBot, SURVEY_CLASSES, type SurveyCell } from './balance/ttkSurveySpec';
import { createFarmWorld } from './balance/worldFactory';
import { setupArena, teardownArena, BOT_SPAWN } from './balance/arena';
import { reviveInFarmNode } from './balance/runFarm';
import { writeHitboxArtifact, hydrateHitboxCacheFromArtifact } from '../src/hitbox/cache';
import { isPlayerActivelyInCombat } from '../src/systems/combat/ai/engagement';
import { registerCombatListener, unregisterCombatListener, type CombatEventHandler } from '../src/systems/combat/engine/combatPipeline';
import { FightHpTracker, summarizeFights, type FightHpRecord, type FightHpSummary } from '../../bot/src/telemetry/fightHp';
import { oldModelRecovery, type OldCharmPct } from './phase0RecoveryModel';

const BIOMES = ['plains', 'forest'] as const;
const FRAMES = ['light', 'heavy'] as const;
/** T3/T4 open nodes for the Phase 0b per-tier check (the survey's own picks). */
const HIGH_TIER_NODES: Record<3 | 4, readonly string[]> = {
  3: ['node-t3-cave-02', 'node-t3-volcanic-03'],
  4: ['node-t4-graveyard-03', 'node-t4-tundra-03'],
};

/**
 * Second Wind wiring. `reference` is the retired default (fires off cooldown in
 * combat, so at full HP the heal is wasted). `timed` fires at `hp-below-25`, the
 * only HP-threshold condition authored, as a stand-in for a player who saves it.
 * The Use Ability rune is gone (class-first D3), so nothing fires Second Wind
 * from a Rune now and `timed` only differs by spelling out the default rules.
 */
type SecondWindWiring = 'reference' | 'timed';
function rulesFor(c: (typeof SURVEY_CLASSES)[number], wiring: SecondWindWiring): EquippedRule[] | undefined {
  if (wiring === 'reference') return undefined;
  return [
    { conditionId: 'always', actionId: 'auto-path-enemy' },
    { conditionId: 'inside-telegraph', actionId: 'step-back' },
    ...(!c.melee ? [{ conditionId: 'in-combat', actionId: 'orbit' }] : []),
    { conditionId: 'always', actionId: 'avoid-hazards' },
    { conditionId: 'always', actionId: 'wait-for-regen' },
  ];
}

function cells(plus: number, wiring: SecondWindWiring, tiers: number[]): SurveyCell[] {
  const out: SurveyCell[] = [];
  for (const c of SURVEY_CLASSES) for (const tier of [3, 4] as const) {
    if (!tiers.includes(tier)) continue;
    for (const nodeId of HIGH_TIER_NODES[tier]) for (const frame of FRAMES) {
      const biome = NODE_BIOMES[nodeId].biomeGroup;
      const id = `p0-t${tier}-${c.name}-${frame}-${biome}`;
      out.push({ id, tier, role: 'farm', nodeId, className: c.name, alternate: false, upgradeLevel: plus, runeRules: rulesFor(c, wiring),
        build: { id, classRoot: `${c.prefix}-root`, contentTier: tier, playerTier: tier, gearTier: tier,
          skillPath: [`${c.prefix}-root`, `${c.prefix}-${frame}`, `${c.prefix}-range-${c.melee ? 'close' : 'mid'}`],
          gearItemIds: { weapon: c.weapons[2], armor: `${biome}-vest-t${tier}`, recovery: `${biome}-charm-t${tier}`, mobility: `mountain-boots-t${tier}` } } });
    }
  }
  for (const c of SURVEY_CLASSES) for (const biome of BIOMES) {
    const runeRules = rulesFor(c, wiring);
    // T1: root only — a T1 character owns one skill point.
    if (tiers.includes(1)) {
      const id = `p0-t1-${c.name}-root-${biome}`;
      out.push({ id, tier: 1, role: 'farm', nodeId: `node-t1-${biome}-03`, className: c.name, alternate: false, upgradeLevel: plus, runeRules,
        build: { id, classRoot: `${c.prefix}-root`, contentTier: 1, playerTier: 1, gearTier: 1, skillPath: [`${c.prefix}-root`],
          gearItemIds: { weapon: c.weapons[0], armor: `${biome}-vest-t1`, recovery: `${biome}-charm-t1`, mobility: 'mountain-boots-t1' } } });
    }
    // T2: two frames per root, as the phase exit asks.
    if (tiers.includes(2)) for (const frame of FRAMES) {
      const id = `p0-t2-${c.name}-${frame}-${biome}`;
      out.push({ id, tier: 2, role: 'farm', nodeId: `node-t2-${biome}-03`, className: c.name, alternate: false, upgradeLevel: plus, runeRules,
        build: { id, classRoot: `${c.prefix}-root`, contentTier: 2, playerTier: 2, gearTier: 2, skillPath: [`${c.prefix}-root`, `${c.prefix}-${frame}`],
          gearItemIds: { weapon: c.weapons[1], armor: `${biome}-vest-t2`, recovery: `${biome}-charm-t2`, mobility: 'mountain-boots-t2' } } });
    }
  }
  return out;
}

interface CellRow {
  id: string; tier: number; className: string; frame: string; biome: string; seed: number; capMs: number;
  maxHp: number; recovery: number; kills: number; deaths: number;
  /** HP lost / regained while engaged (tick deltas), as fractions of max HP per fight. */
  lostPerFight: number; healedPerFight: number; engagedMs: number;
  fights: FightHpSummary;
  /** Largest single hits taken, with their source — the burst-lethal watch list. */
  burst: Array<{ source: string; hitFraction: number; hpBeforeFraction: number; atMs: number }>;
}

async function main() {
  const out = resolve(process.argv[2] ?? `../reports/progression-phase0/${new Date().toISOString().slice(0, 10)}`);
  const capMs = Number(process.env.PHASE0_CAP_MS ?? 300_000);
  const plus = Number(process.env.PHASE0_PLUS ?? 3);
  const seeds = (process.env.PHASE0_SEEDS ?? '101009,101033').split(',').map(Number);
  const filter = process.env.PHASE0_FILTER;
  const wiring = (process.env.PHASE0_SW ?? 'reference') as SecondWindWiring;
  const tiers = (process.env.PHASE0_TIERS ?? '1,2').split(',').map(Number);
  // Gear arm (Phase 0b exit): 'charm' = +N gear with the biome charm (default),
  // 'geared' = the same without a charm, 'naked' = no items at all.
  const arm = (process.env.PHASE0_ARM ?? 'charm') as 'charm' | 'geared' | 'naked';
  assert(arm === 'charm' || arm === 'geared' || arm === 'naked', 'PHASE0_ARM must be charm, geared or naked');
  // PHASE0_MODEL=old emulates the pre-0b percentage model inside the current
  // engine: every in-combat effect is a fraction of one rate, so writing
  // maxHp × (5 + oldCharmPct) / 100 into hasHealth.recovery each tick reproduces
  // it exactly (base 5 = Phase 0a). Old charm percentages come from
  // reports/progression-phase0/old-charm-pct.json (extracted from the pre-0b recipes).
  const model = (process.env.PHASE0_MODEL ?? 'new') as 'old' | 'new';
  assert(model === 'old' || model === 'new', 'PHASE0_MODEL must be old or new');
  const oldCharms: Record<string, OldCharmPct> = model === 'old'
    ? JSON.parse(readFileSync(resolve('../reports/progression-phase0/old-charm-pct.json'), 'utf8')) as Record<string, OldCharmPct>
    : {};
  assert(wiring === 'reference' || wiring === 'timed', 'PHASE0_SW must be reference or timed');
  // Lever overrides for the sweep. GAME_CONFIG is `as const` for types only; the
  // stat recalc reads these at call time, so mutating before any bot is built is
  // exactly what committing the value to gameConfig.ts would do.
  const cfg = GAME_CONFIG as unknown as Record<string, number>;
  if (process.env.PHASE0_MAX_HP) cfg.PLAYER_MAX_HP = Number(process.env.PHASE0_MAX_HP);
  // Flat model (Phase 0b): the base rate is a fraction of the tier's reference pool.
  if (process.env.PHASE0_BASE_FRACTION) cfg.RECOVERY_BASE_FRACTION = Number(process.env.PHASE0_BASE_FRACTION);
  // Second Wind activates a fraction of the Recovery rate, so cutting the rate
  // also shrinks the one active heal. This knob scales its `recoveryPct` ranks
  // to test keeping the ability's absolute heal while passive sustain drops.
  const swMult = Number(process.env.PHASE0_SW_MULT ?? 1);
  if (swMult !== 1) {
    const sw = ABILITY_DATABASE.get('second-wind')!;
    for (const rank of sw.ranks) if (rank.effect.kind === 'heal') (rank.effect as { recoveryPct: number }).recoveryPct *= swMult;
  }
  mkdirSync(out, { recursive: true });
  const artifact = resolve('../reports/progression-phase0/hitboxes.json');
  if (!existsSync(artifact)) await writeHitboxArtifact(artifact);
  assert(hydrateHitboxCacheFromArtifact(artifact) > 0);

  const selected = cells(plus, wiring, tiers).filter((c) => !filter || c.id.includes(filter)).map((c) => {
    if (arm === 'charm') return c;
    const gearItemIds = arm === 'naked' ? {} : Object.fromEntries(Object.entries(c.build.gearItemIds).filter(([slot]) => slot !== 'recovery'));
    return { ...c, id: `${c.id}-${arm}`, build: { ...c.build, id: `${c.id}-${arm}`, gearItemIds } };
  });
  assert(selected.length > 0, 'no cells selected');
  writeFileSync(resolve(out, 'manifest.json'), JSON.stringify({
    schema: 1, source: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), capMs, plus, seeds, tiers, arm, model, secondWind: wiring, secondWindMult: swMult,
    config: { PLAYER_MAX_HP: GAME_CONFIG.PLAYER_MAX_HP, RECOVERY_BASE_FRACTION: GAME_CONFIG.RECOVERY_BASE_FRACTION, RECOVERY_REFERENCE_POOL_BY_TIER: GAME_CONFIG.RECOVERY_REFERENCE_POOL_BY_TIER, OOC_RECOVERY_PCT: GAME_CONFIG.OOC_RECOVERY_PCT, COMBAT_REGEN_DELAY: GAME_CONFIG.COMBAT_REGEN_DELAY },
    scope: 'ttkSurvey reference bot, capped mastery, declared +N gear, reference ability wiring, no travel. Deaths revive in place. Provisional; not the live-bot column.',
    cells: selected.map((c) => c.id),
  }, null, 2));

  const originalRandom = Math.random, originalNow = Date.now;
  const rows: CellRow[] = [];
  const fightLists = new Map<CellRow, FightHpRecord[]>();
  const rowsPath = resolve(out, 'rows.jsonl');
  for (const cell of selected) for (const seed of seeds) {
    let state = seed;
    Math.random = () => { state |= 0; state = state + 0x6D2B79F5 | 0; let t = Math.imul(state ^ state >>> 15, 1 | state); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    let now = 0; Date.now = () => now;
    const world = createFarmWorld();
    const biome = NODE_BIOMES[cell.nodeId].biomeGroup;
    const target = { nodeId: cell.nodeId, biomeGroup: biome, contentTier: cell.tier, isDungeon: false };
    const tracker = new FightHpTracker();
    const burst: CellRow['burst'] = [];
    let kills = 0, deaths = 0, hpLost = 0, hpHealed = 0, engagedMs = 0, lastHp = 0;
    const onDamage: CombatEventHandler = (ctx) => {
      if (ctx.defenderType !== 'player' || ctx.damage <= 0) return;
      const maxHp = ctx.defender.hasHealth.maxHp;
      const source = ctx.attackerType === 'monster' ? (MONSTER_DATABASE.get(ctx.attacker.isMonster.monsterTypeId)?.name ?? ctx.attacker.isMonster.monsterTypeId) : ctx.attackerType;
      burst.push({ source, hitFraction: ctx.damage / maxHp, hpBeforeFraction: ctx.defender.hasHealth.hp / maxHp, atMs: now });
      burst.sort((a, b) => b.hitFraction - a.hitFraction);
      if (burst.length > 5) burst.length = 5;
    };
    const onKill: CombatEventHandler = (ctx) => { if (ctx.defenderType === 'monster') kills++; };
    registerCombatListener('onDamageTaken', onDamage); registerCombatListener('onKill', onKill);
    try {
      setupArena(world, target);
      const { bot } = prepareSurveyBot(world, cell, BOT_SPAWN);
      const maxHp = bot.hasHealth.maxHp;
      // Null under the DEFAULT `new` model: `oldCharms` is only loaded for the
      // `old` arm, so asking it for a charm's pre-0b percentage there threw and
      // took the bench's own primary arm down with it.
      const oldFlat = oldModelRecovery({ model, maxHp, charmId: cell.build.gearItemIds.recovery, plus, oldCharms });
      if (oldFlat !== null) bot.hasHealth.recovery = oldFlat;
      const recovery = bot.hasHealth.recovery ?? 0;
      lastHp = bot.hasHealth.hp;
      for (; now < capMs;) {
        if (oldFlat !== null) bot.hasHealth.recovery = oldFlat;
        world.tick(100, now); now += 100;
        world.pendingDeaths = [];
        world.clearNodeEvents(cell.nodeId);
        const dead = bot.isDead !== undefined || bot.hasHealth.hp <= 0;
        const engaged = !dead && isPlayerActivelyInCombat(world, bot);
        if (engaged) {
          engagedMs += 100;
          const delta = bot.hasHealth.hp - lastHp;
          if (delta < 0) hpLost -= delta; else hpHealed += delta;
        }
        lastHp = bot.hasHealth.hp;
        tracker.sample(now, 100, {
          engaged,
          dead,
          hpFraction: bot.hasHealth.hp / bot.hasHealth.maxHp,
          biomeGroup: biome,
          nodeId: cell.nodeId,
        });
        if (dead) { deaths++; reviveInFarmNode(world, bot, cell.nodeId); lastHp = bot.hasHealth.hp; }
      }
      tracker.finish(now);
      const realFights = Math.max(1, tracker.fights.filter((f) => f.durationMs >= 1000).length);
      const row: CellRow = { id: cell.id, tier: cell.tier, className: cell.className,
        frame: cell.build.skillPath[1]?.split('-').pop() ?? 'root', biome, seed, capMs, maxHp, recovery, kills, deaths,
        lostPerFight: Math.round(hpLost / realFights / maxHp * 1000) / 1000, healedPerFight: Math.round(hpHealed / realFights / maxHp * 1000) / 1000, engagedMs,
        fights: summarizeFights(tracker.fights), burst };
      rows.push(row); fightLists.set(row, tracker.fights);
      appendFileSync(rowsPath, JSON.stringify({ ...row, fightList: tracker.fights }) + '\n');
      const f = row.fights;
      console.log(`${cell.id.padEnd(34)} seed=${seed} fights=${String(f.fights).padStart(3)} medEnd=${fmt(f.medianEndHpFraction)} inBand=${fmt(f.timeInBandShare)} lost/fight=${fmt(row.lostPerFight)} healed/fight=${fmt(row.healedPerFight)} deaths=${deaths} kills=${kills}`);
    } finally {
      unregisterCombatListener('onDamageTaken', onDamage); unregisterCombatListener('onKill', onKill);
      teardownArena(world); Math.random = originalRandom; Date.now = originalNow;
    }
  }

  // Aggregate per cell over seeds (fight lists pooled), then print the gate table.
  const table: string[] = ['| cell | maxHp | fights | median end HP | mean end HP | time in band | lost/fight | healed/fight | deaths | kills | <20% | 20-40 | 40-60 | 60-80 | >=80 |', '|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|'];
  const byCell = new Map<string, CellRow[]>();
  for (const r of rows) (byCell.get(r.id) ?? byCell.set(r.id, []).get(r.id)!).push(r);
  const pooled: Record<string, FightHpSummary> = {};
  for (const [id, group] of byCell) {
    const fights = group.flatMap((r) => fightLists.get(r)!);
    const s = summarizeFights(fights); pooled[id] = s;
    const b = s.endHpBuckets;
    table.push(`| ${id} | ${group[0].maxHp} | ${s.fights} | ${fmt(s.medianEndHpFraction)} | ${fmt(s.meanEndHpFraction)} | ${fmt(s.timeInBandShare)} | ${fmt(avg(group.map((r) => r.lostPerFight)))} | ${fmt(avg(group.map((r) => r.healedPerFight)))} | ${group.reduce((a, r) => a + r.deaths, 0)} | ${group.reduce((a, r) => a + r.kills, 0)} | ${b.lt20} | ${b.from20to40} | ${b.from40to60} | ${b.from60to80} | ${b.ge80} |`);
  }
  const burstAll = rows.flatMap((r) => r.burst.map((h) => ({ ...h, cell: r.id }))).sort((a, b) => b.hitFraction - a.hitFraction).slice(0, 15);
  const md = [`# Phase 0 recovery pass — ${new Date().toISOString()}`, '', `cap ${capMs} ms per cell per seed; seeds ${seeds.join(', ')}; arm ${arm}; model ${model}; gear +${plus}; Second Wind ${wiring} x${swMult}; RECOVERY_BASE_FRACTION ${GAME_CONFIG.RECOVERY_BASE_FRACTION} of pools ${GAME_CONFIG.RECOVERY_REFERENCE_POOL_BY_TIER.join('/')} (flat HP/s); OOC ${GAME_CONFIG.OOC_RECOVERY_PCT}; PLAYER_MAX_HP ${GAME_CONFIG.PLAYER_MAX_HP}`, '',
    'Target: median fight-end HP 0.40–0.60, time in band > 0.50.', '', ...table, '', '## Largest single hits (burst watch list)', '', '| cell | source | hit / maxHp | HP before |', '|---|---|---:|---:|',
    ...burstAll.map((h) => `| ${h.cell} | ${h.source} | ${fmt(h.hitFraction)} | ${fmt(h.hpBeforeFraction)} |`), ''].join('\n');
  writeFileSync(resolve(out, 'report.md'), md);
  writeFileSync(resolve(out, 'summary.json'), JSON.stringify({ pooled, burst: burstAll }, null, 2));
  console.log('\n' + md);
  console.log(`\nwrote ${out}`);
}

function avg(xs: number[]): number { return xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length); }
function fmt(x: number | null): string { return x === null ? '—' : x.toFixed(2); }

main().catch((error) => { console.error(error); process.exitCode = 1; });
