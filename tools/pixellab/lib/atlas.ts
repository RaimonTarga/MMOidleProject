import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { ART_SRC_DIR, CLIENT_ASSETS_DIR, toPosix } from './paths';

// The atlas JSON shape the client already parses (free-tex-packer "Phaser3"
// format: sceneSetup.ts `load.atlas`, MonsterSprite.tsx, ItemIcon.tsx, uiAtlas.ts).
export interface AtlasFrame {
  filename: string;
  rotated: boolean;
  trimmed: boolean;
  sourceSize: { w: number; h: number };
  spriteSourceSize: { x: number; y: number; w: number; h: number };
  frame: { x: number; y: number; w: number; h: number };
}

export interface AtlasJson {
  textures: Array<{
    image: string;
    format: string;
    size: { w: number; h: number };
    scale: number;
    frames: AtlasFrame[];
  }>;
}

/** The three packed atlases and which art/src prefix feeds each. */
export interface AtlasDef {
  /** Texture name inside the JSON. */
  name: string;
  /** art/src subtree whose files become frames (frame name == path under art/src). */
  prefix: string;
  json: string;
  png: string;
}

export const ATLASES: AtlasDef[] = [
  { name: 'sprites', prefix: 'sprites/', json: 'sprites.json', png: 'sprites.png' },
  { name: 'icons', prefix: 'items/', json: 'icons.json', png: 'icons.png' },
  { name: 'UI_icons', prefix: 'UI_icons/', json: 'UI_icons.json', png: 'UI_icons.png' },
];

export function readAtlasJson(jsonPath: string): AtlasJson {
  return JSON.parse(fs.readFileSync(jsonPath, 'utf8')) as AtlasJson;
}

/** Slice every frame of an existing packed atlas into art/src/<frame name>. */
export async function sliceAtlas(
  def: AtlasDef,
  opts: { force: boolean },
): Promise<{ written: number; skipped: number }> {
  const jsonPath = path.join(CLIENT_ASSETS_DIR, def.json);
  const pngPath = path.join(CLIENT_ASSETS_DIR, def.png);
  const atlas = readAtlasJson(jsonPath);
  const image = sharp(pngPath);
  let written = 0;
  let skipped = 0;
  for (const texture of atlas.textures) {
    for (const frame of texture.frames) {
      const outPath = path.join(ART_SRC_DIR, ...frame.filename.split('/'));
      if (!opts.force && fs.existsSync(outPath)) {
        skipped++;
        continue;
      }
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      await image
        .clone()
        .extract({
          left: frame.frame.x,
          top: frame.frame.y,
          width: frame.frame.w,
          height: frame.frame.h,
        })
        .png()
        .toFile(outPath);
      written++;
    }
  }
  return { written, skipped };
}

interface PackInput {
  filename: string; // frame name, POSIX-style
  absPath: string;
  width: number;
  height: number;
}

interface PlacedFrame extends PackInput {
  x: number;
  y: number;
}

/** Deterministic shelf packing: sort by height desc then name, fill rows. */
function shelfPack(inputs: PackInput[]): { placed: PlacedFrame[]; width: number; height: number } {
  const sorted = [...inputs].sort(
    (a, b) => b.height - a.height || a.filename.localeCompare(b.filename),
  );
  const totalArea = sorted.reduce((sum, i) => sum + i.width * i.height, 0);
  const maxFrameWidth = Math.max(...sorted.map((i) => i.width));
  const minWidth = Math.max(maxFrameWidth, Math.ceil(Math.sqrt(totalArea)));
  const width = [128, 256, 512, 1024, 2048, 4096].find((w) => w >= minWidth) ?? minWidth;

  const placed: PlacedFrame[] = [];
  let cursorX = 0;
  let cursorY = 0;
  let shelfHeight = 0;
  for (const input of sorted) {
    if (cursorX + input.width > width) {
      cursorY += shelfHeight;
      cursorX = 0;
      shelfHeight = 0;
    }
    placed.push({ ...input, x: cursorX, y: cursorY });
    cursorX += input.width;
    shelfHeight = Math.max(shelfHeight, input.height);
  }
  return { placed, width, height: cursorY + shelfHeight };
}

/** Recursively list files under a directory, returning POSIX-style relative paths. */
export function walkFiles(root: string): string[] {
  if (!fs.existsSync(root)) return [];
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const name of fs.readdirSync(dir).sort()) {
      const full = path.join(dir, name);
      if (fs.statSync(full).isDirectory()) walk(full);
      else out.push(toPosix(path.relative(root, full)));
    }
  };
  walk(root);
  return out;
}

/**
 * Pack every PNG under art/src/<prefix> into an atlas PNG + JSON buffer pair.
 * Frame names are the file paths relative to art/src, unchanged — this is what
 * keeps frameMaps.ts and the icon components working without edits.
 */
export async function packAtlas(def: AtlasDef): Promise<{ png: Buffer; json: string }> {
  const rootDir = path.join(ART_SRC_DIR, def.prefix.replace(/\/$/, ''));
  const files = walkFiles(rootDir).filter((f) => f.endsWith('.png'));
  if (files.length === 0) {
    throw new Error(`No PNGs found under ${rootDir} — run art:import first.`);
  }
  const inputs: PackInput[] = [];
  for (const rel of files) {
    const absPath = path.join(rootDir, ...rel.split('/'));
    const meta = await sharp(absPath).metadata();
    if (!meta.width || !meta.height) throw new Error(`Unreadable PNG: ${absPath}`);
    inputs.push({
      filename: toPosix(path.posix.join(def.prefix, rel)),
      absPath,
      width: meta.width,
      height: meta.height,
    });
  }

  const { placed, width, height } = shelfPack(inputs);
  // Raw byte copy instead of sharp.composite: compositing premultiplies alpha
  // and rounds semi-transparent RGB values off by one. Frames never overlap,
  // so a direct copy keeps every source pixel bit-identical.
  const canvas = Buffer.alloc(width * height * 4);
  for (const p of placed) {
    const raw = await sharp(p.absPath).ensureAlpha().raw().toBuffer();
    for (let row = 0; row < p.height; row++) {
      raw.copy(
        canvas,
        ((p.y + row) * width + p.x) * 4,
        row * p.width * 4,
        (row + 1) * p.width * 4,
      );
    }
  }
  const png = await sharp(canvas, { raw: { width, height, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toBuffer();

  const atlas: AtlasJson = {
    textures: [
      {
        image: def.name,
        format: 'RGBA8888',
        size: { w: width, h: height },
        scale: 1,
        frames: placed
          .sort((a, b) => a.filename.localeCompare(b.filename))
          .map((p) => ({
            filename: p.filename,
            rotated: false,
            trimmed: false,
            sourceSize: { w: p.width, h: p.height },
            spriteSourceSize: { x: 0, y: 0, w: p.width, h: p.height },
            frame: { x: p.x, y: p.y, w: p.width, h: p.height },
          })),
      },
    ],
  };
  // Existing atlas JSONs are tab-indented; keep diffs quiet.
  return { png, json: JSON.stringify(atlas, null, '\t') + '\n' };
}
