// node genT2.mjs <cfg.json> <plan.json>
// T2 boss pass: 15 non-Conduit T2 reference builds (5 classes x 3 frames) x Defensive/Offensive,
// normalized abilities (Power Strike + Second Wind + Brace). cfg keys may carry '#variant'.
import { readFileSync, writeFileSync } from 'node:fs';
import { refs } from './genA.mjs';
const [cfgPath, planPath] = process.argv.slice(2);
const cfg = JSON.parse(readFileSync(cfgPath, 'utf8'));
const TARGET = 60;
const ABIL = { techniques: ['power-strike'], guards: ['second-wind', 'brace'] };
const panel = refs().filter((r) => r.tier === 2 && r.cls !== 'conduit');
const plan = [];
for (const [key, c] of Object.entries(cfg)) {
  const id = key.split('#')[0];
  if (c.hp === undefined && c.mid) c.hp = Math.round(c.old.hp * (TARGET / c.mid) / ((1 - c.old.dr) / (1 - c.dr)) / 10) * 10;
  const stats = { hp: c.hp ?? c.old.hp, plating: c.plating ?? c.old.plating, damageReduction: c.dr ?? c.old.dr };
  const mp = { [id]: { stats, ...(c.paths ? { paths: c.paths } : {}) } };
  for (const b of panel) for (const arm of ['def', 'off'])
    plan.push({ id: `T2-${key}-${b.key}-${arm}`, tier: 2, cls: b.cls, frame: b.frame, treatment: 'live', node: `node-t2-${c.node}-dungeon`,
      capMs: 400000, mp, stance: arm === 'def' ? 'defensive-stance' : 'offensive-stance', ...ABIL });
}
writeFileSync(planPath, JSON.stringify(plan));
writeFileSync(cfgPath.replace('.json', '.resolved.json'), JSON.stringify(cfg, null, 1));
console.log('plan', plan.length, Object.entries(cfg).map(([k, c]) => `${k}:${c.hp ?? c.old.hp}`).join(' '));
