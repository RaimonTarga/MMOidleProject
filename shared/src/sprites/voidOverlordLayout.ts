export const VOID_OVERLORD_SHEET_W = 2172;
export const VOID_OVERLORD_BOSS_W = 543;
export const VOID_OVERLORD_BOSS_H = 362;
export const VOID_OVERLORD_MINION_Y0 = 452;
export const VOID_OVERLORD_MINION_ROW_H = 136;
export const VOID_OVERLORD_MINION_COLS = 16;
export const VOID_OVERLORD_MINION_ROWS = 2;

export const VOID_OVERLORD_BOSS_FRAME_NAMES = [
  'boss-0',
  'boss-1',
  'boss-2',
  'boss-3',
] as const;

const ABYSSAL_TITAN_FRAMES = [0, 1, 2, 3] as const;

export const VOID_OVERLORD_MINION_POOLS: Record<string, readonly number[]> = {
  'abyssal-titan': ABYSSAL_TITAN_FRAMES,
  'elder-trench-serpent-warden': ABYSSAL_TITAN_FRAMES,
  'void-horror': Array.from(
    { length: VOID_OVERLORD_MINION_COLS * VOID_OVERLORD_MINION_ROWS - 4 },
    (_, i) => i + 4,
  ),
};

export const VOID_OVERLORD_DISPLAY: Record<
  string,
  { displayW: number; displayH: number; barOffsetY: number; visualOffsetY?: number }
> = {
  'void-overlord': { displayW: 400, displayH: 400, barOffsetY: 180, visualOffsetY: -100 },
  'abyssal-titan': { displayW: 72, displayH: 72, barOffsetY: 44 },
  'elder-trench-serpent-warden': { displayW: 144, displayH: 144, barOffsetY: 88 },
  'void-horror': { displayW: 60, displayH: 60, barOffsetY: 38 },
};

const VOID_OVERLORD_SHEET_TYPES = new Set([
  'void-overlord',
  'void-horror',
  'abyssal-titan',
  'elder-trench-serpent-warden',
]);

export function isVoidOverlordSheetMonster(monsterTypeId: string): boolean {
  return VOID_OVERLORD_SHEET_TYPES.has(monsterTypeId);
}

export function shouldUseVoidOverlordSheet(monsterTypeId: string): boolean {
  return monsterTypeId in VOID_OVERLORD_MINION_POOLS;
}

export function stableFrameIndex(id: string, count: number): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h) % count;
}

export function resolveVoidOverlordMinionFrameName(
  monsterTypeId: string,
  entityId: string,
): string | null {
  const pool = VOID_OVERLORD_MINION_POOLS[monsterTypeId];
  if (!pool?.length) return null;
  const idx = stableFrameIndex(entityId, pool.length);
  return `minion-${pool[idx]}`;
}

export function resolveVoidOverlordBossFrameName(): 'boss-0' {
  return 'boss-0';
}

export interface VoidOverlordAtlasFrame {
  filename: string;
  sourceSize: { w: number; h: number };
  spriteSourceSize: { x: number; y: number; w: number; h: number };
  frame: { x: number; y: number; w: number; h: number };
}

export function buildVoidOverlordAtlasFrames(): VoidOverlordAtlasFrame[] {
  const frames: VoidOverlordAtlasFrame[] = [];

  for (let i = 0; i < VOID_OVERLORD_BOSS_FRAME_NAMES.length; i++) {
    frames.push({
      filename: VOID_OVERLORD_BOSS_FRAME_NAMES[i],
      sourceSize: { w: VOID_OVERLORD_BOSS_W, h: VOID_OVERLORD_BOSS_H },
      spriteSourceSize: {
        x: 0,
        y: 0,
        w: VOID_OVERLORD_BOSS_W,
        h: VOID_OVERLORD_BOSS_H,
      },
      frame: {
        x: i * VOID_OVERLORD_BOSS_W,
        y: 0,
        w: VOID_OVERLORD_BOSS_W,
        h: VOID_OVERLORD_BOSS_H,
      },
    });
  }

  for (let row = 0; row < VOID_OVERLORD_MINION_ROWS; row++) {
    for (let col = 0; col < VOID_OVERLORD_MINION_COLS; col++) {
      const idx = row * VOID_OVERLORD_MINION_COLS + col;
      const x = Math.round((col * VOID_OVERLORD_SHEET_W) / VOID_OVERLORD_MINION_COLS);
      const nextX = Math.round(
        ((col + 1) * VOID_OVERLORD_SHEET_W) / VOID_OVERLORD_MINION_COLS,
      );
      const w = nextX - x;
      const y = VOID_OVERLORD_MINION_Y0 + row * VOID_OVERLORD_MINION_ROW_H;
      frames.push({
        filename: `minion-${idx}`,
        sourceSize: { w, h: VOID_OVERLORD_MINION_ROW_H },
        spriteSourceSize: { x: 0, y: 0, w, h: VOID_OVERLORD_MINION_ROW_H },
        frame: { x, y, w, h: VOID_OVERLORD_MINION_ROW_H },
      });
    }
  }

  return frames;
}
