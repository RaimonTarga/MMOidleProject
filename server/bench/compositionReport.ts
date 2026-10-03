/**
 * The lean × verb composition matrix REPORT (course-correction W3-A).
 *
 * Reads the two instruments' rows and writes `composition-matrix.md`:
 *
 *   - the boss lab (`scripts/_t1BossLab.ts` over `_t1BossPlan.ts --matrix=composition`):
 *     every weapon's nine T1 pairs + its no-band control, six tutorial classes, five
 *     T1 bosses, ten seeds;
 *   - the lane bench (`bench/compositionLanes.ts`): the same pairs and classes on the
 *     weapon's home-biome family-dominated nodes, ten seeds.
 *
 * Uplift is ALWAYS against the same (weapon, class) wearing the same form with no
 * cards, in the same encounter: on the lane bench, kills per minute over the
 * control's on the same node pooled over seeds (the lane matrix's own definition);
 * in the boss lab, mean boss DPS (HP removed per fight-second, wins and losses
 * alike) over the control's on the same boss and seeds. A (weapon, class, pair) cell
 * is the median of those over its nodes / bosses; a (weapon, pair) reading is the
 * median over the six classes.
 *
 * The judgments are design §24.1's viability floor (no pair below 0.9× the median
 * pair of its tier and instrument) and the brief's outlier ceiling (listed above
 * 1.5×), both from `lineage/viabilityFloor.ts`. Moment firings are the verb card's
 * landed `card-fx` events, reported per minute of engaged (lanes) or fight (boss)
 * time, so "fires rarely" is visible next to the uplift.
 *
 *   node --conditions=development --import tsx bench/compositionReport.ts \
 *     [--boss=../reports/course-correction/matrix-boss.jsonl] \
 *     [--lanes=../reports/course-correction/matrix-lanes.jsonl] \
 *     [--out=../reports/course-correction/composition-matrix.md] [--note=<runs line>]
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { ITEM_DATABASE, PACKET_DEFINITIONS, type PacketId } from '@mmo-idle/shared';
import { CLASS_BY_ROOT, compositionPairs, t1FormOf, weaponLineages } from './lineage/compositionPairs';
import { medianOf, viabilityFloor } from './lineage/viabilityFloor';

const args = Object.fromEntries(process.argv.slice(2).map((s) => {
  const i = s.indexOf('=');
  return i < 0 ? [s.slice(2), '1'] : [s.slice(2, i), s.slice(i + 1)];
})) as Record<string, string>;

const DIR = '../reports/course-correction';
const bossPath = resolve(args.boss ?? `${DIR}/matrix-boss.jsonl`);
const lanesPath = resolve(args.lanes ?? `${DIR}/matrix-lanes.jsonl`);
const outPath = resolve(args.out ?? `${DIR}/composition-matrix.md`);

const CLASSES = Object.values(CLASS_BY_ROOT);
const BOSSES = ['tusked-razorback', 'gnarled-greatbear', 'grave-toadeater', 'crag-behemoth', 'obsidian-broodmother'];
const BOSS_SHORT: Record<string, string> = {
  'tusked-razorback': 'Razorback', 'gnarled-greatbear': 'Greatbear', 'grave-toadeater': 'Toadeater',
  'crag-behemoth': 'Behemoth', 'obsidian-broodmother': 'Broodmother',
};

interface BossRow {
  id: string; boss: string; cls: string; seed: number; weapon: string; lineage: string;
  lean: string | null; verb: string | null; refusals: string[]; fxByCard: Record<string, number>;
  verbFires: number; won: boolean; t: number; dealt: number; dps: number; bossPctLeft: number;
  minHpPct: number; error?: string;
}
interface LaneRow {
  cellId: string; lineageId: string; cls: string; pair: string; lean: PacketId | null; verb: PacketId | null;
  nodeId: string; seed: number; kills: number; deaths: number; engagedMs: number; capMs: number;
  refusals: string[]; verbFires: number;
}

function readJsonl<T>(path: string): T[] {
  if (!existsSync(path)) return [];
  const out: T[] = [];
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    try { out.push(JSON.parse(line) as T); } catch { /* torn line: skipped and counted below */ }
  }
  return out;
}

