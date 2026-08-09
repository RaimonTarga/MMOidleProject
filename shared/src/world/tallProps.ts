import { GAME_CONFIG } from "../config/gameConfig";
import type { HitboxRect } from "../hitbox/types";
import { NODE_BIOMES, worldNodeExits, type NodeDirection } from "./nodeBiomes";
import { RESOLVED_NODE_FEATURES, type NodeFeatureShape } from "./nodeFeatures";
import type { TreeArtSet, TreeInstance } from "./trees";

export const TALL_PROP_CELL_PX = 1254;
export const TALL_PROPS_PER_NODE = 3;
export const TALL_PROP_DUNGEON_COUNT = 2;
export const TALL_PROP_ROUTE_CLEARANCE = 320;
export const TALL_PROP_FEATURE_CLEARANCE = 260;

type RockBiome = "cave" | "desert" | "volcanic" | "trench";

interface RockSet {
  artSet: TreeArtSet;
  displayBase: number;
  trunks: readonly HitboxRect[];
}

const ROCK_SETS: Readonly<Record<RockBiome, RockSet>> = {
  cave: {
    artSet: "cave-rock",
    displayBase: 465,
    trunks: [
      { offsetX: 0, offsetY: 445, halfW: 78, halfH: 58 },
      { offsetX: 0, offsetY: 450, halfW: 86, halfH: 60 },
      { offsetX: 0, offsetY: 440, halfW: 72, halfH: 58 },
    ],
  },
  desert: {
    artSet: "desert-rock",
    displayBase: 450,
    trunks: [
      { offsetX: 0, offsetY: 445, halfW: 76, halfH: 56 },
      { offsetX: 0, offsetY: 450, halfW: 62, halfH: 54 },
      { offsetX: 0, offsetY: 445, halfW: 70, halfH: 56 },
    ],
  },
  volcanic: {
    artSet: "volcanic-rock",
    displayBase: 460,
    trunks: [
      { offsetX: 0, offsetY: 445, halfW: 84, halfH: 58 },
      { offsetX: 0, offsetY: 440, halfW: 68, halfH: 56 },
      { offsetX: 0, offsetY: 450, halfW: 80, halfH: 60 },
    ],
  },
  trench: {
    artSet: "trench-rock",
    displayBase: 465,
    trunks: [
      { offsetX: 0, offsetY: 430, halfW: 82, halfH: 58 },
      { offsetX: 0, offsetY: 435, halfW: 72, halfH: 56 },
      { offsetX: 0, offsetY: 430, halfW: 78, halfH: 58 },
    ],
  },
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

export function distancePointToSegment(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  const abx = bx - ax;
  const aby = by - ay;
  const lengthSq = abx * abx + aby * aby;
  const t = lengthSq === 0
    ? 0
    : Math.max(0, Math.min(1, ((px - ax) * abx + (py - ay) * aby) / lengthSq));
  return Math.hypot(px - (ax + abx * t), py - (ay + aby * t));
}

function exitAnchor(direction: NodeDirection): { x: number; y: number } {
  const w = GAME_CONFIG.NODE_WIDTH;
  const h = GAME_CONFIG.NODE_HEIGHT;
  if (direction === "north") return { x: w / 2, y: 0 };
  if (direction === "south") return { x: w / 2, y: h };
  if (direction === "west") return { x: 0, y: h / 2 };
  return { x: w, y: h / 2 };
}

function isClearOfRoutes(nodeId: string, x: number, y: number): boolean {
  const cx = GAME_CONFIG.NODE_WIDTH / 2;
  const cy = GAME_CONFIG.NODE_HEIGHT / 2;
  const exits = worldNodeExits(nodeId);
  return (Object.keys(exits) as NodeDirection[]).every((direction) => {
    const gate = exitAnchor(direction);
    return distancePointToSegment(x, y, cx, cy, gate.x, gate.y) >= TALL_PROP_ROUTE_CLEARANCE;
  });
}

function distanceFromShape(x: number, y: number, shape: NodeFeatureShape): number {
  if (shape.kind === "circle") return Math.hypot(x - shape.x, y - shape.y) - shape.radius;
  if (shape.kind === "ellipse") {
    // Conservatively reserve a circle around ellipse art and gameplay effects.
    return Math.hypot(x - shape.x, y - shape.y) - Math.max(shape.halfW, shape.halfH);
  }
  const dx = Math.max(Math.abs(x - shape.x) - shape.halfW, 0);
  const dy = Math.max(Math.abs(y - shape.y) - shape.halfH, 0);
  return Math.hypot(dx, dy);
}

const EDGE_MARGIN_X = 330;
const EDGE_MARGIN_TOP = 470;
const EDGE_MARGIN_BOTTOM = 300;
const MIN_SEPARATION = 590;
const DUNGEON_CENTER_CLEARANCE = 850;

function generateTallProps(nodeId: string, biomeGroup: RockBiome): TreeInstance[] {
  const set = ROCK_SETS[biomeGroup];
  const biome = NODE_BIOMES[nodeId];
  const rng = mulberry32(hashString(`${nodeId}:tall-rock-props`));
  const props: TreeInstance[] = [];
  const target = biome?.isDungeon ? TALL_PROP_DUNGEON_COUNT : TALL_PROPS_PER_NODE;
  const features = RESOLVED_NODE_FEATURES[nodeId] ?? [];

  for (let attempt = 0; attempt < target * 192 && props.length < target; attempt++) {
    const variant = Math.floor(rng() * set.trunks.length) % set.trunks.length;
    const trunk = set.trunks[variant];
    const displaySize = set.displayBase * (0.92 + rng() * 0.16);
    const scale = displaySize / TALL_PROP_CELL_PX;
    const anchorX = EDGE_MARGIN_X + rng() * (GAME_CONFIG.NODE_WIDTH - EDGE_MARGIN_X * 2);
    const anchorY = EDGE_MARGIN_TOP +
      rng() * (GAME_CONFIG.NODE_HEIGHT - EDGE_MARGIN_TOP - EDGE_MARGIN_BOTTOM);

    if (!isClearOfRoutes(nodeId, anchorX, anchorY)) continue;
    if (features.some((feature) =>
      distanceFromShape(anchorX, anchorY, feature.shape) < TALL_PROP_FEATURE_CLEARANCE
    )) continue;
    if (biome?.isDungeon) {
      const dx = anchorX - GAME_CONFIG.NODE_WIDTH / 2;
      const dy = anchorY - GAME_CONFIG.NODE_HEIGHT / 2;
      if (dx * dx + dy * dy < DUNGEON_CENTER_CLEARANCE ** 2) continue;
    }
    if (props.some((prop) => {
      const shape = prop.shapes[0];
      return Math.hypot(anchorX - shape.x, anchorY - shape.y) < MIN_SEPARATION;
    })) continue;

    const spriteX = anchorX - trunk.offsetX * scale;
    const spriteY = anchorY - trunk.offsetY * scale;
    props.push({
      id: `${nodeId}:tall-prop:${props.length}`,
      artSet: set.artSet,
      variant,
      cellPx: TALL_PROP_CELL_PX,
      trunkTopPx: Math.round(
        TALL_PROP_CELL_PX / 2 + trunk.offsetY - trunk.halfH,
      ),
      spriteX,
      spriteY,
      displaySize,
      shapes: [{
        kind: "ellipse",
        x: anchorX,
        y: anchorY,
        halfW: trunk.halfW * scale,
        halfH: trunk.halfH * scale,
      }],
      baseY: anchorY + trunk.halfH * scale,
    });
  }
  return props;
}

const cache = new Map<string, TreeInstance[]>();

/** Sparse, tall rock formations kept away from authored features and travel lanes. */
export function getNodeTallProps(nodeId: string): TreeInstance[] {
  const cached = cache.get(nodeId);
  if (cached) return cached;
  const biomeGroup = NODE_BIOMES[nodeId]?.biomeGroup;
  const props = biomeGroup && biomeGroup in ROCK_SETS
    ? generateTallProps(nodeId, biomeGroup as RockBiome)
    : [];
  cache.set(nodeId, props);
  return props;
}
