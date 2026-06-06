/** Single axis-aligned box centered at entity pos + offset. */
export interface HitboxRect {
  /** Offset from entity center (sprite anchor) in world pixels */
  offsetX: number;
  offsetY: number;
  halfW: number;
  halfH: number;
}

/** Baked hitbox data for one atlas frame (source-space rects). */
export interface HitboxDef {
  frameName: string;
  sourceW: number;
  sourceH: number;
  /** Rects in source-space; scaled at resolve time */
  rects: HitboxRect[];
  coverage: number;
}

/** Baked contact-shadow metadata for one atlas frame (source-space). */
export interface ShadowDef {
  sourceW: number;
  sourceH: number;
  /** Y of the lowest opaque row, relative to sprite center. */
  footY: number;
  /** Half-width of the opaque footprint near the bottom of the sprite. */
  halfWAtFoot: number;
}

export interface ShadowDefsFile {
  atlasHash: string;
  frames: Record<string, ShadowDef>;
}

/** Runtime / networked hitbox slice (display-scaled rects). */
export interface HasHitbox {
  rects: HitboxRect[];
  /** Baked atlas frame key; null when using fallback AABB only. */
  frameName?: string | null;
  /** Source-space dimensions used for the last resolve (from HitboxDef or fallback). */
  sourceW?: number;
  sourceH?: number;
  /** Nominal display size at last resolve (before optional scaleMult). */
  displayW?: number;
  displayH?: number;
}
