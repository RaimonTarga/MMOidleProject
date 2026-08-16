import { GAME_CONFIG } from "../config/gameConfig";

/**
 * SWAMP POOLS — deterministic rot-pool fields, generated per node.
 *
 * Replaces six hand-authored templates that were reused verbatim at every tier, so
 * `t1-swamp-01`, `t2-swamp-01` and `t3-swamp-01` were the same node three times. Nine
 * distinct layouts across twenty-one nodes becomes twenty-one distinct layouts, and a
 * new swamp node costs nothing to author.
 *
 * These are gameplay features, not decoration: each becomes a `rotPool` carrying a
 * damage-over-time and a slow, and the functional Wang sheet paints the water directly
 * from these shapes. So the generator has hard obligations, not just aesthetic ones —
 * it must leave the node crossable and must never swallow the spawn point.
 */

export interface SwampPool {
  x: number;
  y: number;
  radius: number;
}

/**
 * Fraction of the node the water may cover. The authored layouts sat at 8.3-9.4%; this
 * band keeps that character while varying it, because coverage is the single number
 * that decides whether a swamp node reads as "hazard field with lanes" or as "swamp
 * you cannot cross". The ceiling is the important half.
 */
const MIN_COVERAGE = 0.055;
const MAX_COVERAGE = 0.085;

/** Pools stay this far inside the node so they never sit on a gate band. */
const EDGE_MARGIN = GAME_CONFIG.NODE_WIDTH * 0.085;
/** Nothing may encroach on the spawn point / dungeon altar at node centre. */
const CENTRE_CLEAR = GAME_CONFIG.NODE_WIDTH * 0.115;
/** Dungeons keep a far bigger arena clear — the pools ring the boss fight. */
const DUNGEON_CENTRE_CLEAR = GAME_CONFIG.NODE_WIDTH * 0.26;
/**
 * Minimum gap between two pool edges. Pools that touch merge into one bog and destroy
 * the read the biome is built on: hazard-aware routing needs visible lanes BETWEEN the
 * water, not one continuous sheet of it.
 */
const MIN_POOL_GAP = GAME_CONFIG.NODE_WIDTH * 0.05;

/** Floor on how many pools a node's water is split across. */
const MIN_POOLS = 3;

const MIN_RADIUS = GAME_CONFIG.NODE_WIDTH * 0.045;
const MAX_RADIUS = GAME_CONFIG.NODE_WIDTH * 0.105;

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

const cache = new Map<string, SwampPool[]>();

/**
 * Rot-pool field for a swamp node. Deterministic from the node id, so the server's
 * damage zones and the client's painted water are the same shapes without any sync.
 */
export function generateSwampPools(
  nodeId: string,
  isDungeon: boolean,
): SwampPool[] {
  const cached = cache.get(nodeId);
  if (cached) return cached;

  const rng = mulberry32(hashString(`${nodeId}:swamp-pools:v1`));
  const W = GAME_CONFIG.NODE_WIDTH;
  const H = GAME_CONFIG.NODE_HEIGHT;
  const area = W * H;
  const centreClear = isDungeon ? DUNGEON_CENTRE_CLEAR : CENTRE_CLEAR;

  // Coverage is the budget; pool COUNT falls out of it. Choosing the budget first is
  // what keeps a node of few large pools and a node of many small ones equally
  // crossable — picking a count first lets total water swing wildly.
  const budget = area * range(rng, MIN_COVERAGE, MAX_COVERAGE);
  // Cap the radius so the budget cannot be eaten by one or two enormous pools. A
  // coverage-first generator otherwise produces the occasional node of two vast bogs
  // with a 2000px void between them, which is within budget but barely reads as swamp.
  // Solving for MIN_POOLS pools of this size keeps a field wherever the budget lands.
  const maxRadius = Math.min(
    MAX_RADIUS,
    Math.sqrt(budget / (MIN_POOLS * Math.PI)),
  );
  const pools: SwampPool[] = [];
  let covered = 0;
  const maxAttempts = 400;

  for (let attempt = 0; attempt < maxAttempts && covered < budget; attempt++) {
    const radius = range(rng, MIN_RADIUS, maxRadius);
    // Overshoot allowance, kept tight. The budget is the whole point of the
    // coverage-first approach, so a generous tolerance quietly reintroduces the
    // "too much water" it exists to prevent.
    if (covered + Math.PI * radius * radius > budget * 1.06) continue;

    const x = range(rng, EDGE_MARGIN + radius, W - EDGE_MARGIN - radius);
    const y = range(rng, EDGE_MARGIN + radius, H - EDGE_MARGIN - radius);

    const dcx = x - W / 2;
    const dcy = y - H / 2;
    if (Math.hypot(dcx, dcy) < centreClear + radius) continue;

    let clashes = false;
    for (const p of pools) {
      if (Math.hypot(x - p.x, y - p.y) < p.radius + radius + MIN_POOL_GAP) {
        clashes = true;
        break;
      }
    }
    if (clashes) continue;

    pools.push({ x, y, radius });
    covered += Math.PI * radius * radius;
  }

  cache.set(nodeId, pools);
  return pools;
}
