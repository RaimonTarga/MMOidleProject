import type { PlayerState, MonsterState } from '@mmo-idle/shared';
import { NODE_BIOMES, MONSTER_DATABASE, RECIPE_DATABASE, GAME_CONFIG, biomeXpForLevel, biomeLevelCap } from '@mmo-idle/shared';
import type { World } from '../world/World';
import { registerKillForQuests } from './questSystem';

export interface KillRewards {
  essence: number;
  essenceType: string;
  level: number;
}

export interface KillRewardInfo {
  biomeXpGained: number;
  essenceGained: number;
  essenceType:   string;
}

const FALLBACK_REWARDS: KillRewards = { essence: 1, essenceType: 'green', level: 1 };

export function rewardPlayer(player: PlayerState, rewards: KillRewards): void {
  const type = rewards.essenceType as keyof typeof player.essences;
  if (type in player.essences) player.essences[type] += rewards.essence;
  player.level += rewards.level;
}

/**
 * Grant biome XP for the node where the kill happened, advance the biome level
 * if the threshold is crossed, and auto-unlock any recipes that become available.
 * XP gain stops once the level cap for the current playerTier is reached.
 * Returns the XP actually granted (0 if already at cap).
 */
function applyBiomeXP(player: PlayerState, nodeId: string, xpGain: number): number {
  const biomeInfo = NODE_BIOMES[nodeId];
  if (!biomeInfo) return 0;

  const { biomeGroup } = biomeInfo;
  const levelCap  = biomeLevelCap(player.playerTier, biomeGroup);
  const prevLevel = player.biomeLevel[biomeGroup] ?? 0;
  if (prevLevel >= levelCap) return 0;

  const newXP   = (player.biomeXP[biomeGroup] ?? 0) + xpGain;
  player.biomeXP[biomeGroup] = newXP;

  let rawLevel = prevLevel;
  while (rawLevel < levelCap && newXP >= biomeXpForLevel(rawLevel + 1)) rawLevel++;
  const newLevel = rawLevel;
  if (newLevel > prevLevel) {
    player.biomeLevel[biomeGroup] = newLevel;
    checkRecipeUnlocks(player, biomeGroup, newLevel);
  }
  return xpGain;
}

export function checkRecipeUnlocks(
  player: PlayerState,
  biomeGroup: string,
  newLevel: number,
): void {
  for (const recipe of RECIPE_DATABASE.values()) {
    if (recipe.recipeGroup !== biomeGroup) continue;
    if (recipe.requiredBiomeLevel > newLevel) continue;
    if (!player.unlockedRecipes.includes(recipe.id)) {
      player.unlockedRecipes.push(recipe.id);
    }
  }
}

export function grantMonsterRewards(
  world: World,
  killerPlayerId: string,
  monster: MonsterState,
): KillRewardInfo {
  const killer = world.players.get(killerPlayerId);
  if (!killer) return { biomeXpGained: 0, essenceGained: 0, essenceType: 'green' };

  const def = MONSTER_DATABASE.get(monster.monsterTypeId);
  const rewards = def?.rewards ?? FALLBACK_REWARDS;
  rewardPlayer(killer, rewards);
  const biomeTier = NODE_BIOMES[monster.nodeId]?.biomeTier ?? 0;
  const tierMult  = GAME_CONFIG.BIOME_XP_ESSENCE_MULT[biomeTier] ?? 1.0;
  const biomeXpGain = def?.rewards.biomeXp ?? Math.round((def?.rewards.essence ?? 5) * tierMult);
  const biomeXpGained = applyBiomeXP(killer, monster.nodeId, biomeXpGain);
  const tierAdvanced  = registerKillForQuests(killer, monster.monsterTypeId);
  if (tierAdvanced) {
    world.pendingAscensions.push({ playerId: killerPlayerId, tier: killer.playerTier });
  }

  if (monster.isBoss) {
    world.bossRespawnAt.set(monster.nodeId, Date.now() + 30_000);
  }

  return {
    biomeXpGained,
    essenceGained: rewards.essence,
    essenceType:   rewards.essenceType,
  };
}
