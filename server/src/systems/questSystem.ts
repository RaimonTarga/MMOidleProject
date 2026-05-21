import type { PlayerState } from '@mmo-idle/shared';
import { QUEST_DATABASE, XP_PER_LEVEL } from '@mmo-idle/shared';

const SKILL_POINTS_PER_LEVEL = 1;

/**
 * Award progression XP to a player. Automatically level-ups and grants skill
 * points when the XP threshold is crossed. Keeps the remainder for the next level.
 */
function awardProgressionXP(player: PlayerState, xp: number): void {
  player.progressionXP += xp;
  while (player.progressionXP >= XP_PER_LEVEL) {
    player.progressionXP     -= XP_PER_LEVEL;
    player.progressionLevel  += 1;
    player.skillPoints       += SKILL_POINTS_PER_LEVEL;
  }
}

/**
 * Called after every monster kill. Increments quest progress for any quest
 * whose targetMonsterTypes includes this monsterTypeId. Completes quests whose
 * kill threshold is reached and awards XP.
 *
 * Quests are one-time: completed quests (progress === killsRequired) are no
 * longer incremented. New quests can be added to QUEST_DATABASE at runtime.
 */
export function registerKillForQuests(player: PlayerState, monsterTypeId: string): void {
  for (const [questId, quest] of QUEST_DATABASE) {
    if (!quest.targetMonsterTypes.includes(monsterTypeId)) continue;

    const current = player.questProgress[questId] ?? 0;
    if (current >= quest.killsRequired) continue; // already completed

    const next = current + 1;
    player.questProgress[questId] = next;

    if (next >= quest.killsRequired) {
      awardProgressionXP(player, quest.xpReward);
    }
  }
}
