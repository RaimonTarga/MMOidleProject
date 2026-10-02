/**
 * Aggregator for the T1 boss pass (2026-10-02). Reads one or more `_t1BossLab.ts`
 * jsonl outputs and prints the win-rate matrix plus the Recovery columns the brief's
 * decision 7 asks for. Row ids are `cand|cls|boss|seed`.
 *
 *   tsx scripts/_t1BossMatrix.ts res.jsonl [more.jsonl ...] [--md] [--recovery]
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const files = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const flags = new Set(process.argv.slice(2).filter((a) => a.startsWith('--')));

interface Res {
  id: string; boss: string; cls: string; won: boolean; outcome: string; t: number;
  bossPctLeft: number; minHpPct: number; hpLost: number; healed: number; hpGained: number;
  healedShare: number | null; under25Pct: number; under25s: number; fromBoss: number; healApplied: number; hpEnd: number;
  fromAdds: number; maxAdds: number; killer: string | null; error?: string;
  loadout?: { maxHp: number; plating: number; dr: number; recovery: number; attack: number };
}

const rows: Res[] = [];
for (const f of files) {
  for (const line of readFileSync(f, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    let r: Res;
    try { r = JSON.parse(line) as Res; } catch { console.error(`CORRUPT LINE in ${f}: ${line.slice(0, 120)}`); continue; }
    rows.push(r);
  }
}
const errors = rows.filter((r) => r.error);
for (const e of errors) console.error(`ERROR ${e.id}: ${e.error}`);

const CLASSES = ['striker', 'squire', 'slinger', 'spirit', 'apprentice', 'conduit'];
const BOSSES = ['tusked-razorback', 'gnarled-greatbear', 'grave-toadeater', 'crag-behemoth', 'obsidian-broodmother'];
const SHORT: Record<string, string> = {
  'tusked-razorback': 'Razorback', 'gnarled-greatbear': 'Greatbear', 'grave-toadeater': 'Toadeater',
  'crag-behemoth': 'Behemoth', 'obsidian-broodmother': 'Broodmother',
};

const cands = [...new Set(rows.map((r) => r.id.split('|')[0]!))];
const mean = (xs: number[]) => xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length;
const med = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); return s.length === 0 ? 0 : s[Math.floor(s.length / 2)]!; };
const r1 = (x: number) => Math.round(x * 10) / 10;

for (const cand of cands) {
  const mine = rows.filter((r) => r.id.startsWith(`${cand}|`) && !r.error);
  console.log(`\n${'='.repeat(78)}\n${cand}  (${mine.length} fights)\n${'='.repeat(78)}`);

  // Win-rate matrix.
  const head = ['class', ...BOSSES.map((b) => SHORT[b]!), 'worst'];
  const lines: string[][] = [];
  for (const cls of CLASSES) {
    const cells = BOSSES.map((boss) => {
      const f = mine.filter((r) => r.cls === cls && r.boss === boss);
      if (f.length === 0) return null;
      const w = f.filter((r) => r.won).length;
      return { w, n: f.length, pct: Math.round((w / f.length) * 100), f };
    });
    if (cells.every((c) => c === null)) continue;
    const got = cells.filter((c) => c !== null);
    lines.push([cls, ...cells.map((c) => c === null ? '-' : `${c.pct}% ${c.w}/${c.n}`),
      `${Math.min(...got.map((c) => c!.pct))}%`]);
  }
  // Per-boss floor across classes.
  const floors = BOSSES.map((boss) => {
    const per = CLASSES.map((cls) => {
      const f = mine.filter((r) => r.cls === cls && r.boss === boss);
      return f.length === 0 ? null : Math.round((f.filter((r) => r.won).length / f.length) * 100);
    }).filter((x) => x !== null);
    return per.length === 0 ? '-' : `${Math.min(...per)}%`;
  });
  lines.push(['FLOOR', ...floors, '']);

  const w = head.map((h, i) => Math.max(h.length, ...lines.map((l) => (l[i] ?? '').length)));
  const fmt = (cells: string[]) => cells.map((c, i) => c.padEnd(w[i]!)).join(flags.has('--md') ? ' | ' : '  ');
  console.log(flags.has('--md') ? `| ${fmt(head)} |` : fmt(head));
  if (flags.has('--md')) console.log(`|${w.map((x) => '-'.repeat(x + 2)).join('|')}|`);
  for (const l of lines) console.log(flags.has('--md') ? `| ${fmt(l)} |` : fmt(l));

  // Loss shape: where the losses sit, which is what sizes a lever.
  console.log('\nlosses (boss % left, median / worst) and median TTK on wins:');
  for (const boss of BOSSES) {
    const f = mine.filter((r) => r.boss === boss);
    if (f.length === 0) continue;
    const parts: string[] = [];
    for (const cls of CLASSES) {
      const g = f.filter((r) => r.cls === cls);
      if (g.length === 0) continue;
      const L = g.filter((r) => !r.won);
      parts.push(L.length === 0
        ? `${cls} clean(${r1(med(g.map((r) => r.t)))}s)`
        : `${cls} ${L.length}L@${r1(med(L.map((r) => r.bossPctLeft)))}/${r1(Math.max(...L.map((r) => r.bossPctLeft)))}%`);
    }
    console.log(`  ${SHORT[boss]!.padEnd(11)} ${parts.join('  ')}`);
  }

  if (flags.has('--recovery')) {
    console.log('\nRecovery (decision 7): pool, HP/s, raw dmg, healed back (exact), share healed, time <25% HP, min HP');
    // `healApplied` is the exact figure (raw hpDamage minus the bar's net decline);
    // the logged heal total is not -- see its comment in `_t1BossLab.ts`.
    const hdr = ['class', 'boss', 'pool', 'HP/s', 'rawDmg', 'healed', 'share', '<25% HP', 'minHP', 'dps-in', 'ttk'];
    const rl: string[][] = [];
    for (const cls of CLASSES) for (const boss of BOSSES) {
      const f = mine.filter((r) => r.cls === cls && r.boss === boss);
      if (f.length === 0) continue;
      const raw = mean(f.map((r) => r.fromBoss + r.fromAdds));
      const heal = mean(f.map((r) => r.healApplied));
      rl.push([cls, SHORT[boss]!, String(f[0]!.loadout?.maxHp ?? '?'), String(f[0]!.loadout?.recovery ?? '?'),
        String(Math.round(raw)), String(Math.round(heal)),
        `${raw > 0 ? r1((heal / raw) * 100) : 0}%`,
        `${r1(mean(f.map((r) => r.under25Pct)))}% (${r1(mean(f.map((r) => r.under25s)))}s)`,
        `${r1(med(f.map((r) => r.minHpPct)))}%`,
        String(r1(mean(f.map((r) => r.hpLost / Math.max(0.1, r.t))))),
        `${r1(mean(f.map((r) => r.t)))}s`]);
    }
    const w2 = hdr.map((h, i) => Math.max(h.length, ...rl.map((l) => (l[i] ?? '').length)));
    const fmt2 = (cells: string[]) => cells.map((c, i) => c.padEnd(w2[i]!)).join(' | ');
    console.log(`| ${fmt2(hdr)} |`);
    console.log(`|${w2.map((x) => '-'.repeat(x + 2)).join('|')}|`);
    for (const l of rl) console.log(`| ${fmt2(l)} |`);
  }
}
assert(errors.length === 0, `${errors.length} rows errored`);
