/**
 * Progression rework Phase 0b — charm sweep, time-to-death.
 *
 * The amended Phase 0b exit asks for TIME-TO-DEATH, not fight-end HP: a geared
 * (+3) character with its tier's charm must land within ±10% of its pre-0b TTD,
 * a naked character at entry must be unchanged, and a geared character without
 * a charm is expected to be lower.
 *
 * Arena: the charm's home biome node with repopulation on; the bot fights as
 * usual (auto on, reference ability wiring) but the bench keeps `PRESSURE`
 * monsters aggroed on it at all times, so every cell dies inside the cap and the
 * measurement is survival under a constant pull, not a kill race. TTD is the sim
 * time from spawn to the first death.
 *
 * Pre-0b healing is emulated inside the same world: the percentage model healed
 * `maxHp × (5 + charmPct) / 100 × fraction` per second (base 5 after Phase 0a),
 * and every in-combat effect is a fraction of that one rate, so writing that
 * flat equivalent into `hasHealth.recovery` each tick reproduces it exactly.
 * The old charm percentages are read from `reports/progression-phase0/old-charm-pct.json`
 * (extracted from the pre-0b recipes).
 *
 *   cd server
 *   node --conditions=development --import tsx bench/phase0Ttd.ts <out-dir>
 *   PHASE0_TTD_CLASSES=striker,slinger PHASE0_TTD_PRESSURE=5 PHASE0_TTD_CAP_MS=300000
 *   PHASE0_TTD_ARMS=naked,geared,charm PHASE0_TTD_MODELS=old,new PHASE0_TTD_FILTER=t1-
 */
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, appendFileSync, existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { GAME_CONFIG, ITEM_DATABASE, NODE_BIOMES, RECIPE_DATABASE } from '@mmo-idle/shared';
import { prepareSurveyBot, SURVEY_CLASSES, type SurveyCell } from './balance/ttkSurveySpec';
import { createFarmWorld } from './balance/worldFactory';
import { setupArena, teardownArena, BOT_SPAWN } from './balance/arena';
import { writeHitboxArtifact, hydrateHitboxCacheFromArtifact } from '../src/hitbox/cache';
import { setAggroTarget } from '../src/systems/combat/ai/targeting';
import type { MonsterEntity } from '../src/ecs/entity';

type Arm = 'naked' | 'geared' | 'charm';
type Model = 'old' | 'new';
interface OldCharm { tier: number; base: number; steps: number[] }

const CHARM_NODES: Record<number, string[]> = {
  1: ['plains', 'forest', 'swamp', 'cave', 'mountain'],
  2: ['plains', 'forest', 'swamp', 'cave', 'mountain', 'jungle', 'desert'],
  3: ['cave', 'swamp', 'mountain', 'jungle', 'desert', 'volcanic', 'tundra'],
  4: ['graveyard', 'jungle', 'desert', 'trench', 'tundra', 'volcanic', 'mountain'],
};

function nodeFor(tier: number, biome: string): string {
  const ids = Object.entries(NODE_BIOMES)
    .filter(([id, n]) => n.biomeTier === tier && n.biomeGroup === biome && !id.includes('dungeon'))
    .map(([id]) => id);
  const pick = ids.find((id) => id.endsWith('-03')) ?? ids[0];
  assert(pick, `no open node for T${tier} ${biome}`);
  return pick;
}

interface TtdCell { cell: SurveyCell; arm: Arm; charmId: string | null; tier: number; biome: string; className: string }

function cells(plus: number, classNames: string[], arms: Arm[]): TtdCell[] {
  const out: TtdCell[] = [];
  const charms = [...RECIPE_DATABASE.values()].filter((r) => r.slot === 'recovery' && r.tier >= 1 && ITEM_DATABASE.has(r.id));
  for (const c of SURVEY_CLASSES.filter((c) => classNames.includes(c.name))) {
    for (const tier of [1, 2, 3, 4]) {
      const skillPath = [`${c.prefix}-root`, ...(tier >= 2 ? [`${c.prefix}-balanced`] : []), ...(tier >= 3 ? [`${c.prefix}-range-${c.melee ? 'close' : 'mid'}`] : [])];
      const weapon = c.weapons[Math.min(2, tier - 1)];
      const base = (id: string, nodeId: string, gear: SurveyCell['build']['gearItemIds']): SurveyCell => ({
        id, tier, role: 'ttd', nodeId, className: c.name, alternate: false, upgradeLevel: plus,
        build: { id, classRoot: `${c.prefix}-root`, contentTier: tier, playerTier: tier, gearTier: tier, skillPath, gearItemIds: gear },
      });
      // Naked and geared-without-charm are per tier, measured in the tier's first charm biome.
      const homeBiome = CHARM_NODES[tier][0];
      if (arms.includes('naked')) out.push({ cell: base(`ttd-t${tier}-${c.name}-naked`, nodeFor(tier, homeBiome), {}), arm: 'naked', charmId: null, tier, biome: homeBiome, className: c.name });
      for (const biome of CHARM_NODES[tier]) {
        const gear: SurveyCell['build']['gearItemIds'] = { weapon, armor: `${biome}-vest-t${tier}`, mobility: `mountain-boots-t${tier}`, ...(tier >= 2 ? { core: 'core-tempered' } : {}) };
        if (arms.includes('geared')) out.push({ cell: base(`ttd-t${tier}-${c.name}-${biome}-geared`, nodeFor(tier, biome), gear), arm: 'geared', charmId: null, tier, biome, className: c.name });
        if (arms.includes('charm')) for (const charm of charms.filter((r) => r.tier === tier && r.recipeGroup === biome)) {
          out.push({ cell: base(`ttd-t${tier}-${c.name}-${charm.id}`, nodeFor(tier, biome), { ...gear, recovery: charm.id }), arm: 'charm', charmId: charm.id, tier, biome, className: c.name });
        }
      }
    }
  }
  return out;
}

