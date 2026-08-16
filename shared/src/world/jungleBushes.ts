import { GAME_CONFIG } from "../config/gameConfig";
import { NODE_BIOMES } from "./nodeBiomes";

/**
 * JUNGLE BUSHES — deterministic per-node ambush thickets, generated from the node id.
 *
 * Replaces two hand-authored bush sets that covered all fifteen walkable jungle nodes: a
 * four-bush layout and a three-bush layout, alternating, at IDENTICAL coordinates and
 * identical radii every time. Fifteen nodes shared two layouts, so the biome's defining
 * feature was in the same place on every node you ever visited. Same fix mountain ledges
 * and swamp pools already had; jungle was the last biome still on a template table.
 *
 * A thicket is GAMEPLAY, not dressing — it slows the player and doubles every monster's
 * detection radius while they stand in it — so this lives in `shared/`, and the values it
 * feeds into `denseBush` are unchanged. Only WHERE the thickets are and HOW MANY varies.
 *
 * ## Arrangements
 *
 * The thing that makes two nodes feel different is not coordinates, it is the RELATIONSHIP
 * between the cover and the open ground. Four arrangements, rolled per node, so a node has
 * a character rather than a seed:
 *
 *  - `gauntlet` — thickets flank a lane. Crossing the node means running a corridor with
 *    cover on both sides, which is the ambush read at its strongest.
 *  - `ring` — cover around the perimeter, middle open. You fight in the clear and every
 *    approach is through a thicket.
 *  - `cluster` — one dense mass, the rest of the node open. Concentrates the whole
 *    mechanic into a place you can choose to enter or route around.
 *  - `scatter` — spread evenly, the read the authored sets had. Kept because it is the
 *    neutral case the other three are read against.
 */

export type JungleBushArrangement = "gauntlet" | "ring" | "cluster" | "scatter";

export interface JungleBush {
  x: number;
  y: number;
  radius: number;
}

export interface JungleBushLayout {
  arrangement: JungleBushArrangement;
  bushes: readonly JungleBush[];
}

/**
 * Target mix of arrangements across the biome.
 *
 * These are DEALT, not rolled per node — see {@link arrangementForNode}. Scatter is damped
 * because it is the case the other three are read against, not a character of its own.
 */
const ARRANGEMENT_WEIGHTS: ReadonlyArray<{
  arrangement: JungleBushArrangement;
  weight: number;
}> = [
  { arrangement: "gauntlet", weight: 3 },
  { arrangement: "ring", weight: 3 },
  { arrangement: "cluster", weight: 3 },
  { arrangement: "scatter", weight: 2 },
];

/**
 * Arrangements are DEALT from a shuffled deck rather than rolled independently per node,
 * because rolling cannot hit a distribution across a set this small.
 *
 * Measured: an independent roll gave scatter 6, gauntlet 5, ring 2, cluster 2 — against a
 * target of 4/4/4/3. The cause is not the weights. `mulberry32` seeded from a string hash
 * produces a FIRST draw that clumps for structured seeds: 7 of the 15 jungle node ids came
 * out above 0.818, which is precisely the scatter band. Burning a draw only moves the
 * clump (the second draw had nothing above 0.81 at all, which starves scatter instead).
 *
 * Fifteen samples will never look uniform. A deck guarantees the mix, and the player is
 * guaranteed to meet all four arrangements — which is the entire point of adding them.
 *
 * The deal is deterministic: sorted node ids against a fixed-seed Fisher-Yates shuffle, so
 * client and server agree without a byte crossing the wire, exactly like every other layout
 * here. Adding a jungle node reshuffles the biome; nothing persisted depends on it.
 */
function dealArrangements(nodeIds: readonly string[]): Map<string, JungleBushArrangement> {
  const total = ARRANGEMENT_WEIGHTS.reduce((a, x) => a + x.weight, 0);
  // Largest-remainder allocation, so the counts sum to exactly the node count.
  const quotas = ARRANGEMENT_WEIGHTS.map((entry) => {
    const exact = (nodeIds.length * entry.weight) / total;
    return { arrangement: entry.arrangement, whole: Math.floor(exact), frac: exact % 1 };
  });
  let remaining = nodeIds.length - quotas.reduce((a, q) => a + q.whole, 0);
  for (const q of [...quotas].sort((a, b) => b.frac - a.frac)) {
    if (remaining <= 0) break;
    q.whole++;
    remaining--;
  }

  const deck: JungleBushArrangement[] = [];
  for (const q of quotas) {
    for (let i = 0; i < q.whole; i++) deck.push(q.arrangement);
  }
  const rng = mulberry32(hashString("jungle-arrangement-deal:v1"));
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1)) % (i + 1);
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return new Map(nodeIds.map((id, i) => [id, deck[i]]));
}

