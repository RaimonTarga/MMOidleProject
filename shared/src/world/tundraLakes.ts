import { GAME_CONFIG } from "../config/gameConfig";
import { NODE_BIOMES } from "./nodeBiomes";

/**
 * TUNDRA FROZEN LAKES — deterministic per-node ice sheets, generated from the node id.
 *
 * The ice was a decorative ground pattern (`off-center-patch` / `scatter` / `ring-path`)
 * producing five to fourteen small discs of radius 80–415, about 3% of the node. It read as
 * a rash of patches. The user reads the ice as a FROZEN LAKE, so it is now generated as one
 * or two proper sheets — big enough that you route around them rather than stepping over
 * them.
 *
 * ## Why this lives in `shared/`
 *
 * It was pure renderer state before, which is exactly why nothing respected it: **trees
 * stood in the middle of the ice**, because trees carry trunk hitboxes and are generated
 * server-side, and the server could not see a client-only ground pattern (trap 8 in the
 * handoff brief — the same reason forest trails had to move). Props had the same problem
 * from the other direction: only the vegetation specs set `avoidsDirt`, so rocks and drifts
 * sat on the lake surface.
 *
 * The ice is still purely DECORATIVE — no slow, no damage, no collision. Nothing about
 * standing on it changes; the layout is shared so that everything which places objects can
 * agree on where it is.
 */

export interface TundraLake {
  x: number;
  y: number;
  radius: number;
}

/**
 * Fraction of the node the ice may cover.
 *
 * Up from ~3%. This is a LOOK number rather than a balance one (the ice does nothing), but
 * it is not free: trees and props now avoid the ice, so every point of coverage is floor
 * the node's nine trees cannot use.
 */
const MIN_COVERAGE = 0.15;
const MAX_COVERAGE = 0.2;

/** Lakes stay this far inside the node so they never sit on a gate band. */
const EDGE_MARGIN = GAME_CONFIG.NODE_WIDTH * 0.07;
/** Nothing may encroach on the spawn point at node centre. */
const CENTRE_CLEAR = GAME_CONFIG.NODE_WIDTH * 0.1;
/**
 * A dungeon keeps a large clear arena and pushes its lakes to the sides.
 *
 * The user's call: the boss is fought on solid ground, with the ice as terrain you can be
 * pushed toward. This inverts what the biome used to do — the old `dungeon-court` pattern
 * painted the arena floor ITSELF as ice, so the fight happened on the lake.
 */
const DUNGEON_CENTRE_CLEAR = GAME_CONFIG.NODE_WIDTH * 0.3;
/** Minimum gap between two lake edges, so two sheets never merge into an ambiguous blob. */
const MIN_LAKE_GAP = GAME_CONFIG.NODE_WIDTH * 0.055;
/** Floor on how many lakes the budget is split across. Two, because these are LAKES. */
const MIN_LAKES = 2;

const MIN_RADIUS = GAME_CONFIG.NODE_WIDTH * 0.135;
const MAX_RADIUS = GAME_CONFIG.NODE_WIDTH * 0.198;

/**
 * Dungeons get a SMALLER band, for the same geometric reason volcanic does.
 *
 * A lake must fit between the arena clearance and the node edge; the furthest a lake
 * centre can sit from the middle is `sqrt(2) * (half - edgeMargin - r)`, in a corner.
 * Against a 0.3 arena clearance nothing above r≈612 fits — below this biome's own minimum
 * — so the normal band produced **zero lakes on both tundra dungeons**, which is precisely
 * not what "cleared arena, lakes around it" means.
 */
const DUNGEON_MIN_RADIUS = GAME_CONFIG.NODE_WIDTH * 0.088;
const DUNGEON_MAX_RADIUS = GAME_CONFIG.NODE_WIDTH * 0.118;
const DUNGEON_MIN_COVERAGE = 0.09;
const DUNGEON_MAX_COVERAGE = 0.12;

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

function buildLakes(nodeId: string): TundraLake[] {
  const biome = NODE_BIOMES[nodeId];
  if (!biome) return [];

  const rng = mulberry32(hashString(`${nodeId}:tundra-lakes:v1`));
  const W = GAME_CONFIG.NODE_WIDTH;
  const H = GAME_CONFIG.NODE_HEIGHT;
  const centreClear = biome.isDungeon ? DUNGEON_CENTRE_CLEAR : CENTRE_CLEAR;

  // Coverage-first, the approach swamp pools introduced: pick the area budget, let the
  // COUNT fall out of it. Picking a count first lets the total ice swing wildly between
  // nodes, and total ice is what decides whether a node reads as snow with a lake on it or
  // as a lake with some snow round the edge.
  const budget = W * H * (biome.isDungeon
    ? range(rng, DUNGEON_MIN_COVERAGE, DUNGEON_MAX_COVERAGE)
    : range(rng, MIN_COVERAGE, MAX_COVERAGE));
  const minRadius = biome.isDungeon ? DUNGEON_MIN_RADIUS : MIN_RADIUS;
  const maxRadius = Math.min(
    biome.isDungeon ? DUNGEON_MAX_RADIUS : MAX_RADIUS,
    Math.sqrt(budget / (MIN_LAKES * Math.PI)),
  );
  const lakes: TundraLake[] = [];
  let covered = 0;

  for (let attempt = 0; attempt < 400 && covered < budget; attempt++) {
    const radius = range(rng, minRadius, Math.max(minRadius, maxRadius));
    if (covered + Math.PI * radius * radius > budget * 1.06) continue;

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
    covered += Math.PI * radius * radius;
  }

  return lakes;
}

const cache = new Map<string, TundraLake[]>();

/** Frozen lakes for a tundra node. */
export function getTundraLakes(nodeId: string): TundraLake[] {
  const hit = cache.get(nodeId);
  if (hit) return hit;
  const lakes = buildLakes(nodeId);
  cache.set(nodeId, lakes);
  return lakes;
}

/**
 * Whether a point lies on a frozen lake. `pad` grows it for callers placing something with
 * a footprint — a tree should clear the shore by its trunk, not merely have its centre off
 * the ice.
 */
export function isOnTundraLake(
  nodeId: string,
  x: number,
  y: number,
  pad = 0,
): boolean {
  for (const lake of getTundraLakes(nodeId)) {
    const rr = lake.radius + pad;
    const dx = x - lake.x;
    const dy = y - lake.y;
    if (dx * dx + dy * dy < rr * rr) return true;
  }
  return false;
}
