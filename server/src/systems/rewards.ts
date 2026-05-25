import type { PlayerSnapshot, MonsterSnapshot } from '@mmo-idle/shared';
import { NODE_BIOMES, MONSTER_DATABASE, RECIPE_DATABASE, GAME_CONFIG, biomeXpForLevel } from '@mmo-idle/shared';
import type { PlayerEntity } from '../ecs/components/player';
import type { MonsterEntity } from '../ecs/components/monster';
import type { World } from '../world/World';
import { withPlayerSnapshotDraft } from '../ecs/playerSnapshotAdapter';
import { registerKillForQuests } from './questSystem';

export interface KillRewards {
  essence: number;
  essenceType: string;
  level: number;
}

const FALLBACK_REWARDS: KillRewards = { essence: 1, essenceType: 'green', level: 1 };

export function rewardPlayer(player: PlayerSnapshot | PlayerEntity, rewards: KillRewards): void {
  if ('entityId' in player) {
    withPlayerSnapshotDraft(player, draft => rewardPlayerSnapshot(draft, rewards));
    return;
  }
  rewardPlayerSnapshot(player, rewards);
}

function rewardPlayerSnapshot(player: PlayerSnapshot, rewards: KillRewards): void {
  const type = rewards.essenceType as keyof typeof player.essences;
  if (type in player.essences) player.essences[type] += rewards.essence;
  player.level += rewards.level;
}

/**
 * Grant biome XP for the node where the kill happened, advance the biome level
 * if the threshold is crossed, and auto-unlock any recipes that become available.
 * XP gain stops once the level cap for the current playerTier is reached.
 */
function applyBiomeXP(player: PlayerSnapshot, nodeId: string): void {
  const biomeInfo = NODE_BIOMES[nodeId];
  if (!biomeInfo) return;

  const { biomeGroup, biomeTier } = biomeInfo;
  const levelCap  = GAME_CONFIG.BIOME_LEVEL_CAP_BY_TIER[player.playerTier] ?? 999;
  const prevLevel = player.biomeLevel[biomeGroup] ?? 0;
  if (prevLevel >= levelCap) return;

  const xpGain  = GAME_CONFIG.BIOME_XP_BY_NODE_TIER[biomeTier] ?? 5;
  const newXP   = (player.biomeXP[biomeGroup] ?? 0) + xpGain;
  player.biomeXP[biomeGroup] = newXP;

  let rawLevel = prevLevel;
  while (rawLevel < levelCap && newXP >= biomeXpForLevel(rawLevel + 1)) rawLevel++;
  const newLevel = rawLevel;
  if (newLevel > prevLevel) {
    player.biomeLevel[biomeGroup] = newLevel;
    checkRecipeUnlocks(player, biomeGroup, newLevel);
  }
}

function checkRecipeUnlocks(
  player: PlayerSnapshot,
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
  monster: MonsterSnapshot | MonsterEntity,
): void {
  const killer = world.getPlayerEntity(killerPlayerId);
  if (!killer) return;

  const monsterTypeId = 'entityId' in monster ? monster.isMonster.monsterTypeId : monster.monsterTypeId;
  const nodeId = 'entityId' in monster ? monster.hasPosition.nodeId : monster.nodeId;
  const def = MONSTER_DATABASE.get(monsterTypeId);
  const rewards = def?.rewards ?? FALLBACK_REWARDS;
  rewardPlayer(killer, rewards);
  withPlayerSnapshotDraft(killer, draft => applyBiomeXP(draft, nodeId));
  registerKillForQuests(killer, monsterTypeId);
}
