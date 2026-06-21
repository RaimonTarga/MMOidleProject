import { GAME_CONFIG } from '../config/gameConfig';
import type { FeatureTarget } from '../world/nodeFeatures';
import {
  moverOverlapsBlockShapes,
  type Vec2,
} from '../systems/spatial';
import { EXIT_TRIGGER } from './nodeAdjacency';
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

/**
 * Cells whose center falls in the EXIT_TRIGGER gate band along any edge. The cell
 * size (32px) is wider than the band (20px), so the outermost cells centre inside
 * it; routing a waypoint there steers the mover across the boundary. Blocking them
 * keeps paths that run parallel to an edge — e.g. turning toward a perpendicular
 * gate right after entering a node — from re-triggering the transition just used.
 * Crossings are unaffected: gateApproachTarget aims past the edge, and the final
 * path segment to that off-grid goal still carries the mover through the band.
 */
function isCellInGateBand(
  col: number,
  row: number,
  cellSize: number,
  width: number,
  height: number,
): boolean {
  const cx = col * cellSize + cellSize / 2;
  const cy = row * cellSize + cellSize / 2;
  return (
    cx < EXIT_TRIGGER ||
    cx > width - EXIT_TRIGGER ||
    cy < EXIT_TRIGGER ||
    cy > height - EXIT_TRIGGER
  );
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
      if (
        isCellInGateBand(col, row, cellSize, width, height) ||
        isCellBlocked(shapes, pathPad, col, row, cellSize)
      ) {
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
 * Find nearest walkable cell to `pos`, searching outward ring by ring.
 *
 * Within a ring the geometrically closest walkable cell wins, not the first one
 * hit in iteration order. An order-biased pick skews off-grid goals (e.g. a gate
 * target placed past an edge, whose on-grid cells are blocked gate-band cells)
 * consistently sideways; because the steering goal is recomputed each tick from
 * the drifted position, that skew compounds into a slide along the border.
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
    let best: { col: number; row: number } | null = null;
    let bestDistSq = Infinity;
    for (let dc = -r; dc <= r; dc++) {
      for (let dr = -r; dr <= r; dr++) {
        if (Math.max(Math.abs(dc), Math.abs(dr)) !== r) continue; // ring edge only
        const col = start.col + dc;
        const row = start.row + dr;
        if (!isCellWalkable(grid, col, row)) continue;
        const center = cellToWorld(grid, col, row);
        const distSq = (center.x - pos.x) ** 2 + (center.y - pos.y) ** 2;
        if (distSq < bestDistSq) {
          bestDistSq = distSq;
          best = { col, row };
        }
      }
    }
    if (best) return best;
  }
  return null;
}
