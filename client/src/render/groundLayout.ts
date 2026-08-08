import {
  GAME_CONFIG,
  RESOLVED_NODE_FEATURES,
  getNodeTrees,
  type NodeFeatureShape,
} from '@mmo-idle/shared';

/**
 * Deterministic per-node ground layout: which parts of a node are "dirt"
 * (the upper Wang material) versus base ground. This is the single source of
 * truth for that shape — the Wang autotiler renders it, and the biome-decor
 * scatter reads it so props can react to it (e.g. grass tufts avoiding bare
 * dirt). Everything here is pure and world-space (node pixels), so it stays
 * renderer-agnostic and stable across sessions.
 *
 * The system is biome-agnostic: a layout is a weighted set of named PATTERNS
 * (loose path to center, off-center patch, ring path, plain scatter), and each
 * biome config just picks its own mix and size parameters. Adding a biome is a
 * config entry; adding a new shape is one generator function.
 */

export interface DirtDisc {
  x: number;
  y: number;
  r: number;
}

export interface GroundLayout {
  /** Which upper material this node paints (selects the Wang sheet). */
  material: string;
  discs: DirtDisc[];
  /**
   * Inverted layouts paint the UPPER material as the dominant ground and the
   * discs as pockets of the lower/base material (e.g. jungle: overgrowth
   * everywhere, discs = open floor clearings).
   */
  invert: boolean;
  /** Coarse world-space upper-material test (no per-tile edge wobble). */
  isDirt: (x: number, y: number) => boolean;
}

export type DirtPatternName =
  | 'loose-center-path'
  | 'off-center-patch'
  | 'ring-path'
  | 'scatter'
  | 'sparse-scatter'
  | 'hub-plaza'
  | 'tree-canopy'
  | 'plain';

/**
 * A ground STYLE pairs an upper material (one Wang sheet, see render/wangGround.ts)
 * with the dirt patterns that suit it. One style is picked per node, weighted-
 * deterministically by nodeId — a node never mixes two sheets, because each
 * sheet's base tile is an independent generation and mixing them would leave
 * visible square seams around every patch.
 */
export interface GroundStyleConfig {
  material: string;
  weight: number;
  /** One pattern is picked per node, weighted-deterministically by nodeId. */
  patterns: Array<{ pattern: DirtPatternName; weight: number }>;
  /** See GroundLayout.invert: discs become pockets of the BASE material. */
  invert?: boolean;
  /**
   * Route the discs AROUND this node's authored features instead of letting them
   * land on top.
   *
   * Only meaningful where a feature is dressed by its own art and the ground is
   * supposed to stay out of its way — jungle, where the discs are open floor and
   * the features are bush thickets, so an overlap paints walkable-looking ground
   * inside a slow/conceal/ambush zone. Deliberately OFF elsewhere: swamp rot
   * pools are painted BY the functional Wang sheet and need the ground to cover
   * them, not dodge them.
   */
  avoidsFeatures?: boolean;
}

