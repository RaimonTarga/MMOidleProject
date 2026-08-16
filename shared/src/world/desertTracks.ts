import { GAME_CONFIG } from "../config/gameConfig";
import { NODE_BIOMES, worldNodeExits, type NodeDirection } from "./nodeBiomes";

/**
 * DESERT TRACKS — deterministic per-node caravan tracks scoured out of the sand.
 *
 * A node carries at most ONE, and some carry none: this is a route layout, not a texture.
 * The first cut kept `none` at 5/9 for desolation and the user could not find a road in
 * play at all — the desert entry node had rolled `none`, and so had half the biome. The
 * weights are even now (3/3/3), and the emptiness is carried by the road being thin,
 * broken into patches and often failing outright, rather than by there being no road.
 *
 * The track deliberately does NOT serve the node's own exits. It enters one edge and
 * leaves another at points that have nothing to do with the gates you travel through —
 * it is a road going somewhere else, crossing ground you happen to be standing on. That
 * is the desolation read the whole biome is built around, and it is what separates this
 * from the hub's cardinal roads, which exist precisely to match real topology.
 *
 * Lives in `shared/` for the same reason `forestPaths` does: the ground rendering paints
 * it, the decor scatter keeps off it, and the rock formations in `tallProps` (which carry
 * COLLISION) have to clear it. All three must read one layout rather than each guessing
 * at the others' geometry.
 */

/**
 * Track layouts a desert node can take.
 *
 * `arrival` is the dungeon case and is never rolled: every desert boss node has one, and
 * only desert boss nodes do. See {@link arrivalRoad}.
 */
export type DesertTrackShape = "none" | "through" | "broken" | "arrival";

export interface DesertTrackDisc {
  x: number;
  y: number;
  r: number;
  /** Damping on the renderer's per-corner edge wobble. See `DirtDisc.jitter`. */
  jitter: number;
}

export interface DesertTrackLayout {
  shape: DesertTrackShape;
  discs: readonly DesertTrackDisc[];
}

/**
 * Weighted shape table.
 *
 * Like cave's `PATROLLED_CHANCE`, this is set against the ACTUAL draw over the 15
 * non-dungeon desert nodes rather than as a nominal probability — over that few nodes the
 * draw matters more than the constant. At 5/2/2 it gave 7 tracked nodes and the biome read
 * as having no roads at all; at 3/3/3 it gives 11, including the node you enter the desert
 * through. `none` stays in the mix because unbroken pan is what makes a road read as one.
 */
const SHAPE_WEIGHTS: ReadonlyArray<{ shape: DesertTrackShape; weight: number }> = [
  { shape: "none", weight: 3 },
  { shape: "through", weight: 3 },
  { shape: "broken", weight: 3 },
];

/**
 * Track half-width — 91px, the NARROWEST route line in the game (cave's patrol beat is 82,
 * a forest trail 154, a mountain pass 134).
 *
 * A desert road is read at a distance across open ground, and width is the wrong lever for
 * that: a wide band on sand reads as a discoloured area, while a thin line reads as
 * something that was travelled. Length and edge definition carry it instead — see
 * {@link ROAD_JITTER} and {@link PATCH}.
 */
const TRACK_RADIUS = GAME_CONFIG.NODE_WIDTH * 0.019;
/** Disc spacing WITHIN a patch. Well below 2r, so a patch is solid rather than beaded. */
const TRACK_STEP = TRACK_RADIUS * 1.1;
/**
 * How much of the biome's edge wobble a road disc keeps.
 *
 * Desert's `edgeJitter` is 1.4 CELLS — 90 world px of random per-corner noise, which is
 * most of a 91px road. Left at full strength the line paints as a smudge with a speckled
 * fringe: exactly the "I can see something is there but it does not read as a road"
 * failure. Damped, the same line holds an edge and still is not ruled-straight. The wind
 * pockets on the same node keep the full wobble, because a blob SHOULD look eroded.
 */
const ROAD_JITTER = 0.35;
/** Length of one worn stretch, and of the swept sand between two of them. */
const PATCH = { lo: 700, hi: 1500 } as const;
const GAP = { lo: 220, hi: 520 } as const;
/**
 * How far across the node a `broken` track gets before the sand takes it. Long — the point
 * of the shape is a road that fails, and one that quits in the first third reads as an
 * offcut rather than as a road at all.
 */
