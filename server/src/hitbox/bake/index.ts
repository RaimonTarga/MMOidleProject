import { createHash } from 'crypto';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import sharp from 'sharp';
import {
  buildVoidOverlordAtlasFrames,
  type HitboxRect,
  type ShadowDef,
  type ShadowDefsFile,
} from '@mmo-idle/shared';
import type { HitboxRow } from '../../db/hitboxRepo';
import {
  buildSourceMask,
  greedyRectCover,
  toCenterRelativeRects,
} from './greedyCover';
import { computeShadowDef } from './footMetrics';

export interface BakeAtlasFrame {
  filename: string;
  sourceSize: { w: number; h: number };
  spriteSourceSize: { x: number; y: number; w: number; h: number };
  frame: { x: number; y: number; w: number; h: number };
}

interface AtlasJson {
  textures: Array<{ frames: BakeAtlasFrame[] }>;
}

export interface BakeResult {
  rows: HitboxRow[];
  shadowDefs: Record<string, ShadowDef>;
}

export function sha256File(filePath: string): string {
  const buf = readFileSync(filePath);
  return createHash('sha256').update(buf).digest('hex');
}

export function writeShadowDefsFile(
  atlasJsonPath: string,
  atlasHash: string,
  frames: Record<string, ShadowDef>,
): void {
  const outPath = path.join(path.dirname(atlasJsonPath), 'shadows.json');
  const file: ShadowDefsFile = { atlasHash, frames };
  writeFileSync(outPath, `${JSON.stringify(file, null, 2)}\n`, 'utf8');
}

export async function bakeFramesFromPng(
  atlasPngPath: string,
  frames: BakeAtlasFrame[],
): Promise<BakeResult> {
  const png = sharp(atlasPngPath);
  const { data, info } = await png.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const atlasW = info.width;

  const rows: HitboxRow[] = [];
  const shadowDefs: Record<string, ShadowDef> = {};

  for (const frame of frames) {
    const { filename, sourceSize, spriteSourceSize, frame: fr } = frame;
    const rgba = Buffer.alloc(fr.w * fr.h * 4);

    for (let y = 0; y < fr.h; y++) {
      for (let x = 0; x < fr.w; x++) {
        const srcIdx = ((fr.y + y) * atlasW + (fr.x + x)) * 4;
        const dstIdx = (y * fr.w + x) * 4;
        rgba[dstIdx] = data[srcIdx];
        rgba[dstIdx + 1] = data[srcIdx + 1];
        rgba[dstIdx + 2] = data[srcIdx + 2];
        rgba[dstIdx + 3] = data[srcIdx + 3];
      }
    }

    const mask = buildSourceMask(
      rgba,
      fr.w,
      fr.h,
      sourceSize.w,
      sourceSize.h,
      spriteSourceSize.x,
      spriteSourceSize.y,
    );

    const shadowDef = computeShadowDef(mask, sourceSize.w, sourceSize.h);
    if (shadowDef) shadowDefs[filename] = shadowDef;

    const { rects: pixelRects, coverage } = greedyRectCover(
      mask,
      sourceSize.w,
      sourceSize.h,
    );

    let hitboxRects: HitboxRect[] = toCenterRelativeRects(
      pixelRects,
      sourceSize.w,
      sourceSize.h,
    );

    if (hitboxRects.length === 0 && spriteSourceSize.w > 0 && spriteSourceSize.h > 0) {
      const cx = sourceSize.w / 2;
      const cy = sourceSize.h / 2;
      hitboxRects = [{
        offsetX: spriteSourceSize.x + spriteSourceSize.w / 2 - cx,
        offsetY: spriteSourceSize.y + spriteSourceSize.h / 2 - cy,
        halfW: spriteSourceSize.w / 2,
        halfH: spriteSourceSize.h / 2,
      }];
    }

    rows.push({
      frameName: filename,
      sourceW: sourceSize.w,
      sourceH: sourceSize.h,
      rects: hitboxRects,
      coverage: hitboxRects.length > 0 ? Math.max(coverage, 1) : 0,
    });
  }

  return { rows, shadowDefs };
}

export async function bakeSpriteHitboxes(
  atlasPngPath: string,
  atlasJsonPath: string,
): Promise<BakeResult> {
  const atlasJson = JSON.parse(readFileSync(atlasJsonPath, 'utf8')) as AtlasJson;
  const frames = atlasJson.textures[0]?.frames ?? [];
  return bakeFramesFromPng(atlasPngPath, frames);
}

export async function bakeVoidOverlordHitboxes(atlasPngPath: string): Promise<BakeResult> {
  const frames = buildVoidOverlordAtlasFrames();
  return bakeFramesFromPng(atlasPngPath, frames);
}
