import { GAME_CONFIG } from "../config/gameConfig";
import type { HitboxRect } from "../hitbox/types";
import { NODE_BIOMES } from "./nodeBiomes";
import {
  RESOLVED_NODE_FEATURES,
  type NodeFeatureShape,
  type ResolvedNodeFeature,
} from "./nodeFeatures";
import type { TreeInstance } from "./trees";

/** Jungle trees are individual large images generated at this native size. */
export const JUNGLE_TREE_CELL_PX = 1254;
/** The jungle canopy is slightly larger than the forest canopy on screen. */
export const JUNGLE_TREE_DISPLAY_BASE = 520;
export const JUNGLE_TREE_VARIANT_COUNT = 4;
export const JUNGLE_TREES_PER_NODE = 4;
export const JUNGLE_DUNGEON_TREES_PER_NODE = 3;
/** Empty-space ring between a brush's authored radius and a tree trunk. */
export const JUNGLE_BRUSH_TREE_CLEARANCE = 490;

/**
 * Smooth trunk footprints for kapok, strangler fig, palm cluster, and liana tree.
 * Coordinates are center-relative to their 1254px source images. As with the
 * forest trees, roots remain walk-on ground while the solid trunk blocks.
 */
export const JUNGLE_TREE_TRUNK_RECTS: readonly HitboxRect[] = [
  { offsetX: 0, offsetY: 430, halfW: 150, halfH: 150 },
  { offsetX: 0, offsetY: 393, halfW: 220, halfH: 150 },
  { offsetX: 0, offsetY: 453, halfW: 135, halfH: 110 },
  { offsetX: 0, offsetY: 423, halfW: 155, halfH: 140 },
];

/** Crop seam at the north edge of each jungle trunk footprint. */
export const JUNGLE_TREE_TRUNK_TOP_PX: readonly number[] =
  JUNGLE_TREE_TRUNK_RECTS.map((trunk) =>
    Math.round(JUNGLE_TREE_CELL_PX / 2 + trunk.offsetY - trunk.halfH),
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

function isJungleBrush(feature: ResolvedNodeFeature): boolean {
  return (
    feature.id.startsWith("jungle_bush_") ||
    feature.id.startsWith("boss_bush_")
  );
}

const EDGE_MARGIN_X = 360;
const EDGE_MARGIN_TOP = 520;
const EDGE_MARGIN_BOTTOM = 340;
const MIN_TREE_SEPARATION = 620;
const DUNGEON_CENTER_CLEARANCE = 900;

function overlapsBrushClearance(
  x: number,
  y: number,
  brushes: readonly ResolvedNodeFeature[],
): boolean {
  return brushes.some((brush) => {
    const radius = Math.min(brush.displayW, brush.displayH) / 2;
    const clearance = radius + JUNGLE_BRUSH_TREE_CLEARANCE;
    const dx = x - brush.x;
    const dy = y - brush.y;
    return dx * dx + dy * dy < clearance * clearance;
  });
}

/**
 * Sparse jungle trees occupy open ground only. Candidate trunks are rejected
 * when their canopy clearance could overlap a brush section, so tree and thicket
 * art never need to compete in the same depth stack.
 */
export function generateJungleNodeTrees(nodeId: string): TreeInstance[] {
  const biome = NODE_BIOMES[nodeId];
  const brushes = (RESOLVED_NODE_FEATURES[nodeId] ?? []).filter(isJungleBrush);
  const rng = mulberry32(hashString(`${nodeId}:jungle-trees`));
  const trees: TreeInstance[] = [];
  const target = biome?.isDungeon
    ? JUNGLE_DUNGEON_TREES_PER_NODE
    : JUNGLE_TREES_PER_NODE;
  const maxAttempts = target * 256;

  for (let attempt = 0; attempt < maxAttempts && trees.length < target; attempt++) {
    const variant =
      Math.floor(rng() * JUNGLE_TREE_VARIANT_COUNT) %
      JUNGLE_TREE_VARIANT_COUNT;
    const trunk = JUNGLE_TREE_TRUNK_RECTS[variant];
    const displaySize = JUNGLE_TREE_DISPLAY_BASE * (0.92 + rng() * 0.16);
    const scale = displaySize / JUNGLE_TREE_CELL_PX;
    const trunkX =
      EDGE_MARGIN_X + rng() * (GAME_CONFIG.NODE_WIDTH - EDGE_MARGIN_X * 2);
    const trunkY =
      EDGE_MARGIN_TOP +
      rng() * (GAME_CONFIG.NODE_HEIGHT - EDGE_MARGIN_TOP - EDGE_MARGIN_BOTTOM);

    if (overlapsBrushClearance(trunkX, trunkY, brushes)) continue;
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
      artSet: "jungle",
      variant,
      cellPx: JUNGLE_TREE_CELL_PX,
      trunkTopPx:
        JUNGLE_TREE_TRUNK_TOP_PX[variant] ?? JUNGLE_TREE_CELL_PX,
      spriteX,
      spriteY,
      displaySize,
      shapes,
      baseY: trunkY + trunk.halfH * scale,
    });
  }

  return trees;
}
