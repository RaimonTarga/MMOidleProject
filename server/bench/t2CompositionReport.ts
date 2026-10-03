/**
 * The T2 composition matrix against its T1 pairs (verbs-that-fire B, design §24.9:
 * "T2+ bands compose too … a gate must never make the cards read smaller").
 *
 * WHAT "AS LARGE" COMPARES. Two readings per (weapon, lean × verb) pair:
 *
 *   1. In the LAB (the measured one): the pair's UPLIFT on its own tier against a
 *      no-card control of that same tier — the T1 pair on the T1 form against the
 *      T1 form with no cards on the five T1 bosses; the T2 pair on the band-2 form
 *      against the band-2 form with no cards on the same five biomes' T2 bosses.
 *      Uplift is `compositionReport.ts`'s own definition, unchanged: mean boss DPS
 *      over the control's on the same boss and seeds (wins and losses alike),
 *      median over the five bosses, then median over the six tutorial classes; on
 *      the lane bench, kills per minute over the control's on the same node,
 *      median over the home biome's three family-dominated nodes, then over
 *      classes. A relative number on each side, so the two tiers' different
 *      bodies, bosses and HP pools cancel out of the comparison: "does the T2 card
 *      move its own character as much as the T1 card moved its own".
 *   2. On the PAGE (by construction, pinned by `composition.test.ts`): the
 *      sentence's per-firing numbers. Every T2 payload is its T1 payload with its
 *      size × `verbTierScalar(2)` (1.15) on the same moment.
 *
 * The comparison table lists, per pair, T1 uplift, T2 uplift, their difference,
 * the classes (of six) in which T2 ≥ T1, verb firings per minute at each tier, and
 * the per-firing size at each tier. A pair whose T2 median reads below its T1
 * median is flagged; the reason goes in `--findings`.
 *
 *   node --conditions=development --import tsx bench/t2CompositionReport.ts \
 *     [--t1boss=../reports/course-correction/matrix-boss.jsonl] \
 *     [--t2boss=../reports/verbs-that-fire/t2-matrix.jsonl] \
 *     [--t1lanes=../reports/course-correction/matrix-lanes.jsonl] \
 *     [--t2lanes=../reports/verbs-that-fire/t2-matrix-lanes.jsonl] \
 *     [--out=../reports/verbs-that-fire/t2-matrix.md] [--findings=<file.md>] [--note=<runs line>]
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  ITEM_DATABASE, LINEAGE_DATABASE, composeVerb, payloadSize, verbTierScalar,
  type LineagePayoff, type PacketId,
} from '@mmo-idle/shared';
import { CLASS_BY_ROOT, bandFormOf, compositionPairs } from './lineage/compositionPairs';
import { medianOf } from './lineage/viabilityFloor';

const args = Object.fromEntries(process.argv.slice(2).map((s) => {
  const i = s.indexOf('=');
  return i < 0 ? [s.slice(2), '1'] : [s.slice(2, i), s.slice(i + 1)];
})) as Record<string, string>;

const paths = {
  t1boss: resolve(args.t1boss ?? '../reports/course-correction/matrix-boss.jsonl'),
  t2boss: resolve(args.t2boss ?? '../reports/verbs-that-fire/t2-matrix.jsonl'),
  t1lanes: resolve(args.t1lanes ?? '../reports/course-correction/matrix-lanes.jsonl'),
  t2lanes: resolve(args.t2lanes ?? '../reports/verbs-that-fire/t2-matrix-lanes.jsonl'),
  out: resolve(args.out ?? '../reports/verbs-that-fire/t2-matrix.md'),
};

const CLASSES = Object.values(CLASS_BY_ROOT);

interface BossRow {
  id: string; boss: string; cls: string; seed: number; lineage?: string;
  verbFires: number; won: boolean; t: number; dps: number; refusals?: string[]; error?: string;
}
interface LaneRow {
  cellId?: string; tier?: number; lineageId: string; cls: string; pair: string; nodeId: string; seed: number;
  kills: number; capMs: number; verbFires: number; deaths: number; refusals?: string[];
}

function readJsonl<T>(path: string): T[] {
  if (!existsSync(path)) return [];
  const out: T[] = [];
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    try { out.push(JSON.parse(line) as T); } catch { /* torn line */ }
  }
  return out;
}

/** `cmp-rapier-tempo×affliction|…` / `cmpt2-rapier-…` → { lineage, pair }. */
function bossKey(row: BossRow): { lineage: string; pair: string } {
  const head = row.id.split('|')[0]!;
  const [, lineage, ...rest] = head.split('-');
  return { lineage: row.lineage ?? lineage!, pair: rest.join('-') };
}

