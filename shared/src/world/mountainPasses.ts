import { GAME_CONFIG } from "../config/gameConfig";
import { NODE_BIOMES } from "./nodeBiomes";

/**
 * MOUNTAIN LEDGES AND PASSES — deterministic per-node ascent, generated from the node id.
 *
 * Replaces six hand-authored entrance sets that were reused verbatim at every tier, so
 * `t1-mountain-01`, `t2-mountain-01`, `t3-mountain-01` and `t4-mountain-01` were the same
 * node four times over. Twenty-four nodes shared six layouts; now they have twenty-four,
 * and mountain nodes at T5-T8 cost nothing to author.
 *
 * This lives in `shared/` for the same reason `forestPaths` does, only more so. The ledges
 * are COLLISION — they block player and monster movement, the server spawns chokepoint
 * holders on them, and pathing routes around them. The passes worn through their gaps are
 * ground rendering. All three have to describe one shape, so one seeded layout feeds them
 * all rather than each end guessing at the other's geometry.
 *
 * ## The reachability contract
 *
 * Unlike swamp's rot pools, this generator makes WALLS, and a wall generator can wedge a
 * node in a way a hazard generator cannot. Reachability here is structural rather than
 * checked after the fact:
 *
 *  - The rings are concentric squares, so the corridor between them is an annulus and is
 *    connected all the way round regardless of where the gaps land.
 *  - Therefore the outside reaches the annulus iff the OUTER ring has >= 1 gap, and the
 *    annulus reaches the centre iff the INNER ring has >= 1 gap.
 *  - Both minimums are enforced at generation ({@link MIN_GAPS_PER_RING}), and the
 *    narrowest legal gap is far wider than a body.
 *
 * `server/test/mountainPassesReachable.test.ts` asserts that contract across every mountain
 * node rather than a sampled few — a single hard-coded node is exactly how the old
 * approach-goal wedge stayed hidden.
 */

/** The four sides of a ledge ring. */
export type MountainSide = "north" | "south" | "west" | "east";

/** Which of the two concentric ledge rings. */
export type MountainRing = "outer" | "inner";

/** A break in one side of a ring, expressed along that side as fractions 0..1. */
export interface MountainGap {
  side: MountainSide;
  /** Gap centre along the side. */
  centre: number;
  /** Gap width as a fraction of the side's length. */
  span: number;
}

/** A break in the dungeon ring, as angles in radians. */
export interface MountainArc {
  /** Gap centre angle. */
  centre: number;
  /** Gap width in radians. */
  span: number;
}

/**
 * A normal node: two concentric broken squares, the guarded ascent.
 */
export interface MountainRingsLayout {
  kind: "rings";
  outer: MountainGap[];
  inner: MountainGap[];
  /** Per-node perpendicular jitter on the segments, so the rock line is not ruled. */
  wobble: number;
}

/**
 * A dungeon: ONE circular wall around the arena, with one or two ways in.
 *
 * Deliberately unlike a normal node. Two nested squares read as terrain you work your way
 * through; a boss node should read as a single enclosure you commit to entering, so the
 * layout says "arena" the moment it is on screen rather than "more mountain".
 */
export interface MountainCircleLayout {
  kind: "circle";
  radius: number;
  gaps: MountainArc[];
  wobble: number;
}

export type MountainLedgeLayout = MountainRingsLayout | MountainCircleLayout;

export interface MountainPassDisc {
  x: number;
  y: number;
  r: number;
}

// The two rings are concentric SQUARES on a square node. The insets were once
// asymmetric (top 280 vs left 430) purely to track the old 4:3 footprint; with
// NODE_HEIGHT == NODE_WIDTH the same inset on every side is what keeps the guarded
// ascent reading as a ring rather than a corridor.
export const MOUNTAIN_OUTER_INSET = 645;
export const MOUNTAIN_INNER_INSET = 1350;

/**
 * The procedural ledge renderer no longer relies on Wang-grid coverage, so the collision
 * band can hug the visible cliff face instead of reserving a broad invisible strip on both
 * sides. Scaled with the node to 3 nav cells (96px) so the rock face keeps its proportion;
 * two cells was already enough for robust walls.
 */
export const MOUNTAIN_LEDGE_THICKNESS = 96;

/**
 * A ring must keep at least this many breaks or the node stops being crossable. This is
 * the whole reachability guarantee, so it is a floor and never an average.
 */
const MIN_GAPS_PER_RING = 1;

