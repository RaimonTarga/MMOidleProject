import { GAME_CONFIG } from "../config/gameConfig";
import { NODE_BIOMES, worldNodeExits, type NodeDirection } from "./nodeBiomes";

/**
 * CAVE PATROLS AND RITUAL SITES — deterministic per-node routes, generated from the node id.
 *
 * ## What was broken
 *
 * Caves already had a `patrol-path` ground material, monsters with patrol loops, and a
 * server-side patrol assignment. What they did not have was any relationship between the
 * three. `CAVE_PATROL_ROUTES` was a module-level constant with no `nodeId` in it — the same
 * routes on all 21 cave nodes — running a 4080px rectangle 360px from the node edges, while
 * the floor painted a wandering trail or a ~700px ring through the middle. The guards walked
 * the rim and the painted path went somewhere else entirely.
 *
 * The SHAPE those constants described was right: a circuit with arms cutting across it. What
 * was missing was that anything drew it, and that it varied per node. Both are fixed here.
 *
 * This module is the single layout both ends now read, exactly as `mountainPasses` is for
 * ledges and `forestPaths` is for trails: the worn path on the floor IS the route the troll
 * walks.
 *
 * ## Why it lives in `shared/`
 *
 * Three consumers that must agree, in three packages:
 *  - the server assigns brutes to routes and spawns them on the anchor,
 *  - the client paints the ground from the same discs,
 *  - the tall rock formations (which are COLLISION) have to keep off them, or a boulder
 *    ends up standing in the middle of the painted path.
 *
 * ## Patrolled vs. wild
 *
 * The decision of whether a cave is patrolled at all is made HERE rather than falling out of
 * the client's ground-material roll, and the ground then follows it. That inverts the old
 * relationship on purpose: a cave is held territory or it is not, and the floor reports that
 * fact. Cave has ONE sheet, whose upper material is brown worn earth, so a patrolled node
 * has the beat worn into its floor and a wild one is unbroken stone with no route, no
 * painted path, and brutes that roam instead of walking a beat.
 */

export interface CavePatrolWaypoint {
  x: number;
  y: number;
}

export interface CavePatrolRoute {
  /** Where the brute assigned to this route spawns — the first waypoint. */
  anchor: CavePatrolWaypoint;
  /** Absolute node coordinates. */
  waypoints: CavePatrolWaypoint[];
  /** The circuit walks its loop; each cross arm is walked back and forth. */
  mode: "loop" | "pingpong";
}

export interface CavePatrolDisc {
  x: number;
  y: number;
  r: number;
}

export interface CavePatrolLayout {
  /** False on a wild cave: no routes, no painted path, brutes roam. */
  patrolled: boolean;
  routes: CavePatrolRoute[];
  /** The worn ground along every route, for the ground painter. */
  discs: CavePatrolDisc[];
}

/**
 * Share of cave nodes that are held territory. Set against the actual roll rather than as a
 * nominal probability: over eighteen nodes the draw matters more than the constant, and 0.66
 * happened to leave only three wild caves — too few for the contrast that makes a patrolled
 * one read as held. This lands 11/7.
 */
const PATROLLED_CHANCE = 0.53;

/**
 * How far the circuit sits inside the node. Varied per node so two caves are not the same
 * beat, but the SHAPE is fixed: this is the biome's signature, not something to roll.
 */
const MIN_SQUARE_INSET = GAME_CONFIG.NODE_WIDTH * 0.145;
const MAX_SQUARE_INSET = GAME_CONFIG.NODE_WIDTH * 0.215;

/**
 * How far the crossing point drifts off dead centre. Enough that the two arms are not a
 * perfect cross-hair, small enough that they still read as meeting in the middle.
 */
const CROSS_OFFSET = GAME_CONFIG.NODE_WIDTH * 0.035;

/**
 * Path half-width. Deliberately narrower than a forest trail (0.032) or a mountain pass
 * (0.028): those are routes a whole biome moves along, whereas this is the line worn by a
 * handful of individual guards walking the same beat.
 */
const PATH_RADIUS = GAME_CONFIG.NODE_WIDTH * 0.017;
/** Disc spacing along a leg. Below 2r, so consecutive discs always overlap. */
const PATH_STEP = PATH_RADIUS * 1.3;

// --- ritual site (cave dungeons) -------------------------------------------------------

/**
 * Radius of the standing-stone ring around a cave dungeon's altar. Outside the painted
 * court (radius ~552) with room to fight between the two.
 */
