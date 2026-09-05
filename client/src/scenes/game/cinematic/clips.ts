/**
 * Authored camera paths for the prerecorded landing footage.
 *
 * Data only. These are consumed by `camera.ts` during a dev-only capture run
 * (`?cinematic=<id>`) and never in a normal session — the landing page ships the
 * ENCODED VIDEO, not this. Nothing here reaches a visitor's browser at runtime.
 *
 * Coordinates are node coords (0..NODE_WIDTH/HEIGHT, currently 4800 square) and
 * name the camera CENTRE, not its corner.
 */

export interface CinematicWaypoint {
  x: number;
  y: number;
  /** Linger here before travelling on. Holds add to the clip's total length. */
  holdMs?: number;
}

export interface CinematicClip {
  id: string;
  /** World node to film. Must exist in NODE_BIOMES — guarded by the smoke test. */
  nodeId: string;
  /**
   * Camera centre waypoints, walked in order.
   *
   * For a `population` clip this is the FALLBACK, used only if the node turns
   * out to have nothing to film. The shot that ships is routed at capture time.
   */
  path: readonly CinematicWaypoint[];
  /** Time spent MOVING across the whole path. Holds are added on top. */
  travelMs: number;
  /**
   * How the path is chosen. `authored` walks `path` exactly; `population` picks
   * the best straight drift through the monsters actually standing in the node
   * when the take rolls (see `route.ts`).
   *
   * Population routing exists because the framing is arithmetic: a zoom-1 frame
   * covers 4% of a node, so a fixed path through a uniformly-scattered roster
   * averages one or two creatures and frequently none at all.
   */
  route?: 'authored' | 'population';
  /** Population routing: travel distance, world px. */
  pathLength?: number;
  /** Population routing: hold at each of the two richest waypoints, ms. */
  routeHoldMs?: number;
}

/**
 * The world drift — the first and, for now, only clip.
 *
 * The path runs a long lateral arc and eases back toward its start, so the loop
 * seam is a short crossfade rather than a cut. The anchor player is parked
 * wherever `rightmostEntranceTarget` drops it (the node's east entrance band);
 * the path stays clear of that on purpose so no character is in frame.
 *
 * Node and waypoints were chosen by capturing stills of candidate Tier-1 Plains
 * and Forest nodes with `pnpm landing:scout` and comparing them — see
 * `docs/landing-cinematic-current-state.md`.
 */
export const CINEMATIC_CLIPS: readonly CinematicClip[] = [
  {
    id: 'world-drift',
    nodeId: 'node-t1-forest-02',
    travelMs: 12_000,
    path: [
      { x: 3300, y: 3600 },
      { x: 2600, y: 3620, holdMs: 800 },
      { x: 1900, y: 3640, holdMs: 800 },
      { x: 1300, y: 3560 },
    ],
  },
];

/**
 * Comparison candidates. The landing page rotates through a chosen SUBSET of
 * these; capturing one does not ship it. Each takes a deliberately different
 * palette, and the Tier-1 set is routed at its node's live population.
 */
/**
 * One drift per Tier-1 biome, all population-routed.
 *
 * The node picked from each biome is its `swarming` one — the modifier raises
 * the roster, and density is the single biggest lever on whether a frame has
 * anything alive in it. Measured populations: plains 52, forest 40, mountain 26,
 * swamp 22, cave 17.
 *
 * These are deliberately identical in shape. The variable under test is the
 * BIOME, so travel time, path length and holds are held constant; the routing
 * then does the same job in each. The fallback paths run through the middle of
 * each node and are only reached if a node somehow stages empty.
 *
 * 14 s over 1700 px is about half the speed of the original `world-drift`. A
 * slower drift reads as a flyover rather than a pan, and it leaves a creature in
 * frame long enough to be seen.
 */
const T1_DRIFT_TRAVEL_MS = 14_000;
const T1_DRIFT_LENGTH = 1_700;
const T1_DRIFT_HOLD_MS = 900;

function t1Drift(id: string, nodeId: string): CinematicClip {
  return {
    id,
    nodeId,
    travelMs: T1_DRIFT_TRAVEL_MS,
    route: 'population',
    pathLength: T1_DRIFT_LENGTH,
    routeHoldMs: T1_DRIFT_HOLD_MS,
    path: [
      { x: 1600, y: 2400 },
      { x: 3300, y: 2400 },
    ],
  };
}

const T1_BIOME_DRIFTS: readonly CinematicClip[] = [
  t1Drift('t1-forest', 'node-t1-forest-02'),
  t1Drift('t1-plains', 'node-t1-plains-03'),
  t1Drift('t1-cave', 'node-t1-cave-03'),
  t1Drift('t1-mountain', 'node-t1-mountain-02'),
  t1Drift('t1-swamp', 'node-t1-swamp-03'),
];

export const CINEMATIC_CANDIDATES: readonly CinematicClip[] = [
  ...T1_BIOME_DRIFTS,
  {
    // Dense tropical thicket: near-black ground, pale fern clusters, a dirt
    // track. The darkest of the candidates and the closest in mood to the forest.
    id: 'jungle-thicket',
    nodeId: 'node-t2-jungle-02',
    travelMs: 12_000,
    path: [
      { x: 2000, y: 1700 },
      { x: 1300, y: 1900, holdMs: 800 },
      { x: 1200, y: 2500 },
      { x: 1750, y: 2850, holdMs: 700 },
    ],
  },
  {
    // Maximum contrast with the forest: pale blue-white snow, frozen lakes as
    // large flat shapes, bare dead trees. Also by far the cheapest to encode.
    id: 'tundra-lakes',
    nodeId: 'node-t3-tundra-02',
    travelMs: 12_000,
    path: [
      { x: 1400, y: 2250 },
      { x: 2200, y: 2200, holdMs: 800 },
      { x: 3000, y: 2300, holdMs: 800 },
      { x: 3500, y: 2400 },
    ],
  },
  {
    // Dark teal cavern with stalagmites and glowing creatures — the only
    // candidate with bright emissive accents against a dark ground.
    id: 'cave-glow',
    nodeId: 'node-t2-cave-03',
    travelMs: 12_000,
    path: [
      { x: 1000, y: 3250 },
      { x: 1750, y: 3220, holdMs: 800 },
      { x: 2600, y: 3200, holdMs: 800 },
      { x: 3300, y: 3250 },
    ],
  },
];

export function cinematicClipById(id: string): CinematicClip | null {
  return [...CINEMATIC_CLIPS, ...CINEMATIC_CANDIDATES].find((clip) => clip.id === id) ?? null;
}
