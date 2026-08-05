// Contact sheet for a Conduit bakeoff round: each candidate shown at 4x for
// judging detail, plus at TRUE Consort display px (28) magnified 3x so the
// in-game read is visible in the same picture.
import sharp from '../../server/node_modules/sharp/lib/index.js';
import fs from 'node:fs';

const ARMS = [
  ['arm-g-bone-skull',        'G - HUMAN SKULL, pure bone + teal sockets'],
  ['arm-h-bone-skull-mask',   'H - HUMAN SKULL-MASK, glazed porcelain'],
  ['arm-i-bone-skull-noglow', 'I - HUMAN SKULL, pure bone, NO glow'],
];
const BIG = 4, TRUE_PX = 28, TRUE_MAG = 3;
const CELL = 64 * BIG, PAD = 14, LABEL = 26, GAP = 8;
const strip = TRUE_PX * TRUE_MAG;
const rowH = CELL + GAP + strip;
const W = PAD + 3 * (CELL + PAD);
const H = PAD + ARMS.length * (rowH + LABEL + PAD);

const comps = [];
for (let r = 0; r < ARMS.length; r++) {
  for (let c = 0; c < 3; c++) {
    const f = `art/candidates/conduit-bakeoff/${ARMS[r][0]}/candidate-${c + 1}.png`;
    if (!fs.existsSync(f)) continue;
    const left = PAD + c * (CELL + PAD);
    const top = PAD + r * (rowH + LABEL + PAD) + LABEL;
    comps.push({ input: await sharp(f).resize(CELL, CELL, { kernel: 'nearest' }).png().toBuffer(), left, top });
    comps.push({
      input: await sharp(f).resize(TRUE_PX, TRUE_PX, { kernel: 'nearest' })
        .resize(strip, strip, { kernel: 'nearest' }).png().toBuffer(),
      left: left + Math.round((CELL - strip) / 2), top: top + CELL + GAP,
    });
  }
}

const svg = `<svg width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#1b1b1f"/>
${ARMS.map(([, l], r) => `<text x="${PAD}" y="${PAD + r * (rowH + LABEL + PAD) + 18}" font-family="monospace" font-size="15" fill="#e8e8ec">${l}</text>`).join('')}
</svg>`;
await sharp(Buffer.from(svg)).composite(comps).png().toFile('art/workbench/conduit-bakeoff-r3-sheet.png');
console.log('wrote art/workbench/conduit-bakeoff-r3-sheet.png');
