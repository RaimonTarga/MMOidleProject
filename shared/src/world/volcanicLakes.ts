import { GAME_CONFIG } from "../config/gameConfig";

/**
 * VOLCANIC LAVA LAKES — deterministic per-node lava, generated from the node id.
 *
 * Replaces two authored vent layouts that covered all twelve walkable volcanic nodes,
 * alternating by `featureVariant` at identical coordinates: a four-vent set and a
 * three-vent set, so the lava sat in the same two arrangements everywhere. Same fix
 * mountain, swamp and jungle already had.
 *
 * Deliberately NOT the swamp pool generator, though it borrows its best idea. Swamp wants
 * a FIELD — many pools with visible lanes between them, and `MIN_POOLS = 3` exists to stop
 * the budget being eaten by two enormous bogs. Volcano wants exactly what swamp guards
 * against: **few and big**. A caldera should have lava LAKES you route around, not a
 * scattering of pools you step between. So the radius floor is high, the pool floor is low,
 * and the budget is roughly double swamp's.
 *
 * The idea it does borrow is **coverage-first**: pick the total area budget, then let the
 * COUNT fall out of it. Picking a count first lets total lava swing wildly between nodes,
 * and lava is a damage zone — total coverage is the number that decides whether a node is
 * a hazard to route around or a node you cannot fight on.
 */

export interface VolcanicLake {
  x: number;
  y: number;
  radius: number;
}

/**
 * Fraction of the node the lava may cover.
 *
 * The authored layouts sat at 6.6-9.0%. This is roughly double, at the user's explicit
 * request for more lava — and it is a BALANCE number, not only a look one, because every
 * point of it is floor that burns. It is the first constant to move if volcanic nodes play
 * too punishingly.
 */
const MIN_COVERAGE = 0.14;
const MAX_COVERAGE = 0.175;

/** Lakes stay this far inside the node so they never sit on a gate band. */
const EDGE_MARGIN = GAME_CONFIG.NODE_WIDTH * 0.075;
/** Nothing may encroach on the spawn point at node centre. */
const CENTRE_CLEAR = GAME_CONFIG.NODE_WIDTH * 0.115;
/** Dungeons keep a far bigger arena clear — the lava rings the boss fight. */
const DUNGEON_CENTRE_CLEAR = GAME_CONFIG.NODE_WIDTH * 0.26;
/**
 * Minimum gap between two lake edges.
 *
 * Wider than swamp's, and for the opposite reason. Swamp needs lanes between pools so the
 * field stays crossable; here there are only two or three lakes, so two of them touching
 * would not read as "one bigger lake", it would read as a mistake — a figure-eight nobody
 * drew on purpose.
 */
const MIN_LAKE_GAP = GAME_CONFIG.NODE_WIDTH * 0.06;

/**
 * Lakes per node — exactly this many, not a floor.
 *
 * Started at 2, which is what "big but few" suggested on paper. Two did not read as a
 * caldera in play (the user's call), so it is 3, with the COVERAGE budget held where it was.
 * That distinction matters: raising the count without touching the budget makes each lake
 * smaller rather than making the node hotter, so this was a composition change and not a
 * balance one.
 */
const LAKE_COUNT = 3;
/**
 * A dungeon uses the same count, at a smaller size — which is also what the authored boss
 * layouts did (three vents ringing a clear arena). At four, the even share fell below the
 * dungeon radius floor and every lake clamped to it, which quietly inflated dungeon
 * coverage and threw away the size variation the shares exist to create.
 */
const DUNGEON_LAKES = 3;
/**
 * How unevenly the area budget is split between lakes, as a fraction either side of an even
 * share. At 0.45 the largest lake is roughly 1.6x the area of the smallest, which is enough
 * that the three read as a landscape rather than as one shape stamped three times.
 */
const SHARE_SPREAD = 0.45;

const MIN_RADIUS = GAME_CONFIG.NODE_WIDTH * 0.095;
const MAX_RADIUS = GAME_CONFIG.NODE_WIDTH * 0.17;