const t2Boss = readJsonl<BossRow>(paths.t2boss).filter((r) => !r.error && r.id.startsWith('cmpt2-'));
const weapons = [...new Set(t2Boss.map((r) => bossKey(r).lineage))].sort();
const t1Boss = readJsonl<BossRow>(paths.t1boss)
  .filter((r) => !r.error && r.id.startsWith('cmp-') && weapons.includes(bossKey(r).lineage));
const laneTier = (r: LaneRow): number => r.tier ?? (r.cellId?.startsWith('cmpt2-') ? 2 : 1);
const t2Lanes = readJsonl<LaneRow>(paths.t2lanes).filter((r) => laneTier(r) === 2);
const t1Lanes = readJsonl<LaneRow>(paths.t1lanes)
  .filter((r) => laneTier(r) === 1 && weapons.includes(r.lineageId));

interface Cell { uplift: number | null; firesPerMin: number | null; fires: number; n: number; wins?: number; refusals: string[] }
type Cells = Map<string, Cell>; // weapon|class|pair
const k = (w: string, c: string, p: string) => `${w}|${c}|${p}`;

function bossCells(rows: BossRow[]): Cells {
  const groups = new Map<string, BossRow[]>(); // weapon|class|pair|boss
  for (const r of rows) {
    const { lineage, pair } = bossKey(r);
    const g = `${lineage}|${r.cls}|${pair}|${r.boss}`;
    (groups.get(g) ?? groups.set(g, []).get(g)!).push(r);
  }
  const out: Cells = new Map();
  const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);
  for (const w of weapons) {
    const bosses = [...new Set(rows.filter((r) => bossKey(r).lineage === w).map((r) => r.boss))];
    for (const cls of CLASSES) {
      for (const pair of compositionPairs(LINEAGE_DATABASE.get(w)!)) {
        if (pair.label === 'control') continue;
        const uplifts: number[] = [];
        let fires = 0; let ms = 0; let n = 0; let wins = 0;
        const refusals = new Set<string>();
        for (const boss of bosses) {
          const mine = groups.get(`${w}|${cls}|${pair.label}|${boss}`) ?? [];
          const ctrl = groups.get(`${w}|${cls}|control|${boss}`) ?? [];
          if (!mine.length || !ctrl.length) continue;
          const c = mean(ctrl.map((r) => r.dps));
          if (c > 0) uplifts.push(mean(mine.map((r) => r.dps)) / c - 1);
          fires += mine.reduce((a, r) => a + (r.verbFires ?? 0), 0);
          ms += mine.reduce((a, r) => a + r.t * 1000, 0);
          n += mine.length;
          wins += mine.filter((r) => r.won).length;
          for (const r of mine) for (const x of r.refusals ?? []) refusals.add(x);
        }
        if (!n) continue;
        out.set(k(w, cls, pair.label), {
          uplift: medianOf(uplifts), firesPerMin: ms > 0 ? fires / (ms / 60_000) : null,
          fires, n, wins, refusals: [...refusals],
        });
      }
    }
  }
  return out;
}

function laneCells(rows: LaneRow[]): Cells {
  const groups = new Map<string, LaneRow[]>(); // weapon|class|pair|node
  for (const r of rows) {
    const g = `${r.lineageId}|${r.cls}|${r.pair}|${r.nodeId}`;
    (groups.get(g) ?? groups.set(g, []).get(g)!).push(r);
  }
  const out: Cells = new Map();
  const kpm = (xs: LaneRow[]) => xs.reduce((a, r) => a + r.kills, 0) / (xs.reduce((a, r) => a + r.capMs, 0) / 60_000);
  for (const w of weapons) {
    const nodes = [...new Set(rows.filter((r) => r.lineageId === w).map((r) => r.nodeId))];
    for (const cls of CLASSES) {
      for (const pair of compositionPairs(LINEAGE_DATABASE.get(w)!)) {
        if (pair.label === 'control') continue;
        const uplifts: number[] = [];
        let fires = 0; let ms = 0; let n = 0;
        const refusals = new Set<string>();
        for (const node of nodes) {
          const mine = groups.get(`${w}|${cls}|${pair.label}|${node}`) ?? [];
          const ctrl = groups.get(`${w}|${cls}|control|${node}`) ?? [];
          if (!mine.length || !ctrl.length) continue;
          const c = kpm(ctrl);
          if (c > 0) uplifts.push(kpm(mine) / c - 1);
          fires += mine.reduce((a, r) => a + r.verbFires, 0);
          ms += mine.reduce((a, r) => a + r.capMs, 0);
          n += mine.length;
          for (const r of mine) for (const x of r.refusals ?? []) refusals.add(x);
        }
        if (!n) continue;
        out.set(k(w, cls, pair.label), {
          uplift: medianOf(uplifts), firesPerMin: ms > 0 ? fires / (ms / 60_000) : null, fires, n, refusals: [...refusals],
        });
      }
    }
  }
  return out;
}