/**
 * Gap counts per ring. The outer ring can afford more breaks; it is far longer.
 *
 * These also set how many guard posts a node has, since a chokepoint is one opening: the
 * ranges below give 5-8 posts per node. A first pass at 2-4 / 1-3 bottomed out at three
 * openings on a whole node, which read as sealed rather than guarded and left too few
 * `holdsChokepoints` monsters posted.
 */
const OUTER_GAP_RANGE: readonly [number, number] = [3, 5];
const INNER_GAP_RANGE: readonly [number, number] = [2, 3];

/**
 * Gap width as a fraction of its side. The authored variants used a fixed 0.24 for a side
 * entrance and 0.16 for a corner one; this band spans both and varies within it. The floor
 * matters: the inner ring's sides are only 2100px long, so 0.14 is still a ~294px opening,
 * comfortably wider than a body but narrow enough to read as a pass.
 */
const MIN_GAP_SPAN = 0.14;
const MAX_GAP_SPAN = 0.26;

/**
 * Gaps on the same side keep this much solid rock between them, as a fraction of the side.
 * Without it two rolled gaps merge into one hole and the side stops reading as a wall.
 */
const MIN_GAP_SEPARATION = 0.12;

/**
 * No side may be more than this fraction open. A side carved past roughly half its length
 * reads as a missing wall rather than as a guarded one.
 */
const MAX_SIDE_OPEN = 0.5;

/** Gap centres stay this far from a side's ends so a gap never lands on a ring corner. */
const GAP_EDGE_MARGIN = 0.1;

/**
 * Dungeon ring radius. Sized so the arena inside comfortably seats the altar and its
 * painted court (radius ~552) with room to fight around them, while leaving roughly a
 * thousand pixels of approach outside the wall on every side.
 */
const DUNGEON_RING_MIN_RADIUS = 1180;
const DUNGEON_RING_MAX_RADIUS = 1330;

/** One or two ways in, as the biome's dungeons are meant to be committed to. */
const DUNGEON_MIN_GAPS = 1;
const DUNGEON_MAX_GAPS = 2;

/** Opening width along the wall, in pixels of arc, converted to an angle per node. */
const DUNGEON_GAP_MIN_ARC = 540;
const DUNGEON_GAP_MAX_ARC = 780;

/** Two entrances must sit well apart, or they read as one ragged hole. */
const DUNGEON_MIN_GAP_SEPARATION = Math.PI * 0.55;

/** Segment pitch along the ring. Below the 96px thickness, so squares always overlap. */
const DUNGEON_SEGMENT_STEP = 82;

/** Pass half-width. Wide enough to read as a route inside the narrowest legal gap. */
const PASS_RADIUS = GAME_CONFIG.NODE_WIDTH * 0.028;
/** Disc spacing along a pass. Below 2r, so consecutive discs always overlap. */
const PASS_STEP = PASS_RADIUS * 1.3;

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

const SIDES: readonly MountainSide[] = ["north", "south", "west", "east"];

/** Square bounds of a ring's centre line. */
export function mountainRingBounds(ring: MountainRing): {
  left: number;
  right: number;
  top: number;
  bottom: number;
} {
  const inset = ring === "outer" ? MOUNTAIN_OUTER_INSET : MOUNTAIN_INNER_INSET;
  return {
    left: inset,
    right: GAME_CONFIG.NODE_WIDTH - inset,
    top: inset,
    bottom: GAME_CONFIG.NODE_HEIGHT - inset,
  };
}

/** Whether a mountain node carries ledge rings at all. */
export function hasMountainLedges(nodeId: string): boolean {
  return NODE_BIOMES[nodeId]?.biomeGroup === "mountain";
}

/**
 * Roll the gaps for one ring.
 *
 * Candidates are rejected rather than repaired: a rejected roll costs nothing, whereas
 * nudging a clashing gap into place biases every layout toward the same spacing.
 */
