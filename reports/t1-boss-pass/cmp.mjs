// Candidate A/B against the baseline, one boss column.
//   node cmp.mjs <boss> <cand.jsonl> [...]        (base.jsonl is always the control)
import { readFileSync, existsSync } from 'node:fs';
import { basename } from 'node:path';
const [boss, ...files] = process.argv.slice(2);
const CL = ['striker', 'squire', 'slinger', 'spirit', 'apprentice', 'conduit'];
const load = (f) => readFileSync(f, 'utf8').split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l)).filter((r) => r.boss === boss);
const m = (a) => a.length ? Math.round((a.reduce((x, y) => x + y, 0) / a.length) * 10) / 10 : 0;
const cell = (f, cls) => {
  const g = f.filter((r) => r.cls === cls);
  if (!g.length) return '-';
  const w = g.filter((r) => r.won).length;
  const L = g.filter((r) => !r.won);
  return `${Math.round((w / g.length) * 100)}%`.padStart(4) + (L.length ? ` @${m(L.map((r) => r.bossPctLeft))}` : '     ');
};
const rows = [['candidate', ...CL, 'burst5s%', 'dps-in', 'ttk']];
for (const f of ['reports/t1-boss-pass/base.jsonl', ...files]) {
  if (!existsSync(f)) { console.error(`missing ${f}`); continue; }
  const d = load(f);
  rows.push([basename(f, '.jsonl'), ...CL.map((c) => cell(d, c)),
    `${m(d.map((r) => r.burst5sPctPool))}%`, String(m(d.map((r) => r.hpLost / Math.max(0.1, r.t)))),
    `${m(d.filter((r) => r.won).map((r) => r.t))}s`]);
}
const w = rows[0].map((_, i) => Math.max(...rows.map((r) => (r[i] ?? '').length)));
for (const r of rows) console.log('| ' + r.map((c, i) => c.padEnd(w[i])).join(' | ') + ' |');