export const GROUND_LAYOUTS: Partial<Record<string, GroundStyleConfig[]>> = {
  plains: [
    {
      material: 'dirt',
      weight: 1,
      patterns: [
        { pattern: 'loose-center-path', weight: 4 },
        { pattern: 'off-center-patch', weight: 3 },
        { pattern: 'ring-path', weight: 2 },
        { pattern: 'scatter', weight: 1 },
      ],
    },
  ],
  // The Clearing is the single T0 hub node: worn paving reinforces the
  // civilized/sanctuary read, laid out as a fixed plaza under the rune altar.
  clearing: [
    {
      material: 'paving',
      weight: 1,
      patterns: [{ pattern: 'hub-plaza', weight: 1 }],
    },
  ],
  // Forest undergrowth pools under the tree clusters (the trees are the
  // authoritative shared layout; the ground follows them, not the other way
  // around). The light-undergrowth sheet stays a bake-off alternate.
  forest: [
    {
      material: 'heavy-foliage',
      weight: 1,
      patterns: [{ pattern: 'tree-canopy', weight: 1 }],
    },
  ],
  cave: [
    // Patrol path is the canonical cavern floor. Rubble remains available in
    // the developer ground bake-off, but is no longer selected by default.
    {
      material: 'patrol-path',
      weight: 1,
      patterns: [
        { pattern: 'loose-center-path', weight: 2 },
        { pattern: 'ring-path', weight: 1 },
      ],
    },
  ],
  // Mountain always uses regular flat ground. Its blocking ledges are independent
  // overlays, never a functional Wang material.
  mountain: [
    {
      material: 'stone',
      weight: 1,
      patterns: [
        { pattern: 'off-center-patch', weight: 3 },
        { pattern: 'scatter', weight: 2 },
      ],
    },
  ],
  swamp: [
    {
      material: 'reeds',
      weight: 1,
      patterns: [
        { pattern: 'scatter', weight: 3 },
        { pattern: 'off-center-patch', weight: 2 },
        { pattern: 'ring-path', weight: 1 },
      ],
    },
  ],
  // Open standoff biome: broad unbroken sand, hardpan only shows in rare
  // wind-stripped pockets.
  desert: [
    {
      material: 'hardpan',
      weight: 1,
      patterns: [
        { pattern: 'sparse-scatter', weight: 4 },
        { pattern: 'off-center-patch', weight: 1 },
      ],
    },
  ],
  // Ambush biome, INVERTED: overgrowth is the dominant ground and the discs
  // are the open-floor clearings and trails cut through it.
  jungle: [
    {
      material: 'overgrowth',
      weight: 1,
      invert: true,
      // The open floor is the SAFE LANE the ambush ecology is read against, so
      // it has to thread between the thickets rather than through them.
      avoidsFeatures: true,
      patterns: [
        { pattern: 'off-center-patch', weight: 3 },
        { pattern: 'loose-center-path', weight: 2 },
        { pattern: 'scatter', weight: 2 },
      ],
    },
  ],
  tundra: [
    {
      material: 'ice',
      weight: 1,
      patterns: [
        { pattern: 'off-center-patch', weight: 3 },
        { pattern: 'scatter', weight: 2 },
        { pattern: 'ring-path', weight: 1 },
      ],
    },
  ],
  // Ventless volcanic nodes render plain basalt: the sheet's lava upper is a
  // FUNCTIONAL hazard material reserved for the lava-vent nodes (see the
  // functional config in wangGround.ts) — decorative lava would telegraph a
  // hazard that isn't there.
  volcanic: [
    {
      material: 'lava',
      weight: 1,
      patterns: [{ pattern: 'plain', weight: 1 }],
    },
  ],
  trench: [
    {
      material: 'biolume',
      weight: 1,
      patterns: [
        { pattern: 'scatter', weight: 3 },
        { pattern: 'off-center-patch', weight: 2 },
        { pattern: 'ring-path', weight: 1 },
      ],
    },
  ],
  // Wasteland art (biomeGroup id is still 'graveyard'): drifted ash banks over
  // dead earth.
  graveyard: [
    {
      material: 'ash',
      weight: 1,
      patterns: [
        { pattern: 'off-center-patch', weight: 3 },
        { pattern: 'scatter', weight: 2 },
        { pattern: 'loose-center-path', weight: 2 },
      ],
    },
  ],
};

