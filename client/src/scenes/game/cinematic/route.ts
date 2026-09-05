/**
 * Pick the camera path from where the monsters ACTUALLY are, at capture time.
 *
 * The framing problem this solves is arithmetic, not taste. A zoom-1 frame is
 * about 4% of a 4800-square node, and a Tier-1 node holds 17-52 monsters spread
 * roughly uniformly, so an arbitrary frame averages one or two — and three of
 * four frames of the first authored clip contained none at all. Monsters also
 * wander, so no hand-authored waypoint can be relied on to still have anything
 * standing on it by the time the take rolls.
 *
 * So the path is chosen from the live roster once the node is staged and stable.
 * Candidates are STRAIGHT lines rather than a free walk between clusters: a
 * cluster-hopping polyline maximises monsters and looks like a camera hunting
 * for them, while a straight drift past the best part of the node keeps the
 * calm flyover the landing page wants. Smoothness is a constraint here, not a
 * thing to be traded off.
 *
 * Pure and side-effect free, so it is testable and so `camera.ts` stays about
 * driving a path rather than choosing one.
 */

export interface RoutePoint {
  x: number;
  y: number;
}

export interface RouteWaypoint extends RoutePoint {
  holdMs?: number;
}

export interface RouteOptions {
  /** Node extent, world px. Square in practice. */
  nodeWidth: number;
  nodeHeight: number;
  /** Camera view size in WORLD px — what a frame actually covers. */
  viewWidth: number;
  viewHeight: number;
  /** Total travel distance of the path, world px. */
  pathLength: number;
  /** Hold at the two richest waypoints, ms. */
  holdMs: number;
}

/** Waypoints per path, including both ends. Three segments reads as a drift. */
const WAYPOINTS = 4;
/** Path start candidates per axis. */
const STARTS_PER_AXIS = 9;
/** Positions sampled along a candidate when scoring it. */
const SAMPLES = 24;
/**
 * Keep the shot off the node edge. The camera clamps to peek bounds near a
 * boundary, so a path that runs into one stops moving while the clip thinks it
 * is still travelling — and the frame fills with unpainted neighbour space.
 */
const EDGE_MARGIN = 240;

/** The eight compass directions. A straight line in any of them reads as a drift. */
const DIRECTIONS: readonly RoutePoint[] = [
  { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 },
  { x: Math.SQRT1_2, y: Math.SQRT1_2 }, { x: -Math.SQRT1_2, y: Math.SQRT1_2 },
  { x: Math.SQRT1_2, y: -Math.SQRT1_2 }, { x: -Math.SQRT1_2, y: -Math.SQRT1_2 },
];

/**
 * How much one monster at a given camera centre is worth.
 *
 * Zero outside the frame, and falling off toward the edges inside it: a creature
 * crossing the middle of the shot is the point, one clipping the corner for two
 * frames is not. The falloff is what stops the scorer preferring a path that
 * grazes many monsters over one that properly features a few.
 */
function frameValue(monster: RoutePoint, centre: RoutePoint, opts: RouteOptions): number {
  const dx = Math.abs(monster.x - centre.x) / (opts.viewWidth / 2);
  const dy = Math.abs(monster.y - centre.y) / (opts.viewHeight / 2);
  if (dx >= 1 || dy >= 1) return 0;
  return (1 - dx * dx) * (1 - dy * dy);
}

/** Total value of a camera centre: every monster it frames, weighted by position. */
function centreValue(points: readonly RoutePoint[], centre: RoutePoint, opts: RouteOptions): number {
  let sum = 0;
  for (const p of points) sum += frameValue(p, centre, opts);
  return sum;
}

function clampCentre(point: RoutePoint, opts: RouteOptions): RoutePoint {
  const halfW = opts.viewWidth / 2 + EDGE_MARGIN;
  const halfH = opts.viewHeight / 2 + EDGE_MARGIN;
  return {
    x: Math.min(opts.nodeWidth - halfW, Math.max(halfW, point.x)),
    y: Math.min(opts.nodeHeight - halfH, Math.max(halfH, point.y)),
  };
}

function insideBounds(point: RoutePoint, opts: RouteOptions): boolean {
  const halfW = opts.viewWidth / 2 + EDGE_MARGIN;
  const halfH = opts.viewHeight / 2 + EDGE_MARGIN;
  return point.x >= halfW && point.x <= opts.nodeWidth - halfW
    && point.y >= halfH && point.y <= opts.nodeHeight - halfH;
}

/**
 * The best straight drift through the node's population.
 *
 * Returns null when the node has nothing to film, so the caller can fall back to
 * the clip's authored path rather than shooting a line chosen from no evidence.
 */
export function planPopulationRoute(
  points: readonly RoutePoint[],
  opts: RouteOptions,
): RouteWaypoint[] | null {
  if (points.length === 0) return null;

  let best: { from: RoutePoint; to: RoutePoint; score: number } | null = null;
  const halfW = opts.viewWidth / 2 + EDGE_MARGIN;
  const halfH = opts.viewHeight / 2 + EDGE_MARGIN;
  const spanX = opts.nodeWidth - 2 * halfW;
  const spanY = opts.nodeHeight - 2 * halfH;

  for (let ix = 0; ix < STARTS_PER_AXIS; ix += 1) {
    for (let iy = 0; iy < STARTS_PER_AXIS; iy += 1) {
      const from: RoutePoint = {
        x: halfW + (spanX * ix) / (STARTS_PER_AXIS - 1),
        y: halfH + (spanY * iy) / (STARTS_PER_AXIS - 1),
      };
      for (const dir of DIRECTIONS) {
        const to: RoutePoint = {
          x: from.x + dir.x * opts.pathLength,
          y: from.y + dir.y * opts.pathLength,
        };
        // Reject rather than clamp: a clamped candidate is a different, shorter
        // path than the one being scored, and would win on a technicality.
        if (!insideBounds(to, opts)) continue;
        let score = 0;
        for (let s = 0; s < SAMPLES; s += 1) {
          const t = s / (SAMPLES - 1);
          score += centreValue(points, {
            x: from.x + (to.x - from.x) * t,
            y: from.y + (to.y - from.y) * t,
          }, opts);
        }
        if (!best || score > best.score) best = { from, to, score };
      }
    }
  }
  if (!best || best.score <= 0) return null;

  // Lay the waypoints along the winning line, then hold on the two richest of
  // the interior ones — a beat on a creature rather than a uniform slide past it.
  const path: RouteWaypoint[] = [];
  for (let i = 0; i < WAYPOINTS; i += 1) {
    const t = i / (WAYPOINTS - 1);
    path.push(clampCentre({
      x: best.from.x + (best.to.x - best.from.x) * t,
      y: best.from.y + (best.to.y - best.from.y) * t,
    }, opts));
  }
  const interior = path
    .map((point, index) => ({ index, value: centreValue(points, point, opts) }))
    .filter((entry) => entry.index > 0 && entry.index < path.length - 1)
    .sort((a, b) => b.value - a.value);
  for (const entry of interior.slice(0, 2)) path[entry.index].holdMs = opts.holdMs;
  return path;
}
