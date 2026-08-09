import {
  buildNodeGateEntities,
  gateCollisionShapeFromBounds,
  gateEntityToCollisionRegion,
} from './gates';
import { inAttackRange, resolveMoveAgainstBlocks, type PosHitbox } from '../systems/spatial';

import {
  buildStaticCollisionRegions,
  exitNodeIdForGate,
  gateDirectionAtPoint,
  identityProjection,
  minimapProjection,
  projectPoint,
  reachGap,
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
import { GAME_CONFIG } from '../config/gameConfig';
import { NODE_BIOMES, WORLD_NODE_LIST, worldNodeExits } from '../world/nodeBiomes';
import {
  MOUNTAIN_LEDGE_THICKNESS,
  RESOLVED_NODE_FEATURES,
} from '../world/nodeFeatures';
import {
  JUNGLE_BRUSH_TREE_CLEARANCE,
  JUNGLE_DUNGEON_TREES_PER_NODE,
  JUNGLE_TREES_PER_NODE,
} from '../world/jungleTrees';
import {
  isSwampRotPool,
  SWAMP_DUNGEON_TREES_PER_NODE,
  SWAMP_POOL_TREE_CLEARANCE,
  SWAMP_TREES_PER_NODE,
} from '../world/swampTrees';
import {
  PLAINS_DUNGEON_TREES_PER_NODE,
  PLAINS_TREES_PER_NODE,
} from '../world/plainsTrees';
import { getNodeTrees } from '../world/trees';
import {
  DEAD_DUNGEON_TREES_PER_NODE,
  DEAD_TREES_PER_NODE,
} from '../world/deadTrees';
import {
  distancePointToSegment,
  getNodeTallProps,
  TALL_PROP_DUNGEON_COUNT,
  TALL_PROPS_PER_NODE,
  TALL_PROP_ROUTE_CLEARANCE,
} from '../world/tallProps';

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

const clearing = buildStaticCollisionRegions('node-clearing');
assert(clearing.some(r => r.kind === 'gate'), 'clearing has gate regions');
assert(clearing.length >= 4, 'clearing has four edge bands');

const northExit = exitNodeIdForGate('node-clearing', 'north');
assert(
  northExit === worldNodeExits('node-clearing').north,
  'north exit from collision layer',
);

const westGate = gateDirectionAtPoint('node-clearing', { x: 10, y: 1200 });
assert(westGate === 'west', 'west gate band detection');

const gateEntities = buildNodeGateEntities('node-clearing');
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
  'node-t1-forest-01',
  'monster',
  { x: 28, y: 28 },
  { x: 400, y: 400 },
  { x: 2800, y: 2000 },
);
assert(forestPath !== null && forestPath.length >= 1, 'forest node path between open points');

function walkableComponentCount(grid: NavGrid): number {
  const seen = new Uint8Array(grid.blocked.length);
  let components = 0;
  const neighbors = [[-1, 0], [1, 0], [0, -1], [0, 1]] as const;

  for (let start = 0; start < grid.blocked.length; start++) {
    if (grid.blocked[start] || seen[start]) continue;
    components++;
    const queue = [start];
    seen[start] = 1;
    for (let head = 0; head < queue.length; head++) {
      const current = queue[head];
      const row = Math.floor(current / grid.cols);
      const col = current % grid.cols;
      for (const [dc, dr] of neighbors) {
        const nextCol = col + dc;
        const nextRow = row + dr;
        if (
          nextCol < 0 || nextCol >= grid.cols ||
          nextRow < 0 || nextRow >= grid.rows
        ) continue;
        const next = nextRow * grid.cols + nextCol;
        if (grid.blocked[next] || seen[next]) continue;
        seen[next] = 1;
        queue.push(next);
      }
    }
  }
  return components;
}

for (const { id: nodeId } of WORLD_NODE_LIST.filter(node => node.biomeGroup === 'jungle')) {
  const trees = getNodeTrees(nodeId);
  const brushes = (RESOLVED_NODE_FEATURES[nodeId] ?? []).filter(
    feature => feature.id.startsWith('jungle_bush_') || feature.id.startsWith('boss_bush_'),
  );
  const maxTrees = NODE_BIOMES[nodeId]?.isDungeon
    ? JUNGLE_DUNGEON_TREES_PER_NODE
    : JUNGLE_TREES_PER_NODE;
  assert(
    trees.length >= 1 && trees.length <= maxTrees,
    `${nodeId} has a sparse open-ground jungle tree scatter`,
  );
  assert(trees.every(tree => tree.artSet === 'jungle'), `${nodeId} uses jungle tree art`);

  if (NODE_BIOMES[nodeId]?.isDungeon) {
    for (const tree of trees) {
      const trunk = tree.shapes[0];
      const halfW = 'halfW' in trunk ? trunk.halfW : trunk.radius;
      const halfH = 'halfH' in trunk ? trunk.halfH : trunk.radius;
      const centerDistance = Math.hypot(
        trunk.x - GAME_CONFIG.NODE_WIDTH / 2,
        trunk.y - GAME_CONFIG.NODE_HEIGHT / 2,
      );
      assert(
        centerDistance - Math.max(halfW, halfH) >= 760,
        `${tree.id} keeps the dungeon altar clearing open`,
      );
    }
  }

  for (const brush of brushes) {
    const radius = Math.min(brush.displayW, brush.displayH) / 2;
    for (const tree of trees) {
      const trunk = tree.shapes[0];
      const dx = trunk.x - brush.x;
      const dy = trunk.y - brush.y;
      const clearance = radius + JUNGLE_BRUSH_TREE_CLEARANCE;
      assert(
        dx * dx + dy * dy >= clearance * clearance,
        `${tree.id} keeps its canopy clear of ${brush.id}`,
      );
    }
  }

  const treeBlockRegions = buildStaticCollisionRegions(nodeId).filter(
    region => region.kind === 'block' && trees.some(tree => tree.id === region.ownerId),
  );
  assert(
    treeBlockRegions.length === trees.length * 2,
    `${nodeId} gives every jungle trunk player and monster collision`,
  );

  const jungleGrid = buildNavGrid(nodeId, 'player', { x: 32, y: 32 });
  assert(
    walkableComponentCount(jungleGrid) === 1,
    `${nodeId} remains one connected walkable region with jungle trees`,
  );
}

