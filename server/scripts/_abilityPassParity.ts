/**
 * Ability pass parity check (docs/briefs/ability-pass-run-2026-10-02.md, wave 0).
 *
 * Reads two `_t1BossLab.ts` JSONL files (a BASELINE and a CANDIDATE), groups the
 * fights per (candidate label, class, boss) -- the candidate label is the row id's
 * first `|` field, e.g. `tut-tempo×tempo` or `tut-control` -- and prints, per cell
 * and per file, the fight count, mean dps, mean dps8 and win rate, plus the % delta
 * of mean dps and the win-rate delta in points.
 *
 * The gate (the run's hard constraint): every KIT cell (any label that is not a
 * no-card control) must have >= 10 fights in BOTH files and a mean-dps delta inside
 * +/-5%. Control cells (`tut-control`, `cmp-<lineage>-control`, or whatever
 * `--control` names) are printed under their own heading with their deltas and are
 * NOT gated: a no-card character is the identity check, not the parity check.
 *
 * `dps8` is only on full rows; the tutorial-pair plan writes `compact` rows, which
 * carry no `dps8`, so that column reads `-` there.
 *
 *   node --conditions=development --import tsx scripts/_abilityPassParity.ts \
 *     <baseline.jsonl> <candidate.jsonl> [--tol=5] [--min=10] [--md=<out.md>] \
 *     [--control=tut-control,other-label]
 *
 * Exit codes: 0 every kit cell inside; 1 any kit cell outside the tolerance, under
 * the fight minimum, missing from one file, or any row carrying a lab `error`;
 * 2 a read or format error (missing file, unparseable line, row without id/cls/boss/
 * dps/won, no rows at all).
 *
 * `--identity` is the other question (the no-card check, e.g. wave 3's no-band plan
 * against reports/legibility/final-base.jsonl): are the two files the SAME fights,
 * row for row, once `wallMs` (wall-clock time) is dropped and both are sorted? It
 * prints the count of equal / differing / one-sided rows by candidate label and exits
 * 0 identical, 1 not, 2 on a read error. No table, no gate.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const argv = process.argv.slice(2);
const files = argv.filter((a) => !a.startsWith('--'));
const opts = Object.fromEntries(argv.filter((a) => a.startsWith('--')).map((s) => {
  const i = s.indexOf('=');
  return i < 0 ? [s.slice(2), '1'] : [s.slice(2, i), s.slice(i + 1)];
})) as Record<string, string>;

function formatError(msg: string): never {
  console.error(`parity: ${msg}`);
  process.exit(2);
}

if (files.length !== 2) formatError('usage: _abilityPassParity.ts <baseline.jsonl> <candidate.jsonl> [--tol=5] [--min=10] [--md=out.md] [--control=a,b]');
const TOL = Number(opts.tol ?? 5);
const MIN = Number(opts.min ?? 10);
if (!Number.isFinite(TOL) || TOL <= 0) formatError(`--tol must be a positive number, got ${opts.tol}`);
if (!Number.isInteger(MIN) || MIN < 1) formatError(`--min must be a positive integer, got ${opts.min}`);
const explicitControls = opts.control ? new Set(opts.control.split(',')) : null;
const isControl = (cand: string): boolean =>
  explicitControls ? explicitControls.has(cand) : cand === 'control' || cand.endsWith('-control');

interface Fight { id: string; cand: string; cls: string; boss: string; dps: number; dps8: number | null; won: boolean }
interface Read { fights: Fight[]; errors: { id: string; error: string }[] }

function readLab(path: string): Read {
  let text: string;
  try { text = readFileSync(path, 'utf8'); } catch (e) { formatError(`cannot read ${path}: ${(e as Error).message}`); }
  const fights: Fight[] = [];
  const errors: { id: string; error: string }[] = [];
  text.split('\n').forEach((line, i) => {
    if (!line.trim()) return;
    let r: Record<string, unknown>;
    try { r = JSON.parse(line) as Record<string, unknown>; } catch { formatError(`${path}:${i + 1}: not JSON: ${line.slice(0, 100)}`); }
    if (typeof r.id !== 'string' || !r.id.includes('|')) formatError(`${path}:${i + 1}: row has no \`cand|cls|boss|seed\` id`);
    if (typeof r.error === 'string') { errors.push({ id: r.id, error: r.error }); return; }
    if (typeof r.cls !== 'string' || typeof r.boss !== 'string' || typeof r.dps !== 'number' || typeof r.won !== 'boolean') {
      formatError(`${path}:${i + 1}: row ${r.id} lacks cls/boss/dps/won`);
    }
    fights.push({
      id: r.id, cand: r.id.split('|')[0]!, cls: r.cls, boss: r.boss, dps: r.dps,
      dps8: typeof r.dps8 === 'number' ? r.dps8 : null, won: r.won,
    });
  });
  if (fights.length === 0 && errors.length === 0) formatError(`${path}: no rows`);
  return { fights, errors };
}

const [pathA, pathB] = files as [string, string];

if (opts.identity) {
  const canon = (path: string): Map<string, string> => {
    let text: string;
    try { text = readFileSync(path, 'utf8'); } catch (e) { formatError(`cannot read ${path}: ${(e as Error).message}`); }
    const out = new Map<string, string>();
    text.split('\n').forEach((line, i) => {
      if (!line.trim()) return;
      let r: Record<string, unknown>;
      try { r = JSON.parse(line) as Record<string, unknown>; } catch { formatError(`${path}:${i + 1}: not JSON`); }
      if (typeof r.id !== 'string') formatError(`${path}:${i + 1}: row has no id`);
      if (out.has(r.id)) formatError(`${path}: duplicate row id ${r.id}`);
      delete r.wallMs;
      out.set(r.id, JSON.stringify(r));
    });
    return out;
  };
  const a = canon(pathA), b = canon(pathB);
  const tally = new Map<string, { same: number; differ: number; onlyA: number; onlyB: number }>();
  const t = (id: string) => { const c = id.split('|')[0]!; return tally.get(c) ?? tally.set(c, { same: 0, differ: 0, onlyA: 0, onlyB: 0 }).get(c)!; };
  const firstDiffs: string[] = [];
  for (const [id, row] of a) {
    const other = b.get(id);
    if (other === undefined) t(id).onlyA++;
    else if (other === row) t(id).same++;
    else { t(id).differ++; if (firstDiffs.length < 5) firstDiffs.push(id); }
  }
  for (const id of b.keys()) if (!a.has(id)) t(id).onlyB++;
  for (const [c, n] of tally) console.log(`${c.padEnd(32)} same ${n.same}  differ ${n.differ}  only-A ${n.onlyA}  only-B ${n.onlyB}`);
  for (const id of firstDiffs) console.log(`differs: ${id}`);
  const ok = [...tally.values()].every((n) => n.differ === 0 && n.onlyA === 0 && n.onlyB === 0);
  console.log(`${pathA} (${a.size} rows) vs ${pathB} (${b.size} rows), wallMs dropped: ${ok ? 'IDENTICAL' : 'NOT IDENTICAL'}`);
  process.exit(ok ? 0 : 1);
}

const A = readLab(pathA), B = readLab(pathB);

interface Stat { n: number; dps: number; dps8: number | null; win: number }
const keyOf = (f: Pick<Fight, 'cand' | 'cls' | 'boss'>): string => `${f.cand}|${f.cls}|${f.boss}`;
function group(fights: Fight[]): Map<string, Stat> {
  const acc = new Map<string, Fight[]>();
  for (const f of fights) { const k = keyOf(f); (acc.get(k) ?? acc.set(k, []).get(k)!).push(f); }
  const out = new Map<string, Stat>();
  for (const [k, fs] of acc) {
    const d8 = fs.map((f) => f.dps8).filter((x): x is number => x !== null);
    out.set(k, {
      n: fs.length,
      dps: fs.reduce((s, f) => s + f.dps, 0) / fs.length,
      dps8: d8.length === 0 ? null : d8.reduce((s, x) => s + x, 0) / d8.length,
      win: fs.filter((f) => f.won).length / fs.length,
    });
  }
  return out;
}
const gA = group(A.fights), gB = group(B.fights);

// Canonical orders (the T1 lab's), anything else appended alphabetically.
const CLASS_ORDER = ['striker', 'squire', 'slinger', 'spirit', 'apprentice', 'conduit'];
const BOSS_ORDER = ['tusked-razorback', 'gnarled-greatbear', 'grave-toadeater', 'crag-behemoth', 'obsidian-broodmother',
  'gorging-razortusk', 'apex-timberclaw', 'mire-gorged-behemoth', 'stoneplate-juggernaut', 'chitinous-dreadbore'];
const rank = (order: string[], x: string): number => { const i = order.indexOf(x); return i < 0 ? order.length : i; };
const keys = [...new Set([...gA.keys(), ...gB.keys()])].sort((a, b) => {
  const [ca, la, ba] = a.split('|') as [string, string, string];
  const [cb, lb, bb] = b.split('|') as [string, string, string];
  return Number(isControl(ca)) - Number(isControl(cb)) || ca.localeCompare(cb)
    || rank(CLASS_ORDER, la) - rank(CLASS_ORDER, lb) || la.localeCompare(lb)
    || rank(BOSS_ORDER, ba) - rank(BOSS_ORDER, bb) || ba.localeCompare(bb);
});

interface Line { cand: string; cls: string; boss: string; a?: Stat; b?: Stat; dDps: number | null; dWin: number | null; control: boolean; fail: string | null }
const lines: Line[] = keys.map((k) => {
  const [cand, cls, boss] = k.split('|') as [string, string, string];
  const a = gA.get(k), b = gB.get(k);
  const control = isControl(cand);
  const dDps = a && b ? (a.dps === 0 ? (b.dps === 0 ? 0 : Infinity) : ((b.dps - a.dps) / a.dps) * 100) : null;
  const dWin = a && b ? (b.win - a.win) * 100 : null;
  let fail: string | null = null;
  if (!control) {
    if (!a || !b) fail = `missing in ${!a ? 'baseline' : 'candidate'}`;
    else if (a.n < MIN || b.n < MIN) fail = `n<${MIN}`;
    else if (dDps === null || !(Math.abs(dDps) <= TOL)) fail = `|Δ|>${TOL}%`;
  }
  return { cand, cls, boss, a, b, dDps, dWin, control, fail };
});

const SHORT: Record<string, string> = {
  'tusked-razorback': 'Razorback', 'gnarled-greatbear': 'Greatbear', 'grave-toadeater': 'Toadeater',
  'crag-behemoth': 'Behemoth', 'obsidian-broodmother': 'Broodmother',
};
const f1 = (x: number | null | undefined): string => x === null || x === undefined ? '-' : x.toFixed(1);
const pct = (x: number | undefined): string => x === undefined ? '-' : `${Math.round(x * 100)}%`;
const signed = (x: number | null, unit: string): string =>
  x === null ? '-' : !Number.isFinite(x) ? 'inf' : `${x > 0 ? '+' : x < 0 ? '' : '±'}${x.toFixed(1)}${unit}`;
const HEAD = ['cand', 'class', 'boss', 'n A', 'dps A', 'dps8 A', 'win A', 'n B', 'dps B', 'dps8 B', 'win B', 'Δdps', 'Δwin', ''];
const cells = (l: Line): string[] => [
  l.cand, l.cls, SHORT[l.boss] ?? l.boss,
  String(l.a?.n ?? 0), f1(l.a?.dps), f1(l.a?.dps8), pct(l.a?.win),
  String(l.b?.n ?? 0), f1(l.b?.dps), f1(l.b?.dps8), pct(l.b?.win),
  signed(l.dDps, '%'), signed(l.dWin, 'pt'), l.control ? '' : l.fail ? `FAIL ${l.fail}` : 'ok',
];

function textTable(rows: string[][]): string {
  const w = HEAD.map((h, i) => Math.max(h.length, ...rows.map((r) => r[i]!.length)));
  const fmt = (r: string[]) => r.map((c, i) => (i <= 2 ? c.padEnd(w[i]!) : c.padStart(w[i]!))).join('  ').trimEnd();
  return [fmt(HEAD), w.map((n) => '-'.repeat(n)).join('  '), ...rows.map(fmt)].join('\n');
}
function mdTable(rows: string[][]): string {
  return [`| ${HEAD.map((h) => h || 'gate').join(' | ')} |`, `|${HEAD.map((_, i) => (i <= 2 ? '---' : '---:')).join('|')}|`,
    ...rows.map((r) => `| ${r.join(' | ')} |`)].join('\n');
}

const kit = lines.filter((l) => !l.control), ctl = lines.filter((l) => l.control);
const failing = kit.filter((l) => l.fail);
const labErrors = [...A.errors.map((e) => ({ ...e, file: pathA })), ...B.errors.map((e) => ({ ...e, file: pathB }))];
const worst = kit.filter((l) => l.dDps !== null).sort((x, y) => Math.abs(y.dDps!) - Math.abs(x.dDps!))[0];
const verdict = failing.length === 0 && labErrors.length === 0 && kit.length > 0;
const summary = [
  `A (baseline):  ${pathA}  ${A.fights.length} fights${A.errors.length ? `, ${A.errors.length} error rows` : ''}`,
  `B (candidate): ${pathB}  ${B.fights.length} fights${B.errors.length ? `, ${B.errors.length} error rows` : ''}`,
  `gate: kit cells within ±${TOL}% mean dps and n >= ${MIN} in both files; control cells ungated`,
  `kit cells: ${kit.length}, inside: ${kit.length - failing.length}, outside: ${failing.length}`
    + (worst ? `; largest |Δdps| ${signed(worst.dDps, '%')} (${worst.cand} ${worst.cls} ${SHORT[worst.boss] ?? worst.boss})` : ''),
  `verdict: ${verdict ? 'PARITY HOLDS' : 'PARITY BROKEN'}`,
];

console.log(`\nKIT CELLS (gated)\n${textTable(kit.map(cells))}`);
if (ctl.length) console.log(`\nCONTROL CELLS (no cards; ungated)\n${textTable(ctl.map(cells))}`);
for (const e of labErrors) console.log(`LAB ERROR ${e.file}: ${e.id}: ${e.error}`);
console.log(`\n${summary.join('\n')}`);

if (opts.md) {
  const md = [
    '## Parity: kit cells (gated)', '', mdTable(kit.map(cells)), '',
    ...(ctl.length ? ['## Control cells (no cards; ungated)', '', mdTable(ctl.map(cells)), ''] : []),
    ...(labErrors.length ? ['## Lab error rows', '', ...labErrors.map((e) => `- \`${e.id}\` (${e.file}): ${e.error}`), ''] : []),
    '```', ...summary, '```', '',
  ].join('\n');
  writeFileSync(opts.md, md);
  console.log(`markdown -> ${opts.md}`);
}

process.exit(verdict ? 0 : 1);
