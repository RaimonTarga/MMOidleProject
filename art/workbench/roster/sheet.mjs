// Roster contact sheet + palette report for the player-sprite colour pass.
//
// Run from repo root:
//   node art/workbench/roster/sheet.mjs [--bg=<hex>] [--out=<path>]
//
// Renders every accepted player body as one image: rows = classes, columns =
// root / light / balanced / heavy, nearest-neighbour upscaled so palette
// decisions can be made at a glance instead of squinting at 64px. Also prints
// a per-sprite palette report (dominant hues by coverage) so colour collisions
// between classes are measurable rather than a matter of opinion.
//
// Palette work is CODE, not generation — zero API spend, repeatable, reversible.
import sharp from '../../../server/node_modules/sharp/lib/index.js';
import path from 'node:path';
import fs from 'node:fs';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  }),
);
const BG = args.bg ?? '#4a4a52';
const OUT = args.out ?? 'art/workbench/roster/roster-sheet.png';
const SRC = args.src ?? 'art/src/sprites/classes';
// --src lets the sheet render a recolour preview dir instead of the live art,
// with a fallback to live art for any sprite the preview does not override.
const FALLBACK = 'art/src/sprites/classes';
const SCALE = 4;
const CELL = 64 * SCALE;
const PAD = 12;
const LABEL_W = 120;
const HEAD_H = 34;

const CLASSES = [
  ['Vagrant',   'classless', null],
  ['Striker',   'cadence',   'cadence'],
  ['Squire',    'cooldown',  'cooldown'],
  ['Apprentice','dot',       'dot'],
  ['Slinger',   'reload',    'reload'],
  ['Spirit',    'energy',    'energy'],
  ['Conduit',   'summoner',  'summoner'],
];
const COLS = ['root', 'light', 'balanced', 'heavy'];

const fileFor = (cls, col) =>
  col === 'root' ? `${cls}.png`
  : col === 'light' ? `light_${cls}.png`
  : col === 'balanced' ? `medium_${cls}.png`
  : `heavy_${cls}.png`;

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

const HUE_NAMES = [
  [15, 'red'], [45, 'orange/amber'], [70, 'yellow'], [160, 'green'],
  [200, 'cyan'], [255, 'blue'], [290, 'violet'], [340, 'magenta'], [361, 'red'],
];
const hueName = (h) => HUE_NAMES.find(([lim]) => h < lim)[1];

/** Palette report: what colours does this sprite actually occupy? */
async function analyse(file) {
  const { data } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let opaque = 0, neutral = 0, dark = 0, light = 0;
  const hues = new Map();
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 10) continue;
    opaque++;
    const [h, s, v] = rgb2hsv(data[i], data[i + 1], data[i + 2]);
    if (v < 0.22) dark++;
    else if (v > 0.8) light++;
    if (s < 0.15) { neutral++; continue; }
    const name = hueName(h);
    hues.set(name, (hues.get(name) ?? 0) + 1);
  }
  const top = [...hues.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3)
    .map(([n, c]) => `${n} ${Math.round((c / opaque) * 100)}%`);
  return {
    opaque,
    neutralPct: Math.round((neutral / opaque) * 100),
    darkPct: Math.round((dark / opaque) * 100),
    lightPct: Math.round((light / opaque) * 100),
    top: top.length ? top.join(', ') : 'monochrome',
  };
}

const W = LABEL_W + COLS.length * (CELL + PAD) + PAD;
const H = HEAD_H + CLASSES.length * (CELL + PAD) + PAD;
const composites = [];
const report = [];

for (const [ci, [label, cls]] of CLASSES.entries()) {
  const top = HEAD_H + ci * (CELL + PAD);
  composites.push({
    input: Buffer.from(
      `<svg width="${LABEL_W}" height="${CELL}"><text x="6" y="${CELL / 2}" ` +
      `font-family="sans-serif" font-size="19" fill="#fff">${label}</text></svg>`,
    ),
    left: 0, top,
  });
  for (const [xi, col] of COLS.entries()) {
    if (cls === 'classless' && col !== 'root') continue;
    let file = path.join(SRC, fileFor(cls, col));
    if (!fs.existsSync(file)) file = path.join(FALLBACK, fileFor(cls, col));
    if (!fs.existsSync(file)) { console.warn('missing', file); continue; }
    const buf = await sharp(file)
      .resize({ width: CELL, height: CELL, kernel: 'nearest' })
      .png().toBuffer();
    composites.push({ input: buf, left: LABEL_W + xi * (CELL + PAD), top });
    report.push([`${label} ${col}`, await analyse(file)]);
  }
}
for (const [xi, col] of COLS.entries()) {
  composites.push({
    input: Buffer.from(
      `<svg width="${CELL}" height="${HEAD_H}"><text x="4" y="23" font-family="sans-serif" ` +
      `font-size="19" fill="#fff">${col}</text></svg>`,
    ),
    left: LABEL_W + xi * (CELL + PAD), top: 2,
  });
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
await sharp({ create: { width: W, height: H, channels: 4, background: BG } })
  .composite(composites).png().toFile(OUT);

console.log(`wrote ${OUT}  (${W}x${H}, bg ${BG})\n`);
console.log('sprite'.padEnd(22), 'neutral  dark  light   dominant hues');
for (const [name, r] of report) {
  console.log(
    name.padEnd(22),
    `${String(r.neutralPct).padStart(5)}% ${String(r.darkPct).padStart(4)}% ` +
    `${String(r.lightPct).padStart(5)}%   ${r.top}`,
  );
}
