import { GAME_CONFIG } from "../config/gameConfig";
import type { HitboxRect } from "../hitbox/types";
import { NODE_BIOMES } from "./nodeBiomes";
import {
  RESOLVED_NODE_FEATURES,
  type NodeFeatureShape,
  type ResolvedNodeFeature,
} from "./nodeFeatures";
import type { TreeInstance } from "./trees";

/** Swamp trees are individual large images generated at this native size. */
export const SWAMP_TREE_CELL_PX = 1254;
export const SWAMP_TREE_DISPLAY_BASE = 500;
export const SWAMP_TREE_VARIANT_COUNT = 4;
export const SWAMP_TREES_PER_NODE = 3;
export const SWAMP_DUNGEON_TREES_PER_NODE = 2;
/**
 * Empty-space ring beyond a rot pool's radius. This covers the whole rendered
 * tree, not only its blocking trunk, so no branch or root is drawn over water.
 */
export const SWAMP_POOL_TREE_CLEARANCE = 490;

/**
 * Smooth blocking footprints for cypress, mangrove, split oak, and leaning snag.
 * Coordinates are center-relative to their 1254px source images; exposed roots
 * remain walk-on ground while the solid lower trunk blocks movement.
 */
export const SWAMP_TREE_TRUNK_RECTS: readonly HitboxRect[] = [
  { offsetX: 0, offsetY: 390, halfW: 160, halfH: 150 },
  { offsetX: 0, offsetY: 390, halfW: 150, halfH: 140 },
  { offsetX: 0, offsetY: 395, halfW: 180, halfH: 145 },
  { offsetX: -10, offsetY: 405, halfW: 140, halfH: 135 },
];

/** Crop seam at the north edge of each swamp trunk footprint. */
export const SWAMP_TREE_TRUNK_TOP_PX: readonly number[] =
  SWAMP_TREE_TRUNK_RECTS.map((trunk) =>
    Math.round(SWAMP_TREE_CELL_PX / 2 + trunk.offsetY - trunk.halfH),
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

/** Includes ordinary rot pools and the dungeon/boss variants. */
export function isSwampRotPool(feature: ResolvedNodeFeature): boolean {
  return feature.damage?.effectId === "swamp-rot";
}

const EDGE_MARGIN_X = 360;
const EDGE_MARGIN_TOP = 520;
const EDGE_MARGIN_BOTTOM = 340;
const MIN_TREE_SEPARATION = 600;
const DUNGEON_CENTER_CLEARANCE = 900;

function overlapsPoolClearance(
  x: number,
  y: number,
  pools: readonly ResolvedNodeFeature[],
): boolean {
  return pools.some((pool) => {
    const radius = Math.min(pool.displayW, pool.displayH) / 2;
    const clearance = radius + SWAMP_POOL_TREE_CLEARANCE;
    const dx = x - pool.x;
    const dy = y - pool.y;
    return dx * dx + dy * dy < clearance * clearance;
  });
}

/**
 * Sparse dead trees occupy dry islands only. Candidate trunks are rejected when
 * any part of the rendered tree could overlap a swamp rot pool.
 */
export function generateSwampNodeTrees(nodeId: string): TreeInstance[] {
  const biome = NODE_BIOMES[nodeId];
  const pools = (RESOLVED_NODE_FEATURES[nodeId] ?? []).filter(isSwampRotPool);
  const rng = mulberry32(hashString(`${nodeId}:swamp-trees`));
  const trees: TreeInstance[] = [];
  const target = biome?.isDungeon
    ? SWAMP_DUNGEON_TREES_PER_NODE
    : SWAMP_TREES_PER_NODE;
  const maxAttempts = target * 256;

  for (let attempt = 0; attempt < maxAttempts && trees.length < target; attempt++) {
    const variant =
      Math.floor(rng() * SWAMP_TREE_VARIANT_COUNT) % SWAMP_TREE_VARIANT_COUNT;
    const trunk = SWAMP_TREE_TRUNK_RECTS[variant];
    const displaySize = SWAMP_TREE_DISPLAY_BASE * (0.92 + rng() * 0.16);
    const scale = displaySize / SWAMP_TREE_CELL_PX;
    const trunkX =
      EDGE_MARGIN_X + rng() * (GAME_CONFIG.NODE_WIDTH - EDGE_MARGIN_X * 2);
    const trunkY =
      EDGE_MARGIN_TOP +
      rng() * (GAME_CONFIG.NODE_HEIGHT - EDGE_MARGIN_TOP - EDGE_MARGIN_BOTTOM);

    if (overlapsPoolClearance(trunkX, trunkY, pools)) continue;
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
      artSet: "swamp",
      variant,
      cellPx: SWAMP_TREE_CELL_PX,
      trunkTopPx:
        SWAMP_TREE_TRUNK_TOP_PX[variant] ?? SWAMP_TREE_CELL_PX,
      spriteX,
      spriteY,
      displaySize,
      shapes,
      baseY: trunkY + trunk.halfH * scale,
    });
  }

  return trees;
}