let dealt: Map<string, JungleBushArrangement> | null = null;

function arrangementForNode(nodeId: string): JungleBushArrangement {
  if (!dealt) {
    const nodeIds = Object.entries(NODE_BIOMES)
      .filter(([, info]) => info.biomeGroup === "jungle" && !info.isDungeon)
      .map(([id]) => id)
      .sort();
    dealt = dealArrangements(nodeIds);
  }
  return dealt.get(nodeId) ?? "scatter";
}

/** Thickets per node. The authored sets ran 3–4; the user asked for 4–6. */
const COUNT = { lo: 4, hi: 6 } as const;
/** Thicket radius. The authored sets used 390–480; widened so size varies too. */
const RADIUS = { lo: 360, hi: 500 } as const;
/**
 * How far a thicket's EDGE must stay from the node centre.
 *
 * The centre is where you spawn and where a fight resolves, so it has to stay legible.
 * 560 is the tightest the authored sets ever came, so this preserves their read rather
 * than inventing a new one.
 */
const CENTRE_CLEAR = 560;
/** A thicket stays fully on the node, with a margin so its art never clips the border. */
const EDGE_PAD = 80;
/** Minimum gap between two thicket edges, except in a `cluster` (which wants them merged). */
const BUSH_GAP = 200;

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

/**
 * Whether a thicket may sit here: on the node, off the centre, and (unless the caller is
 * building a cluster) not merged into a thicket already placed.
 */
function fits(
  bush: JungleBush,
  placed: readonly JungleBush[],
  allowMerge: boolean,
): boolean {
  const W = GAME_CONFIG.NODE_WIDTH;
  const H = GAME_CONFIG.NODE_HEIGHT;
  const pad = bush.radius + EDGE_PAD;
  if (bush.x < pad || bush.y < pad || bush.x > W - pad || bush.y > H - pad) return false;
  const fromCentre = Math.hypot(bush.x - W / 2, bush.y - H / 2) - bush.radius;
  if (fromCentre < CENTRE_CLEAR) return false;
  if (allowMerge) return true;
  return placed.every(
    (p) => Math.hypot(p.x - bush.x, p.y - bush.y) >= p.radius + bush.radius + BUSH_GAP,
  );
}

/** Pull thicket positions from a candidate generator until the node has its quota. */
function fill(
  rng: () => number,
  count: number,
  placed: JungleBush[],
  allowMerge: boolean,
  candidate: (rng: () => number) => JungleBush,
): void {
  for (let attempt = 0; attempt < count * 96 && placed.length < count; attempt++) {
    const bush = candidate(rng);
    if (fits(bush, placed, allowMerge)) placed.push(bush);
  }
}

const randomRadius = (rng: () => number): number => range(rng, RADIUS.lo, RADIUS.hi);

function anywhere(rng: () => number): JungleBush {
  return {
    x: rng() * GAME_CONFIG.NODE_WIDTH,
    y: rng() * GAME_CONFIG.NODE_HEIGHT,
    radius: randomRadius(rng),
  };
}

/**
 * Thickets flanking a lane through the node.
 *
 * The lane runs through the centre on a rolled axis, and thickets are placed in stations
 * along it, offset perpendicular to alternating sides. The offset is what makes it a
 * gauntlet rather than a wall: wide enough that the lane is genuinely walkable, close
 * enough that walking it keeps you inside somebody's doubled detection radius.
 */
function gauntlet(rng: () => number, count: number): JungleBush[] {
  const W = GAME_CONFIG.NODE_WIDTH;
  const H = GAME_CONFIG.NODE_HEIGHT;
  const angle = rng() * Math.PI * 2;
  const ax = Math.cos(angle);
  const ay = Math.sin(angle);
  const nx = -ay;
  const ny = ax;
  const placed: JungleBush[] = [];
  // Stations spread along the lane, skipping the middle so the centre stays open.
  const stations = [-0.78, -0.4, 0.4, 0.78, -0.6, 0.6];
  let side = rng() < 0.5 ? 1 : -1;
  for (const station of stations) {
    if (placed.length >= count) break;
    const along = station * (Math.min(W, H) / 2);
    const offset = range(rng, 780, 1180) * side;
    side = -side;
    const bush = {
      x: W / 2 + ax * along + nx * offset,
      y: H / 2 + ay * along + ny * offset,
      radius: randomRadius(rng),
    };
    if (fits(bush, placed, false)) placed.push(bush);
  }
  fill(rng, count, placed, false, anywhere);
  return placed;
}