function rollRingGaps(
  rng: () => number,
  countRange: readonly [number, number],
): MountainGap[] {
  const want = Math.max(
    MIN_GAPS_PER_RING,
    Math.floor(range(rng, countRange[0], countRange[1] + 1)),
  );
  const gaps: MountainGap[] = [];
  const openPerSide = new Map<MountainSide, number>();

  for (let attempt = 0; attempt < 200 && gaps.length < want; attempt++) {
    const side = SIDES[Math.floor(rng() * SIDES.length)];
    const span = range(rng, MIN_GAP_SPAN, MAX_GAP_SPAN);
    const centre = range(rng, GAP_EDGE_MARGIN + span / 2, 1 - GAP_EDGE_MARGIN - span / 2);

    if ((openPerSide.get(side) ?? 0) + span > MAX_SIDE_OPEN) continue;
    const clashes = gaps.some(
      (g) =>
        g.side === side &&
        Math.abs(g.centre - centre) < (g.span + span) / 2 + MIN_GAP_SEPARATION,
    );
    if (clashes) continue;

    gaps.push({ side, centre, span });
    openPerSide.set(side, (openPerSide.get(side) ?? 0) + span);
  }

  // The loop can only fall short when the rolls kept clashing. Guarantee the floor
  // directly rather than letting an unlucky node come out sealed.
  while (gaps.length < MIN_GAPS_PER_RING) {
    gaps.push({ side: SIDES[Math.floor(rng() * SIDES.length)], centre: 0.5, span: 0.2 });
  }
  return gaps;
}

/** The single broken circle a dungeon gets instead of two squares. */
function rollDungeonRing(rng: () => number): MountainCircleLayout {
  const radius = range(rng, DUNGEON_RING_MIN_RADIUS, DUNGEON_RING_MAX_RADIUS);
  const want = DUNGEON_MIN_GAPS + Math.floor(rng() * (DUNGEON_MAX_GAPS - DUNGEON_MIN_GAPS + 1));
  const gaps: MountainArc[] = [];
  for (let attempt = 0; attempt < 60 && gaps.length < want; attempt++) {
    const centre = rng() * Math.PI * 2;
    const span = range(rng, DUNGEON_GAP_MIN_ARC, DUNGEON_GAP_MAX_ARC) / radius;
    const clashes = gaps.some((g) => {
      const d = Math.abs(
        ((centre - g.centre + Math.PI * 3) % (Math.PI * 2)) - Math.PI,
      );
      return d < (g.span + span) / 2 + DUNGEON_MIN_GAP_SEPARATION;
    });
    if (clashes) continue;
    gaps.push({ centre, span });
  }
  // The arena must never seal, however the rolls fell.
  if (gaps.length === 0) {
    gaps.push({ centre: rng() * Math.PI * 2, span: DUNGEON_GAP_MIN_ARC / radius });
  }
  return { kind: "circle", radius, gaps, wobble: Math.floor(rng() * 6) };
}

function buildLedgeLayout(nodeId: string): MountainLedgeLayout | null {
  if (!hasMountainLedges(nodeId)) return null;
  // Dungeons draw from their OWN seed rather than sharing the normal-node stream. Two
  // reasons: the arena rolls different quantities entirely, and with only four dungeon
  // nodes in the world a 50/50 entrance count is a hand-countable sample — the shared
  // stream happened to give all four a single entrance, so the "one or two" the layout is
  // supposed to show never appeared. This seed spreads them 2/2/1/2.
  if (NODE_BIOMES[nodeId]?.isDungeon) {
    return rollDungeonRing(mulberry32(hashString(`${nodeId}:mountain-arena:v1`)));
  }
  const rng = mulberry32(hashString(`${nodeId}:mountain-ledges:v1`));
  // Rings roll INDEPENDENTLY. The old table drove both from one entrance list, so the
  // inner gap always sat radially behind the outer one and every node was a straight run
  // to the middle. Decoupling them means arriving in the corridor and having to find the
  // way up, which is the "guarded ascent" the biome is named for.
  const outer = rollRingGaps(rng, OUTER_GAP_RANGE);
  const inner = rollRingGaps(rng, INNER_GAP_RANGE);
  return { kind: "rings", outer, inner, wobble: Math.floor(rng() * 6) };
}

const layoutCache = new Map<string, MountainLedgeLayout | null>();

/** Deterministic ledge layout for a mountain node, or null for any other biome. */
export function getMountainLedgeLayout(nodeId: string): MountainLedgeLayout | null {
  if (layoutCache.has(nodeId)) return layoutCache.get(nodeId) ?? null;
  const layout = buildLedgeLayout(nodeId);
  layoutCache.set(nodeId, layout);
  return layout;
}

