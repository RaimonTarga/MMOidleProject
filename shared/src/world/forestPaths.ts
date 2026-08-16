import { GAME_CONFIG } from "../config/gameConfig";
import { NODE_BIOMES } from "./nodeBiomes";

/**
 * FOREST PATHS — deterministic per-node trails cut through the forest.
 *
 * This lives in `shared/` rather than in the client renderer for one reason: trees
 * carry trunk hitboxes and are therefore COLLISION, generated server-side. A path is
 * only a path if nothing is standing in it, so the tree scatter has to know where the
 * trails are. Ground rendering and decor scatter read the same layout, which is what
 * keeps the painted trail, the gap in the trees, and the gap in the undergrowth all
 * describing the same shape.
 *
 * Like every other node layout here it is derived from the node id, so client and
 * server agree without a byte crossing the wire.
 */

/** Trail layouts a forest node can take. */
export type ForestPathShape = "none" | "ring" | "cross" | "partial";

export interface ForestPathDisc {
  x: number;
  y: number;
  r: number;
}

export interface ForestPathLayout {
  shape: ForestPathShape;
  discs: readonly ForestPathDisc[];
}

/**
 * Weighted shape table. `none` is deliberately kept in the mix and weighted equal to
 * the rest: an unbroken stretch of forest is what makes a trail read as a trail when
 * you reach one. If every node had a path, none of them would feel like a route.
 */
const SHAPE_WEIGHTS: ReadonlyArray<{ shape: ForestPathShape; weight: number }> = [
  { shape: "none", weight: 3 },
  { shape: "ring", weight: 2 },
  { shape: "cross", weight: 2 },
  { shape: "partial", weight: 2 },
];

/** Trail half-width. ~5x the player's body, so it reads as a route, not a gap. */
const PATH_RADIUS = GAME_CONFIG.NODE_WIDTH * 0.032;
/** Disc spacing along a trail. Below 2r so consecutive discs always overlap. */
const PATH_STEP = PATH_RADIUS * 1.35;

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

function range(rng: () => number, lo: number, hi: number): number {
  return lo + rng() * (hi - lo);
}

function pickShape(rng: () => number): ForestPathShape {
  const total = SHAPE_WEIGHTS.reduce((a, s) => a + s.weight, 0);
  let roll = rng() * total;
  for (const s of SHAPE_WEIGHTS) {
    roll -= s.weight;
    if (roll <= 0) return s.shape;
  }
  return SHAPE_WEIGHTS[SHAPE_WEIGHTS.length - 1].shape;
}

/** Discs along a straight run, always overlapping so the trail never breaks. */
function runDiscs(
  rng: () => number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): ForestPathDisc[] {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return [];
  const nx = -dy / dist;
  const ny = dx / dist;
  const out: ForestPathDisc[] = [];
  for (let t = 0; t <= dist; t += PATH_STEP) {
    // A gentle sway keeps a hand-cut trail from looking surveyed.
    const sway = Math.sin(t / (PATH_RADIUS * 3.2)) * PATH_RADIUS * 0.35;
    out.push({
      x: x0 + (dx * t) / dist + nx * sway,
      y: y0 + (dy * t) / dist + ny * sway,
      r: PATH_RADIUS * range(rng, 0.88, 1.12),
    });
  }
  return out;
}

/** Closed loop. `gapFrom`/`gapSpan` (radians) carve the break for `partial`. */
function ringDiscs(
  rng: () => number,
  cx: number,
  cy: number,
  radius: number,
  gapFrom = 0,
  gapSpan = 0,
): ForestPathDisc[] {
  const steps = Math.max(12, Math.round((2 * Math.PI * radius) / PATH_STEP));
  const out: ForestPathDisc[] = [];
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    if (gapSpan > 0) {
      const rel = (a - gapFrom + Math.PI * 4) % (Math.PI * 2);
      if (rel < gapSpan) continue;
    }
    const rr = radius + range(rng, -PATH_RADIUS * 0.22, PATH_RADIUS * 0.22);
    out.push({
      x: cx + Math.cos(a) * rr,
      y: cy + Math.sin(a) * rr,
      r: PATH_RADIUS * range(rng, 0.88, 1.12),
    });
  }
  return out;
}

function buildLayout(nodeId: string): ForestPathLayout {
  const biome = NODE_BIOMES[nodeId];
  // Dungeons are exempt: the arena court IS their layout, and a trail crossing it
  // would fight the one shape a boss node has to read as.
  if (!biome || biome.isDungeon) return { shape: "none", discs: [] };

  const rng = mulberry32(hashString(`${nodeId}:forest-paths:v1`));
  const shape = pickShape(rng);
  const W = GAME_CONFIG.NODE_WIDTH;
  const H = GAME_CONFIG.NODE_HEIGHT;
  const cx = W / 2;
  const cy = H / 2;

  if (shape === "none") return { shape, discs: [] };

  if (shape === "ring") {
    return { shape, discs: ringDiscs(rng, cx, cy, W * range(rng, 0.24, 0.30)) };
  }

  if (shape === "cross") {
    // Diagonals, deliberately unlike the hub's cardinal roads. Overshoot the corners
    // so the trail runs off the node instead of stopping short of the border.
    const reach = W * 0.78;
    const discs: ForestPathDisc[] = [];
    for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) {
      discs.push(...runDiscs(rng, cx, cy, cx + sx * reach, cy + sy * reach));
    }
    return { shape, discs };
  }

  // `partial` — a route that does not resolve. Either a loop with a bite out of it or
  // an X missing arms, so the node reads as forest that was never fully cut through.
  const discs: ForestPathDisc[] = [];
  if (rng() < 0.5) {
    discs.push(
      ...ringDiscs(
        rng,
        cx,
        cy,
        W * range(rng, 0.24, 0.30),
        rng() * Math.PI * 2,
        range(rng, Math.PI * 0.35, Math.PI * 0.75),
      ),
    );
  } else {
    const arms = ([[-1, -1], [1, -1], [-1, 1], [1, 1]] as const).filter(
      () => rng() < 0.6,
    );
    const reach = W * 0.78;
    for (const [sx, sy] of arms.length > 0 ? arms : [[1, 1] as const]) {
      // Some arms stop partway, as if the cutting was abandoned.
      const f = range(rng, 0.55, 1);
      discs.push(...runDiscs(rng, cx, cy, cx + sx * reach * f, cy + sy * reach * f));
    }
  }
  return { shape, discs };
}

const cache = new Map<string, ForestPathLayout>();

/** Deterministic trail layout for a forest node. */
export function getForestPaths(nodeId: string): ForestPathLayout {
  const hit = cache.get(nodeId);
  if (hit) return hit;
  const layout = buildLayout(nodeId);
  cache.set(nodeId, layout);
  return layout;
}

/**
 * Whether a point lies on a node's trail. `pad` grows the trail for callers that
 * place something with a footprint — a tree trunk should clear the path by its own
 * radius, not merely have its centre outside it.
 */
export function isOnForestPath(
  nodeId: string,
  x: number,
  y: number,
  pad = 0,
): boolean {
  const { discs } = getForestPaths(nodeId);
  for (const d of discs) {
    const rr = d.r + pad;
    const dx = x - d.x;
    const dy = y - d.y;
    if (dx * dx + dy * dy < rr * rr) return true;
  }
  return false;
}
