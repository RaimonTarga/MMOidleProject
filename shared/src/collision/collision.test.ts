import {
  buildNodeGateEntities,
  gateCollisionShapeFromBounds,
  gateEntityToCollisionRegion,
} from './gates';
import { inAttackRange, type PosHitbox } from '../systems/spatial';

import {
  buildStaticCollisionRegions,
  exitNodeIdForGate,
  gateDirectionAtPoint,
  identityProjection,
  minimapProjection,
  projectPoint,
  reachGap,
  regionsContainingPoint,
  withinReach,
  buildNavGrid,
  clearNavGridCache,
  findPathForMover,
  findPathOnGrid,
  NAV_CELL_SIZE,
  slideMoveAgainstBlocks,
  type NavGrid,
  cellToWorld,
} from './index';
import { moverOverlapsBlockShapes } from '../systems/spatial';

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(msg);
}

const playerBody: PosHitbox = {
  pos: { x: 0, y: 0 },
  rects: [{ offsetX: 0, offsetY: 0, halfW: 32, halfH: 32 }],
};
const monsterBody: PosHitbox = {
  pos: { x: 100, y: 0 },
  rects: [{ offsetX: 0, offsetY: 0, halfW: 28, halfH: 28 }],
};
const range = 40;

assert(
  withinReach(playerBody, monsterBody, range) === inAttackRange(playerBody, monsterBody, range),
  'withinReach matches inAttackRange',
);
assert(reachGap(playerBody, monsterBody) === 40, 'reachGap separation');

const clearing = buildStaticCollisionRegions('node-5-5');
assert(clearing.some(r => r.kind === 'gate'), 'clearing has gate regions');
assert(clearing.length >= 4, 'clearing has four edge bands');

const northExit = exitNodeIdForGate('node-5-5', 'north');
assert(northExit === 'node-4-5', 'north exit from collision layer');

const westGate = gateDirectionAtPoint('node-5-5', { x: 10, y: 1200 });
assert(westGate === 'west', 'west gate band detection');

const gateEntities = buildNodeGateEntities('node-5-5');
const northEntity = gateEntities.find(g => g.direction === 'north');
assert(northEntity != null, 'north gate entity exists');
if (!northEntity) throw new Error('unreachable');
const northRegion = gateEntityToCollisionRegion(northEntity);
assert(
  northRegion.shape.kind === 'rect'
    && northRegion.shape.x === northEntity.bounds.x + northEntity.bounds.width / 2,
  'collision shape derived from gate entity bounds',
);
const northShape = gateCollisionShapeFromBounds(northEntity.bounds);
assert(
  northShape.kind === 'rect' && northShape.halfW === northEntity.bounds.width / 2,
  'gate bounds map to collision half extents',
);

const throne = buildStaticCollisionRegions('node-9-0');
const blockers = throne.filter(r => r.kind === 'block');
assert(blockers.length === 1, 'void throne block region');

const insideThrone = regionsContainingPoint(throne, { x: 1600, y: 1200 });
assert(insideThrone.some(r => r.id.includes('abyssal_throne')), 'throne point containment');

const identity = identityProjection();
const projected = projectPoint({ x: 100, y: 200 }, identity);
assert(projected.x === 100 && projected.y === 200, 'identity projection');

const mini = minimapProjection(0, 0, 220, 165, 3200, 2400);
const miniPoint = projectPoint({ x: 1600, y: 1200 }, mini);
assert(
  Math.abs(miniPoint.x - 110) < 0.01 && Math.abs(miniPoint.y - 82.5) < 0.01,
  'minimap projection center',
);

// ── Pathfinding ───────────────────────────────────────────────────────────────

clearNavGridCache();

