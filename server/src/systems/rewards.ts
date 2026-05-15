import type { PlayerState, MonsterState } from '@mmo-idle/shared';
import type { World } from '../world/World';

/**
 * Resource amounts awarded for a single kill event.
 * Add new resource fields here as the game expands (gold, xp, etc.).
 */
export interface KillRewards {
  essence: number;
  level: number;
}

/**
 * Reward table keyed by monster name.
 * Add entries as new monster types are introduced.
 */
const MONSTER_REWARD_TABLE: Record<string, KillRewards> = {
  Slime: { essence: 5, level: 1 },
};

const FALLBACK_REWARDS: KillRewards = { essence: 1, level: 1 };

/**
 * Apply a reward bundle directly to a player.
 * All resource mutations go through here so party-splitting and
 * bonus multipliers have a single place to hook into later.
 */
export function rewardPlayer(player: PlayerState, rewards: KillRewards): void {
  player.essence     += rewards.essence;
  player.level       += rewards.level;
  player.skillPoints += rewards.level; // 1 skill point per level gained
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

  const rewards = MONSTER_REWARD_TABLE[monster.name] ?? FALLBACK_REWARDS;
  rewardPlayer(killer, rewards);
}
