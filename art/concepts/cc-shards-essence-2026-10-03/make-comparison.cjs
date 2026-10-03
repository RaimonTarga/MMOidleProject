const fs = require('node:fs');
const path = require('node:path');
const repoRoot = path.resolve(__dirname, '../../..');
const sharp = require(path.join(repoRoot, 'server/node_modules/sharp'));
const names = ['Gale', 'Anvil', 'Venom', 'Shackle', 'Bone', 'Spark', 'Sigil', 'Iron', 'Glass'];
const width = 1236, height = 762, step = 132;
const layers = [];
const escape = text => text.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const labels = [];
function text(x, y, value, size = 14, color = '#e5e9f0') {
  labels.push(`<text x="${x}" y="${y}" font-family="Segoe UI,Arial,sans-serif" font-size="${size}" fill="${color}">${escape(value)}</text>`);
}
async function card(file, name, column, rowTop) {
  const x = 24 + column * step, y = rowTop + 24;
  labels.push(`<rect x="${x}" y="${y}" width="128" height="184" rx="6" fill="#1c2430" stroke="#303b4a"/>`);
  text(x + 12, y + 22, name, 16);
  layers.push({ input: await sharp(file).resize(96, 96, { kernel: 'nearest' }).png().toBuffer(), left: x + 16, top: y + 30 });
  for (const [size, offset] of [[16, 18], [24, 49], [32, 86]]) {
    layers.push({ input: await sharp(file).resize(size, size, { kernel: 'nearest' }).png().toBuffer(), left: x + offset, top: y + 140 - Math.floor(size / 2) });
    text(x + offset, y + 174, size + 'px', 10, '#9aa9bd');
  }
}
(async () => {
  text(24, 30, 'Shard material icons - essence-style comparison', 24);
  text(24, 54, 'Enlarged 3x above; actual 16 / 24 / 32px below. Shared crystal set approved 2026-10-03.', 14, '#aebbcf');
  text(24, 84, 'Existing essence references', 18);
  for (const [index, color] of ['yellow', 'green', 'purple', 'blue', 'red'].entries()) {
    await card(path.join(repoRoot, 'art/src/UI_icons/essences', color + '.png'), color[0].toUpperCase() + color.slice(1), index + 2, 92);
  }
  text(24, 314, 'Original approved material fragments - retained for comparison', 18);
  text(24, 544, 'Current approved shards - shared crystal + distinct symbols', 18);
  for (const [index, name] of names.entries()) {
    const id = name.toLowerCase() + '-shard';
    await card(path.join(repoRoot, 'art/concepts/cc-icons-2026-10-03/candidates', id + '.png'), name, index, 322);
    await card(path.join(__dirname, 'candidates', id + '-essence-v2.png'), name, index, 552);
  }
  const svg = Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${labels.join('')}</svg>`);
  await sharp({ create: { width, height, channels: 4, background: '#111820' } }).composite([{ input: svg, top: 0, left: 0 }, ...layers]).png().toFile(path.join(__dirname, 'comparison-sheet.png'));
  console.log('Wrote 1236x762 comparison sheet.');
})().catch(error => { console.error(error); process.exit(1); });