for (const { id: nodeId } of WORLD_NODE_LIST.filter(node => node.biomeGroup === 'swamp')) {
  const trees = getNodeTrees(nodeId);
  const pools = (RESOLVED_NODE_FEATURES[nodeId] ?? []).filter(isSwampRotPool);
  const maxTrees = NODE_BIOMES[nodeId]?.isDungeon
    ? SWAMP_DUNGEON_TREES_PER_NODE
    : SWAMP_TREES_PER_NODE;
  const minTrees = NODE_BIOMES[nodeId]?.isDungeon ? 0 : 1;
  assert(
    trees.length >= minTrees && trees.length <= maxTrees,
    `${nodeId} has a sparse dry-ground swamp tree scatter`,
  );
  assert(trees.every(tree => tree.artSet === 'swamp'), `${nodeId} uses swamp tree art`);

  for (const pool of pools) {
    const radius = Math.min(pool.displayW, pool.displayH) / 2;
    for (const tree of trees) {
      const trunk = tree.shapes[0];
      const dx = trunk.x - pool.x;
      const dy = trunk.y - pool.y;
      const clearance = radius + SWAMP_POOL_TREE_CLEARANCE;
      assert(
        dx * dx + dy * dy >= clearance * clearance,
        `${tree.id} keeps its entire sprite clear of ${pool.id}`,
      );
    }
  }

  const treeBlockRegions = buildStaticCollisionRegions(nodeId).filter(
    region => region.kind === 'block' && trees.some(tree => tree.id === region.ownerId),
  );
  assert(
    treeBlockRegions.length === trees.length * 2,
    `${nodeId} gives every swamp trunk player and monster collision`,
  );

  const swampGrid = buildNavGrid(nodeId, 'player', { x: 32, y: 32 });
  assert(
    walkableComponentCount(swampGrid) === 1,
    `${nodeId} remains one connected walkable region with swamp trees`,
  );
}

for (const { id: nodeId } of WORLD_NODE_LIST.filter(node => node.biomeGroup === 'plains')) {
  const trees = getNodeTrees(nodeId);
  const maxTrees = NODE_BIOMES[nodeId]?.isDungeon
    ? PLAINS_DUNGEON_TREES_PER_NODE
    : PLAINS_TREES_PER_NODE;
  assert(
    trees.length >= 1 && trees.length <= maxTrees,
    `${nodeId} has a very sparse plains tree scatter`,
  );
  assert(trees.every(tree => tree.artSet === 'plains'), `${nodeId} uses plains tree art`);

  if (NODE_BIOMES[nodeId]?.isDungeon) {
    for (const tree of trees) {
      const trunk = tree.shapes[0];
      const halfW = 'halfW' in trunk ? trunk.halfW : trunk.radius;
      const halfH = 'halfH' in trunk ? trunk.halfH : trunk.radius;
      const centerDistance = Math.hypot(
        trunk.x - GAME_CONFIG.NODE_WIDTH / 2,
        trunk.y - GAME_CONFIG.NODE_HEIGHT / 2,
      );
      assert(
        centerDistance - Math.max(halfW, halfH) >= 760,
        `${tree.id} keeps the plains dungeon combat clearing open`,
      );
    }
  }

  const treeBlockRegions = buildStaticCollisionRegions(nodeId).filter(
    region => region.kind === 'block' && trees.some(tree => tree.id === region.ownerId),
  );
  assert(
    treeBlockRegions.length === trees.length * 2,
    `${nodeId} gives every plains trunk player and monster collision`,
  );

  const plainsGrid = buildNavGrid(nodeId, 'player', { x: 32, y: 32 });
  assert(
    walkableComponentCount(plainsGrid) === 1,
    `${nodeId} remains one connected walkable region with plains trees`,
  );
}

const rockArtByBiome = {
  cave: 'cave-rock',
  desert: 'desert-rock',
  volcanic: 'volcanic-rock',
  trench: 'trench-rock',
} as const;

