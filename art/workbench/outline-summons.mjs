// Bakes a 1px outline onto the Conduit summon sprites.
//
// Deterministic post-process, in the same family as the roster hue scripts:
// reads the PRESERVED un-outlined art in art/workbench/conduit-summon-raw/ and
// writes art/src/sprites/monsters/. Re-runnable — changing the colour is one
// flag, and the raw copies are never modified, so nothing degrades across runs.
//
//   node art/workbench/outline-summons.mjs                  # default #14181a
//   node art/workbench/outline-summons.mjs --color=#1d5f5a  # dark-teal variant
//   node art/workbench/outline-summons.mjs --none           # strip, restore raw
//
// WHY near-black: the real wang ground colours run #bea581 (desert) down to
// #212b1f (jungle), and a pale bone skull only fails to read on the LIGHT
// biomes. A dark outline separates it there; on the dark biomes it vanishes,
// which is fine because the bright skull already carries itself. The Conduit's
// accent teal (#4ad4c8) was tested and rejected: at luminance ~0.75 it barely
// separates from desert (~0.65) or tundra (~0.71), exactly where help is needed.
//
// After running: pnpm art:pack && pnpm bake:hitboxes (the outline grows the
// silhouette by 1px, so the baked footprint shifts slightly).
import sharp from '../../server/node_modules/sharp/lib/index.js';
import fs from 'node:fs';
import path from 'node:path';

const RAW = 'art/workbench/conduit-summon-raw';
const DEST = 'art/src/sprites/monsters';
const ALPHA_CUTOFF = 40;

const args = process.argv.slice(2);
const strip = args.includes('--none');
const colorArg = args.find((a) => a.startsWith('--color='));
const hex = colorArg ? colorArg.split('=')[1] : '#14181a';

function parseHex(h) {
  const m = /^#?([0-9a-f]{6})$/i.exec(h);
  if (!m) throw new Error(`bad colour: ${h}`);
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

async function run() {
  const [r, g, b] = strip ? [0, 0, 0] : parseHex(hex);
  for (const file of fs.readdirSync(RAW).filter((f) => f.endsWith('.png'))) {
    const src = path.join(RAW, file);
    const dest = path.join(DEST, file);
    if (strip) {
      fs.copyFileSync(src, dest);
      console.log('restored', file);
      continue;
    }
    const { data, info } = await sharp(src).ensureAlpha().raw()
      .toBuffer({ resolveWithObject: true });
    const { width: W, height: H } = info;
    const out = Buffer.from(data);
    const opaque = (x, y) =>
      x >= 0 && y >= 0 && x < W && y < H && data[(y * W + x) * 4 + 3] >= ALPHA_CUTOFF;

    let painted = 0;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        if (data[i + 3] >= ALPHA_CUTOFF) continue;
        let touches = false;
        for (let dy = -1; dy <= 1 && !touches; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) continue;
            if (opaque(x + dx, y + dy)) { touches = true; break; }
          }
        }
        if (!touches) continue;
        out[i] = r; out[i + 1] = g; out[i + 2] = b; out[i + 3] = 255;
        painted++;
      }
    }
    await sharp(out, { raw: { width: W, height: H, channels: 4 } }).png().toFile(dest);
    console.log(`outlined ${file.padEnd(30)} ${painted} px @ ${hex}`);
  }
}

run();