const RITUAL_RING_MIN_RADIUS = GAME_CONFIG.NODE_WIDTH * 0.235;
const RITUAL_RING_MAX_RADIUS = GAME_CONFIG.NODE_WIDTH * 0.275;

/**
 * Angular half-width of the break a spoke cuts in the stone ring.
 *
 * Sized so the nearest standing stone clears the centre-to-gate travel lane by the
 * TALL_PROP_ROUTE_CLEARANCE the rest of the biome respects: asin((320 + stone) / radius) is
 * about 0.30rad at this ring size, so 0.36 leaves margin at the smallest legal radius.
 */
const SPOKE_GAP_HALF_ANGLE = 0.36;

/**
 * Total approach paths a ritual site converges. Enough to read as deliberate, few enough
 * that the stone ring is still an enclosure.
 */
const RITUAL_SPOKES = 4;

/** Compass headings in node space: y grows downward, so north is negative. */
const EXIT_ANGLES: Readonly<Record<NodeDirection, number>> = {
  north: -Math.PI / 2,
  south: Math.PI / 2,
  west: Math.PI,
  east: 0,
};

export interface CaveRitualSite {
  radius: number;
  /** Angles the approach paths run along, which are also the breaks in the ring. */
  spokes: number[];
  /** Angles that carry a standing stone. */
  stones: number[];
}

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

function isCave(nodeId: string): boolean {
  return NODE_BIOMES[nodeId]?.biomeGroup === "cave";
}

/** Overlapping discs along one leg of a loop. */
function legDiscs(
  rng: () => number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): CavePatrolDisc[] {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return [];
  const nx = -dy / dist;
  const ny = dx / dist;
  const out: CavePatrolDisc[] = [];
  for (let t = 0; t <= dist; t += PATH_STEP) {
    // A worn beat wavers; a surveyed one does not.
    const sway = Math.sin(t / (PATH_RADIUS * 3.1)) * PATH_RADIUS * 0.26;
    out.push({
      x: x0 + (dx * t) / dist + nx * sway,
      y: y0 + (dy * t) / dist + ny * sway,
      r: PATH_RADIUS * range(rng, 0.88, 1.12),
    });
  }
  return out;
}

function buildLayout(nodeId: string): CavePatrolLayout {
  const empty: CavePatrolLayout = { patrolled: false, routes: [], discs: [] };
  if (!isCave(nodeId)) return empty;
  // A dungeon's layout is its ritual site, not a patrol beat.
  if (NODE_BIOMES[nodeId]?.isDungeon) return empty;

  const rng = mulberry32(hashString(`${nodeId}:cave-patrols:v2`));
  if (rng() >= PATROLLED_CHANCE) return empty;

  const W = GAME_CONFIG.NODE_WIDTH;
  const H = GAME_CONFIG.NODE_HEIGHT;

  // The beat: an outer circuit with two arms crossing through the middle. One shape for the
  // whole biome, because it is what makes a cave read as HELD — a garrison walks a circuit
  // and cuts across it, and the floor should show both. Only the proportions vary per node.
  const inset = range(rng, MIN_SQUARE_INSET, MAX_SQUARE_INSET);
  const left = inset;
  const right = W - inset;
  const top = inset;
  const bottom = H - inset;
  const cx = W / 2 + range(rng, -CROSS_OFFSET, CROSS_OFFSET);
  const cy = H / 2 + range(rng, -CROSS_OFFSET, CROSS_OFFSET);

  const corners: CavePatrolWaypoint[] = [
    { x: left, y: top },
    { x: right, y: top },
    { x: right, y: bottom },
    { x: left, y: bottom },
  ];

  const routes: CavePatrolRoute[] = [
    // The circuit, walked as a closed loop.
    { anchor: { ...corners[0] }, waypoints: corners.map((c) => ({ ...c })), mode: "loop" },
    // Each arm is walked back and forth, so its guard meets you head-on rather than
    // always arriving from the same side.
    {
      anchor: { x: left, y: cy },
      waypoints: [
        { x: left, y: cy },
        { x: cx, y: cy },
        { x: right, y: cy },
      ],
      mode: "pingpong",
    },
    {
      anchor: { x: cx, y: top },
      waypoints: [
        { x: cx, y: top },
        { x: cx, y: cy },
        { x: cx, y: bottom },
      ],
      mode: "pingpong",
    },
  ];

  const discs: CavePatrolDisc[] = [];
  for (let i = 0; i < corners.length; i++) {
    const a = corners[i];
    const b = corners[(i + 1) % corners.length];
    discs.push(...legDiscs(rng, a.x, a.y, b.x, b.y));
  }
  discs.push(...legDiscs(rng, left, cy, right, cy));
  discs.push(...legDiscs(rng, cx, top, cx, bottom));

  return { patrolled: true, routes, discs };
}

