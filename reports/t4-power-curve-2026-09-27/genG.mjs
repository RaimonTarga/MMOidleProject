import { writeFileSync } from 'node:fs';
import { refs } from './genA.mjs';
const T = 'C:/Users/osaif/AppData/Local/Temp/claude/t4';
const BOSSES = { 3: ['swamp', 'mountain', 'cave', 'desert', 'jungle', 'volcanic', 'tundra'], 4: ['mountain', 'jungle', 'desert', 'tundra', 'volcanic', 'graveyard', 'trench'] };
const G = [];
for (const b of refs().filter((r) => r.tier >= 3 && r.cls !== 'conduit'))
  for (const k of b.tier === 4 ? [3, 5] : [1.5])
    for (const biome of BOSSES[b.tier]) G.push({ id: `${b.key}-hpx${k}-${biome}`, tier: b.tier, cls: b.cls, frame: b.frame, path: b.path, treatment: `hpx:${k}`, node: `node-t${b.tier}-${biome}-dungeon`, capMs: 600000 });
writeFileSync(`${T}/planG.json`, JSON.stringify(G)); console.log('G', G.length);
