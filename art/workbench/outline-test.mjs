import sharp from '../../server/node_modules/sharp/lib/index.js';

const SRC = 'art/src/sprites/monsters/conduit-summon.png';
const N = 64;

/** 1px outline: any transparent pixel touching an opaque one takes `hex`. */
async function outlined(hex, alpha = 255) {
  const { data } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const out = Buffer.from(data);
  const A = (x, y) => data[(y * N + x) * 4 + 3];
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const i = (y * N + x) * 4;
    if (data[i + 3] >= 40) continue;
    let touch = false;
    for (let dy = -1; dy <= 1 && !touch; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue;
      if (A(nx, ny) >= 40) { touch = true; break; }
    }
    if (touch) { out[i] = r; out[i + 1] = g; out[i + 2] = b; out[i + 3] = alpha; }
  }
  return sharp(out, { raw: { width: N, height: N, channels: 4 } }).png().toBuffer();
}

const GROUNDS = [
  ['desert', '#bea581'], ['tundra', '#a7b7c9'], ['plains', '#a99475'],
  ['wasteland', '#726c6b'], ['forest', '#424c32'], ['cave', '#3c393b'],
  ['trench', '#1b3b4f'], ['jungle', '#212b1f'],
];
const TREATMENTS = [
  ['none', null], ['near-black #14181a', '#14181a'], ['dark teal #1d5f5a', '#1d5f5a'],
  ['accent teal #4ad4c8', '#4ad4c8'], ['bone #f2ead8', '#f2ead8'],
];

const PX = 28, MAG = 4, CELL = PX * MAG, PAD = 6, LABEL = 30, ROWLBL = 150;
const W = ROWLBL + GROUNDS.length * (CELL + PAD) + PAD;
const H = LABEL + TREATMENTS.length * (CELL + PAD) + PAD;
const comps = [];

for (let r = 0; r < TREATMENTS.length; r++) {
  const buf = TREATMENTS[r][1] ? await outlined(TREATMENTS[r][1]) : await sharp(SRC).png().toBuffer();
  const spr = await sharp(buf).resize(PX, PX, { kernel: 'nearest' })
    .resize(CELL, CELL, { kernel: 'nearest' }).png().toBuffer();
  for (let c = 0; c < GROUNDS.length; c++) {
    const left = ROWLBL + c * (CELL + PAD), top = LABEL + r * (CELL + PAD);
    comps.push({ input: await sharp({ create: { width: CELL, height: CELL, channels: 4,
      background: GROUNDS[c][1] } }).png().toBuffer(), left, top });
    comps.push({ input: spr, left, top });
  }
}

const svg = `<svg width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#0e0e11"/>
${GROUNDS.map(([n], c) => `<text x="${ROWLBL + c * (CELL + PAD) + CELL / 2}" y="20" text-anchor="middle" font-family="monospace" font-size="12" fill="#cfcfd6">${n}</text>`).join('')}
${TREATMENTS.map(([n], r) => `<text x="8" y="${LABEL + r * (CELL + PAD) + CELL / 2 + 4}" font-family="monospace" font-size="13" fill="#e8e8ec">${n}</text>`).join('')}
</svg>`;
await sharp(Buffer.from(svg)).composite(comps).png().toFile('art/workbench/outline-test.png');
console.log('wrote art/workbench/outline-test.png', W, 'x', H);
