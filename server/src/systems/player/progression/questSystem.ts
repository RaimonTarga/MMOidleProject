import { QUEST_DATABASE } from '@mmo-idle/shared';
import type { PlayerEntity } from '../../../ecs/components/player';

/**
 * Called after every monster kill. Finds the quest for the player's current tier,
 * increments progress, and on completion advances the tier and grants a skill point.
 */
export function registerKillForQuests(entity: PlayerEntity, monsterTypeId: string): void {
  for (const [questId, quest] of QUEST_DATABASE) {
    if (quest.tierRequired !== entity.tracksProgression.playerTier) continue;
    if (!quest.targetMonsterTypes.includes(monsterTypeId)) continue;

    const current = entity.tracksProgression.questProgress[questId] ?? 0;
    if (current >= quest.killsRequired) continue;

    const next = current + 1;
    entity.tracksProgression.questProgress[questId] = next;

    if (next >= quest.killsRequired) {
      entity.tracksProgression.playerTier  += 1;
      entity.tracksProgression.skillPoints += 1;
    }
  }
}