const BROKEN_RUN = { lo: 0.6, hi: 0.9 } as const;
/** Fraction of the run over which a fading tail dissolves. */
const FADE_SPAN = 0.28;
/**
 * Where a dungeon arrival road stops, as a fraction of `NODE_WIDTH`.
 *
 * Well INSIDE the arena court (which `dungeonCourt` paints at 0.115 ± 3%), not at its rim.
 * The last disc of a run lands anywhere within one `TRACK_STEP` of the target, so a road
 * aimed at the rim can finish a step short of it and leave a band of sand between road and
 * court — the one seam that would break the shape. Overshooting costs nothing, because the
 * two paint the same material and merge.
 */
const COURT_STOP = 0.08;

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

function pickShape(rng: () => number): DesertTrackShape {
  const total = SHAPE_WEIGHTS.reduce((a, s) => a + s.weight, 0);
  let roll = rng() * total;
  for (const s of SHAPE_WEIGHTS) {
    roll -= s.weight;
    if (roll <= 0) return s.shape;
  }
  return SHAPE_WEIGHTS[SHAPE_WEIGHTS.length - 1].shape;
}

const SIDES = ["north", "south", "west", "east"] as const;
type Side = (typeof SIDES)[number];

/**
 * A point on one edge of the node, overshooting the border so the track visibly runs OFF
 * the node rather than stopping at it.
 *
 * `t` is the position along the side, 0..1. Callers choose it rather than this function,
 * because where it belongs depends on the other end of the track — see `alongEdge`.
 */
function edgePoint(side: Side, t: number): { x: number; y: number } {
  const W = GAME_CONFIG.NODE_WIDTH;
  const H = GAME_CONFIG.NODE_HEIGHT;
  const over = TRACK_RADIUS * 1.5;
  if (side === "north") return { x: W * t, y: -over };
  if (side === "south") return { x: W * t, y: H + over };
  if (side === "west") return { x: -over, y: H * t };
  return { x: W + over, y: H * t };
}

/** The side opposite a given one. */
function opposite(side: Side): Side {
  if (side === "north") return "south";
  if (side === "south") return "north";
  if (side === "west") return "east";
  return "west";
}

/** Which end of `side` (t = 0 or t = 1) touches the corner it shares with `other`. */
function sharedCornerT(side: Side, other: Side): number {
  const corner = {
    north: { west: 0, east: 1 },
    south: { west: 0, east: 1 },
    west: { north: 0, south: 1 },
    east: { north: 0, south: 1 },
  } as const;
  const row = corner[side] as Record<string, number | undefined>;
  return row[other] ?? 0;
}

/**
 * Where along an edge a track meets it.
 *
 * Two constraints, and they pull in different directions:
 *
 *  - Away from the MIDDLE of the side, always. A track entering dead centre of an edge
 *    lines up with the gate there and reads as the node's own road, which is precisely
 *    what this is not.
 *  - Away from the shared CORNER when the two ends sit on adjacent sides. Left free, a
 *    quarter-turn track picks two points either side of one corner and clips it — the
 *    first draft produced a node whose entire road lay off the map except for one disc,
 *    which is worse than having no track at all.
 */
function alongEdge(rng: () => number, side: Side, other: Side): number {
  if (other !== opposite(side)) {
    return sharedCornerT(side, other) === 0
      ? range(rng, 0.58, 0.9)
      : range(rng, 0.1, 0.42);
  }
  return rng() < 0.5 ? range(rng, 0.12, 0.36) : range(rng, 0.64, 0.88);
}

/**
 * The sub-range of a → b that actually lies inside the node, as fractions of the whole
 * segment (Liang-Barsky against the node rect).
 *
 * A `broken` track is a fraction of the ON-NODE crossing rather than of the raw segment,
 * so "it gets three-quarters of the way across" means that on every geometry — including
 * a quarter turn, where the two are not remotely the same thing.
 */