export function hashString(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Rng = () => number;

const range = (rng: Rng, min: number, max: number): number => min + rng() * (max - min);

/** A few unclustered small patches — background texture used by every pattern. */
function scatterDiscs(rng: Rng, W: number, H: number, count: number, rMin: number, rMax: number): DirtDisc[] {
  const out: DirtDisc[] = [];
  for (let i = 0; i < count; i++) {
    out.push({ x: rng() * W, y: rng() * H, r: range(rng, rMin, rMax) });
  }
  return out;
}

/**
 * Stamps of dirt along a straight line, deliberately broken: over-spaced steps,
 * perpendicular drift, and a skip chance keep the trail readable as a worn path
 * without ever becoming a continuous ribbon.
 */
function looseTrail(rng: Rng, x0: number, y0: number, x1: number, y1: number): DirtDisc[] {
  const out: DirtDisc[] = [];
  const dx = x1 - x0;
  const dy = y1 - y0;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return out;
  const nx = -dy / dist;
  const ny = dx / dist;
  let t = range(rng, 60, 160);
  while (t < dist) {
    if (rng() > 0.3) {
      const drift = range(rng, -85, 85);
      out.push({
        x: x0 + (dx * t) / dist + nx * drift,
        y: y0 + (dy * t) / dist + ny * drift,
        r: range(rng, 85, 150),
      });
    }
    t += range(rng, 150, 270);
  }
  return out;
}

/** Random point on the node border rectangle, a little inside the true edge. */
function edgePoint(rng: Rng, W: number, H: number): { x: number; y: number } {
  const along = range(rng, 0.15, 0.85);
  switch (Math.floor(rng() * 4)) {
    case 0: return { x: along * W, y: 0 };
    case 1: return { x: along * W, y: H };
    case 2: return { x: 0, y: along * H };
    default: return { x: W, y: along * H };
  }
}

/** Big central patch plus a loose, broken trail in from a random node edge. */
function looseCenterPath(rng: Rng, W: number, H: number): DirtDisc[] {
  const cx = W / 2 + range(rng, -90, 90);
  const cy = H / 2 + range(rng, -90, 90);
  const centerR = range(rng, 260, 380);
  const start = edgePoint(rng, W, H);
  return [
    { x: cx, y: cy, r: centerR },
    ...looseTrail(rng, start.x, start.y, cx, cy),
    ...scatterDiscs(rng, W, H, 2, 70, 120),
  ];
}

/**
 * The big patch pushed away from center, with satellite crumbs around its rim
 * so the edge reads as eroded rather than stamped.
 */
function offCenterPatch(rng: Rng, W: number, H: number): DirtDisc[] {
  const angle = rng() * Math.PI * 2;
  const mag = range(rng, 380, 620);
  const r = range(rng, 300, 420);
  const margin = r * 0.5;
  const x = Math.min(W - margin, Math.max(margin, W / 2 + Math.cos(angle) * mag));
  const y = Math.min(H - margin, Math.max(margin, H / 2 + Math.sin(angle) * mag));
  const out: DirtDisc[] = [{ x, y, r }];
  const satellites = 2 + Math.floor(rng() * 2);
  for (let i = 0; i < satellites; i++) {
    const a = rng() * Math.PI * 2;
    const d = r * range(rng, 1.1, 1.6);
    out.push({ x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, r: range(rng, 100, 160) });
  }
  out.push(...scatterDiscs(rng, W, H, 3, 80, 150));
  return out;
}

/** A broken circular trail around the node center, like a walked patrol loop. */
function ringPath(rng: Rng, W: number, H: number): DirtDisc[] {
  const cx = W / 2 + range(rng, -60, 60);
  const cy = H / 2 + range(rng, -60, 60);
  const R = range(rng, 620, 780);
  const spacing = range(rng, 210, 290);
  const steps = Math.max(6, Math.round((2 * Math.PI * R) / spacing));
  const phase = rng() * Math.PI * 2;
  const out: DirtDisc[] = [];
  for (let i = 0; i < steps; i++) {
    if (rng() < 0.25) continue;
    const a = phase + (i / steps) * Math.PI * 2;
    const rr = R + range(rng, -70, 70);
    out.push({ x: cx + Math.cos(a) * rr, y: cy + Math.sin(a) * rr, r: range(rng, 90, 150) });
  }
  if (rng() < 0.5) out.push({ x: cx, y: cy, r: range(rng, 140, 200) });
  return out;
}

/**
 * Fixed plaza for the Clearing hub: a paved apron under the rune altar (which
 * NODE_FEATURES pins at (W/2, H/2 - 320)) flowing into the spawn point at node
 * center, plus a loose walked-in trail from the south edge and a few crumbs.
 */
function hubPlaza(rng: Rng, W: number, H: number): DirtDisc[] {
  const altarX = W / 2;
  const altarY = H / 2 - 320;
  const centerX = W / 2;
  const centerY = H / 2;
  return [
    { x: altarX, y: altarY, r: range(rng, 330, 370) },
    { x: centerX, y: centerY, r: range(rng, 210, 250) },
    ...looseTrail(rng, centerX + range(rng, -160, 160), H, centerX, centerY),
    ...scatterDiscs(rng, W, H, 3, 70, 120),
  ];
}

/**
 * Foliage pooled under each tree of the shared per-node tree layout, so the
 * heavy-undergrowth material reads as the forest floor beneath the canopies
 * and overlapping trees merge into one grove-sized patch. Nodes without trees
 * (shouldn't happen in forest) fall back to plain scatter.
 */
function treeCanopy(rng: Rng, W: number, H: number, nodeId: string): DirtDisc[] {
  const trees = getNodeTrees(nodeId);
  if (trees.length === 0) return scatterDiscs(rng, W, H, 5, 128, 288);
  const out: DirtDisc[] = [];
  for (const tree of trees) {
    out.push({
      x: tree.spriteX + range(rng, -36, 36),
      y: tree.baseY + range(rng, -24, 48),
      r: tree.displaySize * range(rng, 0.34, 0.46),
    });
  }
  out.push(...scatterDiscs(rng, W, H, 2, 80, 140));
  return out;
}

const PATTERN_GENERATORS: Record<
  DirtPatternName,
  (rng: Rng, W: number, H: number, nodeId: string) => DirtDisc[]
> = {
  'loose-center-path': looseCenterPath,
  'off-center-patch': offCenterPatch,
  'ring-path': ringPath,
  scatter: (rng, W, H) => scatterDiscs(rng, W, H, 5, 128, 288),
  // A couple of small pockets — for biomes whose upper material should stay rare.
  'sparse-scatter': (rng, W, H) => scatterDiscs(rng, W, H, 2 + Math.floor(rng() * 2), 100, 180),
  'hub-plaza': hubPlaza,
  'tree-canopy': treeCanopy,
  // Base material only — the whole node stays the sheet's lower tile.
  plain: () => [],
};

function pickWeighted<T extends { weight: number }>(rng: Rng, options: T[]): T {
  let total = 0;
  for (const o of options) total += o.weight;
  let roll = rng() * total;
  for (const o of options) {
    roll -= o.weight;
    if (roll <= 0) return o;
  }
  return options[options.length - 1];
}

/**
 * The deterministic dirt layout for one node, or null when the biome has no
 * layered ground. Cheap enough to recompute on every node repaint.
 */

/** Distance from a point to a feature shape's edge (negative = inside). */
function shapeClearance(shape: NodeFeatureShape, x: number, y: number): number {
  switch (shape.kind) {
    case 'circle':
      return Math.hypot(x - shape.x, y - shape.y) - shape.radius;
    case 'ellipse': {
      // Cheap conservative read: treat it as its larger axis. Ground discs are
      // coarse, so over-avoiding by a few px is invisible and always safe.
      const r = Math.max(shape.halfW, shape.halfH);
      return Math.hypot(x - shape.x, y - shape.y) - r;
    }
    default: {
      const dx = Math.max(Math.abs(x - shape.x) - shape.halfW, 0);
      const dy = Math.max(Math.abs(y - shape.y) - shape.halfH, 0);
      return Math.hypot(dx, dy);
    }
  }
}

/** The centre a shape pushes away from. */
function shapeCentre(shape: NodeFeatureShape): { x: number; y: number } {
  return { x: shape.x, y: shape.y };
}

const FEATURE_CLEAR_PAD = 40;
const MIN_DISC_R = 60;
const RELAX_PASSES = 4;

/**
 * Push ground discs out of the node's authored feature footprints.
 *
 * A post-pass over whatever the pattern generated, rather than a constraint
 * threaded through every generator: the patterns stay pure shape-makers, and
 * there is exactly one place that reasons about features. Discs are PUSHED
 * first and only shrunk or dropped when they cannot be moved clear, so a
 * "path in from the edge" still arrives — it just bends around the thicket
 * instead of vanishing.
 */
function routeDiscsAroundFeatures(
  discs: DirtDisc[],
  nodeId: string,
  W: number,
  H: number,
): DirtDisc[] {
  const shapes = (RESOLVED_NODE_FEATURES[nodeId] ?? []).map((f) => f.shape);
  if (shapes.length === 0) return discs;

  const out: DirtDisc[] = [];
  for (const disc of discs) {
    let { x, y, r } = disc;

    for (let pass = 0; pass < RELAX_PASSES; pass++) {
      let worst: { shape: NodeFeatureShape; overlap: number } | null = null;
      for (const shape of shapes) {
        const overlap = r + FEATURE_CLEAR_PAD - shapeClearance(shape, x, y);
        if (overlap > 0 && (!worst || overlap > worst.overlap)) {
          worst = { shape, overlap };
        }
      }
      if (!worst) break;

      const c = shapeCentre(worst.shape);
      let vx = x - c.x;
      let vy = y - c.y;
      const len = Math.hypot(vx, vy);
      if (len < 1e-3) {
        // Concentric with the thicket — pick a stable direction from the disc's
        // own coordinates so the result stays deterministic across clients.
        vx = 1;
        vy = 0;
      } else {
        vx /= len;
        vy /= len;
      }
      x += vx * worst.overlap;
      y += vy * worst.overlap;

      // A disc shoved past the node edge is worse than a smaller one, so clamp
      // back inside and let the next pass trade radius for fit instead.
      const cx = Math.min(W, Math.max(0, x));
      const cy = Math.min(H, Math.max(0, y));
      if (cx !== x || cy !== y) {
        x = cx;
        y = cy;
        r = Math.max(MIN_DISC_R, r * 0.8);
      }
    }

    // Still buried after relaxing? Shrink to whatever actually fits, and drop it
    // only if even the floor size cannot clear the thicket.
    let clear = Math.min(...shapes.map((sh) => shapeClearance(sh, x, y)));
    if (clear < r + FEATURE_CLEAR_PAD) {
      r = clear - FEATURE_CLEAR_PAD;
    }
    if (r >= MIN_DISC_R) out.push({ x, y, r });
  }

  return out;
}

export function computeGroundLayout(biomeGroup: string, nodeId: string): GroundLayout | null {
  const styles = GROUND_LAYOUTS[biomeGroup];
  if (!styles || styles.length === 0) return null;
  const W = GAME_CONFIG.NODE_WIDTH;
  const H = GAME_CONFIG.NODE_HEIGHT;
  const rng = mulberry32(hashString(`${nodeId}:ground-layout:v1`));
  const style = pickWeighted(rng, styles);
  const pattern = pickWeighted(rng, style.patterns).pattern;
  const generated = PATTERN_GENERATORS[pattern](rng, W, H, nodeId);
  const discs = style.avoidsFeatures
    ? routeDiscsAroundFeatures(generated, nodeId, W, H)
    : generated;
  const invert = style.invert ?? false;
  const isDirt = (x: number, y: number): boolean => {
    for (const d of discs) {
      const dx = x - d.x;
      const dy = y - d.y;
      if (dx * dx + dy * dy < d.r * d.r) return !invert;
    }
    return invert;
  };
  return { material: style.material, discs, invert, isDirt };
}
