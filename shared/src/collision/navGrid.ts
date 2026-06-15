import { GAME_CONFIG } from '../config/gameConfig';
import type { FeatureTarget } from '../world/nodeFeatures';
import {
  moverOverlapsBlockShapes,
  type Vec2,
} from '../systems/spatial';
import { blockShapesForMover } from './staticRegions';

/** Nav grid cell size in node-local pixels. */
export const NAV_CELL_SIZE = 32;

/**
 * Extra clearance (px per axis) baked into the nav grid beyond the mover's
 * hitbox half-extents. Covers discrete cell error and keeps paths from threading
 * gaps narrower than the mover's body.
 */
export const NAV_PATH_PAD_MARGIN = 8;

export function effectivePathfindingPad(pad: Vec2): Vec2 {
  return { x: pad.x + NAV_PATH_PAD_MARGIN, y: pad.y + NAV_PATH_PAD_MARGIN };
}

export interface NavGrid {
  cellSize: number;
  cols: number;
  rows: number;
  width: number;
  height: number;
  /** 1 = blocked, 0 = walkable. Index: row * cols + col. */
  blocked: Uint8Array;
  shapes: import('../world/nodeFeatures').NodeFeatureShape[];
  pad: Vec2;
}

const gridCache = new Map<string, NavGrid>();

function cacheKey(
  nodeId: string,
  mover: FeatureTarget,
  pad: Vec2,
  suppressed: ReadonlySet<string>,
): string {
  const suppressedKey = [...suppressed].sort().join(',');
  return `${nodeId}:${mover}:${pad.x},${pad.y}:${suppressedKey}`;
}

export function worldToCell(grid: NavGrid, pos: Vec2): { col: number; row: number } {
  return {
    col: Math.floor(pos.x / grid.cellSize),
    row: Math.floor(pos.y / grid.cellSize),
  };
}

export function cellToWorld(grid: NavGrid, col: number, row: number): Vec2 {
  return {
    x: col * grid.cellSize + grid.cellSize / 2,
    y: row * grid.cellSize + grid.cellSize / 2,
  };
}

export function isCellInBounds(grid: NavGrid, col: number, row: number): boolean {
  return col >= 0 && col < grid.cols && row >= 0 && row < grid.rows;
}

export function isCellWalkable(grid: NavGrid, col: number, row: number): boolean {
  if (!isCellInBounds(grid, col, row)) return false;
  return grid.blocked[row * grid.cols + col] === 0;
}

function isCellBlocked(
  shapes: import('../world/nodeFeatures').NodeFeatureShape[],
  pad: Vec2,
  col: number,
  row: number,
  cellSize: number,
): boolean {
  const center = {
    x: col * cellSize + cellSize / 2,
    y: row * cellSize + cellSize / 2,
  };
  return moverOverlapsBlockShapes(center, shapes, pad);
}

export function buildNavGrid(
  nodeId: string,
  mover: FeatureTarget,
  pad: Vec2,
  suppressedFeatureIds: ReadonlySet<string> = new Set(),
): NavGrid {
  const pathPad = effectivePathfindingPad(pad);
  const key = cacheKey(nodeId, mover, pathPad, suppressedFeatureIds);
  const cached = gridCache.get(key);
  if (cached) return cached;

  const width = GAME_CONFIG.NODE_WIDTH;
  const height = GAME_CONFIG.NODE_HEIGHT;
  const cellSize = NAV_CELL_SIZE;
  const cols = Math.ceil(width / cellSize);
  const rows = Math.ceil(height / cellSize);
  const shapes = blockShapesForMover(nodeId, mover, suppressedFeatureIds);
  const blocked = new Uint8Array(cols * rows);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (isCellBlocked(shapes, pathPad, col, row, cellSize)) {
        blocked[row * cols + col] = 1;
      }
    }
  }

  const grid: NavGrid = {
    cellSize,
    cols,
    rows,
    width,
    height,
    blocked,
    shapes,
    pad: pathPad,
  };
  gridCache.set(key, grid);
  return grid;
}

/** Clear cached nav grids (tests or dynamic suppression changes). */
export function clearNavGridCache(): void {
  gridCache.clear();
}

/**
 * Find nearest walkable cell to `pos`, searching outward in a spiral.
 * Returns null when no walkable cell exists within `maxRadius` cells.
 */
export function nearestWalkableCell(
  grid: NavGrid,
  pos: Vec2,
  maxRadius = 12,
): { col: number; row: number } | null {
  const start = worldToCell(grid, pos);
  if (isCellWalkable(grid, start.col, start.row)) return start;

  for (let r = 1; r <= maxRadius; r++) {
    for (let dc = -r; dc <= r; dc++) {
      for (const dr of [-r, r]) {
        const col = start.col + dc;
        const row = start.row + dr;
        if (isCellWalkable(grid, col, row)) return { col, row };
      }
    }
    for (let dr = -r + 1; dr <= r - 1; dr++) {
      for (const dc of [-r, r]) {
        const col = start.col + dc;
        const row = start.row + dr;
        if (isCellWalkable(grid, col, row)) return { col, row };
      }
    }
  }
  return null;
}
