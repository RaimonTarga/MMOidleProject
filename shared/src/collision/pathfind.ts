import { distanceSq, moverOverlapsBlockShapes, resolveMoveAgainstBlocks, type Vec2 } from '../systems/spatial';
import type { FeatureTarget } from '../world/nodeFeatures';
import {
  buildNavGrid,
  cellToWorld,
  isCellWalkable,
  nearestWalkableCell,
  type NavGrid,
  worldToCell,
} from './navGrid';

const SQRT2 = Math.SQRT2;
const OCTILE = SQRT2 - 1;

/** Skip first waypoint when already within this distance of it. */
export const PATH_ARRIVAL_THRESHOLD = 24;

/** Replan when goal moves less than this (px) — avoids chase replans every tick. */
export const PATH_GOAL_EPSILON_SQ = 48 * 48;

function octileHeuristic(col: number, row: number, endCol: number, endRow: number): number {
  const dx = Math.abs(col - endCol);
  const dy = Math.abs(row - endRow);
  return Math.max(dx, dy) + OCTILE * Math.min(dx, dy);
}

function reconstructPath(
  grid: NavGrid,
  endIdx: number,
  cameFrom: Int32Array,
  cols: number,
): Vec2[] {
  const cells: Array<{ col: number; row: number }> = [];
  let idx = endIdx;
  while (idx >= 0) {
    const row = Math.floor(idx / cols);
    const col = idx % cols;
    cells.push({ col, row });
    idx = cameFrom[idx];
  }
  cells.reverse();
  return cells.map(({ col, row }) => cellToWorld(grid, col, row));
}

function isPaddedSegmentClear(grid: NavGrid, from: Vec2, to: Vec2): boolean {
  if (moverOverlapsBlockShapes(from, grid.shapes, grid.pad)) return false;
  if (resolveMoveAgainstBlocks(from, to, grid.shapes, grid.pad) !== to) return false;

  const dist = Math.hypot(to.x - from.x, to.y - from.y);
  if (dist < 1e-6) return !moverOverlapsBlockShapes(to, grid.shapes, grid.pad);

  const steps = Math.max(2, Math.ceil(dist / 8));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const p: Vec2 = {
      x: from.x + (to.x - from.x) * t,
      y: from.y + (to.y - from.y) * t,
    };
    if (moverOverlapsBlockShapes(p, grid.shapes, grid.pad)) return false;
  }
  return true;
}

function isSegmentOnWalkableCells(grid: NavGrid, from: Vec2, to: Vec2): boolean {
  const dist = Math.hypot(to.x - from.x, to.y - from.y);
  if (dist < 1e-6) {
    const { col, row } = worldToCell(grid, from);
    return isCellWalkable(grid, col, row);
  }
  const steps = Math.max(2, Math.ceil(dist / (grid.cellSize / 2)));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const p: Vec2 = {
      x: from.x + (to.x - from.x) * t,
      y: from.y + (to.y - from.y) * t,
    };
    const { col, row } = worldToCell(grid, p);
    if (!isCellWalkable(grid, col, row)) return false;
  }
  return true;
}

function isSegmentWalkableOnGrid(grid: NavGrid, from: Vec2, to: Vec2): boolean {
  return isPaddedSegmentClear(grid, from, to) && isSegmentOnWalkableCells(grid, from, to);
}

/**
 * Grid A* from `from` to `to`. Returns world-space waypoints (may be `[to]` on a
 * clear straight line). Returns null when no route exists.
 */