for (const [biomeGroup, artSet] of Object.entries(rockArtByBiome)) {
  for (const { id: nodeId } of WORLD_NODE_LIST.filter(
    node => node.biomeGroup === biomeGroup,
  )) {
    const props = getNodeTallProps(nodeId);
    const expected = NODE_BIOMES[nodeId]?.isDungeon
      ? TALL_PROP_DUNGEON_COUNT
      : TALL_PROPS_PER_NODE;
    assert(props.length === expected, `${nodeId} has its sparse tall rock count`);
    assert(props.every(prop => prop.artSet === artSet), `${nodeId} uses matching rock art`);

    const center = { x: GAME_CONFIG.NODE_WIDTH / 2, y: GAME_CONFIG.NODE_HEIGHT / 2 };
    for (const prop of props) {
      const shape = prop.shapes[0];
      assert(
        shape.kind === 'ellipse' && shape.halfW <= 36 && shape.halfH <= 25,
        `${prop.id} has a compact base hitbox`,
      );
      for (const direction of Object.keys(worldNodeExits(nodeId))) {
        const gate = direction === 'north'
          ? { x: center.x, y: 0 }
          : direction === 'south'
            ? { x: center.x, y: GAME_CONFIG.NODE_HEIGHT }
            : direction === 'west'
              ? { x: 0, y: center.y }
              : { x: GAME_CONFIG.NODE_WIDTH, y: center.y };
        assert(
          distancePointToSegment(shape.x, shape.y, center.x, center.y, gate.x, gate.y) >=
            TALL_PROP_ROUTE_CLEARANCE,
          `${prop.id} stays outside the ${direction} travel lane`,
        );
      }
    }

    const propRegions = buildStaticCollisionRegions(nodeId).filter(
      region => region.kind === 'block' && props.some(prop => prop.id === region.ownerId),
    );
    assert(propRegions.length === props.length * 2, `${nodeId} rock bases block both movers`);
    assert(
      walkableComponentCount(buildNavGrid(nodeId, 'player', { x: 32, y: 32 })) === 1,
      `${nodeId} remains connected with rock formations`,
    );
  }
}

for (const [biomeGroup, artSet] of [
  ['tundra', 'tundra'],
  ['graveyard', 'wasteland'],
] as const) {
  for (const { id: nodeId } of WORLD_NODE_LIST.filter(
    node => node.biomeGroup === biomeGroup,
  )) {
    const trees = getNodeTrees(nodeId);
    const expected = NODE_BIOMES[nodeId]?.isDungeon
      ? DEAD_DUNGEON_TREES_PER_NODE
      : DEAD_TREES_PER_NODE;
    assert(trees.length === expected, `${nodeId} has its sparse dead-tree count`);
    assert(trees.every(tree => tree.artSet === artSet), `${nodeId} uses ${artSet} tree art`);
    const regions = buildStaticCollisionRegions(nodeId).filter(
      region => region.kind === 'block' && trees.some(tree => tree.id === region.ownerId),
    );
    assert(regions.length === trees.length * 2, `${nodeId} dead trunks block both movers`);
    assert(
      walkableComponentCount(buildNavGrid(nodeId, 'player', { x: 32, y: 32 })) === 1,
      `${nodeId} remains connected with dead trees`,
    );
  }
}

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

// From the east corridor (between the inner and outer ledge rings) to the top
// corridor — forces routing around the inner ring's NE corner. Points keep
// clearance from the tightened ledge walls plus the 32px mover pad.
const mountainCornerGrid = buildNavGrid('node-t1-mountain-01', 'player', { x: 32, y: 32 });
const mountainCornerFrom = { x: 2520, y: 1600 };
const mountainCornerGoal = { x: 1040, y: 440 };
const mountainCornerPath = findPathOnGrid(
  mountainCornerGrid,
  mountainCornerFrom,
  mountainCornerGoal,
);
assert(mountainCornerPath !== null, 'mountain corner path routes around ledge');
if (mountainCornerPath) {
  const first = mountainCornerPath[0];
  const resolvedFirst = resolveMoveAgainstBlocks(
    mountainCornerFrom,
    first,
    mountainCornerGrid.shapes,
    mountainCornerGrid.pad,
  );
  assert(
    Math.abs(resolvedFirst.x - first.x) < 1e-6 && Math.abs(resolvedFirst.y - first.y) < 1e-6,
    'mountain corner path keeps the first reachable dogleg',
  );
}

for (const { id: nodeId } of WORLD_NODE_LIST.filter(node => node.biomeGroup === 'mountain')) {
  for (const ledge of (RESOLVED_NODE_FEATURES[nodeId] ?? []).filter(
    feature => feature.id.startsWith('mountain_'),
  )) {
    assert(ledge.shape.kind === 'rect', `${ledge.id} is an authored ledge rect`);
    if (ledge.shape.kind === 'rect') {
      assert(
        Math.min(ledge.shape.halfW, ledge.shape.halfH) * 2 === MOUNTAIN_LEDGE_THICKNESS,
        `${ledge.id} uses the tightened mountain ledge hitbox`,
      );
    }
  }
}

console.log('collision tests ok');
