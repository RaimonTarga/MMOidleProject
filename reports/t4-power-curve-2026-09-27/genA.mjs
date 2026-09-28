import { writeFileSync } from 'node:fs';
const T = 'C:/Users/osaif/AppData/Local/Temp/claude/t4';
const CLS = ['squire', 'striker', 'apprentice', 'slinger', 'conduit', 'spirit'];
const FR = ['light', 'balanced', 'heavy'], PA = ['a', 'b', 'c'];
const BOSSES = {
  1: ['plains', 'forest', 'swamp', 'mountain', 'cave'],
  2: ['plains', 'forest', 'swamp', 'mountain', 'cave', 'desert', 'jungle'],
  3: ['swamp', 'mountain', 'cave', 'desert', 'jungle', 'volcanic', 'tundra'],
  4: ['mountain', 'jungle', 'desert', 'tundra', 'volcanic', 'graveyard', 'trench'],
};
export function refs() {
  const r = [];
  for (const cls of CLS) r.push({ tier: 1, cls, key: `t1-${cls}` });
  for (const tier of [2, 3]) for (const cls of CLS) for (const frame of FR) r.push({ tier, cls, frame, key: `t${tier}-${cls}-${frame}` });
  for (const cls of CLS) for (const frame of FR) for (const path of PA) r.push({ tier: 4, cls, frame, path, key: `t4-${cls}-${frame}-${path}` });
  return r;
}
const A = [], B = [];
for (const b of refs()) {
  const st = b.tier >= 2 ? { stance: 'offensive-stance' } : {};
  for (const t of ['dummy-armored', 'dummy-heavy']) A.push({ id: `${b.key}-${t}`, tier: b.tier, cls: b.cls, frame: b.frame, path: b.path, treatment: t, ...st });
  for (const biome of BOSSES[b.tier]) {
    const node = `node-t${b.tier}-${biome}-dungeon`;
    B.push({ id: `${b.key}-live-${biome}-bench`, tier: b.tier, cls: b.cls, frame: b.frame, path: b.path, treatment: 'live', node });
    if (b.tier >= 3) B.push({ id: `${b.key}-live-${biome}-off`, tier: b.tier, cls: b.cls, frame: b.frame, path: b.path, treatment: 'live', node, stance: 'offensive-stance' });
  }
}
writeFileSync(`${T}/planA.json`, JSON.stringify(A)); writeFileSync(`${T}/planB.json`, JSON.stringify(B));
console.log('A', A.length, 'B', B.length);