export function findPathOnGrid(grid: NavGrid, from: Vec2, to: Vec2): Vec2[] | null {
  if (
    isSegmentWalkableOnGrid(grid, from, to)
    && resolveMoveAgainstBlocks(from, to, grid.shapes, grid.pad) === to
  ) {
    return [to];
  }

  const startCell = nearestWalkableCell(grid, from);
  const endCell = nearestWalkableCell(grid, to);
  if (!startCell || !endCell) return null;

  const { cols, rows } = grid;
  const startIdx = startCell.row * cols + startCell.col;
  const endIdx = endCell.row * cols + endCell.col;
  if (startIdx === endIdx) return [to];

  const total = cols * rows;
  const cameFrom = new Int32Array(total);
  cameFrom.fill(-1);
  const gScore = new Float64Array(total);
  gScore.fill(Number.POSITIVE_INFINITY);
  gScore[startIdx] = 0;

  const open = new Set<number>([startIdx]);
  const closed = new Set<number>();

  const neighbors: Array<[number, number, number]> = [
    [-1, 0, 1],
    [1, 0, 1],
    [0, -1, 1],
    [0, 1, 1],
    [-1, -1, SQRT2],
    [-1, 1, SQRT2],
    [1, -1, SQRT2],
    [1, 1, SQRT2],
  ];

  while (open.size > 0) {
    let current = -1;
    let bestF = Number.POSITIVE_INFINITY;
    for (const idx of open) {
      const row = Math.floor(idx / cols);
      const col = idx % cols;
      const f = gScore[idx] + octileHeuristic(col, row, endCell.col, endCell.row);
      if (f < bestF) {
        bestF = f;
        current = idx;
      }
    }

    if (current === endIdx) {
      const path = reconstructPath(grid, endIdx, cameFrom, cols);
      const endWorld = cellToWorld(grid, endCell.col, endCell.row);
      const finalGoal = isPaddedSegmentClear(grid, endWorld, to) ? to : endWorld;
      const trimmed = trimPathWaypoints(from, finalGoal, path);
      if (!isPathPaddedClear(grid, trimmed)) return null;
      return trimmed;
    }

    open.delete(current);
    closed.add(current);

    const curRow = Math.floor(current / cols);
    const curCol = current % cols;

    for (const [dc, dr, cost] of neighbors) {
      const ncol = curCol + dc;
      const nrow = curRow + dr;
      if (!isCellWalkable(grid, ncol, nrow)) continue;

      // Diagonal moves must not cut corners through blocked cardinals.
      if (dc !== 0 && dr !== 0) {
        if (
          !isCellWalkable(grid, curCol + dc, curRow)
          || !isCellWalkable(grid, curCol, curRow + dr)
        ) {
          continue;
        }
      }

      const fromPos = cellToWorld(grid, curCol, curRow);
      const toPos = cellToWorld(grid, ncol, nrow);
      if (!isPaddedSegmentClear(grid, fromPos, toPos)) continue;

      const neighborIdx = nrow * cols + ncol;
      if (closed.has(neighborIdx)) continue;

      const tentative = gScore[current] + cost;
      if (tentative >= gScore[neighborIdx]) continue;

      cameFrom[neighborIdx] = current;
      gScore[neighborIdx] = tentative;
      open.add(neighborIdx);
    }
  }

  return null;
}

function trimPathWaypoints(from: Vec2, goal: Vec2, path: Vec2[]): Vec2[] {
  if (path.length === 0) return [goal];

  const out: Vec2[] = [];
  for (const wp of path) {
    if (out.length === 0 && distanceSq(from, wp) <= PATH_ARRIVAL_THRESHOLD * PATH_ARRIVAL_THRESHOLD) {
      continue;
    }
    out.push(wp);
  }

  if (out.length === 0) {
    return distanceSq(from, goal) <= PATH_ARRIVAL_THRESHOLD * PATH_ARRIVAL_THRESHOLD
      ? [goal]
      : [goal];
  }

  const last = out[out.length - 1];
  if (distanceSq(last, goal) > 4) {
    out.push(goal);
  } else {
    out[out.length - 1] = goal;
  }
  return out;
}

function isPathPaddedClear(grid: NavGrid, path: Vec2[]): boolean {
  if (path.length === 0) return false;
  for (let i = 1; i < path.length; i++) {
    if (!isPaddedSegmentClear(grid, path[i - 1], path[i])) return false;
  }
  return true;
}

export function findPathForMover(
  nodeId: string,
  mover: FeatureTarget,
  pad: Vec2,
  from: Vec2,
  to: Vec2,
  suppressedFeatureIds: ReadonlySet<string> = new Set(),
  avoidHazards = false,
): Vec2[] | null {
  const grid = buildNavGrid(nodeId, mover, pad, suppressedFeatureIds, avoidHazards);
  return findPathOnGrid(grid, from, to);
}

export function goalsNearEnough(a: Vec2, b: Vec2): boolean {
  return distanceSq(a, b) <= PATH_GOAL_EPSILON_SQ;
}

/**
 * When a mover's padded hitbox overlaps block shapes (wedged in a tree trunk),
 * snap to the nearest walkable nav cell. Returns null if already clear or no
 * escape cell exists nearby.
 */
export function depenetrateToWalkable(
  nodeId: string,
  mover: FeatureTarget,
  pad: Vec2,
  pos: Vec2,
  suppressedFeatureIds: ReadonlySet<string> = new Set(),
): Vec2 | null {
  const grid = buildNavGrid(nodeId, mover, pad, suppressedFeatureIds);
  if (!moverOverlapsBlockShapes(pos, grid.shapes, pad)) return null;

  const cell = nearestWalkableCell(grid, pos, 24);
  if (!cell) return null;

  const candidate = cellToWorld(grid, cell.col, cell.row);
  if (moverOverlapsBlockShapes(candidate, grid.shapes, pad)) return null;
  return candidate;
}
