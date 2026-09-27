import { writeFileSync } from 'node:fs';
import { refs } from './genA.mjs';
const T = 'C:/Users/osaif/AppData/Local/Temp/claude/t4';
export const ABIL = {
  1: { techniques: ['power-strike'], guards: ['second-wind'] },
  2: { techniques: ['power-strike'], guards: ['second-wind', 'brace'] },
  3: { techniques: ['power-strike', 'expose-weakness'], guards: ['second-wind', 'brace', 'cleanse'] },
  4: { techniques: ['power-strike', 'expose-weakness'], guards: ['second-wind', 'brace', 'cleanse'] },
};
const A2 = [];
for (const b of refs()) {
  const st = b.tier >= 2 ? { stance: 'offensive-stance' } : {};
  for (const t of ['dummy-armored', 'dummy-heavy']) A2.push({ id: `${b.key}-${t}-norm`, tier: b.tier, cls: b.cls, frame: b.frame, path: b.path, treatment: t, ...st, ...ABIL[b.tier] });
}
// T3 weapon sweep, then T3 core sweep is a follow-up once the best weapon is known.
const W3 = ['cave-cataclysm-axe', 'jungle-venomthorn-rapier', 'mountain-avalanche-maul', 'swamp-blightbrand', 'tundra-permafrost-maul', 'tundra-rimebrand', 'desert-solar-cross', 'desert-pilgrim-quarterstaff', 'volcanic-cinderlash'];
const W = [];
for (const b of refs().filter((r) => r.tier === 3)) for (const w of W3)
  W.push({ id: `${b.key}-w-${w}`, tier: 3, cls: b.cls, frame: b.frame, treatment: 'dummy-heavy', stance: 'offensive-stance', ...ABIL[3], gear: { weapon: w } });
writeFileSync(`${T}/planA2.json`, JSON.stringify([...A2, ...W]));
console.log('A2+W', A2.length + W.length);
