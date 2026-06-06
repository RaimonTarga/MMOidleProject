import type { ShadowDef } from '@mmo-idle/shared';

const FOOT_BAND_PX = 6;

function findOpaqueSpan(mask: Uint8Array, width: number, y: number): { minX: number; maxX: number } | null {
  let minX = width;
  let maxX = -1;
  const rowStart = y * width;

  for (let x = 0; x < width; x++) {
    if (!mask[rowStart + x]) continue;
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
  }

  return maxX >= 0 ? { minX, maxX } : null;
}

export function computeShadowDef(
  mask: Uint8Array,
  sourceW: number,
  sourceH: number,
): ShadowDef | null {
  let lowestRow = -1;
  for (let y = sourceH - 1; y >= 0; y--) {
    if (findOpaqueSpan(mask, sourceW, y)) {
      lowestRow = y;
      break;
    }
  }

  if (lowestRow < 0) return null;

  let bandMinX = sourceW;
  let bandMaxX = -1;
  const bandTop = Math.max(0, lowestRow - FOOT_BAND_PX + 1);

  for (let y = bandTop; y <= lowestRow; y++) {
    const span = findOpaqueSpan(mask, sourceW, y);
    if (!span) continue;
    bandMinX = Math.min(bandMinX, span.minX);
    bandMaxX = Math.max(bandMaxX, span.maxX);
  }

  if (bandMaxX < 0) return null;

  return {
    sourceW,
    sourceH,
    footY: lowestRow - sourceH / 2,
    halfWAtFoot: (bandMaxX - bandMinX + 1) / 2,
  };
}
