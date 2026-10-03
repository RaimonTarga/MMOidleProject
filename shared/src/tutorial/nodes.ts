import { shortestWorldPath } from '../world/map/registry';
import { NODE_BIOMES } from '../world/nodeBiomes';
import { nodeShard } from '../world/nodeBlends';
import type { TutorialNodeRef } from './types';

/**
 * Where a farm or boss step happens, as the bot resolves it
 * (`resolveNodeCandidates` in bot/src/route/conditions.ts): a fixed node, the
 * biome's dungeon, or a normal node of the biome. For a biome the player's
 * current node wins when it qualifies (no pointless trips), then uncleared
 * nodes nearest first. A `shard` narrows the biome to the nodes that pay it
 * (design §24.3).
 */
export function tutorialNodeFor(
  ref: TutorialNodeRef,
  from: { nodeId: string; clearedNodes: readonly string[] },
): string | null {
  if (ref.kind === 'node') return ref.nodeId;
  const candidates = Object.entries(NODE_BIOMES)
    .filter(([, info]) => info.biomeGroup === ref.biomeGroup && info.biomeTier === ref.tier)
    .filter(([, info]) => (ref.kind === 'dungeon' ? info.isDungeon === true : info.kind === 'normal'))
    .filter(([, info]) => ref.kind !== 'biome' || !ref.modifier || info.modifier === ref.modifier)
    .filter(([id]) => ref.kind !== 'biome' || !ref.shard || nodeShard(id) === ref.shard)
    .map(([id]) => id)
    .sort();
  if (candidates.length === 0) return null;
  if (ref.kind === 'dungeon') return candidates[0];
  if (candidates.includes(from.nodeId)) return from.nodeId;
  if (ref.pick === 'first') return candidates[0];

  const cleared = new Set(from.clearedNodes);
  const uncleared = candidates.filter((id) => !cleared.has(id));
  const pool = uncleared.length > 0 ? uncleared : candidates;
  let best: string | null = null;
  let bestHops = Infinity;
  for (const id of pool) {
    const hops = shortestWorldPath(from.nodeId, id)?.length ?? Infinity;
    if (hops < bestHops) {
      best = id;
      bestHops = hops;
    }
  }
  return best ?? pool[0];
}