const pct = (x: number | null | undefined, d = 1) =>
  x === null || x === undefined || !Number.isFinite(x) ? '—' : `${x >= 0 ? '+' : ''}${(x * 100).toFixed(d)}%`;
const pp = (x: number | null | undefined) =>
  x === null || x === undefined || !Number.isFinite(x) ? '—' : `${x >= 0 ? '+' : ''}${(x * 100).toFixed(1)} pp`;
const num = (x: number | null | undefined, d = 1) =>
  x === null || x === undefined || !Number.isFinite(x) ? '—' : x.toFixed(d);

/** A payload's SIZE as a short figure (the number the tier scales). */
function sizeFigure(p: LineagePayoff): string {
  switch (payloadSize(p.kind).axis) {
    case 'bonus': return `×${num(p.magnitude, 3)}`;
    case 'duration': return `${num((p.durationMs ?? 0) / 1000, 2)} s`;
    case 'proxy': return `bonus ×${num(p.bonusScale ?? 1, 2)}`;
    default: return p.kind === 'heal-and-load'
      ? `${num(p.magnitude * 100, 1)}% + ×${num(p.loadMultiplier ?? 1, 3)}`
      : `${num(p.magnitude, 3)}`;
  }
}

interface Comparison {
  weapon: string; pair: string; lean: PacketId; verb: PacketId;
  t1: number | null; t2: number | null; delta: number | null;
  classesAtLeast: number; classesMeasured: number;
  t1Fires: number | null; t2Fires: number | null;
  size: string; payload: string;
}

function compare(t1: Cells, t2: Cells): Comparison[] {
  const out: Comparison[] = [];
  for (const w of weapons) {
    const lineage = LINEAGE_DATABASE.get(w)!;
    for (const pair of compositionPairs(lineage)) {
      if (pair.label === 'control') continue;
      const per = CLASSES.map((cls) => ({ a: t1.get(k(w, cls, pair.label)), b: t2.get(k(w, cls, pair.label)) }));
      const both = per.filter((x) => x.a?.uplift != null && x.b?.uplift != null);
      const t1u = medianOf(per.flatMap((x) => (x.a?.uplift == null ? [] : [x.a.uplift])));
      const t2u = medianOf(per.flatMap((x) => (x.b?.uplift == null ? [] : [x.b.uplift])));
      const c1 = composeVerb(pair.verb!, pair.lean!, 1)!;
      const c2 = composeVerb(pair.verb!, pair.lean!, 2)!;
      out.push({
        weapon: w, pair: pair.label, lean: pair.lean!, verb: pair.verb!,
        t1: t1u, t2: t2u, delta: t1u !== null && t2u !== null ? t2u - t1u : null,
        classesAtLeast: both.filter((x) => x.b!.uplift! >= x.a!.uplift! - 1e-9).length,
        classesMeasured: both.length,
        t1Fires: medianOf(per.flatMap((x) => (x.a?.firesPerMin == null ? [] : [x.a.firesPerMin]))),
        t2Fires: medianOf(per.flatMap((x) => (x.b?.firesPerMin == null ? [] : [x.b.firesPerMin]))),
        size: `${sizeFigure(c1.payoff)} → ${sizeFigure(c2.payoff)}`,
        payload: c2.payoff.kind,
      });
    }
  }
  return out;
}

const instruments = [
  { name: 'boss lab', t1: bossCells(t1Boss), t2: bossCells(t2Boss), rows: [t1Boss.length, t2Boss.length] as const },
  ...(t2Lanes.length ? [{ name: 'lane bench', t1: laneCells(t1Lanes), t2: laneCells(t2Lanes), rows: [t1Lanes.length, t2Lanes.length] as const }] : []),
];

// ── Markdown ──────────────────────────────────────────────────────────────────

const lines: string[] = [];
const push = (...xs: string[]) => lines.push(...xs);
let head = '';
try { head = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim(); } catch { /* not a checkout */ }

