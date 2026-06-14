import { NODE_BIOMES, MONSTER_DATABASE, RECIPE_DATABASE, biomeLevelCap, biomeXpForBiomeLevel, bossClearKey, BIOME_DATABASE, ULTIMATE_CLEAR_VOID_OVERLORD } from '@mmo-idle/shared';
import type { EssenceType } from '@mmo-idle/shared';
import type { MonsterEntity, PlayerEntity } from '../../../ecs/entity';
import type { World } from '../../../world/World';
import { markSliceDirty } from '../../../ecs/dirtyHelpers';
import { registerKillForQuests } from './questSystem';
import { recordWorldLogEvent } from '../../../world/worldLog';
import { actorFromPlayer } from '../../../world/worldLogActors';
import { notifyVoidOverlordDeath } from '../../combat/ai/ultimateEncounter';

export interface KillRewards {
  essence: number;
  essenceType: EssenceType;
  level: number;
  biomeXp?: number;
}

const FALLBACK_REWARDS: KillRewards = { essence: 1, essenceType: 'green', level: 1 };
const DEFAULT_BOSS_RESPAWN_MS = 30_000;
const VOID_OVERLORD_RESPAWN_MS = 5 * 60_000;

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


function scheduleBossRespawn(world: World, monster: MonsterEntity): void {
  const durationMs =
    monster.isMonster.monsterTypeId === 'void-overlord'
      ? VOID_OVERLORD_RESPAWN_MS
      : DEFAULT_BOSS_RESPAWN_MS;
  const respawnAt = Date.now() + durationMs;
  const nodeId = monster.hasPosition.nodeId;

  const marker = {
    monsterTypeId: monster.isMonster.monsterTypeId,
    pos: { ...monster.hasPosition.current },
    respawnAt,
    durationMs,
  };
  world.bossRespawnAt.set(nodeId, respawnAt);
  world.bossRespawnMarkers.set(nodeId, marker);

  if (monster.isMonster.monsterTypeId === 'void-overlord') {
    world.suppressedFeatureBlocks.add(`${nodeId}:abyssal_throne`);
    // The overlord cooldown is global and long (5 min); persist it so it is
    // remembered across node despawn (freeze/thaw) and server restarts.
    world.overlordRespawnPersist?.({ nodeId, ...marker });
  }

  world.broadcastBossFelledState();
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
  while (rawLevel < levelCap && newXP >= biomeXpForBiomeLevel(biomeGroup, rawLevel + 1)) rawLevel++;
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
    world.analyticsProgression?.(
      entity.isPlayer.id,
      nodeId,
      'biome-level-up',
      newLevel,
    );
  }
  return { xpGain, prevLevel, newLevel, unlockedRecipeIds };
}

export function checkRecipeUnlocks(entity: PlayerEntity, biomeGroup?: string, newLevel?: number): void {
  for (const recipe of RECIPE_DATABASE.values()) {
    if (recipe.requiredBossClear &&
        !entity.tracksProgression.bossesCleared.includes(recipe.requiredBossClear)) {
      continue;
    }
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
  const biomeResult = applyBiomeXP(
    world,
    recipient,
    monster.hasPosition.nodeId,
    rewards.biomeXp ?? 1,
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
    world.analyticsProgression?.(
      recipient.isPlayer.id,
      monster.hasPosition.nodeId,
      'player-tier-up',
      tierResult.newTier,
    );
    world.pendingAscensions.push(recipient.isPlayer.id);
  }
  if (monster.isMonster.isBoss && !monster.isEncounterAdd) {
    scheduleBossRespawn(world, monster);
    const info = NODE_BIOMES[monster.hasPosition.nodeId];
    if (info) {
      const key = bossClearKey(info.biomeGroup, info.biomeTier);
      if (!recipient.tracksProgression.bossesCleared.includes(key)) {
        recipient.tracksProgression.bossesCleared.push(key);
        markSliceDirty(world, recipient, 'tracksProgression');
      }
    }
    if (monster.isMonster.monsterTypeId === 'void-overlord') {
      const token = ULTIMATE_CLEAR_VOID_OVERLORD;
      if (!recipient.tracksProgression.bossesCleared.includes(token)) {
        recipient.tracksProgression.bossesCleared.push(token);
        markSliceDirty(world, recipient, 'tracksProgression');
      }
    }
  }
  checkRecipeUnlocks(recipient);
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

  if (monster.isMonster.monsterTypeId === 'void-overlord') {
    notifyVoidOverlordDeath(world, monster, killerPlayerId);
  }

  // Despawn any adds the boss spawned via a 'spawn-adds' script action.
  const spawnedAddIds = monster.scriptsBoss?.spawnedAddIds;
  if (spawnedAddIds?.length) {
    for (const id of spawnedAddIds) world.removeMonsterEntity(id);
    monster.scriptsBoss!.spawnedAddIds = [];
  }

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