const layoutCache = new Map<string, CavePatrolLayout>();

/** Deterministic patrol layout for a cave node. Wild caves come back unpatrolled. */
export function getCavePatrols(nodeId: string): CavePatrolLayout {
  const hit = layoutCache.get(nodeId);
  if (hit) return hit;
  const layout = buildLayout(nodeId);
  layoutCache.set(nodeId, layout);
  return layout;
}

/**
 * Whether a point lies on a cave node's patrol path. `pad` grows it for callers placing
 * something with a footprint — a rock formation should clear the beat by its own radius,
 * not merely have its anchor outside it.
 */
export function isOnCavePatrolPath(
  nodeId: string,
  x: number,
  y: number,
  pad = 0,
): boolean {
  const { discs } = getCavePatrols(nodeId);
  for (const d of discs) {
    const rr = d.r + pad;
    const dx = x - d.x;
    const dy = y - d.y;
    if (dx * dx + dy * dy < rr * rr) return true;
  }
  return false;
}

const ritualCache = new Map<string, CaveRitualSite | null>();

/**
 * The standing-stone ring and approach spokes for a cave dungeon.
 *
 * A ring of stones with the paths cutting through it reads as a place someone BUILT, which
 * is the one thing a cave boss room can be that a cave corridor cannot. The stones are the
 * biome's existing tall rock formations, repositioned rather than newly authored, so they
 * keep the trunk collision they already carry.
 */
export function getCaveRitualSite(nodeId: string): CaveRitualSite | null {
  if (ritualCache.has(nodeId)) return ritualCache.get(nodeId) ?? null;
  let site: CaveRitualSite | null = null;
  if (isCave(nodeId) && NODE_BIOMES[nodeId]?.isDungeon) {
    const rng = mulberry32(hashString(`${nodeId}:cave-ritual:v1`));
    const radius = range(rng, RITUAL_RING_MIN_RADIUS, RITUAL_RING_MAX_RADIUS);
    // Spokes run to the node's REAL exits rather than at a rolled rotation. Two reasons,
    // and the second is not optional: it ties the site to the map's topology so the paths
    // lead where you actually walk, and it keeps the stone ring off the centre-to-gate
    // travel lanes that every other rock formation in the game is required to clear.
    const spokes = (Object.keys(worldNodeExits(nodeId)) as NodeDirection[]).map(
      (d) => EXIT_ANGLES[d],
    );
    // Cave dungeons are dead ends with one or two exits, and a site with a single path
    // reads as a corridor rather than as somewhere converged upon. Top up to RITUAL_SPOKES
    // with diagonals — they cannot threaten the cardinal travel lanes, so they are free.
    const diagonals = [Math.PI / 4, (3 * Math.PI) / 4, (-3 * Math.PI) / 4, -Math.PI / 4];
    for (let i = diagonals.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [diagonals[i], diagonals[j]] = [diagonals[j], diagonals[i]];
    }
    for (const angle of diagonals) {
      if (spokes.length >= RITUAL_SPOKES) break;
      spokes.push(angle);
    }
    // Stones sit at an even pitch around the ring, minus those a spoke passes through.
    // The pitch is rotated per node so two sites never raise identical stones.
    const phase = rng() * Math.PI * 2;
    const slots = 14;
    const stones: number[] = [];
    for (let i = 0; i < slots; i++) {
      const angle = phase + ((i + 0.5) / slots) * Math.PI * 2;
      const blocked = spokes.some((s) => {
        const d = Math.abs(((angle - s + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
        return d < SPOKE_GAP_HALF_ANGLE;
      });
      if (!blocked) stones.push(angle);
    }
    site = { radius, spokes, stones };
  }
  ritualCache.set(nodeId, site);
  return site;
}

/** World-space point on the ritual ring at `angle`, offset radially by `dr`. */
export function caveRitualPoint(
  site: CaveRitualSite,
  angle: number,
  dr = 0,
): { x: number; y: number } {
  const r = site.radius + dr;
  return {
    x: GAME_CONFIG.NODE_WIDTH / 2 + Math.cos(angle) * r,
    y: GAME_CONFIG.NODE_HEIGHT / 2 + Math.sin(angle) * r,
  };
}
