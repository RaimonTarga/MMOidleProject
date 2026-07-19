// Deterministic sprite retouch used for the Stage 0 vagrant (2026-07-12).
// Run from repo root: node art/workbench/classless/retouch.mjs <in.png> <out.png> [widenFactor]
// - Hue-shifts cold/slate pixels to earthy green (h=95); warm tans/browns and the
//   black hood void are untouched (the cold-pixel filter skips them).
// - Optionally stretches the figure horizontally (widenFactor, e.g. 1.25) and
//   re-centers it on the 64px canvas at the same baseline.
// Palette/geometry changes are CODE, not generation — zero API spend, repeatable.
// Old reference sprites fill 59-64% of canvas width; raw generations came out ~44%.
import sharp from '../../../server/node_modules/sharp/lib/index.js';

const [, , inPath, outPath, factorArg] = process.argv;
const factor = factorArg ? Number(factorArg) : 1;
if (!inPath || !outPath) {
  console.error('usage: node retouch.mjs <in.png> <out.png> [widenFactor]');
  process.exit(1);
}

function rgb2hsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0;
  if (d) {
    if (mx === r) h = ((g - b) / d) % 6;
    else if (mx === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60; if (h < 0) h += 360;
  }
  return [h, mx ? d / mx : 0, mx];
}
function hsv2rgb(h, s, v) {
  const c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c;
  let r, g, b;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255].map(Math.round);
}

const { data, info } = await sharp(inPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
for (let i = 0; i < data.length; i += 4) {
  if (data[i + 3] < 10) continue;
  const [h, s, v] = rgb2hsv(data[i], data[i + 1], data[i + 2]);
  const cold = (h >= 170 && h <= 290) || s < 0.13;
  if (cold && v >= 0.14 && v <= 0.85) {
    const [r, g, b] = hsv2rgb(95, Math.max(s, 0.28), Math.min(0.9, v * 1.18));
    data[i] = r; data[i + 1] = g; data[i + 2] = b;
  }
}
const green = await sharp(data, { raw: info }).png().toBuffer();

if (factor === 1) {
  await sharp(green).toFile(outPath);
} else {
  let minX = 1e9, minY = 1e9, maxX = -1, maxY = -1;
  for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
    if (data[(y * info.width + x) * 4 + 3] > 10) {
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
  }
  const w = maxX - minX + 1, h = maxY - minY + 1;
  const newW = Math.min(info.width - 2, Math.round(w * factor));
  const fig = await sharp(green).extract({ left: minX, top: minY, width: w, height: h })
    .resize({ width: newW, height: h, fit: 'fill', kernel: 'lanczos3' }).png().toBuffer();
  await sharp({ create: { width: info.width, height: info.height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: fig, left: Math.round((info.width - newW) / 2), top: minY }])
    .png().toFile(outPath);
}
console.log('wrote', outPath);
