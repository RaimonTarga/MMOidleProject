import {
  CLEARING_NODE_ID,
  NATIVE_FAMILY,
  NODE_BIOMES,
  type PaceFamily,
} from '@mmo-idle/shared';
import type { ContentTarget, MatrixFilter } from './types';

/** A farm target plus the node-modifier identity that shapes its income. */
export interface FarmTarget extends ContentTarget {
  /** Pace family = the node's catalyst key. Absent on excluded nodes (clearing). */
  pace?: PaceFamily;
  density?: string;
}

function toFarmTarget(nodeId: string): FarmTarget | null {
  const info = NODE_BIOMES[nodeId];
  if (!info) return null;
  return {
    nodeId,
    biomeGroup: info.biomeGroup,
    contentTier: info.biomeTier,
    isDungeon: false,
    pace: info.pace,
    density: info.density,
  };
}

/**
 * Resolve one explicitly requested farm node (`--node`). Rejects anything that
 * is not a farmable open-world node, since a dungeon never repopulates the way
 * a farm run assumes and a sanctuary has nothing to kill.
 */
export function farmTargetForNode(nodeId: string): FarmTarget {
  const info = NODE_BIOMES[nodeId];
  if (!info) throw new Error(`Unknown node id: ${nodeId}`);
  if (info.kind !== 'normal' && nodeId !== CLEARING_NODE_ID) {
    throw new Error(
      `Node ${nodeId} is kind '${info.kind}' — farm runs need an open-world ('normal') node or the clearing.`,
    );
  }
  return toFarmTarget(nodeId)!;
}

/**
 * The representative farm node for each (biome group × tier) in `tiers`.
 *
 * Only `kind: 'normal'` nodes are farmable open world: dungeons are static
 * hand-designed exams that never repopulate (and are excluded from the modifier
 * system, so they mint no catalysts at all), and sanctuaries hold no monsters.
 * Tier 0 is the tutorial clearing, which is likewise modifier-excluded — its
 * catalyst income is genuinely zero, and the sweep should show that.
 *
 * Within a pair we prefer the node carrying the biome's NATIVE pace family.
 * Pace reshapes monster offense and *is* the catalyst key, so which node
 * represents a biome is balance-relevant; native is the family a player farming
 * that biome meets most often. Ties break on node id, so the sweep is
 * deterministic across runs and shards.
 */
export function enumerateFarmTargets(
  tiers: number[],
  filter?: MatrixFilter,
): FarmTarget[] {
  const byPair = new Map<string, FarmTarget>();
  const wanted = new Set(tiers);

  if (wanted.has(0) && (!filter?.biome || filter.biome === 'clearing')) {
    const clearing = toFarmTarget(CLEARING_NODE_ID);
    if (clearing) byPair.set(`clearing:0`, clearing);
  }

  for (const nodeId of Object.keys(NODE_BIOMES).sort()) {
    const info = NODE_BIOMES[nodeId];
    if (info.kind !== 'normal') continue;
    if (!wanted.has(info.biomeTier)) continue;
    if (filter?.biome && filter.biome !== info.biomeGroup) continue;

    const key = `${info.biomeGroup}:${info.biomeTier}`;
    const existing = byPair.get(key);
    if (!existing) {
      byPair.set(key, toFarmTarget(nodeId)!);
      continue;
    }
    // Upgrade to the native-family node if we have not already picked one.
    const native = NATIVE_FAMILY[info.biomeGroup];
    if (native && info.pace === native && existing.pace !== native) {
      byPair.set(key, toFarmTarget(nodeId)!);
    }
  }

  return [...byPair.values()].sort(
    (a, b) =>
      a.contentTier - b.contentTier ||
      a.biomeGroup.localeCompare(b.biomeGroup) ||
      a.nodeId.localeCompare(b.nodeId),
  );
}
