import {
  HITBOX_ALPHA_THRESHOLD,
  HITBOX_MAX_RECTS,
  HITBOX_MIN_COVERAGE,
  HITBOX_MIN_RECT_AREA,
} from '@mmo-idle/shared';

export interface PixelRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Build opaque mask in sourceSize canvas (1 = opaque). */
export function buildSourceMask(
  rgba: Buffer,
  frameW: number,
  frameH: number,
  sourceW: number,
  sourceH: number,
  offsetX: number,
  offsetY: number,
): Uint8Array {
  const mask = new Uint8Array(sourceW * sourceH);
  for (let y = 0; y < frameH; y++) {
    for (let x = 0; x < frameW; x++) {
      const idx = (y * frameW + x) * 4;
      const alpha = rgba[idx + 3];
      if (alpha >= HITBOX_ALPHA_THRESHOLD) {
        const sx = offsetX + x;
        const sy = offsetY + y;
        if (sx >= 0 && sx < sourceW && sy >= 0 && sy < sourceH) {
          mask[sy * sourceW + sx] = 1;
        }
      }
    }
  }
  return mask;
}

function countOpaque(mask: Uint8Array): number {
  let n = 0;
  for (let i = 0; i < mask.length; i++) if (mask[i]) n++;
  return n;
}

function zeroRect(mask: Uint8Array, width: number, rect: PixelRect): void {
  for (let y = rect.y; y < rect.y + rect.h; y++) {
    for (let x = rect.x; x < rect.x + rect.w; x++) {
      mask[y * width + x] = 0;
    }
  }
}

/** Largest all-ones rectangle in a binary matrix (histogram / stack method). */
export function largestOpaqueRect(
  mask: Uint8Array,
  width: number,
  height: number,
): PixelRect | null {
  const heights = new Int32Array(width);
  let best: PixelRect | null = null;
  let bestArea = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      heights[x] = mask[y * width + x] ? heights[x] + 1 : 0;
    }

    const stack: number[] = [];
    for (let x = 0; x <= width; x++) {
      const h = x < width ? heights[x] : 0;
      while (stack.length > 0 && heights[stack[stack.length - 1]] > h) {
        const top = stack.pop()!;
        const heightBar = heights[top];
        const left = stack.length > 0 ? stack[stack.length - 1] + 1 : 0;
        const barW = x - left;
        const area = heightBar * barW;
        if (area > bestArea) {
          bestArea = area;
          best = { x: left, y: y - heightBar + 1, w: barW, h: heightBar };
        }
      }
      if (x < width) stack.push(x);
    }
  }

  return bestArea > 0 ? best : null;
}

export function greedyRectCover(
  mask: Uint8Array,
  width: number,
  height: number,
): { rects: PixelRect[]; coverage: number } {
  const working = mask.slice();
  const totalOpaque = countOpaque(working);
  if (totalOpaque === 0) {
    return { rects: [], coverage: 0 };
  }

  const placed: PixelRect[] = [];

  while (placed.length < HITBOX_MAX_RECTS) {
    const rect = largestOpaqueRect(working, width, height);
    if (!rect || rect.w * rect.h < HITBOX_MIN_RECT_AREA) break;
    placed.push(rect);
    zeroRect(working, width, rect);
    const remaining = countOpaque(working);
    const coverage = 1 - remaining / totalOpaque;
    if (coverage >= HITBOX_MIN_COVERAGE) break;
  }

  const remaining = countOpaque(working);
  const coverage = 1 - remaining / totalOpaque;
  return { rects: placed, coverage };
}

/** Convert pixel rects (top-left origin) to center-relative HitboxRect offsets. */
export function toCenterRelativeRects(
  rects: PixelRect[],
  sourceW: number,
  sourceH: number,
): Array<{ offsetX: number; offsetY: number; halfW: number; halfH: number }> {
  const cx = sourceW / 2;
  const cy = sourceH / 2;
  return rects.map(r => ({
    offsetX: r.x + r.w / 2 - cx,
    offsetY: r.y + r.h / 2 - cy,
    halfW: r.w / 2,
    halfH: r.h / 2,
  }));
}
