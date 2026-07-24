import { biomeLevelCap } from '../config/gameConfig';
import { RECIPE_DATABASE } from '../recipeDatabase';
import { NODE_BIOMES, TEST_ROOM_NODE_ID } from '../world/nodeBiomes';
import type { TracksProgression } from '../components/core/networkedSlices';

export type BiomeProgressInput = Pick<
  TracksProgression,
  'playerTier' | 'biomeLevel' | 'unlockedRecipes' | 'bossesCleared' | 'clearedNodes'
>;

const BIOME_GROUPS_BY_TIER = new Map<number, string[]>();

function isProgressionNode(nodeId: string): boolean {
  const node = NODE_BIOMES[nodeId];
  return (
    nodeId !== TEST_ROOM_NODE_ID &&
    (node?.kind === 'normal' || node?.kind === 'dungeon')
  );
}

for (const [nodeId, node] of Object.entries(NODE_BIOMES)) {
  if (!isProgressionNode(nodeId)) continue;
  const groups = BIOME_GROUPS_BY_TIER.get(node.biomeTier) ?? [];
  if (!groups.includes(node.biomeGroup)) {
    groups.push(node.biomeGroup);
    BIOME_GROUPS_BY_TIER.set(node.biomeTier, groups);
  }
}
for (const groups of BIOME_GROUPS_BY_TIER.values()) {
  groups.sort();
}

export function bossClearKey(biomeGroup: string, tier: number): string {
  return `${biomeGroup}:${tier}`;
}

export function isBiomeLevelCapped(player: BiomeProgressInput, biomeGroup: string): boolean {
  const cap = biomeLevelCap(player.playerTier, biomeGroup);
  return (player.biomeLevel[biomeGroup] ?? 0) >= cap;
}

export function areAllBiomeRecipesUnlocked(
  player: BiomeProgressInput,
  biomeGroup: string,
): boolean {
  const cap = biomeLevelCap(player.playerTier, biomeGroup);
  for (const recipe of RECIPE_DATABASE.values()) {
    if (recipe.recipeGroup !== biomeGroup) continue;
    if (recipe.tier > player.playerTier) continue;
    if (recipe.requiredBiomeLevel > cap) continue;
    if (!player.unlockedRecipes.includes(recipe.id)) return false;
  }
  return true;
}

export function isBossClearedAtTier(
  player: BiomeProgressInput,
  biomeGroup: string,
  tier: number,
): boolean {
  return (player.bossesCleared ?? []).includes(bossClearKey(biomeGroup, tier));
}

export function listNonBossNodesForBiomeTier(biomeGroup: string, tier: number): string[] {
  return Object.entries(NODE_BIOMES)
    .filter(([nodeId, node]) =>
      isProgressionNode(nodeId) &&
      node.biomeGroup === biomeGroup &&
      node.biomeTier === tier &&
      node.kind === 'normal'
    )
    .map(([nodeId]) => nodeId)
    .sort();
}

export function hasDungeonForBiomeTier(biomeGroup: string, tier: number): boolean {
  return Object.entries(NODE_BIOMES).some(
    ([nodeId, node]) =>
      isProgressionNode(nodeId) &&
      node.biomeGroup === biomeGroup &&
      node.biomeTier === tier &&
      node.isDungeon,
  );
}

export function isNodeCleared(player: BiomeProgressInput, nodeId: string): boolean {
  return (player.clearedNodes ?? []).includes(nodeId);
}

export function areAllNonBossNodesClearedAtTier(
  player: BiomeProgressInput,
  biomeGroup: string,
  tier: number,
): boolean {
  const nodes = listNonBossNodesForBiomeTier(biomeGroup, tier);
  return nodes.length > 0 && nodes.every(nodeId => isNodeCleared(player, nodeId));
}

export function isBiomeFullyDoneAtTier(
  player: BiomeProgressInput,
  biomeGroup: string,
  tier: number,
): boolean {
  const bossDone =
    !hasDungeonForBiomeTier(biomeGroup, tier) ||
    isBossClearedAtTier(player, biomeGroup, tier);
  // A biome is "done" once nothing more can be unlocked from it (all reachable
  // recipes unlocked) and its nodes + boss are cleared. We intentionally do NOT
  // require maxing the biome level — grinding levels past the last unlock is
  // wasted time, so auto-traverse moves on as soon as unlocks are exhausted.
  return (
    areAllBiomeRecipesUnlocked(player, biomeGroup) &&
    areAllNonBossNodesClearedAtTier(player, biomeGroup, tier) &&
    bossDone
  );
}

export function listBiomeGroupsAtTier(tier: number): string[] {
  return BIOME_GROUPS_BY_TIER.get(tier) ?? [];
}

function firstIncompleteBiomeAtTier(
  player: BiomeProgressInput,
  tier: number,
): { biomeGroup: string; tier: number } | null {
  for (const biomeGroup of listBiomeGroupsAtTier(tier)) {
    if (!isBiomeFullyDoneAtTier(player, biomeGroup, tier)) {
      return { biomeGroup, tier };
    }
  }
  return null;
}

/**
 * Picks the next biome the player should work on for auto-traverse.
 * Prefers the player's current tier (e.g. T3 players route to T3 biomes first),
 * then falls back to lower tiers. Tiers above playerTier are not considered.
 */
export function pickNextIncompleteBiome(
  player: BiomeProgressInput,
): { biomeGroup: string; tier: number } | null {
  const preferredTier = Math.max(0, player.playerTier);
  for (let tier = preferredTier; tier >= 0; tier--) {
    const next = firstIncompleteBiomeAtTier(player, tier);
    if (next) return next;
  }
  return null;
}
