import type { Vec2 } from "../systems/spatial";
import { RESOLVED_NODE_FEATURES } from "./nodeFeatures";
import { isSwampRotPool } from "./swampTrees";

/**
 * ROT-POOL LOOKUP — the swamp's water as a queryable circle.
 *
 * The Bog Lurker lineage needs the SAME pools three times over: the idle anchor
 * that parks it at the water's edge, the destination its Deathroll Drag hauls a
 * player to, and (in tests) the geometry both are asserted against. Each of those
 * previously re-derived "a circular node feature that poisons players" by hand,
 * which is how the anchor and the drag could silently disagree about which shapes
 * count as water.
 *
 * Lives in `shared/` because it is pure geometry over static node data — the server
 * decides what to DO with a pool, this only says where the pools are.
 */
export interface RotPoolCircle {
  x: number;
  y: number;
  radius: number;
}

/** Every rot pool in a node, as plain circles. Empty for non-swamp nodes. */
export function swampRotPools(nodeId: string): RotPoolCircle[] {
  const features = RESOLVED_NODE_FEATURES[nodeId];
  if (!features) return [];
  const pools: RotPoolCircle[] = [];
  for (const feature of features) {
    if (!isSwampRotPool(feature)) continue;
    if (feature.shape.kind !== "circle") continue;
    pools.push({
      x: feature.shape.x,
      y: feature.shape.y,
      radius: feature.shape.radius,
    });
  }
  return pools;
}

/**
 * The rot pool nearest `from`, or null when the node has none (or none inside
 * `maxRange`). Distance is measured to the pool CENTRE, not its rim: a lurker
 * standing on the lip of a huge bog is still "at" that bog, and ranking by rim
 * distance would have it ignore the water it is already in for a smaller puddle
 * further away.
 */
export function nearestSwampRotPool(
  nodeId: string,
  from: Vec2,
  maxRange = Infinity,
): RotPoolCircle | null {
  let best: RotPoolCircle | null = null;
  let bestDistSq = maxRange === Infinity ? Infinity : maxRange * maxRange;
  for (const pool of swampRotPools(nodeId)) {
    const dx = pool.x - from.x;
    const dy = pool.y - from.y;
    const distSq = dx * dx + dy * dy;
    if (distSq > bestDistSq) continue;
    best = pool;
    bestDistSq = distSq;
  }
  return best;
}