const bossRows = readJsonl<BossRow>(bossPath).filter((r) => !r.error && r.lineage);
const bossErrors = readJsonl<BossRow>(bossPath).filter((r) => r.error);
const laneRows = readJsonl<LaneRow>(lanesPath);

/** `cmp-rapier-tempo×affliction|striker|...` → `tempo×affliction`. */
const bossPair = (r: BossRow): string => r.id.split('|')[0].slice(`cmp-${r.lineage}-`.length);

const pct = (x: number | null | undefined, digits = 1): string =>
  x === null || x === undefined || !Number.isFinite(x) ? '—' : `${x >= 0 ? '+' : ''}${(x * 100).toFixed(digits)}%`;
const num = (x: number | null | undefined, digits = 1): string =>
  x === null || x === undefined || !Number.isFinite(x) ? '—' : x.toFixed(digits);
const mean = (xs: number[]): number | null => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const shard = (lane: PacketId | null): string => (lane ? PACKET_DEFINITIONS.get(lane)?.shardName ?? lane : '—');

// ── Cells ─────────────────────────────────────────────────────────────────────

interface PairCell {
  /** Median over nodes (lanes) or bosses (boss lab) of the per-encounter uplift. */
  uplift: number | null;
  /** Verb firings per minute of engaged (lanes) / fight (boss) time. */
  firesPerMin: number | null;
  verbFires: number;
  /** Lanes: deaths; boss: fights lost. Control's alongside for the delta. */
  bad: number;
  controlBad: number;
  n: number;
  refusals: string[];
  /** Boss lab only: win rate of the pair and of the control. */
  winRate?: number;
  controlWinRate?: number;
}

type CellKey = `${string}|${string}|${string}`; // weapon|class|pair
const key = (weapon: string, cls: string, pair: string): CellKey => `${weapon}|${cls}|${pair}`;

function laneCells(): Map<CellKey, PairCell> {
  const byEncounter = new Map<string, LaneRow[]>(); // weapon|class|pair|node
  for (const row of laneRows) {
    const k = `${row.lineageId}|${row.cls}|${row.pair}|${row.nodeId}`;
    const list = byEncounter.get(k) ?? [];
    list.push(row);
    byEncounter.set(k, list);
  }
  const out = new Map<CellKey, PairCell>();
  for (const lineage of weaponLineages()) {
    for (const cls of CLASSES) {
      for (const pair of compositionPairs(lineage)) {
        if (pair.label === 'control') continue;
        const nodes = [...new Set(laneRows.filter((r) => r.lineageId === lineage.id && r.cls === cls).map((r) => r.nodeId))];
        const uplifts: number[] = [];
        let fires = 0; let engaged = 0; let deaths = 0; let controlDeaths = 0; let n = 0;
        const refusals = new Set<string>();
        for (const nodeId of nodes) {
          const mine = byEncounter.get(`${lineage.id}|${cls}|${pair.label}|${nodeId}`) ?? [];
          const control = byEncounter.get(`${lineage.id}|${cls}|control|${nodeId}`) ?? [];
          if (mine.length === 0 || control.length === 0) continue;
          const kpm = (rows: LaneRow[]) => rows.reduce((a, r) => a + r.kills, 0) / (rows.reduce((a, r) => a + r.capMs, 0) / 60_000);
          const c = kpm(control);
          if (c > 0) uplifts.push(kpm(mine) / c - 1);
          fires += mine.reduce((a, r) => a + r.verbFires, 0);
          engaged += mine.reduce((a, r) => a + r.engagedMs, 0);
          deaths += mine.reduce((a, r) => a + r.deaths, 0);
          controlDeaths += control.reduce((a, r) => a + r.deaths, 0);
          n += mine.length;
          for (const r of mine) for (const refusal of r.refusals) refusals.add(refusal);
        }
        if (n === 0) continue;
        out.set(key(lineage.id, cls, pair.label), {
          uplift: medianOf(uplifts),
          firesPerMin: engaged > 0 ? fires / (engaged / 60_000) : null,
          verbFires: fires, bad: deaths, controlBad: controlDeaths, n, refusals: [...refusals],
        });
      }
    }
  }
  return out;
}

