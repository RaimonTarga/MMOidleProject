import { NODE_BIOMES, MONSTER_DATABASE, RECIPE_DATABASE, GAME_CONFIG, biomeLevelCap, biomeXpForLevel } from '@mmo-idle/shared';
import type { EssenceType } from '@mmo-idle/shared';
import type { MonsterEntity, PlayerEntity } from '../../../ecs/entity';
import type { World } from '../../../world/World';
import { registerKillForQuests } from './questSystem';

export interface KillRewards {
  essence: number;
  essenceType: EssenceType;
  level: number;
  biomeXp?: number;
}

const FALLBACK_REWARDS: KillRewards = { essence: 1, essenceType: 'green', level: 1 };

export interface KillRewardInfo {
  essenceGained: number;
  essenceType: EssenceType;
  biomeXpGained: number;
  tierAdvanced: boolean;
}

export function rewardPlayer(entity: PlayerEntity, rewards: KillRewards): void {
  const type = rewards.essenceType as keyof typeof entity.tracksProgression.essences;
  if (type in entity.tracksProgression.essences) {
    entity.tracksProgression.essences[type] += rewards.essence;
  }
  entity.tracksProgression.level += rewards.level;
}

function fallbackBiomeXp(rewards: KillRewards, biomeTier: number): number {
  const mult = GAME_CONFIG.BIOME_XP_ESSENCE_MULT[biomeTier] ?? 1;
  return Math.max(1, Math.round(rewards.essence * mult));
}

function applyBiomeXP(entity: PlayerEntity, nodeId: string, xpGain: number): number {
  const biomeInfo = NODE_BIOMES[nodeId];
  if (!biomeInfo) return 0;

  const { biomeGroup, biomeTier } = biomeInfo;
  const levelCap  = biomeLevelCap(entity.tracksProgression.playerTier, biomeGroup);
  const prevLevel = entity.tracksProgression.biomeLevel[biomeGroup] ?? 0;
  if (prevLevel >= levelCap) return 0;

  const newXP  = (entity.tracksProgression.biomeXP[biomeGroup] ?? 0) + xpGain;
  entity.tracksProgression.biomeXP[biomeGroup] = newXP;

  let rawLevel = prevLevel;
  while (rawLevel < levelCap && newXP >= biomeXpForLevel(rawLevel + 1)) rawLevel++;
  const newLevel = rawLevel;
  if (newLevel > prevLevel) {
    entity.tracksProgression.biomeLevel[biomeGroup] = newLevel;
    checkRecipeUnlocks(entity, biomeGroup, newLevel);
  }
  return xpGain;
}

export function checkRecipeUnlocks(entity: PlayerEntity, biomeGroup?: string, newLevel?: number): void {
  for (const recipe of RECIPE_DATABASE.values()) {
    const level = newLevel ?? entity.tracksProgression.biomeLevel[recipe.recipeGroup] ?? 0;
    if (biomeGroup !== undefined && recipe.recipeGroup !== biomeGroup) continue;
    if (recipe.requiredBiomeLevel > level) continue;
    if (!entity.tracksProgression.unlockedRecipes.includes(recipe.id)) {
      entity.tracksProgression.unlockedRecipes.push(recipe.id);
    }
  }
}

export function grantMonsterRewards(
  world: World,
  killerPlayerId: string,
  monster: MonsterEntity,
): KillRewardInfo | null {
  const killer = world.getPlayerEntity(killerPlayerId);
  if (!killer) return null;

  const def = MONSTER_DATABASE.get(monster.isMonster.monsterTypeId);
  const rewards = def?.rewards ?? FALLBACK_REWARDS;
  rewardPlayer(killer, rewards);
  const biomeInfo = NODE_BIOMES[monster.hasPosition.nodeId];
  const biomeTier = biomeInfo?.biomeTier ?? 0;
  const biomeXpGained = applyBiomeXP(
    killer,
    monster.hasPosition.nodeId,
    rewards.biomeXp ?? fallbackBiomeXp(rewards, biomeTier),
  );
  const tierAdvanced = registerKillForQuests(killer, monster.isMonster.monsterTypeId);
  if (tierAdvanced) {
    world.pendingAscensions.push(killer.isPlayer.id);
  }
  if (monster.isMonster.isBoss) {
    world.bossRespawnAt.set(monster.hasPosition.nodeId, Date.now() + 30_000);
  }
  return {
    essenceGained: rewards.essence,
    essenceType: rewards.essenceType,
    biomeXpGained,
    tierAdvanced,
  };
}
