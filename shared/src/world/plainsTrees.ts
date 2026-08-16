import { GAME_CONFIG } from "../config/gameConfig";
import type { HitboxRect } from "../hitbox/types";
import { NODE_BIOMES } from "./nodeBiomes";
import type { NodeFeatureShape } from "./nodeFeatures";
import type { TreeInstance } from "./trees";

/** Plains trees are individual large images generated at this native size. */
export const PLAINS_TREE_CELL_PX = 1254;
export const PLAINS_TREE_DISPLAY_BASE = 500;
export const PLAINS_TREE_VARIANT_COUNT = 4;
/**
 * CEILING on field trees per node, not a fixed count — normal nodes draw a seeded
 * count in `[PLAINS_TREES_MIN_PER_NODE, PLAINS_TREES_PER_NODE]`, so one field is
 * open and the next is dotted. The ceiling is raised from the old flat 9 so the
 * AVERAGE stays about where it was while gaining spread.
 *
 * It stays a ceiling in the literal sense the collision tests rely on: placement
 * attempts can still fall short of the target, so `<= PLAINS_TREES_PER_NODE` remains
 * the only safe assertion.
 */
export const PLAINS_TREES_PER_NODE = 12;
export const PLAINS_TREES_MIN_PER_NODE = 6;
/**
 * Dungeons stay a FIXED count deliberately. The arena court is the thing a boss node
 * has to read as, and a varying ring of trees around it muddies that; consistency is
 * worth more than variety here.
 */
export const PLAINS_DUNGEON_TREES_PER_NODE = 7;

/**
 * Smooth lower-trunk footprints for elm, oak, twin aspen, and hawthorn.
 * Coordinates are center-relative to their 1254px source images. Surface roots
 * remain walk-on ground while the solid lower trunk blocks movement.
 */
export const PLAINS_TREE_TRUNK_RECTS: readonly HitboxRect[] = [
  { offsetX: 0, offsetY: 385, halfW: 130, halfH: 145 },
  { offsetX: 0, offsetY: 360, halfW: 175, halfH: 145 },
  { offsetX: 0, offsetY: 405, halfW: 120, halfH: 135 },
  { offsetX: 0, offsetY: 385, halfW: 155, halfH: 145 },
];

/** Crop seam at the north edge of each plains trunk footprint. */
export const PLAINS_TREE_TRUNK_TOP_PX: readonly number[] =
  PLAINS_TREE_TRUNK_RECTS.map((trunk) =>
    Math.round(PLAINS_TREE_CELL_PX / 2 + trunk.offsetY - trunk.halfH),
  );

function hashString(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const EDGE_MARGIN_X = 360;
const EDGE_MARGIN_TOP = 520;
const EDGE_MARGIN_BOTTOM = 340;
const MIN_TREE_SEPARATION = 600;
const DUNGEON_CENTER_CLEARANCE = 900;

/** Sparse, deterministic field trees with an open dungeon combat clearing. */
export function generatePlainsNodeTrees(nodeId: string): TreeInstance[] {
  const biome = NODE_BIOMES[nodeId];
  const rng = mulberry32(hashString(`${nodeId}:plains-trees`));
  const trees: TreeInstance[] = [];
  const target = biome?.isDungeon
    ? PLAINS_DUNGEON_TREES_PER_NODE
    : PLAINS_TREES_MIN_PER_NODE +
      Math.floor(rng() * (PLAINS_TREES_PER_NODE - PLAINS_TREES_MIN_PER_NODE + 1));
  const maxAttempts = target * 128;

  for (let attempt = 0; attempt < maxAttempts && trees.length < target; attempt++) {
    const variant =
      Math.floor(rng() * PLAINS_TREE_VARIANT_COUNT) % PLAINS_TREE_VARIANT_COUNT;
    const trunk = PLAINS_TREE_TRUNK_RECTS[variant];
    const displaySize = PLAINS_TREE_DISPLAY_BASE * (0.92 + rng() * 0.16);
    const scale = displaySize / PLAINS_TREE_CELL_PX;
    const trunkX =
      EDGE_MARGIN_X + rng() * (GAME_CONFIG.NODE_WIDTH - EDGE_MARGIN_X * 2);
    const trunkY =
      EDGE_MARGIN_TOP +
      rng() * (GAME_CONFIG.NODE_HEIGHT - EDGE_MARGIN_TOP - EDGE_MARGIN_BOTTOM);

    if (biome?.isDungeon) {
      const dx = trunkX - GAME_CONFIG.NODE_WIDTH / 2;
      const dy = trunkY - GAME_CONFIG.NODE_HEIGHT / 2;
      if (dx * dx + dy * dy < DUNGEON_CENTER_CLEARANCE ** 2) continue;
    }
    const tooClose = trees.some((tree) => {
      const shape = tree.shapes[0];
      const dx = trunkX - shape.x;
      const dy = trunkY - shape.y;
      return dx * dx + dy * dy < MIN_TREE_SEPARATION ** 2;
    });
    if (tooClose) continue;

    const spriteX = trunkX - trunk.offsetX * scale;
    const spriteY = trunkY - trunk.offsetY * scale;
    const shapes: NodeFeatureShape[] = [
      {
        kind: "ellipse",
        x: trunkX,
        y: trunkY,
        halfW: trunk.halfW * scale,
        halfH: trunk.halfH * scale,
      },
    ];

    trees.push({
      id: `${nodeId}:tree:${trees.length}`,
      artSet: "plains",
      variant,
      cellPx: PLAINS_TREE_CELL_PX,
      trunkTopPx:
        PLAINS_TREE_TRUNK_TOP_PX[variant] ?? PLAINS_TREE_CELL_PX,
      spriteX,
      spriteY,
      displaySize,
      shapes,
      baseY: trunkY + trunk.halfH * scale,
    });
  }

  return trees;
}
