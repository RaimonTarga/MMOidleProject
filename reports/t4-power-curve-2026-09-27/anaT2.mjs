// node anaT2.mjs <res.jsonl> <cfg.resolved.json>
import { readFileSync } from 'node:fs';
const [res, cfgPath] = process.argv.slice(2);
const rows = readFileSync(res, 'utf8').trim().split('\n').map(JSON.parse);
const cfg = JSON.parse(readFileSync(cfgPath, 'utf8'));
const med = (a) => { const s = a.filter((x) => x != null).sort((x, y) => x - y); if (!s.length) return null; const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
console.log('errors', rows.filter((r) => r.error).length, rows.filter((r) => r.error).slice(0, 2).map((r) => r.error));
console.log('| boss | HP / pl / DR | def s (win%) | off s (win%) | midpoint | next HP @60 | top killers | per-class wins def/off |');
for (const [key, c] of Object.entries(cfg)) {
  const rs = rows.filter((r) => r.id.startsWith(`T2-${key}-t2-`) && !r.error);
  const arm = (a) => rs.filter((r) => r.id.endsWith('-' + a));
  const t = (a) => med(arm(a).filter((r) => r.won).map((r) => r.t));
  const w = (a) => Math.round(100 * arm(a).filter((r) => r.won).length / Math.max(1, arm(a).length));
  const mid = ((t('def') ?? 0) + (t('off') ?? 0)) / 2;
  const kills = {}; for (const r of rs.filter((r) => !r.won)) { const k = (r.killer ?? r.outcome).slice(0, 44); kills[k] = (kills[k] ?? 0) + 1; }
  const hp = c.hp ?? c.old.hp;
  const per = ['squire', 'striker', 'apprentice', 'slinger', 'spirit'].map((cl) => { const x = rs.filter((r) => r.cls === cl); return cl.slice(0, 3) + ' ' + x.filter((r) => r.won).length + '/' + x.length; }).join(', ');
  console.log(`| ${key} | ${hp} / ${c.plating ?? c.old.plating} / ${c.dr ?? c.old.dr} | ${Math.round(t('def') ?? 0)} (${w('def')}%) | ${Math.round(t('off') ?? 0)} (${w('off')}%) | ${Math.round(mid)} | ${mid ? Math.round(hp * 60 / mid / 10) * 10 : '-'} | ${Object.entries(kills).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${k} x${v}`).join('; ')} | ${per} |`);
}
