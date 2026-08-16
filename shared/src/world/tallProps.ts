import { GAME_CONFIG } from "../config/gameConfig";
import type { HitboxRect } from "../hitbox/types";
import {
  caveRitualPoint,
  getCaveRitualSite,
  isOnCavePatrolPath,
} from "./cavePatrols";
import { NODE_BIOMES, worldNodeExits, type NodeDirection } from "./nodeBiomes";
import { RESOLVED_NODE_FEATURES, type NodeFeatureShape } from "./nodeFeatures";
import type { TreeArtSet, TreeInstance } from "./trees";

export const TALL_PROP_CELL_PX = 1254;
export const TALL_PROPS_PER_NODE = 9;
/**
 * Caves carry more formations than the other rock biomes. A cavern should read as a space
 * broken up by rock, not as an open floor with a few boulders on it — and now that the
 * patrol beat is drawn on the ground, the formations are what the beat threads between.
 */
export const CAVE_TALL_PROPS_PER_NODE = 15;
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
  // Cave rocks block WIDER than the other sets. Their art is a broad 465px formation but the
  // base was only about 60px across once scaled, so you walked through most of the visible
  // rock. These are sized to the silhouette instead: roughly 100-115px of blocking width.
  // Height is left alone — a deep base would make them block from far below their footprint.
  cave: {
    artSet: "cave-rock",
    displayBase: 465,
    trunks: [
      { offsetX: 0, offsetY: 445, halfW: 142, halfH: 58 },
      { offsetX: 0, offsetY: 450, halfW: 156, halfH: 60 },
      { offsetX: 0, offsetY: 440, halfW: 132, halfH: 58 },
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

function range(rng: () => number, lo: number, hi: number): number {
  return lo + rng() * (hi - lo);
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

/** Rocks clear a patrol beat by their own footprint plus a walking margin. */
const CAVE_PATROL_ROCK_CLEARANCE = 190;

function generateTallProps(nodeId: string, biomeGroup: RockBiome): TreeInstance[] {
  const set = ROCK_SETS[biomeGroup];
  const biome = NODE_BIOMES[nodeId];
  const rng = mulberry32(hashString(`${nodeId}:tall-rock-props`));
  const props: TreeInstance[] = [];

  // A cave dungeon arranges its formations into a standing-stone ring around the altar
  // rather than scattering them. Same props, same collision, placed with intent — which is
  // what makes a boss room read as somewhere that was built rather than merely found.
  const ritual = biomeGroup === "cave" ? getCaveRitualSite(nodeId) : null;
  if (ritual) {
    for (const angle of ritual.stones) {
      const variant = Math.floor(rng() * set.trunks.length) % set.trunks.length;
      const trunk = set.trunks[variant];
      const displaySize = set.displayBase * (0.92 + rng() * 0.16);
      const scale = displaySize / TALL_PROP_CELL_PX;
      const p = caveRitualPoint(ritual, angle, range(rng, -34, 34));
      // The spokes already open the ring at every exit, but the clearance is asserted
      // across all rock biomes, so enforce it here too rather than trusting the geometry.
      if (!isClearOfRoutes(nodeId, p.x, p.y)) continue;
      props.push(
        makeTallProp(nodeId, props.length, set, variant, trunk, displaySize, scale, p.x, p.y),
      );
    }
    return props;
  }
  const target = biome?.isDungeon
    ? TALL_PROP_DUNGEON_COUNT
    : biomeGroup === "cave"
      ? CAVE_TALL_PROPS_PER_NODE
      : TALL_PROPS_PER_NODE;
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
    // A rock formation standing in the middle of a painted patrol path is exactly the
    // mismatch this pass exists to remove, and these carry trunk collision, so it would
    // block the beat as well as look wrong. Cleared by the prop's own footprint.
    if (isOnCavePatrolPath(nodeId, anchorX, anchorY, CAVE_PATROL_ROCK_CLEARANCE)) continue;
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

    props.push(
      makeTallProp(nodeId, props.length, set, variant, trunk, displaySize, scale, anchorX, anchorY),
    );
  }
  return props;
}

/** One rock instance. Shared so the scatter and the ritual ring cannot drift apart. */
function makeTallProp(
  nodeId: string,
  index: number,
  set: RockSet,
  variant: number,
  trunk: HitboxRect,
  displaySize: number,
  scale: number,
  anchorX: number,
  anchorY: number,
): TreeInstance {
  return {
    id: `${nodeId}:tall-prop:${index}`,
    artSet: set.artSet,
    variant,
    cellPx: TALL_PROP_CELL_PX,
    trunkTopPx: Math.round(TALL_PROP_CELL_PX / 2 + trunk.offsetY - trunk.halfH),
    spriteX: anchorX - trunk.offsetX * scale,
    spriteY: anchorY - trunk.offsetY * scale,
    displaySize,
    shapes: [{
      kind: "ellipse",
      x: anchorX,
      y: anchorY,
      halfW: trunk.halfW * scale,
      halfH: trunk.halfH * scale,
    }],
    baseY: anchorY + trunk.halfH * scale,
  };
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