function syntheticBlockedGrid(): NavGrid {
  const cellSize = NAV_CELL_SIZE;
  const cols = 20;
  const rows = 15;
  const blocked = new Uint8Array(cols * rows);
  const wallCol = 10;
  const wallX = wallCol * cellSize + cellSize / 2;
  for (let row = 0; row < rows; row++) {
    if (row < 4 || row > 10) {
      blocked[row * cols + wallCol] = 1;
    }
  }
  // Two wall slabs with a horizontal gap at rows 4–10 — shapes match blocked cells.
  const wallShapes = [
    {
      kind: 'rect' as const,
      x: wallX,
      y: 2 * cellSize,
      halfW: cellSize / 2,
      halfH: 2 * cellSize,
    },
    {
      kind: 'rect' as const,
      x: wallX,
      y: 12 * cellSize,
      halfW: cellSize / 2,
      halfH: 2 * cellSize,
    },
  ];
  return {
    cellSize,
    cols,
    rows,
    width: cols * cellSize,
    height: rows * cellSize,
    blocked,
    shapes: wallShapes,
    pad: { x: 0, y: 0 },
  };
}

const synthGrid = syntheticBlockedGrid();
const synthPath = findPathOnGrid(synthGrid, { x: 80, y: 240 }, { x: 560, y: 240 });
assert(synthPath !== null, 'synthetic path reaches goal through wall gap');
if (synthPath) {
  const last = synthPath[synthPath.length - 1];
  assert(last.x >= 500, 'synthetic path reaches goal side');
}

const forestPath = findPathForMover(
  'node-4-6',
  'monster',
  { x: 28, y: 28 },
  { x: 400, y: 400 },
  { x: 2800, y: 2000 },
);
assert(forestPath !== null && forestPath.length >= 1, 'forest node path between open points');

const splitGrid: NavGrid = {
  cellSize: NAV_CELL_SIZE,
  cols: 5,
  rows: 5,
  width: 5 * NAV_CELL_SIZE,
  height: 5 * NAV_CELL_SIZE,
  blocked: new Uint8Array(25).fill(1),
  shapes: [],
  pad: { x: 0, y: 0 },
};
splitGrid.blocked[2] = 0; // row 0 col 2
splitGrid.blocked[22] = 0; // row 4 col 2
const splitPath = findPathOnGrid(
  splitGrid,
  { x: 80, y: 16 },
  { x: 80, y: 144 },
);
assert(splitPath === null, 'disconnected walkable cells yield null path');

const slideShapes = [{
  kind: 'rect' as const,
  x: 200,
  y: 200,
  halfW: 40,
  halfH: 40,
}];
const slideFrom = { x: 100, y: 200 };
const slideTo = { x: 300, y: 200 };
const slid = slideMoveAgainstBlocks(slideFrom, slideTo, slideShapes, { x: 0, y: 0 });
assert(slid.x > slideFrom.x, 'slide moves along perpendicular when straight blocked');

clearNavGridCache();

const narrowGrid: NavGrid = {
  cellSize: NAV_CELL_SIZE,
  cols: 20,
  rows: 10,
  width: 20 * NAV_CELL_SIZE,
  height: 10 * NAV_CELL_SIZE,
  blocked: new Uint8Array(200),
  shapes: [
    { kind: 'rect', x: 280, y: 160, halfW: 40, halfH: 120 },
    { kind: 'rect', x: 360, y: 160, halfW: 40, halfH: 120 },
  ],
  pad: { x: 40, y: 40 },
};
for (let row = 0; row < narrowGrid.rows; row++) {
  for (let col = 0; col < narrowGrid.cols; col++) {
    const center = cellToWorld(narrowGrid, col, row);
    if (moverOverlapsBlockShapes(center, narrowGrid.shapes, narrowGrid.pad)) {
      narrowGrid.blocked[row * narrowGrid.cols + col] = 1;
    }
  }
}
const tooNarrow = findPathOnGrid(narrowGrid, { x: 80, y: 160 }, { x: 560, y: 160 });
assert(tooNarrow === null, 'padded path rejects corridor narrower than body');

console.log('collision tests ok');