function onNodeSpan(
  ax: number,
  ay: number,
  bx: number,
  by: number,
): { from: number; to: number } {
  let from = 0;
  let to = 1;
  const clip = (p: number, q: number): boolean => {
    if (p === 0) return q >= 0;
    const r = q / p;
    if (p < 0) {
      if (r > to) return false;
      if (r > from) from = r;
    } else {
      if (r < from) return false;
      if (r < to) to = r;
    }
    return true;
  };
  const dx = bx - ax;
  const dy = by - ay;
  const ok =
    clip(-dx, ax) &&
    clip(dx, GAME_CONFIG.NODE_WIDTH - ax) &&
    clip(-dy, ay) &&
    clip(dy, GAME_CONFIG.NODE_HEIGHT - ay);
  return ok && to > from ? { from, to } : { from: 0, to: 1 };
}

/**
 * Discs along a straight run, always overlapping. `fadeFrom` (as a fraction of the run)
 * starts the tail dissolving into sand: radius tapers and discs begin dropping out.
 */
function runDiscs(
  rng: () => number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  fadeFrom = 1,
  fixedSway?: number,
): DesertTrackDisc[] {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return [];
  const nx = -dy / dist;
  const ny = dx / dist;
  // A whole number of half-waves lands the drift back on the line at BOTH ends, which a
  // road that has to arrive somewhere exact needs and a road crossing open sand does not.
  const swayScale = fixedSway ?? range(rng, 0.8, 1.4);
  const out: DesertTrackDisc[] = [];

  const emit = (t: number): void => {
    const f = Math.min(1, t / dist);
    // One long slow wander, unlike forest's short hand-cut sway: this is a line worn by
    // something that travelled straight and drifted, not a path cut around obstacles.
    const drift = Math.sin(f * Math.PI * swayScale) * TRACK_RADIUS * 1.1;
    let taper = 1;
    if (f > fadeFrom) {
      const into = Math.min(1, (f - fadeFrom) / FADE_SPAN);
      taper = 1 - into * 0.55;
    }
    out.push({
      x: x0 + (dx * f),
      y: y0 + (dy * f),
      r: TRACK_RADIUS * range(rng, 0.9, 1.1) * taper,
      jitter: ROAD_JITTER,
    });
    // Applying the drift after the fact keeps the along-line position exact, so a patch
    // boundary lands where it was computed rather than where the sway pushed it.
    const last = out[out.length - 1];
    last.x += nx * drift;
    last.y += ny * drift;
  };

  // A chain of worn stretches with swept sand between them, rather than one unbroken
  // ribbon. Wind does not scour a road evenly, and a dashed line of thin patches carries
  // "something crossed here" better at this width than a continuous band does — a band
  // this thin just reads as a discoloured strip.
  //
  // Both ENDS are always emitted whatever the patch phase: the start has to run off the
  // node edge and the end has to arrive (at the sand, or at a dungeon court).
  let t = 0;
  emit(0);
  while (t < dist) {
    const patchEnd = Math.min(dist, t + range(rng, PATCH.lo, PATCH.hi));
    for (t += TRACK_STEP; t < patchEnd; t += TRACK_STEP) emit(t);
    if (t >= dist) break;
    emit(Math.min(patchEnd, dist));
    t = patchEnd + range(rng, GAP.lo, GAP.hi);
    // The tail of a fading road drops whole stretches, not individual discs: sand takes a
    // road in lengths.
    if (t / dist > fadeFrom && rng() < 0.5) {
      t += range(rng, GAP.lo, GAP.hi) * 1.5;
    }
  }
  emit(dist);
  return out;
}

/** The point where a travel gate meets the node edge. */
function gateAnchor(direction: NodeDirection): { x: number; y: number } {
  const W = GAME_CONFIG.NODE_WIDTH;
  const H = GAME_CONFIG.NODE_HEIGHT;
  if (direction === "north") return { x: W / 2, y: 0 };
  if (direction === "south") return { x: W / 2, y: H };
  if (direction === "west") return { x: 0, y: H / 2 };
  return { x: W, y: H / 2 };
}

/**
 * A DUNGEON road: in from a real travel gate, straight to the arena court, and it stops
 * there. The end of the road.
 *
 * This is the deliberate inversion of every other track in the biome. Those refuse to serve
 * the node's gates because they are going somewhere else; this one comes in exactly the way
 * you do and terminates on the altar, so the road that has been crossing the desert without
 * you finally has a destination — and the destination is the boss.
 *
 * Running it along a centre-to-gate travel lane costs nothing structurally: rock formations
 * are already required to clear those lanes, so nothing can stand in it. And on a dungeon
 * node the decor scatter rejects every disc of the ground layout, so the road ends up swept
 * as well as clear.
 */
