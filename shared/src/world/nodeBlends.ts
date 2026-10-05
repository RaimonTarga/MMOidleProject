import { BIOME_DATABASE } from '../biomeDatabase';
import {
  BLEND_SPAWN_SLOTS,
  blendEntries,
  blendFamilyOccurrence,
  blendSpawnCycle,
  dominantBlendFamily,
  familiesForBiome,
  FAMILY_DATABASE,
  renormalizeBlend,
  type FamilyDefinition,
  type FamilyId,
  type NodeBlend,
} from '../data/families';
import type { PacketId } from '../data/lineages/types';
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
 * authored blend (dungeons, sanctuaries, the Clearing; every T1–T4 normal node
 * carries one since W1-C) — those spawn from the flat biome pool exactly as
 * before.
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

// ── One shard per node (design §24.3) ────────────────────────────────────────

const familyByNode = new Map<string, FamilyDefinition | undefined>();

/**
 * The family a node is categorised under: its AUTHORED blend's dominant family —
 * the largest share, ties broken in family-table order (`dominantBlendFamily`, the
 * one definition; the T2 45/45 nodes rely on the tie-break). Undefined for a node
 * with no blend: dungeons, sanctuaries and the Clearing.
 *
 * Authored, not resolved, on purpose: a node's identity is what the map author
 * wrote, never something the spawner re-derives. The authoring rule that keeps the
 * two equal: a family with no body at the node's tier never leads a blend
 * (`nodeShards.test.ts`, every node, no allowlist — the eight T2–T4 nodes that
 * broke it, review L16, were re-led by the verbs-that-fire run). A bodiless family
 * may keep a minority share; it renormalises away and pays nothing.
 */
export function nodeFamily(nodeId: string): FamilyDefinition | undefined {
  if (familyByNode.has(nodeId)) return familyByNode.get(nodeId);
  const blend = WORLD_NODES.get(nodeId)?.blend;
  const dominant = blend ? dominantBlendFamily(blend) : undefined;
  const family = dominant ? FAMILY_DATABASE.get(dominant) : undefined;
  familyByNode.set(nodeId, family);
  return family;
}

/**
 * The one shard every non-boss kill in this node pays (design §24.3): its
 * dominant family's `drops`, minority families included. A player learns a
 * node's currency in one visit and never collects three from one clearing, and
 * a pack follower filed under another family pays the node's shard like every
 * other body here (review P16, closed by construction).
 *
 * Undefined for a node with no blend; the reward seam then falls back to the
 * dead monster's own family shard there (dungeons — the behaviour before §24.3).
 */
export function nodeShard(nodeId: string): PacketId | undefined {
  return nodeFamily(nodeId)?.drops;
}

/**
 * The normal nodes of one biome and tier that pay `packet`, in id order. Where a
 * shard can be farmed under the node rule — what the map, the bot and the
 * tutorial ask instead of "which family drops it".
 */
export function nodesPayingShard(biomeGroup: string, tier: number, packet: PacketId): string[] {
  return WORLD_NODE_LIST
    .filter((node) => node.biomeGroup === biomeGroup && node.biomeTier === tier && node.blend)
    .filter((node) => nodeShard(node.id) === packet)
    .map((node) => node.id)
    .sort();
}

// ── Rosters (design §26.3) ───────────────────────────────────────────────────

/**
 * Tiers whose blends are authored as ROSTERS (design §26.3): a normal node fields
 * its dominant family and at most one guest, except one crossroads per biome that
 * fields all three. T1 only in the legibility run; the T2–T4 blends are still
 * proportions over three families and are a follow-up.
 */
export const ROSTER_TIERS: ReadonlySet<number> = new Set([1]);

/**
 * True for a crossroads: a normal node of a roster tier whose authored blend fields
 * three families (`regionT1.ts`: one per biome, the cell the dungeon is entered
 * from). It pays its by-a-hair leader's shard like any node (`nodeShard`;
 * PROVISIONAL — §26.3 leaves "one shard or a roll per kill" open). False for every
 * node outside a roster tier, where a three-family blend is the normal shape.
 */
export function isCrossroadsNode(nodeId: string): boolean {
  const node = WORLD_NODES.get(nodeId);
  if (!node?.blend || node.kind !== 'normal' || !ROSTER_TIERS.has(node.biomeTier)) return false;
  return blendEntries(node.blend).length >= 3;
}

/**
 * Every family of a biome, whether or not this tier can field it. The map panel
 * uses it to explain a node whose authored blend names a family the tier is
 * missing.
 */
export function biomeFamilyIds(biomeGroup: string): FamilyId[] {
  return familiesForBiome(biomeGroup).map((family) => family.id);
}