/**
 * Dungeons get their own, SMALLER band — and they need it for a geometric reason, not an
 * aesthetic one.
 *
 * A lake must fit between the arena clearance and the node edge. On a square node the
 * furthest a lake centre can sit from the middle is `sqrt(2) * (half - edgeMargin - r)`,
 * in a corner. Against a 0.26 arena clearance that leaves room for nothing above r≈678 —
 * so the normal band produced **one lake on the T3 dungeon and ZERO on the T4 one**. A
 * "few and big" generator simply cannot satisfy a large centre exclusion on a square node.
 *
 * The fix is smaller lakes rather than a smaller arena: the authored dungeon layouts were
 * r 390–450 ringing the edges with the centre clear, which is the read the boss exam wants.
 */
const DUNGEON_MIN_RADIUS = GAME_CONFIG.NODE_WIDTH * 0.083;
const DUNGEON_MAX_RADIUS = GAME_CONFIG.NODE_WIDTH * 0.117;
/** Dungeon coverage stays near the authored 6.6–7.6%: the arena is the fight, not the lava. */
const DUNGEON_MIN_COVERAGE = 0.07;
const DUNGEON_MAX_COVERAGE = 0.1;

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

const cache = new Map<string, VolcanicLake[]>();

/**
 * Lava lakes for a volcanic node. Deterministic from the node id, so the server's damage
 * zones and the client's painted lava are the same shapes without any sync — the functional
 * Wang sheet paints exactly these feature footprints.
 */
export function generateVolcanicLakes(
  nodeId: string,
  isDungeon: boolean,
): VolcanicLake[] {
  const cached = cache.get(nodeId);
  if (cached) return cached;

  const rng = mulberry32(hashString(`${nodeId}:volcanic-lakes:v1`));
  const W = GAME_CONFIG.NODE_WIDTH;
  const H = GAME_CONFIG.NODE_HEIGHT;
  const area = W * H;
  const centreClear = isDungeon ? DUNGEON_CENTRE_CLEAR : CENTRE_CLEAR;

  const budget = area * (isDungeon
    ? range(rng, DUNGEON_MIN_COVERAGE, DUNGEON_MAX_COVERAGE)
    : range(rng, MIN_COVERAGE, MAX_COVERAGE));

  // Radii are DEALT from the budget rather than drawn independently, because drawing them
  // independently collapses their variance. The draw range is [MIN_RADIUS, budget solved
  // for LAKE_COUNT], and once the count is fixed those two numbers are nearly the same —
  // measured 607/623/654 on one node, a spread under 8%. Three near-identical circles read
  // as a repeated stamp.
  //
  // Splitting the AREA budget into uneven shares instead gives a big lake, a middling one
  // and a small one whose total is still exactly the budget. Coverage stays a controlled
  // number and the composition stops looking generated.
  const count = isDungeon ? DUNGEON_LAKES : LAKE_COUNT;
  const weights: number[] = [];
  let weightSum = 0;
  for (let i = 0; i < count; i++) {
    const w = range(rng, 1 - SHARE_SPREAD, 1 + SHARE_SPREAD);
    weights.push(w);
    weightSum += w;
  }
  const minRadius = isDungeon ? DUNGEON_MIN_RADIUS : MIN_RADIUS;
  const maxRadius = isDungeon ? DUNGEON_MAX_RADIUS : MAX_RADIUS;
  const radii = weights
    .map((w) => {
      const share = (budget * w) / weightSum;
      return Math.min(maxRadius, Math.max(minRadius, Math.sqrt(share / Math.PI)));
    })
    // Largest first: a big lake has the fewest legal positions, so placing it while the
    // node is still empty is what stops it being the one that fails to fit.
    .sort((a, b) => b - a);

  const lakes: VolcanicLake[] = [];
  for (const radius of radii) {
    for (let attempt = 0; attempt < 240; attempt++) {
      const x = range(rng, EDGE_MARGIN + radius, W - EDGE_MARGIN - radius);
      const y = range(rng, EDGE_MARGIN + radius, H - EDGE_MARGIN - radius);

      if (Math.hypot(x - W / 2, y - H / 2) < centreClear + radius) continue;

      let clashes = false;
      for (const lake of lakes) {
        if (Math.hypot(x - lake.x, y - lake.y) < lake.radius + radius + MIN_LAKE_GAP) {
          clashes = true;
          break;
        }
      }
      if (clashes) continue;

      lakes.push({ x, y, radius });
      break;
    }
  }

  cache.set(nodeId, lakes);
  return lakes;
}