/** Percentage-model recovery points the pre-0b build carried: base 5 plus the charm at `plus`. */
function oldRecoveryPct(old: Record<string, OldCharm>, charmId: string | null, plus: number): number {
  let pct = 5;
  if (charmId) {
    const c = old[charmId];
    assert(c, `no pre-0b value for ${charmId}`);
    pct += c.base + c.steps.slice(0, plus).reduce((a, b) => a + b, 0);
  }
  return pct;
}

async function main() {
  const out = resolve(process.argv[2] ?? `../reports/progression-phase0/ttd-${new Date().toISOString().slice(0, 10)}`);
  const capMs = Number(process.env.PHASE0_TTD_CAP_MS ?? 300_000);
  const plus = Number(process.env.PHASE0_PLUS ?? 3);
  // Aggroed monsters kept on the bot. One value, or one per tier ("1,2,3,4"): a
  // single pull that kills a T1 bot in 40 s lets a T3 bot sit at the cap.
  const pressureList = (process.env.PHASE0_TTD_PRESSURE ?? '1').split(',').map(Number);
  const pressureFor = (tier: number) => pressureList[Math.min(pressureList.length - 1, tier - 1)];
  const seeds = (process.env.PHASE0_SEEDS ?? '101009').split(',').map(Number);
  const classNames = (process.env.PHASE0_TTD_CLASSES ?? 'striker,slinger').split(',');
  const arms = (process.env.PHASE0_TTD_ARMS ?? 'naked,geared,charm').split(',') as Arm[];
  const models = (process.env.PHASE0_TTD_MODELS ?? 'old,new').split(',') as Model[];
  const filter = process.env.PHASE0_TTD_FILTER;
  const old = JSON.parse(readFileSync(resolve('../reports/progression-phase0/old-charm-pct.json'), 'utf8')) as Record<string, OldCharm>;
  mkdirSync(out, { recursive: true });
  const artifact = resolve('../reports/progression-phase0/hitboxes.json');
  if (!existsSync(artifact)) await writeHitboxArtifact(artifact);
  assert(hydrateHitboxCacheFromArtifact(artifact) > 0);

  const selected = cells(plus, classNames, arms).filter((c) => !filter || c.cell.id.includes(filter));
  assert(selected.length > 0, 'no cells selected');
  writeFileSync(resolve(out, 'manifest.json'), JSON.stringify({
    schema: 1, source: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), capMs, plus, pressure: pressureList, seeds, classNames, arms, models,
    config: { RECOVERY_BASE_FRACTION: GAME_CONFIG.RECOVERY_BASE_FRACTION, RECOVERY_REFERENCE_POOL_BY_TIER: GAME_CONFIG.RECOVERY_REFERENCE_POOL_BY_TIER },
    scope: 'Time-to-death under a constant aggro pull in the charm\'s home node; pre-0b healing emulated as the flat equivalent of maxHp × (5 + charmPct)/100. Survey bot, +N gear, capped mastery, reference ability wiring.',
    cells: selected.map((c) => c.cell.id),
  }, null, 2));

  const originalRandom = Math.random, originalNow = Date.now;
  const rowsPath = resolve(out, 'rows.jsonl');
  interface Row { id: string; tier: number; className: string; biome: string; arm: Arm; charmId: string | null; model: Model; seed: number; maxHp: number; recoveryStat: number; recoveryUsed: number; ttdMs: number; survived: boolean; kills: number }
  const rows: Row[] = [];
  for (const tc of selected) for (const model of models) for (const seed of seeds) {
    let state = seed;
    Math.random = () => { state |= 0; state = state + 0x6D2B79F5 | 0; let t = Math.imul(state ^ state >>> 15, 1 | state); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    let now = 0; Date.now = () => now;
    const world = createFarmWorld();
    const nodeId = tc.cell.nodeId;
    const pressure = pressureFor(tc.tier);
    try {
      setupArena(world, { nodeId, biomeGroup: tc.biome, contentTier: tc.tier, isDungeon: false });
      const { bot } = prepareSurveyBot(world, tc.cell, BOT_SPAWN);
      const maxHp = bot.hasHealth.maxHp, recoveryStat = bot.hasHealth.recovery ?? 0;
      const oldFlat = maxHp * oldRecoveryPct(old, tc.charmId, plus) / 100;
      const recoveryUsed = model === 'old' ? oldFlat : recoveryStat;
      let ttdMs = capMs, survived = true, kills = 0, liveIds = new Set([...world.monsterEntitiesInNode(nodeId)].map((m) => m.isMonster.id));
      for (; now < capMs;) {
        if (model === 'old') bot.hasHealth.recovery = oldFlat;
        world.tick(100, now); now += 100;
        world.pendingDeaths = [];
        world.clearNodeEvents(nodeId);
        const next = new Set<string>();
        const monsters: MonsterEntity[] = [];
        for (const m of world.monsterEntitiesInNode(nodeId)) { next.add(m.isMonster.id); monsters.push(m); }
        for (const id of liveIds) if (!next.has(id)) kills++;
        liveIds = next;
        // Constant pull: top up the number of monsters aggroed on the bot.
        let onBot = 0;
        for (const m of monsters) if (m.hasAggroTarget?.targetKind === 'player' && m.hasAggroTarget.targetId === bot.isPlayer.id) onBot++;
        if (onBot < pressure) {
          const bx = bot.hasPosition.current.x, by = bot.hasPosition.current.y;
          const free = monsters.filter((m) => m.hasAggroTarget === undefined && m.hasHealth.hp > 0)
            .sort((a, b) => Math.hypot(a.hasPosition.current.x - bx, a.hasPosition.current.y - by) - Math.hypot(b.hasPosition.current.x - bx, b.hasPosition.current.y - by));
          for (const m of free.slice(0, pressure - onBot)) setAggroTarget(world, m, { id: bot.isPlayer.id, kind: 'player' }, now);
        }
        if (bot.isDead !== undefined || bot.hasHealth.hp <= 0) { ttdMs = now; survived = false; break; }
      }
      const row: Row = { id: tc.cell.id, tier: tc.tier, className: tc.className, biome: tc.biome, arm: tc.arm, charmId: tc.charmId, model, seed, maxHp, recoveryStat, recoveryUsed, ttdMs, survived, kills };
      rows.push(row);
      appendFileSync(rowsPath, JSON.stringify(row) + '\n');
      console.log(`${tc.cell.id.padEnd(44)} ${model.padEnd(3)} seed=${seed} maxHp=${maxHp} rec=${recoveryUsed.toFixed(1)} ttd=${(ttdMs / 1000).toFixed(1)}s${survived ? ' (survived cap)' : ''} kills=${kills}`);
    } finally {
      teardownArena(world); Math.random = originalRandom; Date.now = originalNow;
    }
  }

  // Report: per cell, old vs new TTD (median over seeds) and the ratio.
  const byCell = new Map<string, Row[]>();
  for (const r of rows) (byCell.get(r.id) ?? byCell.set(r.id, []).get(r.id)!).push(r);
  const med = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : NaN; };
  const lines = ['| cell | arm | maxHp | old rec | new rec | TTD old (s) | TTD new (s) | new/old | survived |', '|---|---|---:|---:|---:|---:|---:|---:|---|'];
  const summary: Record<string, unknown>[] = [];
  for (const [id, group] of byCell) {
    const o = group.filter((r) => r.model === 'old'), n = group.filter((r) => r.model === 'new');
    const to = med(o.map((r) => r.ttdMs)) / 1000, tn = med(n.map((r) => r.ttdMs)) / 1000;
    const surv = group.some((r) => r.survived);
    const rec = { id, arm: group[0].arm, tier: group[0].tier, className: group[0].className, biome: group[0].biome, charmId: group[0].charmId, maxHp: group[0].maxHp, oldRec: o[0]?.recoveryUsed ?? null, newRec: n[0]?.recoveryUsed ?? null, ttdOld: to, ttdNew: tn, ratio: to > 0 ? tn / to : null, survived: surv };
    summary.push(rec);
    lines.push(`| ${id} | ${rec.arm} | ${rec.maxHp} | ${rec.oldRec?.toFixed(1) ?? '—'} | ${rec.newRec?.toFixed(1) ?? '—'} | ${isNaN(to) ? '—' : to.toFixed(1)} | ${isNaN(tn) ? '—' : tn.toFixed(1)} | ${rec.ratio === null || isNaN(rec.ratio) ? '—' : rec.ratio.toFixed(2)} | ${surv ? 'yes' : ''} |`);
  }
  const md = [`# Phase 0b charm sweep — time-to-death — ${new Date().toISOString()}`, '', `pressure ${pressureList.join('/')} aggroed (per tier); cap ${capMs} ms; gear +${plus}; seeds ${seeds.join(', ')}; classes ${classNames.join(', ')}`, '', 'Target: charm arm new/old within 0.90–1.10; naked ≈ 1.00; geared-without-charm < 1.00 by design.', '', ...lines, ''].join('\n');
  writeFileSync(resolve(out, 'report.md'), md);
  writeFileSync(resolve(out, 'summary.json'), JSON.stringify(summary, null, 2));
  console.log('\n' + md + `\nwrote ${out}`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
