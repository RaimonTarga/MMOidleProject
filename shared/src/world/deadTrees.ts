import { GAME_CONFIG } from "../config/gameConfig";
import type { HitboxRect } from "../hitbox/types";
import { NODE_BIOMES } from "./nodeBiomes";
import type { NodeFeatureShape } from "./nodeFeatures";
import type { TreeArtSet, TreeInstance } from "./trees";

export const DEAD_TREE_CELL_PX = 1254;
export const DEAD_TREE_DISPLAY_BASE = 500;
export const DEAD_TREE_VARIANT_COUNT = 3;
export const DEAD_TREES_PER_NODE = 3;
export const DEAD_DUNGEON_TREES_PER_NODE = 2;

const TRUNKS: Readonly<Record<"tundra" | "wasteland", readonly HitboxRect[]>> = {
  tundra: [
    { offsetX: 0, offsetY: 410, halfW: 115, halfH: 135 },
    { offsetX: 0, offsetY: 420, halfW: 110, halfH: 130 },
    { offsetX: -10, offsetY: 405, halfW: 120, halfH: 135 },
  ],
  wasteland: [
    { offsetX: 0, offsetY: 405, halfW: 110, halfH: 135 },
    { offsetX: 0, offsetY: 415, halfW: 105, halfH: 130 },
    { offsetX: -8, offsetY: 400, halfW: 120, halfH: 140 },
  ],
};

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
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const EDGE_MARGIN_X = 360;
const EDGE_MARGIN_TOP = 500;
const EDGE_MARGIN_BOTTOM = 320;
const MIN_SEPARATION = 620;
const DUNGEON_CENTER_CLEARANCE = 900;

function generateDeadNodeTrees(
  nodeId: string,
  artSet: "tundra" | "wasteland",
): TreeInstance[] {
  const biome = NODE_BIOMES[nodeId];
  const rng = mulberry32(hashString(`${nodeId}:${artSet}-dead-trees`));
  const trees: TreeInstance[] = [];
  const target = biome?.isDungeon
    ? DEAD_DUNGEON_TREES_PER_NODE
    : DEAD_TREES_PER_NODE;

  for (let attempt = 0; attempt < target * 128 && trees.length < target; attempt++) {
    const variant = Math.floor(rng() * DEAD_TREE_VARIANT_COUNT) % DEAD_TREE_VARIANT_COUNT;
    const trunk = TRUNKS[artSet][variant];
    const displaySize = DEAD_TREE_DISPLAY_BASE * (0.92 + rng() * 0.16);
    const scale = displaySize / DEAD_TREE_CELL_PX;
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
    if (
      trees.some((tree) => {
        const shape = tree.shapes[0];
        const dx = trunkX - shape.x;
        const dy = trunkY - shape.y;
        return dx * dx + dy * dy < MIN_SEPARATION ** 2;
      })
    ) continue;

    const spriteX = trunkX - trunk.offsetX * scale;
    const spriteY = trunkY - trunk.offsetY * scale;
    const shapes: NodeFeatureShape[] = [{
      kind: "ellipse",
      x: trunkX,
      y: trunkY,
      halfW: trunk.halfW * scale,
      halfH: trunk.halfH * scale,
    }];
    trees.push({
      id: `${nodeId}:tree:${trees.length}`,
      artSet: artSet as TreeArtSet,
      variant,
      cellPx: DEAD_TREE_CELL_PX,
      trunkTopPx: Math.round(
        DEAD_TREE_CELL_PX / 2 + trunk.offsetY - trunk.halfH,
      ),
      spriteX,
      spriteY,
      displaySize,
      shapes,
      baseY: trunkY + trunk.halfH * scale,
    });
  }
  return trees;
}

export function generateTundraNodeTrees(nodeId: string): TreeInstance[] {
  return generateDeadNodeTrees(nodeId, "tundra");
}

export function generateWastelandNodeTrees(nodeId: string): TreeInstance[] {
  return generateDeadNodeTrees(nodeId, "wasteland");
}
