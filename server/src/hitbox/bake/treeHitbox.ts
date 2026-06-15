import sharp from 'sharp';
import { TREE_VARIANT_COUNT, type HitboxRect } from '@mmo-idle/shared';
import { buildSourceMask, greedyRectCover, toCenterRelativeRects } from './greedyCover';

/**
 * Bake per-variant trunk-base hitbox rects from `trees_hitbox.png` using the
 * exact greedy-rect-cover algorithm used for monster/player sprites. The sheet
 * is a 2×2 grid; each cell is one tree variant. Returned rects are center-
 * relative to their cell, in cell pixels (matching `HitboxRect` source space).
 */
export async function bakeTreeHitboxRects(
  hitboxPngPath: string,
): Promise<HitboxRect[][]> {
  const { data, info } = await sharp(hitboxPngPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const sheetW = info.width;
  const cell = Math.floor(sheetW / 2);

  const perVariant: HitboxRect[][] = [];
  for (let variant = 0; variant < TREE_VARIANT_COUNT; variant++) {
    const qx = variant % 2;
    const qy = Math.floor(variant / 2);
    const ox = qx * cell;
    const oy = qy * cell;

    const rgba = Buffer.alloc(cell * cell * 4);
    for (let y = 0; y < cell; y++) {
      for (let x = 0; x < cell; x++) {
        const src = ((oy + y) * sheetW + (ox + x)) * 4;
        const dst = (y * cell + x) * 4;
        rgba[dst] = data[src];
        rgba[dst + 1] = data[src + 1];
        rgba[dst + 2] = data[src + 2];
        rgba[dst + 3] = data[src + 3];
      }
    }

    const mask = buildSourceMask(rgba, cell, cell, cell, cell, 0, 0);
    const { rects } = greedyRectCover(mask, cell, cell);
    perVariant.push(toCenterRelativeRects(rects, cell, cell));
  }

  return perVariant;
}
