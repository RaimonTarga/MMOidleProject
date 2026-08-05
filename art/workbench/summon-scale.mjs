// True-size preview of the Conduit summons: downsample the 64px atlas frame to
// the exact in-game display px, then magnify 3x nearest so the real fidelity
// loss is visible rather than hidden.
import sharp from '../../server/node_modules/sharp/lib/index.js';

const BASE = 32; // MINION_BASE_DISPLAY_SIZE
const SPECS = [
  ['Kilnmaster', 0.72 * 0.72, '8 summons'],
  ['Splinter',   0.72,        '6 summons'],
  ['Consort',    1.0,         '5 summons'],
  ['Effigy',     1.75,        '2 summons'],
  ['Idolwright', 1.75 * 1.5,  '1 summon'],
];
const SRC = ['conduit-summon.png', 'conduit-summon-b.png'];

const MAG = 3, PAD = 16, LABEL = 34;
const cellW = Math.round(BASE * SPECS.at(-1)[1] * MAG);
const rowH  = cellW;
const W = PAD + SPECS.length * (cellW + PAD);
const H = LABEL + SRC.length * (rowH + LABEL + PAD);

const comps = [];
for (let r = 0; r < SRC.length; r++) {
  for (let c = 0; c < SPECS.length; c++) {
    const px = Math.max(1, Math.round(BASE * SPECS[c][1]));
    const img = await sharp(`art/src/sprites/monsters/${SRC[r]}`)
      .resize(px, px, { kernel: 'nearest' })
      .resize(px * MAG, px * MAG, { kernel: 'nearest' })
      .png().toBuffer();
    comps.push({
      input: img,
      left: PAD + c * (cellW + PAD) + Math.round((cellW - px * MAG) / 2),
      top:  LABEL + r * (rowH + LABEL + PAD) + LABEL + Math.round((rowH - px * MAG) / 2),
    });
  }
}

const head = SPECS.map(([n, m, cnt], c) => {
  const px = Math.round(BASE * m);
  const x = PAD + c * (cellW + PAD) + cellW / 2;
  return `<text x="${x}" y="24" text-anchor="middle" font-family="monospace" font-size="14" fill="#e8e8ec">${n}</text>
<text x="${x}" y="42" text-anchor="middle" font-family="monospace" font-size="12" fill="#9a9aa4">${px}px · ${cnt}</text>`;
}).join('');

const rows = SRC.map((s, r) => `<text x="${PAD}" y="${LABEL + r * (rowH + LABEL + PAD) + 24}" font-family="monospace" font-size="13" fill="#7ad4c8">${s.replace('.png','')}</text>`).join('');

await sharp(Buffer.from(`<svg width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#1b1b1f"/>${head}${rows}</svg>`))
  .composite(comps).png().toFile('art/workbench/summon-scale.png');
console.log('wrote art/workbench/summon-scale.png', W, 'x', H);