/** Cover around the perimeter, middle open: you fight in the clear and every way in is cover. */
function ring(rng: () => number, count: number): JungleBush[] {
  const W = GAME_CONFIG.NODE_WIDTH;
  const H = GAME_CONFIG.NODE_HEIGHT;
  const radius = range(rng, 1450, 1850);
  const phase = rng() * Math.PI * 2;
  const placed: JungleBush[] = [];
  for (let i = 0; i < count; i++) {
    const a = phase + (i / count) * Math.PI * 2 + range(rng, -0.18, 0.18);
    const rr = radius * range(rng, 0.9, 1.1);
    const bush = {
      x: W / 2 + Math.cos(a) * rr,
      y: H / 2 + Math.sin(a) * rr,
      radius: randomRadius(rng),
    };
    if (fits(bush, placed, false)) placed.push(bush);
  }
  fill(rng, count, placed, false, anywhere);
  return placed;
}

/**
 * One dense mass and open ground everywhere else.
 *
 * The mass is the only place thickets are allowed to MERGE — that is the whole point of the
 * arrangement, and it is why `fits` takes the flag rather than enforcing separation
 * globally. One or two outliers keep the node from reading as "a blob and nothing else".
 */
function cluster(rng: () => number, count: number): JungleBush[] {
  const W = GAME_CONFIG.NODE_WIDTH;
  const H = GAME_CONFIG.NODE_HEIGHT;
  const angle = rng() * Math.PI * 2;
  const dist = range(rng, 1250, 1750);
  const cx = W / 2 + Math.cos(angle) * dist;
  const cy = H / 2 + Math.sin(angle) * dist;
  const massSize = Math.max(3, count - 2);
  const placed: JungleBush[] = [];
  fill(rng, massSize, placed, true, (r) => {
    const a = r() * Math.PI * 2;
    const d = range(r, 260, 620);
    return { x: cx + Math.cos(a) * d, y: cy + Math.sin(a) * d, radius: randomRadius(r) };
  });
  // Outliers keep their distance from the mass AND from each other.
  fill(rng, count, placed, false, anywhere);
  return placed;
}

/** Spread evenly — the read the authored sets had, kept as the neutral case. */
function scatter(rng: () => number, count: number): JungleBush[] {
  const placed: JungleBush[] = [];
  fill(rng, count, placed, false, anywhere);
  return placed;
}

function buildLayout(nodeId: string): JungleBushLayout {
  const biome = NODE_BIOMES[nodeId];
  // A jungle dungeon carries NO thickets, at the user's request. Its shape is the hacked
  // clearing; cover inside an arena fought the one thing a boss node has to read as, and
  // the three it used to carry rendered as debug placeholder circles anyway — their ids
  // started with `boss_bush`, which the art scatter (`jungle_bush`) never matched.
  if (!biome || biome.isDungeon) return { arrangement: "scatter", bushes: [] };

  const rng = mulberry32(hashString(`${nodeId}:jungle-bushes:v1`));
  const arrangement = arrangementForNode(nodeId);
  const count = Math.round(range(rng, COUNT.lo, COUNT.hi));
  const bushes =
    arrangement === "gauntlet"
      ? gauntlet(rng, count)
      : arrangement === "ring"
        ? ring(rng, count)
        : arrangement === "cluster"
          ? cluster(rng, count)
          : scatter(rng, count);
  return { arrangement, bushes };
}

const cache = new Map<string, JungleBushLayout>();

/** Deterministic thicket layout for a jungle node. */
export function getJungleBushes(nodeId: string): JungleBushLayout {
  const hit = cache.get(nodeId);
  if (hit) return hit;
  const layout = buildLayout(nodeId);
  cache.set(nodeId, layout);
  return layout;
}

/**
 * Trees per node, decided by the thicket arrangement.
 *
 * The two levers are deliberately correlated rather than rolled independently. A `cluster`
 * node already has all its cover in one mass, so a full quota of trees on top would bury
 * the open ground that makes the mass mean anything; a `scatter` node has thin cover
 * everywhere and can carry a proper canopy. Independent rolls would average this out and
 * the node would read as "some trees, some bushes" either way.
 */
export function jungleTreeTarget(nodeId: string): number {
  const { arrangement } = getJungleBushes(nodeId);
  const rng = mulberry32(hashString(`${nodeId}:jungle-tree-count:v1`));
  const band =
    arrangement === "cluster"
      ? { lo: 6, hi: 9 }
      : arrangement === "ring"
        ? { lo: 7, hi: 10 }
        : arrangement === "gauntlet"
          ? { lo: 8, hi: 11 }
          : { lo: 10, hi: 13 };
  return Math.round(range(rng, band.lo, band.hi));
}
