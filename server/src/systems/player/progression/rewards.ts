import { NODE_BIOMES, MONSTER_DATABASE, RECIPE_DATABASE, GAME_CONFIG, biomeXpForLevel } from '@mmo-idle/shared';
import type { PlayerEntity } from '../../../ecs/components/player';
import type { MonsterEntity } from '../../../ecs/components/monster';
import type { World } from '../../../world/World';
import { registerKillForQuests } from './questSystem';

export interface KillRewards {
  essence: number;
  essenceType: string;
  level: number;
}

const FALLBACK_REWARDS: KillRewards = { essence: 1, essenceType: 'green', level: 1 };

export function rewardPlayer(entity: PlayerEntity, rewards: KillRewards): void {
  const type = rewards.essenceType as keyof typeof entity.tracksProgression.essences;
  if (type in entity.tracksProgression.essences) {
    entity.tracksProgression.essences[type] += rewards.essence;
  }
  entity.tracksProgression.level += rewards.level;
}

function applyBiomeXP(entity: PlayerEntity, nodeId: string): void {
  const biomeInfo = NODE_BIOMES[nodeId];
  if (!biomeInfo) return;

  const { biomeGroup, biomeTier } = biomeInfo;
  const levelCap  = GAME_CONFIG.BIOME_LEVEL_CAP_BY_TIER[entity.tracksProgression.playerTier] ?? 999;
  const prevLevel = entity.tracksProgression.biomeLevel[biomeGroup] ?? 0;
  if (prevLevel >= levelCap) return;

  const xpGain = GAME_CONFIG.BIOME_XP_BY_NODE_TIER[biomeTier] ?? 5;
  const newXP  = (entity.tracksProgression.biomeXP[biomeGroup] ?? 0) + xpGain;
  entity.tracksProgression.biomeXP[biomeGroup] = newXP;

  let rawLevel = prevLevel;
  while (rawLevel < levelCap && newXP >= biomeXpForLevel(rawLevel + 1)) rawLevel++;
  const newLevel = rawLevel;
  if (newLevel > prevLevel) {
    entity.tracksProgression.biomeLevel[biomeGroup] = newLevel;
    checkRecipeUnlocks(entity, biomeGroup, newLevel);
  }
}

function checkRecipeUnlocks(entity: PlayerEntity, biomeGroup: string, newLevel: number): void {
  for (const recipe of RECIPE_DATABASE.values()) {
    if (recipe.recipeGroup !== biomeGroup) continue;
    if (recipe.requiredBiomeLevel > newLevel) continue;
    if (!entity.tracksProgression.unlockedRecipes.includes(recipe.id)) {
      entity.tracksProgression.unlockedRecipes.push(recipe.id);
    }
  }
}

export function grantMonsterRewards(
  world: World,
  killerPlayerId: string,
  monster: MonsterEntity,
): void {
  const killer = world.getPlayerEntity(killerPlayerId);
  if (!killer) return;

  const def = MONSTER_DATABASE.get(monster.isMonster.monsterTypeId);
  const rewards = def?.rewards ?? FALLBACK_REWARDS;
  rewardPlayer(killer, rewards);
  applyBiomeXP(killer, monster.hasPosition.nodeId);
  registerKillForQuests(killer, monster.isMonster.monsterTypeId);
}
