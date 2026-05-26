export interface EffectDef {
  id: string;
  key: string;
  file: string;
  /**
   * For uniform 5×5 grids: the cell width/height in pixels. When `rowSlices` is
   * supplied this is treated as the column width only (rows are explicit).
   */
  frameSize: number;
  durationMs: number;
  startFrame?: number;
  endFrame?: number;
  scale?: number;
  baseSize?: number;
  depth?: number;
  anchorYPx?: number;
  /**
   * When set, an explicit `activeEffectFrames[id]` value is treated as the BASE
   * of a contiguous `[base, base + loopFrames - 1]` band that the client cycles
   * through over `durationMs`. Used for ramping overlays like Permafrost where
   * the server picks the band (damage tier) and the client handles the loop.
   */
  loopFrames?: number;
  /**
   * Per-row vertical slices for sheets where rows have non-uniform heights and
   * tall content bleeds across cell boundaries when the sheet is read as a
   * uniform grid. Length must equal EFFECT_GRID; columns remain uniform width
   * `frameSize`. When present, the sheet is loaded as a plain image and each
   * of the 25 frames is registered manually using the slice's `y`/`h` plus
   * `col * frameSize` for x/w.
   */
  rowSlices?: ReadonlyArray<{ y: number; h: number }>;
}

export const EFFECT_GRID = 5;
export const EFFECT_FRAME_COUNT = EFFECT_GRID * EFFECT_GRID;

export const EFFECT_DEFS: EffectDef[] = [
  {
    id: "freeze",
    key: "fx-freeze",
    file: "/assets/animations/freezing_cold.png",
    frameSize: 256,
    durationMs: 2_000,
  },
  {
    id: "glacial-fracture",
    key: "fx-glacial-fracture",
    file: "/assets/animations/glacial_fracture.png",
    frameSize: 256,
    durationMs: 700,
    startFrame: 10,
    endFrame: 24,
    baseSize: 128,
    scale: 1.6,
    anchorYPx: -8,
  },
  {
    id: "permafrost",
    key: "fx-permafrost",
    file: "/assets/animations/permafrost.png",
    frameSize: 256,
    durationMs: 600,
    loopFrames: 5,
    rowSlices: [
      { y: 0, h: 270 },
      { y: 245, h: 221 },
      { y: 480, h: 225 },
      { y: 716, h: 235 },
      { y: 945, h: 329 },
    ],
    baseSize: 112,
    scale: 1.4,
    anchorYPx: 4,
  },
];

export const EFFECT_BY_ID = new Map<string, EffectDef>(
  EFFECT_DEFS.map((def) => [def.id, def]),
);
