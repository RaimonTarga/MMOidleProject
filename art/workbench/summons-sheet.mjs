// Contact sheet per family: 4x detail view, with the TRUE in-game size beneath
// each candidate so the judgement that matters is visible in the same picture.
import sharp from '../../server/node_modules/sharp/lib/index.js';
import fs from 'node:fs';

const BASE = 28, MN = 0.6, MX = 3.0;
const clamp = (m) => Math.min(MX, Math.max(MN, m));
// [id, sizeMult before range, label]
const FAMILIES = {
  splinter: [
    ['splinter',   0.72,        'Splinter (frame)'],
    ['inquisitor', 0.72,        'Inquisitor'],
    ['kilnmaster', 0.72 * 0.72, 'Kilnmaster'],
    ['iconoclast', 0.72,        'Iconoclast'],
  ],
  consort: [
    ['consort',   1.0, 'Consort (frame)'],
    ['marshal',   1.0, 'Marshal'],
    ['chorister', 1.0, 'Chorister'],
    ['ritualist', 1.0, 'Ritualist'],
  ],
  effigy: [
    ['effigy',             1.75,        'Effigy (frame)'],
    ['covenanter-offense', 1.75 * 0.92, 'Covenanter offense'],
    ['covenanter-defense', 1.75 * 1.08, 'Covenanter defense'],
    ['champion',           1.75,        'Champion'],
    ['idolwright',         1.75 * 1.5,  'Idolwright'],
  ],
};

const CELL = 224, PAD = 12, HDR = 34, GAP = 6, TRUE_MAG = 2;

for (const [family, rows] of Object.entries(FAMILIES)) {
  const maxTrue = Math.max(...rows.map(([, m]) => Math.round(BASE * clamp(m) * 1.25))) * TRUE_MAG;
  const rowH = CELL + GAP + maxTrue;
  const W = 190 + 3 * (CELL + PAD) + PAD;
  const H = HDR + rows.length * (rowH + HDR + PAD);
  const comps = [];

  for (let r = 0; r < rows.length; r++) {
    const [id, mult] = rows[r];
    const truePx = Math.round(BASE * clamp(mult) * 1.25); // Procession, the middle range
    for (let c = 0; c < 3; c++) {
      const f = `art/candidates/conduit-summons/conduit-summon-${id}/candidate-${c + 1}.png`;
      if (!fs.existsSync(f)) continue;
      const left = 190 + c * (CELL + PAD);
      const top = HDR + r * (rowH + HDR + PAD) + HDR;
      comps.push({ input: await sharp(f).resize(CELL, CELL, { kernel: 'nearest' }).png().toBuffer(), left, top });
      comps.push({
        input: await sharp(f).resize(truePx, truePx, { kernel: 'nearest' })
          .resize(truePx * TRUE_MAG, truePx * TRUE_MAG, { kernel: 'nearest' }).png().toBuffer(),
        left: left + Math.round((CELL - truePx * TRUE_MAG) / 2), top: top + CELL + GAP,
      });
    }
  }

  const svg = `<svg width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#131317"/>
${rows.map(([id, m, label], r) => {
  const px = Math.round(BASE * clamp(m) * 1.25);
  const y = HDR + r * (rowH + HDR + PAD) + HDR;
  return `<text x="14" y="${y + 26}" font-family="monospace" font-size="15" fill="#e8e8ec">${label}</text>
<text x="14" y="${y + 48}" font-family="monospace" font-size="12" fill="#8f8f99">${px}px in play</text>`;
}).join('')}
<text x="14" y="22" font-family="monospace" font-size="14" fill="#7ad4c8">${family.toUpperCase()} family — 4x detail, true size beneath</text>
</svg>`;
  await sharp(Buffer.from(svg)).composite(comps).png()
    .toFile(`art/workbench/summons-${family}.png`);
  console.log('wrote', `art/workbench/summons-${family}.png`);
}