push(
  '# T2 composition matrix against its T1 pairs (verbs-that-fire B)',
  '',
  `Generated ${new Date().toISOString().slice(0, 16)}Z${head ? ` at \`${head}\`` : ''} by \`server/bench/t2CompositionReport.ts\`.`
  + ` Weapons: ${weapons.join(', ')}. ${instruments.map((i) => `${i.name}: ${i.rows[0]} T1 rows, ${i.rows[1]} T2 rows`).join('; ')}.`
  + (args.note ? ` ${args.note}` : ''),
  '',
  '**What "as large" compares.** For each lean × verb pair, its UPLIFT on its own tier',
  'against a no-card control of that same tier: the T1 pair on the T1 form vs the T1 form',
  'with no cards (T1 bosses / T1 home nodes); the T2 pair (T2 lean + T2 verb) on the',
  "lineage's band-2 form vs that form with no cards (the same five biomes' T2 bosses / the",
  'home biome\'s T2 nodes), on a tier-2 character with the T2 counterpart of every kit',
  'item. Uplift: boss lab — mean boss DPS over the control\'s on the same boss and seeds,',
  'median over bosses; lane bench — kills/min over the control\'s on the same node, median',
  'over nodes; then the median over the six tutorial classes. **Δ** is T2 − T1 in',
  'percentage points; **≥ in** counts the classes whose own T2 uplift is at least their',
  'T1 uplift. **Size** is the per-firing number the tier scales (the sentence\'s number):',
  'a share of the hit / swing / cooldown, a multiplier, a hold, or the proxy\'s bonus',
  'multiple. Fires/min is the verb\'s landed `card-fx` per minute of fight or farm.',
  '',
);
if (args.findings) push(readFileSync(resolve(args.findings), 'utf8').trimEnd(), '');

for (const inst of instruments) {
  const rows = compare(inst.t1, inst.t2);
  const below = rows.filter((r) => r.delta !== null && r.delta < 0);
  push(
    `## ${inst.name[0]!.toUpperCase()}${inst.name.slice(1)}`,
    '',
    `T2 ≥ T1 on the median in **${rows.length - below.length} of ${rows.length}** pairs`
    + `${below.length ? `; below: ${below.map((r) => `\`${r.weapon}\` ${r.pair} (${pp(r.delta)})`).join(', ')}` : ''}.`,
    '',
  );
  for (const w of weapons) {
    const form1 = bandFormOf(LINEAGE_DATABASE.get(w)!, 1);
    const form2 = bandFormOf(LINEAGE_DATABASE.get(w)!, 2);
    push(
      `### ${w[0]!.toUpperCase()}${w.slice(1)} — ${ITEM_DATABASE.get(form1)?.name ?? form1} (T1) → ${ITEM_DATABASE.get(form2)?.name ?? form2} (T2)`,
      '',
      '| lean × verb | payload | T1 uplift | T2 uplift | Δ | ≥ in | T1 fires/min | T2 fires/min | size T1 → T2 |',
      '|---|---|---:|---:|---:|---:|---:|---:|---|',
      ...rows.filter((r) => r.weapon === w).map((r) =>
        `| ${r.pair}${r.lean === r.verb ? ' (pure)' : ''} | ${r.payload} | ${pct(r.t1)} | ${pct(r.t2)} | ${pp(r.delta)}${r.delta !== null && r.delta < 0 ? ' ⚑' : ''} | ${r.classesAtLeast}/${r.classesMeasured} | ${num(r.t1Fires)} | ${num(r.t2Fires)} | ${r.size} |`),
      '',
    );
    const pairs = compositionPairs(LINEAGE_DATABASE.get(w)!).filter((p) => p.label !== 'control');
    push(
      `<details><summary>${inst.name}, ${w}: per class (T1 uplift → T2 uplift${inst.name === 'boss lab' ? '; T2 wins' : ''})</summary>`,
      '',
      `| class | ${pairs.map((p) => p.label).join(' | ')} |`,
      `|---|${pairs.map(() => '---:').join('|')}|`,
      ...CLASSES.map((cls) => `| ${cls} | ${pairs.map((p) => {
        const a = inst.t1.get(k(w, cls, p.label));
        const b = inst.t2.get(k(w, cls, p.label));
        const wins = b?.wins !== undefined ? ` (${b.wins}/${b.n})` : '';
        const zero = b && b.fires === 0 ? ' ⌀' : '';
        return `${pct(a?.uplift ?? null, 0)} → ${pct(b?.uplift ?? null, 0)}${zero}${wins}`;
      }).join(' | ')} |`),
      '',
      '⌀ = the T2 verb never fired for that class.',
      '',
      '</details>',
      '',
    );
  }
  const refused = [...inst.t2.entries()].filter(([, c]) => c.refusals.length > 0);
  push(`T2 purchases refused: ${refused.map(([key, c]) => `${key}: ${c.refusals.join('; ')}`).join(' / ') || 'none — every T2 pair bought and slotted both cards'}.`, '');
}

push(
  '## The per-firing numbers (by construction)',
  '',
  `Every T2 payload is its T1 payload with its size × \`verbTierScalar(2)\` = ${verbTierScalar(2)}`
  + ' on the same moment (`composition.test.ts` pins every one of the 45 T2 pairs).',
  '',
);

writeFileSync(paths.out, `${lines.join('\n')}\n`);
console.log(`wrote ${paths.out}`);
