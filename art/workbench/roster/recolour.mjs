// Deterministic roster recolour for the player-sprite colour pass.
//
// Run from repo root:
//   node art/workbench/roster/recolour.mjs --preview      # writes art/workbench/roster/preview/
//   node art/workbench/roster/recolour.mjs --apply        # overwrites art/src/sprites/classes/
//
// Palette is CODE, not generation: zero API spend, repeatable, reversible.
// Generalises art/workbench/classless/retouch.mjs (which hardcoded the vagrant's
// green) into a per-class hue map, because the roster contact sheet showed five
// of six classes sitting in the same cool blue-violet band.
//
// Each rule rotates hue for pixels inside a source window, leaving everything
// outside it untouched — so the black hood void, white masks, leather browns and
// metal highlights survive while the garment colour moves.
//
// Keys are a class name (applies to all four of its bodies) or a single filename
// (overrides the class rule). The Apprentice uses per-file keys because its
// frames are ELEMENTAL rather than a single class hue — bible 20's path language,
// which its frame prompts already carry: light = Venom Vessel, balanced = Ember
// Mage, heavy = Rime-Bound. The root stays green as the class identity.
import sharp from '../../../server/node_modules/sharp/lib/index.js';
import path from 'node:path';
import fs from 'node:fs';

const APPLY = process.argv.includes('--apply');
const SRC = 'art/src/sprites/classes';
const PREVIEW_DIR = 'art/workbench/roster/preview';
const BACKUP_DIR = 'art/workbench/roster/pre-colourpass';

// hueFrom/hueTo: source window (degrees, wraps). target: destination hue.
// sat: multiplier on saturation. vMin/vMax: only touch mid-range values so the
// darkest shadows and brightest specular pixels keep doing their structural job.
const RULES = {
  // --- Apprentice: root = class green, frames = elemental (bible 20 paths) ---
  'dot.png': [{ // root: poison green, the class identity
    hueFrom: 190, hueTo: 345, target: 105, sat: 1.05, vMin: 0.12, vMax: 0.92,
  }],
  'light_dot.png': [{ // Venom Vessel: poison green. Its cloth is dusty/near-neutral,
    // so this rule reaches lower into desaturated pixels and boosts saturation —
    // otherwise the frame stays pale and never reads as poison at all.
    hueFrom: 190, hueTo: 345, target: 105, sat: 1.7, minSat: 0.045, vMin: 0.10, vMax: 0.94,
  }],
  'medium_dot.png': [{ // Ember Mage: fire
    hueFrom: 190, hueTo: 345, target: 22, sat: 1.15, vMin: 0.12, vMax: 0.94,
  }],
  'heavy_dot.png': [{ // Rime-Bound: frost
    hueFrom: 190, hueTo: 345, target: 193, sat: 0.9, vMin: 0.12, vMax: 0.94,
  }],
  reload: [{ // Slinger -> amber/ivory (bible 18); currently amber is only trim
    hueFrom: 200, hueTo: 320, target: 38, sat: 0.95, vMin: 0.12, vMax: 0.92,
  }],
  energy: [{ // Spirit -> true neutral; the monochrome intent leaked blue/violet
    hueFrom: 170, hueTo: 330, target: 220, sat: 0.12, vMin: 0.05, vMax: 0.98,
  }],
  summoner: [{ // Conduit -> deeper crimson; pulls magenta back toward red
    hueFrom: 300, hueTo: 350, target: 352, sat: 1.0, vMin: 0.10, vMax: 0.95,
  }],
  // cadence (steel + crimson) and cooldown (iron) are already on-identity: untouched.
};

const FILES = (cls) => [`${cls}.png`, `light_${cls}.png`, `medium_${cls}.png`, `heavy_${cls}.png`];

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
  h = ((h % 360) + 360) % 360;
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
const inWindow = (h, from, to) => (from <= to ? h >= from && h <= to : h >= from || h <= to);

async function recolour(file, rules) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let touched = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 10) continue;
    const [h, s, v] = rgb2hsv(data[i], data[i + 1], data[i + 2]);
    for (const r of rules) {
      // near-neutral pixels stay neutral unless a rule opts into them (minSat)
      if (s < (r.minSat ?? 0.10)) continue;
      if (!inWindow(h, r.hueFrom, r.hueTo) || v < r.vMin || v > r.vMax) continue;
      const [nr, ng, nb] = hsv2rgb(r.target, Math.min(1, s * r.sat), v);
      data[i] = nr; data[i + 1] = ng; data[i + 2] = nb;
      touched++;
      break;
    }
  }
  return { buf: await sharp(data, { raw: info }).png().toBuffer(), touched };
}

const outDir = APPLY ? SRC : PREVIEW_DIR;
if (!APPLY) fs.mkdirSync(PREVIEW_DIR, { recursive: true });
if (APPLY) fs.mkdirSync(BACKUP_DIR, { recursive: true });

// Expand class keys into their four files; filename keys override the class rule.
const CLASSES = ['cadence', 'cooldown', 'dot', 'reload', 'energy', 'summoner'];
const jobs = new Map();
for (const [key, rules] of Object.entries(RULES)) {
  if (key.endsWith('.png')) continue;
  for (const name of FILES(key)) jobs.set(name, rules);
}
for (const [key, rules] of Object.entries(RULES)) {
  if (key.endsWith('.png')) jobs.set(key, rules);
}
const unknown = [...jobs.keys()].filter(
  (n) => !CLASSES.some((c) => FILES(c).includes(n)),
);
if (unknown.length) { console.error('unknown target file(s):', unknown); process.exit(1); }

{
  for (const [name, rules] of jobs) {
    const file = path.join(SRC, name);
    if (!fs.existsSync(file)) { console.warn('missing', name); continue; }
    if (APPLY && !fs.existsSync(path.join(BACKUP_DIR, name))) {
      fs.copyFileSync(file, path.join(BACKUP_DIR, name));   // reversible by construction
    }
    const { buf, touched } = await recolour(file, rules);
    fs.writeFileSync(path.join(outDir, name), buf);
    console.log(`${APPLY ? 'applied' : 'preview'}  ${name.padEnd(22)} ${touched} px`);
  }
}
console.log(APPLY
  ? `\nApplied in place. Originals backed up to ${BACKUP_DIR}. Run: pnpm art:pack --atlas=sprites`
  : `\nPreview only — art/src untouched. Wrote ${PREVIEW_DIR}`);
