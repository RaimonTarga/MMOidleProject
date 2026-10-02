import { BIOME_DATABASE } from '../biomeDatabase';
import {
  BLEND_SPAWN_SLOTS,
  blendEntries,
  blendFamilyOccurrence,
  blendSpawnCycle,
  familiesForBiome,
  FAMILY_DATABASE,
  renormalizeBlend,
  type FamilyId,
  type NodeBlend,
} from '../data/families';
import { WORLD_NODE_LIST, WORLD_NODES } from './map/registry';

/**
 * Node blends: what a node is made of (design §12).
 *
 * Canonical authoring lives on each world node record (`regionT1.ts`); this is the
 * nodeId-keyed view of it plus the one piece of logic both the server spawner and
 * the map panel need — resolving an authored blend against the monsters the node's
 * tier can actually field.
 *
 * This is the file that replaces `nodeModifierMap.ts` when Phase 2b deletes
 * modifiers.
 */
export const NODE_BLENDS: Record<string, NodeBlend> = Object.fromEntries(
  WORLD_NODE_LIST
    .filter((node) => node.blend)
    .map((node) => [node.id, node.blend!]),
);

export interface ResolvedNodeBlend {
  /** Shares over the families this node's tier can actually field; sums to 1. */
  shares: NodeBlend;
  /** Spawnable monster ids per family, in the biome pool's order. */
  poolByFamily: Map<FamilyId, readonly string[]>;
  /**
   * Authored families with no monster in this node's tier pool, whose shares were
   * re-scaled onto the rest. Empty is the goal; see the gap note in `regionT1.ts`.
   */
  unavailable: readonly FamilyId[];
  /** The repeating spawn order, `BLEND_SPAWN_SLOTS` long. */
  cycle: readonly FamilyId[];
}

/**
 * Resolve an authored blend for one node.
 *
 * A family whose mobs all live in another tier's pool cannot be spawned here, so
 * it is dropped and its share re-scaled onto the families that remain. That keeps
 * the node honest: what the panel shows and what the spawner does are the same
 * vector. Returns undefined when nothing in the blend can be fielded at all.
 */
export function resolveNodeBlend(
  biomeGroup: string,
  biomeTier: number,
  blend: NodeBlend,
): ResolvedNodeBlend | undefined {
  const pool = BIOME_DATABASE.get(biomeGroup)?.monsterPoolByTier[biomeTier] ?? [];
  if (pool.length === 0) return undefined;

  const poolByFamily = new Map<FamilyId, readonly string[]>();
  const unavailable: FamilyId[] = [];
  for (const entry of blendEntries(blend)) {
    const family = FAMILY_DATABASE.get(entry.family);
    // Deduplicated: a biome pool may list a mob twice to weight the flat random
    // pick (T1 mountain lists cliff-hopper twice). Inside a family the blend's
    // share is the weight now, so a duplicate would only make the family
    // alternate between two copies of one mob.
    const fielded = [...new Set(pool.filter((id) => family?.monsterIds.includes(id)))];
    if (fielded.length === 0) {
      unavailable.push(entry.family);
      continue;
    }
    poolByFamily.set(entry.family, fielded);
  }
  if (poolByFamily.size === 0) return undefined;

  const shares = renormalizeBlend(blend, (family) => poolByFamily.has(family));
  return {
    shares,
    poolByFamily,
    unavailable,
    cycle: blendSpawnCycle(shares, BLEND_SPAWN_SLOTS),
  };
}

const resolvedByNode = new Map<string, ResolvedNodeBlend | undefined>();

/**
 * The resolved blend for a node, memoized. Undefined for every node with no
 * authored blend (dungeons, sanctuaries, the Clearing, and all of T3–T4; T1
 * and T2 normal nodes both carry one as of W1-E) — those spawn from the flat
 * biome pool exactly as before.
 */
export function nodeSpawnBlend(nodeId: string): ResolvedNodeBlend | undefined {
  if (resolvedByNode.has(nodeId)) return resolvedByNode.get(nodeId);
  const node = WORLD_NODES.get(nodeId);
  const resolved = node?.blend
    ? resolveNodeBlend(node.biomeGroup, node.biomeTier, node.blend)
    : undefined;
  resolvedByNode.set(nodeId, resolved);
  return resolved;
}

/**
 * The family and monster the node's `cursor`-th spawn takes.
 *
 * One integer per node drives both choices: the cursor picks the cycle slot, and
 * the number of times that family has already come up walks its own mob list. No
 * randomness, so a 70/20/10 node spawns 7-2-1 per ten and the composition is
 * testable without a world.
 */
export function blendSpawnPick(
  resolved: ResolvedNodeBlend,
  cursor: number,
): { family: FamilyId; monsterTypeId: string } | undefined {
  if (resolved.cycle.length === 0) return undefined;
  const position = ((cursor % resolved.cycle.length) + resolved.cycle.length) % resolved.cycle.length;
  const family = resolved.cycle[position];
  const pool = resolved.poolByFamily.get(family) ?? [];
  if (pool.length === 0) return undefined;
  const occurrence = blendFamilyOccurrence(resolved.cycle, cursor);
  return { family, monsterTypeId: pool[occurrence % pool.length] };
}

/**
 * Every family of a biome, whether or not this tier can field it. The map panel
 * uses it to explain a node whose authored blend names a family the tier is
 * missing.
 */
export function biomeFamilyIds(biomeGroup: string): FamilyId[] {
  return familiesForBiome(biomeGroup).map((family) => family.id);
}
