import { GAME_CONFIG } from "../config/gameConfig";
import type { HitboxRect } from "../hitbox/types";
import { jungleTreeTarget } from "./jungleBushes";
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
export const JUNGLE_DUNGEON_TREES_PER_NODE = 7;
/**
 * Radius of a jungle dungeon's hacked clearing, as a fraction of `NODE_WIDTH`.
 *
 * Larger than the 0.115 every other biome's arena court uses, because here the trees RING
 * it: at the standard radius the ring closed in tight enough to read as a wall rather than
 * as a treeline. Lives here rather than in the renderer because both the ground (which
 * paints the clearing) and the tree placement (which rings it) have to agree — the same
 * reason every other layout in this folder is shared.
 */
export const JUNGLE_CLEARING_R = 0.135;
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

/** One tree instance at a trunk position, shared by the scatter and the dungeon ring. */
function makeJungleTree(
  nodeId: string,
  index: number,
  variant: number,
  trunkX: number,
  trunkY: number,
  displaySize: number,
): TreeInstance {
  const trunk = JUNGLE_TREE_TRUNK_RECTS[variant];
  const scale = displaySize / JUNGLE_TREE_CELL_PX;
  return {
    id: `${nodeId}:tree:${index}`,
    artSet: "jungle",
    variant,
    cellPx: JUNGLE_TREE_CELL_PX,
    trunkTopPx: JUNGLE_TREE_TRUNK_TOP_PX[variant] ?? JUNGLE_TREE_CELL_PX,
    spriteX: trunkX - trunk.offsetX * scale,
    spriteY: trunkY - trunk.offsetY * scale,
    displaySize,
    shapes: [
      {
        kind: "ellipse",
        x: trunkX,
        y: trunkY,
        halfW: trunk.halfW * scale,
        halfH: trunk.halfH * scale,
      },
    ],
    baseY: trunkY + trunk.halfH * scale,
  };
}

/**
 * The treeline around a dungeon's hacked clearing.
 *
 * Trunks sit in a narrow annulus just OUTSIDE the cut edge, evenly spaced with enough angle
 * and radius jitter that the ring reads as a treeline rather than as a fence. A tree that
 * cannot clear the node border is dropped rather than pulled inward — an incomplete ring is
 * a gap you can walk out through, which is better than a trunk crushed against the edge.
 */
function ringedDungeonTrees(
  nodeId: string,
  rng: () => number,
  target: number,
): TreeInstance[] {
  const cx = GAME_CONFIG.NODE_WIDTH / 2;
  const cy = GAME_CONFIG.NODE_HEIGHT / 2;
  const clearing = GAME_CONFIG.NODE_WIDTH * JUNGLE_CLEARING_R;
  const phase = rng() * Math.PI * 2;
  const trees: TreeInstance[] = [];
  for (let i = 0; i < target; i++) {
    const variant =
      Math.floor(rng() * JUNGLE_TREE_VARIANT_COUNT) % JUNGLE_TREE_VARIANT_COUNT;
    const displaySize = JUNGLE_TREE_DISPLAY_BASE * (0.92 + rng() * 0.16);
    const angle = phase + (i / target) * Math.PI * 2 + (rng() - 0.5) * 0.42;
    // Just off the cut edge: close enough to frame it, far enough that a canopy does not
    // hang over the arena the fight happens in.
    const radius = clearing * (1.34 + rng() * 0.5);
    const trunkX = cx + Math.cos(angle) * radius;
    const trunkY = cy + Math.sin(angle) * radius;
    if (
      trunkX < EDGE_MARGIN_X ||
      trunkX > GAME_CONFIG.NODE_WIDTH - EDGE_MARGIN_X ||
      trunkY < EDGE_MARGIN_TOP ||
      trunkY > GAME_CONFIG.NODE_HEIGHT - EDGE_MARGIN_BOTTOM
    ) {
      continue;
    }
    trees.push(makeJungleTree(nodeId, trees.length, variant, trunkX, trunkY, displaySize));
  }
  return trees;
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
  // Tree count follows the thicket ARRANGEMENT rather than being flat at 9 — see
  // jungleTreeTarget. A cluster node already carries its cover in one mass and wants the
  // rest open; a scatter node has thin cover everywhere and can hold a proper canopy.
  const target = biome?.isDungeon
    ? JUNGLE_DUNGEON_TREES_PER_NODE
    : jungleTreeTarget(nodeId);

  // A dungeon RINGS its clearing instead of scattering. The clearing is the one thing a
  // jungle boss node has to read as — jungle that was cut back, not jungle that happens to
  // be open — and a treeline standing just off the cut edge is what says something did the
  // cutting. Same principle as the cave dungeon's standing stones: same trees, same
  // collision, placed with intent.
  if (biome?.isDungeon) {
    return ringedDungeonTrees(nodeId, rng, target);
  }
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
