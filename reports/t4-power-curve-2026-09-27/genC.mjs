import { readFileSync, writeFileSync } from 'node:fs';
import { refs } from './genA.mjs';
import { ABIL } from './genA2.mjs';
const T = 'C:/Users/osaif/AppData/Local/Temp/claude/t4';
const R = 'C:/Users/osaif/Documents/Claude/Projects/mmo-integration/reports';
export function roster(tier) {
  const out = []; let biome = null;
  for (const line of readFileSync(`${R}/tier-${tier}-table.md`, 'utf8').split('\n')) {
    const h = line.match(/^## (.+?)  \(density (\d+)/); if (h) { biome = h[1]; continue; }
    if (line.startsWith('## ')) biome = null;
    const m = biome && line.match(/^\| (BOSS |follower )?(.+?) `([a-z0-9-]+)` \| (x\d+|—) \| (\d+) \|/);
    if (m) out.push({ biome, boss: m[1] === 'BOSS ', id: m[3], name: m[2], w: m[4] === '—' ? 0 : Number(m[4].slice(1)), hp: Number(m[5]), elite: line.includes('ELITE') });
  }
  return out;
}
const C = [];
for (const tier of [3, 4]) for (const mob of roster(tier).filter((m) => !m.boss))
  for (const b of refs().filter((r) => r.tier === tier))
    C.push({ id: `${b.key}-trash-${mob.id}`, tier, cls: b.cls, frame: b.frame, path: b.path, treatment: `trash:${mob.id}`, stance: 'offensive-stance', ...ABIL[tier] });
writeFileSync(`${T}/planC.json`, JSON.stringify(C));
writeFileSync(`${T}/roster.json`, JSON.stringify({ 3: roster(3), 4: roster(4) }));
console.log('C', C.length, 'T3 mobs', roster(3).filter((m) => !m.boss).length, 'T4 mobs', roster(4).filter((m) => !m.boss).length);