/** Whether an angle falls inside one of the dungeon ring's entrances. */
export function mountainArcIsGap(layout: MountainCircleLayout, angle: number): boolean {
  for (const g of layout.gaps) {
    const d = Math.abs(((angle - g.centre + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
    if (d < g.span / 2) return true;
  }
  return false;
}

/** World-space point on the dungeon ring at `angle`, offset radially by `dr`. */
export function mountainRingPoint(
  layout: MountainCircleLayout,
  angle: number,
  dr = 0,
): { x: number; y: number } {
  const r = layout.radius + dr;
  return {
    x: GAME_CONFIG.NODE_WIDTH / 2 + Math.cos(angle) * r,
    y: GAME_CONFIG.NODE_HEIGHT / 2 + Math.sin(angle) * r,
  };
}

/** Segment pitch along the dungeon ring, exported so the collision and art agree. */
export const MOUNTAIN_DUNGEON_SEGMENT_STEP = DUNGEON_SEGMENT_STEP;

/** World-space point at a fraction along one side of a ring. */
function pointOnSide(
  ring: MountainRing,
  side: MountainSide,
  t: number,
): { x: number; y: number } {
  const b = mountainRingBounds(ring);
  switch (side) {
    case "north":
      return { x: b.left + (b.right - b.left) * t, y: b.top };
    case "south":
      return { x: b.left + (b.right - b.left) * t, y: b.bottom };
    case "west":
      return { x: b.left, y: b.top + (b.bottom - b.top) * t };
    case "east":
      return { x: b.right, y: b.top + (b.bottom - b.top) * t };
  }
}

/** Outward unit normal of a ring side. */
function sideNormal(side: MountainSide): { x: number; y: number } {
  switch (side) {
    case "north":
      return { x: 0, y: -1 };
    case "south":
      return { x: 0, y: 1 };
    case "west":
      return { x: -1, y: 0 };
    case "east":
      return { x: 1, y: 0 };
  }
}

/** World-space centre of a gap. */
export function mountainGapPoint(
  ring: MountainRing,
  gap: MountainGap,
): { x: number; y: number } {
  return pointOnSide(ring, gap.side, gap.centre);
}

/**
 * The corridor between the rings, as a square whose perimeter can be walked by a single
 * scalar. Routing along it is what turns two disconnected stubs into one continuous pass.
 */
function corridorBounds(): { left: number; right: number; top: number; bottom: number } {
  const inset = (MOUNTAIN_OUTER_INSET + MOUNTAIN_INNER_INSET) / 2;
  return {
    left: inset,
    right: GAME_CONFIG.NODE_WIDTH - inset,
    top: inset,
    bottom: GAME_CONFIG.NODE_HEIGHT - inset,
  };
}

/** Map a distance along the corridor square's perimeter to a world point. */
function corridorPoint(s: number): { x: number; y: number } {
  const b = corridorBounds();
  const w = b.right - b.left;
  const h = b.bottom - b.top;
  const perimeter = 2 * (w + h);
  let d = ((s % perimeter) + perimeter) % perimeter;
  if (d < w) return { x: b.left + d, y: b.top };
  d -= w;
  if (d < h) return { x: b.right, y: b.top + d };
  d -= h;
  if (d < w) return { x: b.right - d, y: b.bottom };
  d -= w;
  return { x: b.left, y: b.bottom - d };
}

/** Inverse of {@link corridorPoint}: nearest perimeter distance for a world point. */
function corridorParam(x: number, y: number): number {
  const b = corridorBounds();
  const w = b.right - b.left;
  const h = b.bottom - b.top;
  const cx = Math.min(b.right, Math.max(b.left, x));
  const cy = Math.min(b.bottom, Math.max(b.top, y));
  // Snap to whichever edge of the corridor square the point is closest to.
  const dTop = Math.abs(y - b.top);
  const dBottom = Math.abs(y - b.bottom);
  const dLeft = Math.abs(x - b.left);
  const dRight = Math.abs(x - b.right);
  const best = Math.min(dTop, dBottom, dLeft, dRight);
  if (best === dTop) return cx - b.left;
  if (best === dRight) return w + (cy - b.top);
  if (best === dBottom) return w + h + (b.right - cx);
  return 2 * w + h + (b.bottom - cy);
}

/** Overlapping discs along a straight run, with a gentle sway so it is not ruled. */
function runDiscs(
  rng: () => number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): MountainPassDisc[] {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return [];
  const nx = -dy / dist;
  const ny = dx / dist;
  const out: MountainPassDisc[] = [];
  for (let t = 0; t <= dist; t += PASS_STEP) {
    const sway = Math.sin(t / (PASS_RADIUS * 3.4)) * PASS_RADIUS * 0.28;
    out.push({
      x: x0 + (dx * t) / dist + nx * sway,
      y: y0 + (dy * t) / dist + ny * sway,
      r: PASS_RADIUS * range(rng, 0.86, 1.14),
    });
  }
  return out;
}

/** Discs following the corridor between two perimeter positions, the short way round. */
function corridorDiscs(rng: () => number, from: number, to: number): MountainPassDisc[] {
  const b = corridorBounds();
  const perimeter = 2 * (b.right - b.left + b.bottom - b.top);
  let delta = ((to - from) % perimeter + perimeter) % perimeter;
  if (delta > perimeter / 2) delta -= perimeter;
  const steps = Math.max(1, Math.round(Math.abs(delta) / PASS_STEP));
  const out: MountainPassDisc[] = [];
  for (let i = 0; i <= steps; i++) {
    const p = corridorPoint(from + (delta * i) / steps);
    out.push({ x: p.x, y: p.y, r: PASS_RADIUS * range(rng, 0.86, 1.14) });
  }
  return out;
}

function buildPasses(nodeId: string): MountainPassDisc[] {
  const layout = getMountainLedgeLayout(nodeId);
  if (!layout || layout.kind !== "rings") return [];
  // A dungeon's arena court IS its ground layout, and the user's rule for every dungeon in
  // the game is "the court in the middle with the altar, and no path anywhere else". Same
  // exemption forest trails take.
  if (NODE_BIOMES[nodeId]?.isDungeon) return [];

  const rng = mulberry32(hashString(`${nodeId}:mountain-passes:v1`));
  const W = GAME_CONFIG.NODE_WIDTH;
  const H = GAME_CONFIG.NODE_HEIGHT;
  const discs: MountainPassDisc[] = [];

  // Where each inner gap lands in the corridor — the points the outer approaches aim for.
  const innerEntries = layout.inner.map((gap) => {
    const p = mountainGapPoint("inner", gap);
    const n = sideNormal(gap.side);
    return {
      // Just OUTSIDE the inner ring, i.e. in the corridor.
      corridor: corridorParam(p.x + n.x * 60, p.y + n.y * 60),
      point: p,
      normal: n,
    };
  });

  // Every inner gap is worn through to the node centre, so each one reads as a way up
  // rather than as a hole that happens to be there.
  for (const entry of innerEntries) {
    discs.push(
      ...runDiscs(rng, entry.point.x, entry.point.y, W / 2, H / 2),
    );
  }

  for (const gap of layout.outer) {
    const p = mountainGapPoint("outer", gap);
    const n = sideNormal(gap.side);
    // Run out past the node border so the pass leaves the node instead of stopping short
    // of it — the route has to look like it comes from somewhere.
    const outward = { x: p.x + n.x * (MOUNTAIN_OUTER_INSET + PASS_RADIUS), y: p.y + n.y * (MOUNTAIN_OUTER_INSET + PASS_RADIUS) };
    discs.push(...runDiscs(rng, outward.x, outward.y, p.x, p.y));

    // ...then in to the corridor, and along it to the nearest way up.
    const landing = { x: p.x - n.x * 60, y: p.y - n.y * 60 };
    discs.push(...runDiscs(rng, p.x, p.y, landing.x, landing.y));
    if (innerEntries.length === 0) continue;
    const from = corridorParam(landing.x, landing.y);
    let best = innerEntries[0];
    let bestDist = Number.POSITIVE_INFINITY;
    for (const entry of innerEntries) {
      const d = Math.hypot(entry.point.x - p.x, entry.point.y - p.y);
      if (d < bestDist) {
        bestDist = d;
        best = entry;
      }
    }
    discs.push(...corridorDiscs(rng, from, best.corridor));
    const upP = best.point;
    const upN = best.normal;
    discs.push(
      ...runDiscs(rng, upP.x + upN.x * 60, upP.y + upN.y * 60, upP.x, upP.y),
    );
  }

  return discs;
}

const passCache = new Map<string, MountainPassDisc[]>();

/**
 * Deterministic pass layout for a mountain node: the ground worn through the gaps in the
 * ledges, out to the node border and in to the centre.
 */
export function getMountainPasses(nodeId: string): MountainPassDisc[] {
  const hit = passCache.get(nodeId);
  if (hit) return hit;
  const passes = buildPasses(nodeId);
  passCache.set(nodeId, passes);
  return passes;
}

/**
 * Whether a point lies on a node's pass. `pad` grows the pass for callers placing
 * something with a footprint — a boulder should clear the route by its own radius, not
 * merely have its centre outside it.
 */
export function isOnMountainPass(
  nodeId: string,
  x: number,
  y: number,
  pad = 0,
): boolean {
  for (const d of getMountainPasses(nodeId)) {
    const rr = d.r + pad;
    const dx = x - d.x;
    const dy = y - d.y;
    if (dx * dx + dy * dy < rr * rr) return true;
  }
  return false;
}
