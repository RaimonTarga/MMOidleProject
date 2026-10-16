import { NODE_BIOMES, adjacentWorldNodeIds, shortestWorldPath } from '@mmo-idle/shared';
import { findShortestNodePath } from '../src/world/nodePath';

/**
 * The travel path goes around zones above the traveller's tier when a way around exists
 * (overnight 2026-10-16: the plain BFS walked a T3 Squire from the T1 Swamp through the T4
 * Tundra, Trench and Wasteland toward the T3 Mountain, where it died and stalled).
 */
function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const tierOf = (id: string): number => NODE_BIOMES[id]?.biomeTier ?? 0;
const from = 'node-t1-swamp-03';
const to = 'node-t3-mountain-04';
assert(NODE_BIOMES[from] && NODE_BIOMES[to], 'the observed nodes exist');

const plain = shortestWorldPath(from, to);
assert(plain && plain[0] === from && plain[plain.length - 1] === to, 'the plain path connects');

const tiered = findShortestNodePath(from, to, 3);
assert(tiered && tiered[0] === from && tiered[tiered.length - 1] === to, 'the tier-aware path connects');
for (let i = 1; i < tiered.length; i++) {
  assert(adjacentWorldNodeIds(tiered[i - 1]).includes(tiered[i]), `${tiered[i - 1]} -> ${tiered[i]} is not an exit`);
}
const above = tiered.filter((id) => tierOf(id) > 3);
assert(above.length === 0, `the T3 path still crosses ${above.join(', ')}`);
assert(tiered.length >= plain.length, 'never shorter than the fewest hops');

// Without a tier, the old fewest-hops behaviour is unchanged.
assert(JSON.stringify(findShortestNodePath(from, to)) === JSON.stringify(plain), 'no tier = the plain path');

// A higher-tier destination is still reachable.
const t4 = Object.keys(NODE_BIOMES).find((id) => tierOf(id) === 4 && NODE_BIOMES[id].biomeGroup === 'graveyard');
assert(t4 && findShortestNodePath(from, t4, 1), 'a T1 traveller can still walk to a T4 node');

console.log(`tierAwarePath: ok (plain ${plain.length - 1} hops via ${plain.filter((id) => tierOf(id) > 3).length} T4 nodes; tiered ${tiered.length - 1} hops)`);
