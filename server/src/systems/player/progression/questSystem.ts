import { QUEST_DATABASE } from '@mmo-idle/shared';
import type { PlayerEntity } from '../../../ecs/entity';

export interface QuestTierAdvance {
  advanced: boolean;
  questId?: string;
  questName?: string;
  prevTier?: number;
  newTier?: number;
}

/**
 * Called after every monster kill. Finds the quest for the player's current tier,
 * increments progress, and on completion advances the tier and grants a skill point.
 */
export function registerKillForQuests(
  entity: PlayerEntity,
  monsterTypeId: string,
): QuestTierAdvance {
  let result: QuestTierAdvance = { advanced: false };
  for (const [questId, quest] of QUEST_DATABASE) {
    if (quest.tierRequired !== entity.tracksProgression.playerTier) continue;
    if (!quest.targetMonsterTypes.includes(monsterTypeId)) continue;

    const current = entity.tracksProgression.questProgress[questId] ?? 0;
    if (current >= quest.killsRequired) continue;

    const next = current + 1;
    entity.tracksProgression.questProgress[questId] = next;

    if (next >= quest.killsRequired) {
      const prevTier = entity.tracksProgression.playerTier;
      entity.tracksProgression.playerTier += 1;
      entity.tracksProgression.skillPoints += 1;
      result = {
        advanced: true,
        questId,
        questName: quest.name,
        prevTier,
        newTier: entity.tracksProgression.playerTier,
      };
    }
  }
  return result;
}
