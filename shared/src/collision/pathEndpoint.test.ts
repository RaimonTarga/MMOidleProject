import { findPathOnGrid } from './pathfind';
import type { NavGrid } from './navGrid';
import { moverOverlapsBlockShapes, resolveMoveAgainstBlocks } from '../systems/spatial';

function assert(value: boolean, message: string): void {
  if (!value) throw new Error(message);
}

// A small obstacle fits inside a cell whose center is clear. The same-cell
// shortcut must obey the same endpoint/segment checks as a full A* result.
const grid: NavGrid = {
  cellSize: 32, cols: 3, rows: 3, width: 96, height: 96,
  blocked: new Uint8Array(9), pad: { x: 0, y: 0 },
  shapes: [{ kind: 'rect', x: 62, y: 48, halfW: 2, halfH: 4 }],
};
const from = { x: 48, y: 48 };
const route = findPathOnGrid(grid, from, { x: 62, y: 48 });
assert(route !== null && route.length > 0, 'blocked same-cell click has a safe substitute');
if (route) {
  const end = route[route.length - 1];
  assert(!moverOverlapsBlockShapes(end, grid.shapes, grid.pad), 'substitute endpoint is clear');
  assert(resolveMoveAgainstBlocks(from, end, grid.shapes, grid.pad) === end, 'substitute approach is clear');
  assert(end.x !== 62, 'never returns the blocked raw click');
}

const clearGoal = { x: 54, y: 48 };
const clearRoute = findPathOnGrid(grid, from, clearGoal);
assert(clearRoute?.[0] === clearGoal, 'clear same-cell click keeps its exact endpoint');
console.log('pathEndpoint: ok');