function bossCells(): Map<CellKey, PairCell> {
  const byEncounter = new Map<string, BossRow[]>(); // weapon|class|pair|boss
  for (const row of bossRows) {
    const k = `${row.lineage}|${row.cls}|${bossPair(row)}|${row.boss}`;
    const list = byEncounter.get(k) ?? [];
    list.push(row);
    byEncounter.set(k, list);
  }
  const out = new Map<CellKey, PairCell>();
  for (const lineage of weaponLineages()) {
    for (const cls of CLASSES) {
      for (const pair of compositionPairs(lineage)) {
        if (pair.label === 'control') continue;
        const uplifts: number[] = [];
        let fires = 0; let fightMs = 0; let losses = 0; let controlLosses = 0; let n = 0; let controlN = 0;
        const refusals = new Set<string>();
        for (const boss of BOSSES) {
          const mine = byEncounter.get(`${lineage.id}|${cls}|${pair.label}|${boss}`) ?? [];
          const control = byEncounter.get(`${lineage.id}|${cls}|control|${boss}`) ?? [];
          if (mine.length === 0 || control.length === 0) continue;
          const c = mean(control.map((r) => r.dps))!;
          if (c > 0) uplifts.push(mean(mine.map((r) => r.dps))! / c - 1);
          fires += mine.reduce((a, r) => a + r.verbFires, 0);
          fightMs += mine.reduce((a, r) => a + r.t * 1000, 0);
          losses += mine.filter((r) => !r.won).length;
          controlLosses += control.filter((r) => !r.won).length;
          n += mine.length;
          controlN += control.length;
          for (const r of mine) for (const refusal of r.refusals) refusals.add(refusal);
        }
        if (n === 0) continue;
        out.set(key(lineage.id, cls, pair.label), {
          uplift: medianOf(uplifts),
          firesPerMin: fightMs > 0 ? fires / (fightMs / 60_000) : null,
          verbFires: fires, bad: losses, controlBad: controlLosses, n, refusals: [...refusals],
          winRate: 1 - losses / n, controlWinRate: controlN ? 1 - controlLosses / controlN : undefined,
        });
      }
    }
  }
  return out;
}

const instruments = [
  { name: 'boss lab', short: 'boss', cells: bossCells(), rows: bossRows.length, badLabel: 'losses' },
  { name: 'lane bench', short: 'lanes', cells: laneCells(), rows: laneRows.length, badLabel: 'deaths' },
] as const;

/** A (weapon, pair) reading over the six classes. */
interface PairReading { weapon: string; pair: string; lean: PacketId; verb: PacketId; uplift: number | null; firesPerMin: number | null; zeroFireClasses: string[] }
function pairReadings(cells: Map<CellKey, PairCell>): PairReading[] {
  const out: PairReading[] = [];
  for (const lineage of weaponLineages()) {
    for (const pair of compositionPairs(lineage)) {
      if (pair.label === 'control') continue;
      const perClass = CLASSES.flatMap((cls) => {
        const cell = cells.get(key(lineage.id, cls, pair.label));
        return cell ? [{ cls, cell }] : [];
      });
      out.push({
        weapon: lineage.id, pair: pair.label, lean: pair.lean!, verb: pair.verb!,
        uplift: medianOf(perClass.flatMap(({ cell }) => (cell.uplift === null ? [] : [cell.uplift]))),
        firesPerMin: medianOf(perClass.flatMap(({ cell }) => (cell.firesPerMin === null ? [] : [cell.firesPerMin]))),
        zeroFireClasses: perClass.filter(({ cell }) => cell.verbFires === 0).map(({ cls }) => cls),
      });
    }
  }
  return out;
}

/** A (weapon, class) reading: the median of its nine pairs. */
interface WeaponClassReading { weapon: string; cls: string; uplift: number | null }
function weaponClassReadings(cells: Map<CellKey, PairCell>): WeaponClassReading[] {
  return weaponLineages().flatMap((lineage) => CLASSES.map((cls) => ({
    weapon: lineage.id,
    cls,
    uplift: medianOf(compositionPairs(lineage).flatMap((pair) => {
      const cell = cells.get(key(lineage.id, cls, pair.label));
      return cell?.uplift === null || cell?.uplift === undefined ? [] : [cell.uplift];
    })),
  })));
}