function arrivalRoad(rng: () => number, nodeId: string): DesertTrackDisc[] {
  const cx = GAME_CONFIG.NODE_WIDTH / 2;
  const cy = GAME_CONFIG.NODE_HEIGHT / 2;
  const directions = Object.keys(worldNodeExits(nodeId)) as NodeDirection[];
  // Desert dungeons always have at least one exit; the fallback only keeps the geometry
  // total, so a map change can never leave a boss node with a court and no road.
  const gate = gateAnchor(
    directions.length > 0
      ? directions[Math.floor(rng() * directions.length) % directions.length]
      : "south",
  );
  const dx = cx - gate.x;
  const dy = cy - gate.y;
  const dist = Math.hypot(dx, dy) || 1;
  const over = TRACK_RADIUS * 1.5;
  const stop = GAME_CONFIG.NODE_WIDTH * COURT_STOP;
  return runDiscs(
    rng,
    gate.x - (dx / dist) * over,
    gate.y - (dy / dist) * over,
    cx - (dx / dist) * stop,
    cy - (dy / dist) * stop,
    1,
    1,
  );
}

function buildLayout(nodeId: string): DesertTrackLayout {
  const biome = NODE_BIOMES[nodeId];
  if (!biome) return { shape: "none", discs: [] };

  const rng = mulberry32(hashString(`${nodeId}:desert-tracks:v1`));

  // Every other biome exempts its dungeons from its route layout, because a road across an
  // arena fights the one thing a boss node has to read as. Desert takes the opposite line,
  // at the user's request: the road does not cross the court, it ENDS at it.
  if (biome.isDungeon) return { shape: "arrival", discs: arrivalRoad(rng, nodeId) };

  const shape = pickShape(rng);
  if (shape === "none") return { shape, discs: [] };

  const entry = SIDES[Math.floor(rng() * SIDES.length) % SIDES.length];
  // Mostly straight across; sometimes a quarter turn, which is what stops every track in
  // the biome reading as the same line drawn at a different angle.
  const turns = SIDES.filter((s) => s !== entry && s !== opposite(entry));
  const exit: Side = rng() < 0.7 ? opposite(entry) : turns[rng() < 0.5 ? 0 : 1];
  const a = edgePoint(entry, alongEdge(rng, entry, exit));
  const b = edgePoint(exit, alongEdge(rng, exit, entry));

  if (shape === "through") {
    return { shape, discs: runDiscs(rng, a.x, a.y, b.x, b.y) };
  }

  // `broken` — the sand took it. The track arrives from an edge and simply stops, which is
  // a stronger desolation read than a road that works: something used to come this way.
  const span = onNodeSpan(a.x, a.y, b.x, b.y);
  const stop = span.from + range(rng, BROKEN_RUN.lo, BROKEN_RUN.hi) * (span.to - span.from);
  return {
    shape,
    discs: runDiscs(rng, a.x, a.y, a.x + (b.x - a.x) * stop, a.y + (b.y - a.y) * stop, 0.72),
  };
}

const cache = new Map<string, DesertTrackLayout>();

/** Deterministic track layout for a desert node. */
export function getDesertTracks(nodeId: string): DesertTrackLayout {
  const hit = cache.get(nodeId);
  if (hit) return hit;
  const layout = buildLayout(nodeId);
  cache.set(nodeId, layout);
  return layout;
}

/**
 * Whether a point lies on a node's track. `pad` grows it for callers placing something
 * with a footprint — a rock formation should clear the track by its own radius, not
 * merely have its centre outside it.
 */
export function isOnDesertTrack(
  nodeId: string,
  x: number,
  y: number,
  pad = 0,
): boolean {
  const { discs } = getDesertTracks(nodeId);
  for (const d of discs) {
    const rr = d.r + pad;
    const dx = x - d.x;
    const dy = y - d.y;
    if (dx * dx + dy * dy < rr * rr) return true;
  }
  return false;
}
