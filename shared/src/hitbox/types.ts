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

/** Runtime / networked hitbox slice (display-scaled rects). */
export interface HasHitbox {
  rects: HitboxRect[];
}
