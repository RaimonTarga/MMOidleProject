import { NODE_BIOMES, MONSTER_DATABASE, RECIPE_DATABASE, GAME_CONFIG, biomeLevelCap, biomeXpForLevel, bossClearKey, BIOME_DATABASE } from '@mmo-idle/shared';
import type { EssenceType } from '@mmo-idle/shared';
import type { MonsterEntity, PlayerEntity } from '../../../ecs/entity';
import type { World } from '../../../world/World';
import { markSliceDirty } from '../../../ecs/dirtyHelpers';
import { registerKillForQuests } from './questSystem';
import { recordWorldLogEvent } from '../../../world/worldLog';
import { actorFromPlayer } from '../../../world/worldLogActors';

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

interface BiomeXpResult {
  xpGain: number;
  prevLevel: number;
  newLevel: number;
  unlockedRecipeIds: string[];
}

function applyBiomeXP(
  world: World,
  entity: PlayerEntity,
  nodeId: string,
  xpGain: number,
): BiomeXpResult {
  const biomeInfo = NODE_BIOMES[nodeId];
  if (!biomeInfo) {
    return { xpGain: 0, prevLevel: 0, newLevel: 0, unlockedRecipeIds: [] };
  }

  const { biomeGroup, biomeTier } = biomeInfo;
  const levelCap = biomeLevelCap(entity.tracksProgression.playerTier, biomeGroup);
  const prevLevel = entity.tracksProgression.biomeLevel[biomeGroup] ?? 0;
  if (prevLevel >= levelCap) {
    return { xpGain: 0, prevLevel, newLevel: prevLevel, unlockedRecipeIds: [] };
  }

  const prevUnlocked = [...entity.tracksProgression.unlockedRecipes];
  const newXP = (entity.tracksProgression.biomeXP[biomeGroup] ?? 0) + xpGain;
  entity.tracksProgression.biomeXP[biomeGroup] = newXP;

  let rawLevel = prevLevel;
  while (rawLevel < levelCap && newXP >= biomeXpForLevel(rawLevel + 1)) rawLevel++;
  const newLevel = rawLevel;
  const unlockedRecipeIds: string[] = [];
  if (newLevel > prevLevel) {
    entity.tracksProgression.biomeLevel[biomeGroup] = newLevel;
    checkRecipeUnlocks(entity, biomeGroup, newLevel);
    for (const recipeId of entity.tracksProgression.unlockedRecipes) {
      if (!prevUnlocked.includes(recipeId)) unlockedRecipeIds.push(recipeId);
    }
    const biomeDef = BIOME_DATABASE.get(biomeGroup);
    recordWorldLogEvent(
      world,
      {
        kind: 'biome-level-up',
        nodeId,
        player: actorFromPlayer(entity),
        biomeGroup,
        biomeName: biomeDef?.name ?? biomeGroup,
        prevLevel,
        newLevel,
        unlockedRecipeIds,
      },
      {
        visibility: 'node',
        relatedPlayerIds: [entity.isPlayer.id],
        nodeId,
      },
    );
  }
  return { xpGain, prevLevel, newLevel, unlockedRecipeIds };
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

function applyKillRewardsToPlayer(
  world: World,
  recipient: PlayerEntity,
  monster: MonsterEntity,
): KillRewardInfo {
  const def = MONSTER_DATABASE.get(monster.isMonster.monsterTypeId);
  const rewards = def?.rewards ?? FALLBACK_REWARDS;
  rewardPlayer(recipient, rewards);
  const biomeInfo = NODE_BIOMES[monster.hasPosition.nodeId];
  const biomeTier = biomeInfo?.biomeTier ?? 0;
  const biomeResult = applyBiomeXP(
    world,
    recipient,
    monster.hasPosition.nodeId,
    rewards.biomeXp ?? fallbackBiomeXp(rewards, biomeTier),
  );
  const tierResult = registerKillForQuests(recipient, monster.isMonster.monsterTypeId);
  if (tierResult.advanced && tierResult.prevTier !== undefined && tierResult.newTier !== undefined) {
    recordWorldLogEvent(
      world,
      {
        kind: 'player-tier-up',
        nodeId: monster.hasPosition.nodeId,
        player: actorFromPlayer(recipient),
        prevTier: tierResult.prevTier,
        newTier: tierResult.newTier,
        questId: tierResult.questId,
        questName: tierResult.questName,
      },
      {
        visibility: 'node',
        relatedPlayerIds: [recipient.isPlayer.id],
        nodeId: monster.hasPosition.nodeId,
      },
    );
    world.pendingAscensions.push(recipient.isPlayer.id);
  }
  if (monster.isMonster.isBoss) {
    world.bossRespawnAt.set(monster.hasPosition.nodeId, Date.now() + 30_000);
    const info = NODE_BIOMES[monster.hasPosition.nodeId];
    if (info) {
      const key = bossClearKey(info.biomeGroup, info.biomeTier);
      if (!recipient.tracksProgression.bossesCleared.includes(key)) {
        recipient.tracksProgression.bossesCleared.push(key);
        markSliceDirty(world, recipient, 'tracksProgression');
      }
    }
  }
  return {
    essenceGained: rewards.essence,
    essenceType: rewards.essenceType,
    biomeXpGained: biomeResult.xpGain,
    tierAdvanced: tierResult.advanced,
  };
}

export function grantMonsterRewards(
  world: World,
  killerPlayerId: string,
  monster: MonsterEntity,
): KillRewardInfo | null {
  const killer = world.getPlayerEntity(killerPlayerId);
  if (!killer) return null;

  const killerInfo = applyKillRewardsToPlayer(world, killer, monster);

  const party = killer.inParty;
  if (party) {
    const killNodeId = monster.hasPosition.nodeId;
    for (const member of world.playerEntities) {
      if (member === killer) continue;
      if (member.inParty?.leaderId !== party.leaderId) continue;
      if (member.hasPosition.nodeId !== killNodeId) continue;
      applyKillRewardsToPlayer(world, member, monster);
    }
  }

  return killerInfo;
}
