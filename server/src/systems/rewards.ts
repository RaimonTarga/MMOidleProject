import type { PlayerState, MonsterState } from '@mmo-idle/shared';
import { NODE_BIOMES, BIOME_UNLOCK_THRESHOLDS, MONSTER_DATABASE } from '@mmo-idle/shared';
import type { World } from '../world/World';
import { registerKillForQuests } from './questSystem';

/**
 * Resource amounts awarded for a single kill event.
 * Add new resource fields here as the game expands (gold, xp, etc.).
 */
export interface KillRewards {
  essence: number;
  essenceType: string;
  level: number;
}

const FALLBACK_REWARDS: KillRewards = { essence: 1, essenceType: 'green', level: 1 };

export function rewardPlayer(player: PlayerState, rewards: KillRewards): void {
  const type = rewards.essenceType as keyof typeof player.essences;
  if (type in player.essences) player.essences[type] += rewards.essence;
  // Skill points are granted exclusively via tier advancement (questSystem).
  // The `level` field is kept as a flat kill counter for future use.
  player.level += rewards.level;
}

/**
 * Increment biomeKills for the node where the kill happened, then
 * re-derive recipeProgress from BIOME_UNLOCK_THRESHOLDS.
 * Called after every monster death.
 */
function applyBiomeProgression(player: PlayerState, nodeId: string): void {
  const biomeInfo = NODE_BIOMES[nodeId];
  if (!biomeInfo) return;

  const { biomeGroup } = biomeInfo;
  player.biomeKills[biomeGroup] = (player.biomeKills[biomeGroup] ?? 0) + 1;

  const kills = player.biomeKills[biomeGroup];
  const thresholds = BIOME_UNLOCK_THRESHOLDS[biomeGroup] ?? [];

  let maxTier = player.recipeProgress[biomeGroup] ?? 0;
  for (const { tier, killsRequired } of thresholds) {
    if (kills >= killsRequired && tier > maxTier) maxTier = tier;
  }
  player.recipeProgress[biomeGroup] = maxTier;
}

/**
 * Look up the reward table for the killed monster and grant the result
 * to the killing player. No-ops silently if the killer has disconnected.
 *
 * Future hooks:
 *   - party splitting: iterate over party members instead of a single killer
 *   - dropped loot: call world.spawnLoot(...) here before returning
 *   - loot ownership: attach killerPlayerId to the spawned entity
 */
export function grantMonsterRewards(
  world: World,
  killerPlayerId: string,
  monster: MonsterState,
): void {
  const killer = world.players.get(killerPlayerId);
  if (!killer) return;

  const def = MONSTER_DATABASE.get(monster.monsterTypeId);
  const rewards = def?.rewards ?? FALLBACK_REWARDS;
  rewardPlayer(killer, rewards);
  applyBiomeProgression(killer, monster.nodeId);
  registerKillForQuests(killer, monster.monsterTypeId);
}