// ── Markdown ──────────────────────────────────────────────────────────────────

const lines: string[] = [];
const push = (...xs: string[]) => lines.push(...xs);
let head = '';
try { head = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim(); } catch { /* not a checkout */ }

push(
  '# Composition matrix — T1 lean × verb (course-correction W3-A)',
  '',
  `Generated ${new Date().toISOString().slice(0, 16)}Z${head ? ` at \`${head}\`` : ''} by \`server/bench/compositionReport.ts\` from`
  + ` \`matrix-boss.jsonl\` (${bossRows.length} fights${bossErrors.length ? `, ${bossErrors.length} errored` : ''}) and`
  + ` \`matrix-lanes.jsonl\` (${laneRows.length} lane runs).${args.note ? ` ${args.note}` : ''}`,
  '',
  '**What a row is.** A weapon\'s T1 LEAN (row 1) and T1 VERB (row 2), bought through the real',
  'economy handler, worn by one of the six tutorial classes on that weapon\'s own T1 form —',
  'nine pairs per weapon, plus a no-band CONTROL (the same form, no cards). Every class may',
  'wear every T1 weapon (no class or range gate), so the cross is complete: 5 weapons × 6',
  'classes × 10 rows.',
  '',
  '**Uplift** is against that control, never across classes: on the **lane bench**, kills per',
  'minute on the weapon\'s home-biome family-dominated nodes (pooled over seeds, median over',
  'nodes); in the **boss lab**, mean boss DPS (HP removed per fight-second) on the same boss',
  'and seeds (median over the five bosses). A (weapon, pair) reading is the median over the',
  'six classes. **Fires/min** is the verb card\'s landed `card-fx` events per minute of',
  'engaged (lanes) or fight (boss) time — 0 means the moment never paid out.',
  '',
  '**Judgments.** Design §24.1\'s viability floor: no pair below **0.9×** the median pair of',
  'its instrument (T1 is the only tier measured). Outliers are listed above **1.5×** and below',
  '0.9× of that median — the 1.5× list is a reading, never a failure.',
  '',
);

for (const inst of instruments) {
  const readings = pairReadings(inst.cells);
  const floor = viabilityFloor(readings, (r) => r.uplift);
  push(
    `## ${inst.name[0].toUpperCase()}${inst.name.slice(1)} — summary`,
    '',
    `${inst.rows} rows. Median pair uplift **${pct(floor.median)}**; floor (0.9×) **${pct(floor.floor)}**; outlier ceiling (1.5×) **${pct(floor.ceiling)}**.`
    + ` Below the floor: **${floor.belowFloor.length}** of ${readings.length} pairs; above 1.5×: **${floor.aboveCeiling.length}**.`
    + (floor.medianPositive ? '' : ' **The median is not positive.**'),
    '',
  );
}

for (const lineage of weaponLineages()) {
  const lanes = lineage.lanes;
  const form = t1FormOf(lineage);
  const title = `${lineage.id[0].toUpperCase()}${lineage.id.slice(1)} — ${ITEM_DATABASE.get(form)?.name ?? form}`;
  push(`## ${title} (\`${form}\`, home ${lineage.homeBiome}) — lanes ${lanes.map((l) => `${l} (${shard(l)})`).join(', ')}`, '');
  for (const inst of instruments) {
    const readings = pairReadings(inst.cells).filter((r) => r.weapon === lineage.id);
    push(
      `**${inst.name}** — median uplift over the six classes · verb fires/min (rows: lean; columns: verb)`,
      '',
      `| lean ↓ / verb → | ${lanes.join(' | ')} |`,
      `|---|${lanes.map(() => '---:').join('|')}|`,
      ...lanes.map((lean) => `| **${lean}** | ${lanes.map((verb) => {
        const r = readings.find((x) => x.lean === lean && x.verb === verb);
        const pure = lean === verb ? ' (pure)' : '';
        return r ? `${pct(r.uplift)} · ${num(r.firesPerMin)}${pure}` : '—';
      }).join(' | ')} |`),
      '',
    );
  }
  for (const inst of instruments) {
    const pairs = compositionPairs(lineage).filter((p) => p.label !== 'control');
    push(
      `<details><summary>${inst.name}: per class (uplift; ${inst.badLabel} pair/control${inst.short === 'boss' ? '; wins' : ''})</summary>`,
      '',
      `| class | ${pairs.map((p) => p.label).join(' | ')} |`,
      `|---|${pairs.map(() => '---:').join('|')}|`,
      ...CLASSES.map((cls) => `| ${cls} | ${pairs.map((p) => {
        const cell = inst.cells.get(key(lineage.id, cls, p.label));
        if (!cell) return '—';
        const extra = inst.short === 'boss'
          ? ` (${Math.round((cell.winRate ?? 0) * 100)}% vs ${Math.round((cell.controlWinRate ?? 0) * 100)}%)`
          : (cell.bad !== cell.controlBad ? ` (${cell.bad}/${cell.controlBad}d)` : '');
        return `${pct(cell.uplift)}${cell.verbFires === 0 ? ' ⌀' : ''}${extra}`;
      }).join(' | ')} |`),
      '',
      '⌀ = the verb never fired for that class.',
      '',
      '</details>',
      '',
    );
  }
}

