// art:glyphs — renders the hand-authored pixel maps in glyphs.ts into
// art/src/UI_icons/** and writes a contact sheet for review.
//
// Usage:
//   pnpm art:glyphs                 # render every glyph + contact sheet
//   pnpm art:glyphs --check         # validate maps only, write nothing
//   pnpm art:glyphs --sheet=<path>  # contact sheet destination
//
// art/src is the committed source of truth for shipped art, so this writes
// there and `pnpm art:pack --atlas=UI_icons` compiles it into the client atlas —
// the same contract the PixelLab entries use after gallery acceptance.

import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { GLYPHS, validateGlyphs } from './glyphs';
import { PALETTE, type PaletteKey } from './palette';
import { REPO_ROOT, srcPathFor } from '../pixellab/lib/paths';

const args = process.argv.slice(2);
const checkOnly = args.includes('--check');
const sheetRaw = args.find((a) => a.startsWith('--sheet='))?.split('=')[1];
// pnpm runs this from server/, so a relative path would land there rather than
// where it was typed. Resolve against the repo root instead.
const sheetArg = sheetRaw
  ? (path.isAbsolute(sheetRaw) ? sheetRaw : path.join(REPO_ROOT, sheetRaw))
  : undefined;

/** One pixel map -> an RGBA PNG at its authored size. No scaling, ever. */
function renderGlyph(rows: string[]): sharp.Sharp {
  const GRID = rows.length;
  const buf = Buffer.alloc(GRID * GRID * 4, 0);
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      const rgb = PALETTE[rows[y][x] as PaletteKey];
      if (rgb === undefined) {
        throw new Error(`unknown palette key '${rows[y][x]}' at ${x},${y}`);
      }
      if (rgb === null) continue;
      const i = (y * GRID + x) * 4;
      buf[i] = rgb[0];
      buf[i + 1] = rgb[1];
      buf[i + 2] = rgb[2];
      buf[i + 3] = 255;
    }
  }
  return sharp(buf, { raw: { width: GRID, height: GRID, channels: 4 } });
}

/**
 * Review sheet: 4x for inspecting placement, then the literal size the HUD
 * draws. The small column is the one that decides whether a glyph works.
 */
async function contactSheet(dest: string): Promise<void> {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const CELL = 72;
  const LABEL_W = 150;
  const ids = Object.keys(GLYPHS);
  const layers: sharp.OverlayOptions[] = [];

  for (let row = 0; row < ids.length; row++) {
    const id = ids[row];
    const glyph = GLYPHS[id];
    const png = await renderGlyph(glyph.rows).png().toBuffer();
    const size = glyph.rows.length;
    const top = row * CELL + 4;
    layers.push({
      input: await sharp(png).resize(64, 64, { kernel: 'nearest' }).png().toBuffer(),
      left: LABEL_W + 4,
      top,
    });
    // The right column is always the size the HUD will actually draw: 16px for
    // stat/action glyphs, 32px for the class sigils on their 88px tree nodes.
    layers.push({
      input: png,
      left: LABEL_W + CELL + 28,
      top: top + (size === 32 ? 16 : 24),
    });
    layers.push({
      input: Buffer.from(
        `<svg width="${LABEL_W}" height="${CELL}"><text x="6" y="${CELL / 2 + 5}"`
        + ` font-family="monospace" font-size="15" fill="#e0c070">${id}</text></svg>`,
      ),
      left: 0,
      top: row * CELL,
    });
  }

  await sharp({
    create: {
      width: LABEL_W + CELL * 2 + 32,
      height: ids.length * CELL,
      channels: 4,
      background: { r: 26, g: 23, b: 19, alpha: 255 },
    },
  })
    .composite(layers)
    .png()
    .toFile(dest);
  console.log(`contact sheet: ${dest}`);
}

async function main(): Promise<void> {
  validateGlyphs();
  const ids = Object.keys(GLYPHS);
  const bySize = ids.reduce<Record<number, number>>((acc, id) => {
    const size = GLYPHS[id].rows.length;
    acc[size] = (acc[size] ?? 0) + 1;
    return acc;
  }, {});
  const shape = Object.entries(bySize).map(([s, n]) => `${n}x ${s}px`).join(', ');
  console.log(`${ids.length} glyphs (${shape}), maps valid.`);
  if (checkOnly) return;

  for (const [id, glyph] of Object.entries(GLYPHS)) {
    const dest = srcPathFor(glyph.out);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    await renderGlyph(glyph.rows).png().toFile(dest);
    console.log(`  ${id} -> art/src/${glyph.out}`);
  }

  if (sheetArg) await contactSheet(sheetArg);
  console.log('\nNext: pnpm art:pack --atlas=UI_icons');
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
