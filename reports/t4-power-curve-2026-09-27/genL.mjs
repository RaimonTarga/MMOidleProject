import { writeFileSync } from 'node:fs';
import { refs } from './genA.mjs';
import { ABIL } from './genA2.mjs';
const [out, cfgJson] = process.argv.slice(2);
const cfg = JSON.parse(cfgJson);
const panel = refs().filter((r) => r.tier === 4 && r.cls !== 'conduit' && r.path === { light: 'a', balanced: 'b', heavy: 'c' }[r.frame]);
const plan = [];
for (const [mob, st] of Object.entries(cfg)) for (const b of panel) for (const arm of ['bench', 'off'])
  plan.push({ id: `L-${mob}-${b.key}-${arm}`, tier: 4, cls: b.cls, frame: b.frame, path: b.path, treatment: `trash:${mob}`, capMs: 300000, mp: { [mob]: { stats: st } }, ...(arm === 'off' ? { stance: 'offensive-stance' } : { stance: 'defensive-stance' }), ...ABIL[4] });
writeFileSync(out, JSON.stringify(plan)); console.log('L', plan.length);