// ── Outliers and flags ────────────────────────────────────────────────────────

push('## Outliers (per instrument, T1)', '');
for (const inst of instruments) {
  const readings = pairReadings(inst.cells);
  const floor = viabilityFloor(readings, (r) => r.uplift);
  const wc = viabilityFloor(weaponClassReadings(inst.cells), (r) => r.uplift);
  const fmtPair = (r: { item: PairReading; ratioToMedian: number | null }) =>
    `\`${r.item.weapon}\` ${r.item.pair} ${pct(r.item.uplift)} (${r.ratioToMedian === null ? '—' : `${r.ratioToMedian.toFixed(2)}×`}; ${num(r.item.firesPerMin)}/min)`;
  const fmtWc = (r: { item: WeaponClassReading; ratioToMedian: number | null }) =>
    `\`${r.item.weapon}\` × ${r.item.cls} ${pct(r.item.uplift)} (${r.ratioToMedian === null ? '—' : `${r.ratioToMedian.toFixed(2)}×`})`;
  push(
    `**${inst.name}.** Pairs: median ${pct(floor.median)}.`,
    '',
    `- Above 1.5× (${floor.aboveCeiling.length}): ${floor.aboveCeiling.map(fmtPair).join('; ') || 'none'}`,
    `- Below 0.9× — under the §24.1 floor (${floor.belowFloor.length}): ${floor.belowFloor.map(fmtPair).join('; ') || 'none'}`,
    '',
    `Weapon × class cells (median of the nine pairs): median ${pct(wc.median)}.`,
    '',
    `- Above 1.5× (${wc.aboveCeiling.length}): ${wc.aboveCeiling.map(fmtWc).join('; ') || 'none'}`,
    `- Below 0.9× (${wc.belowFloor.length}): ${wc.belowFloor.map(fmtWc).join('; ') || 'none'}`,
    '',
  );
}

push('## Firing, refusals, deaths', '');
for (const inst of instruments) {
  const readings = pairReadings(inst.cells);
  const never = readings.filter((r) => r.zeroFireClasses.length > 0);
  const refused = [...inst.cells.entries()].filter(([, c]) => c.refusals.length > 0);
  const worse = [...inst.cells.entries()].filter(([, c]) => c.bad > c.controlBad + Math.max(2, c.controlBad * 0.25));
  push(
    `**${inst.name}.**`,
    '',
    `- Verb never fired (pair: classes): ${never.map((r) => `\`${r.weapon}\` ${r.pair}: ${r.zeroFireClasses.join(', ')}`).join('; ') || 'none'}`,
    `- Purchases refused: ${refused.map(([k, c]) => `${k}: ${c.refusals.join('; ')}`).join(' / ') || 'none — every pair bought and slotted both cards'}`,
    `- ${inst.badLabel[0].toUpperCase()}${inst.badLabel.slice(1)} clearly above the control (> control + max(2, 25%)): ${worse.map(([k, c]) => `${k} ${c.bad} vs ${c.controlBad}`).join('; ') || 'none'}`,
    '',
  );
}

writeFileSync(outPath, `${lines.join('\n')}\n`);
console.log(`wrote ${outPath} (${bossRows.length} boss rows, ${laneRows.length} lane rows)`);
