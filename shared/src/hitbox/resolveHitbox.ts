import type { HasHitbox, HitboxDef, HitboxRect } from './types';

export function scaleHitboxDefToDisplay(
  def: HitboxDef,
  displayW: number,
  displayH: number,
): HitboxRect[] {
  const scaleX = displayW / def.sourceW;
  const scaleY = displayH / def.sourceH;
  return def.rects.map(r => ({
    offsetX: r.offsetX * scaleX,
    offsetY: r.offsetY * scaleY,
    halfW: r.halfW * scaleX,
    halfH: r.halfH * scaleY,
  }));
}

export function buildHasHitboxFromDef(args: {
  frameName: string | null;
  def: HitboxDef | undefined;
  displayW: number;
  displayH: number;
  fallback: HitboxRect;
  fallbackSourceW?: number;
  fallbackSourceH?: number;
}): HasHitbox {
  const { frameName, def, displayW, displayH, fallback } = args;
  if (frameName && def) {
    return {
      frameName,
      sourceW: def.sourceW,
      sourceH: def.sourceH,
      displayW,
      displayH,
      rects: scaleHitboxDefToDisplay(def, displayW, displayH),
    };
  }
  const srcW = args.fallbackSourceW ?? displayW;
  const srcH = args.fallbackSourceH ?? displayH;
  const scaleX = displayW / srcW;
  const scaleY = displayH / srcH;
  const fb: HitboxRect = {
    offsetX: fallback.offsetX * scaleX,
    offsetY: fallback.offsetY * scaleY,
    halfW: fallback.halfW * scaleX,
    halfH: fallback.halfH * scaleY,
  };
  return {
    frameName: null,
    sourceW: srcW,
    sourceH: srcH,
    displayW,
    displayH,
    rects: [fb],
  };
}
