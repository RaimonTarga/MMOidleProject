import { readFileSync } from 'node:fs';
const [res, cfgPath] = process.argv.slice(2);
const rows = readFileSync(res, 'utf8').trim().split('\n').map(JSON.parse);
const cfg = JSON.parse(readFileSync(cfgPath, 'utf8'));
const med = (a) => { const s = a.filter((x) => x != null).sort((x, y) => x - y); if (!s.length) return null; const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
console.log('errors', rows.filter((r) => r.error).length, rows.filter((r) => r.error).slice(0, 2).map((r) => r.error));
console.log('| boss | HP / pl / DR | bench s (win%) | off s (win%) | midpoint | target | next HP | top killers |');
const TARGET = { 3: 120, 4: 180 };
for (const [id, c] of Object.entries(cfg)) {
  const rs = rows.filter((r) => r.id.startsWith(`K-${id}-`) && !r.id.slice(3+id.length).startsWith("#") && !r.error);
  const arm = (a) => rs.filter((r) => r.id.endsWith('-' + a));
  const t = (a) => med(arm(a).filter((r) => r.won).map((r) => r.t));
  const w = (a) => Math.round(100 * arm(a).filter((r) => r.won).length / Math.max(1, arm(a).length));
  const mid = (t('bench') + t('off')) / 2;
  const kills = {}; for (const r of rs.filter((r) => !r.won)) { const k = (r.killer ?? r.outcome).slice(0, 40); kills[k] = (kills[k] ?? 0) + 1; }
  const next = Math.round(c.hp * TARGET[c.tier] / mid / 10) * 10;
  console.log(`| ${id} | ${c.hp} / ${c.plating} / ${c.dr} | ${Math.round(t('bench'))} (${w('bench')}%) | ${Math.round(t('off'))} (${w('off')}%) | ${Math.round(mid)} | ${TARGET[c.tier]} | ${next} | ${Object.entries(kills).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${k} ×${v}`).join('; ')} |`);
}
