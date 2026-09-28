// node genK.mjs <cfg.json> <plan.json> : cfg entries may carry "hp" (explicit) or derive it; "set" = extra def fields
import { readFileSync, writeFileSync } from 'node:fs';
import { refs } from './genA.mjs';
const [cfgPath, planPath] = process.argv.slice(2);
const cfg = JSON.parse(readFileSync(cfgPath, 'utf8'));
const TARGET = { 3: 120, 4: 180 };
const panel = (tier) => refs().filter((r) => r.tier === tier && r.cls !== 'conduit' && (tier === 3 || r.path === { light: 'a', balanced: 'b', heavy: 'c' }[r.frame]));
const plan = [];
for (const [key, c] of Object.entries(cfg)) {
  const id = key.split('#')[0];
  const f = (1 - c.old.dr) / (1 - c.dr);
  c.hp ??= Math.round(c.old.hp * (TARGET[c.tier] / c.mid) / f / 10) * 10;
  const mp = { [id]: { stats: { hp: c.hp, plating: c.plating, damageReduction: c.dr }, ...(c.set ? { set: c.set } : {}), ...(c.paths ? { paths: c.paths } : {}) } };
  for (const b of panel(c.tier)) for (const arm of ['bench', 'off'])
    plan.push({ id: `K-${key}-${b.key}-${arm}`, tier: c.tier, cls: b.cls, frame: b.frame, path: b.path, treatment: 'live', node: `node-t${c.tier}-${c.node}-dungeon`, capMs: 720000, mp, ...(arm === 'off' ? { stance: 'offensive-stance' } : {}) });
}
writeFileSync(planPath, JSON.stringify(plan));
writeFileSync(cfgPath.replace('.json', '.resolved.json'), JSON.stringify(cfg, null, 1));
console.log('plan', plan.length, Object.entries(cfg).map(([k, c]) => `${k}:${c.hp}`).join(' '));
