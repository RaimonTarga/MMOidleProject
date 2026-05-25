import type { PlayerSnapshot } from '@mmo-idle/shared';
import { QUEST_DATABASE } from '@mmo-idle/shared';
import type { PlayerEntity } from '../ecs/components/player';
import { withPlayerSnapshotDraft } from '../ecs/playerSnapshotAdapter';

/**
 * Called after every monster kill. Finds the quest for the player's current tier,
 * increments progress, and on completion advances the tier and grants a skill point.
 *
 * Quests are one-time per tier: once the tier has advanced, the completed quest
 * is no longer incremented (player's tier moves past its tierRequired).
 */
export function registerKillForQuests(player: PlayerSnapshot | PlayerEntity, monsterTypeId: string): void {
  if ('entityId' in player) {
    withPlayerSnapshotDraft(player, draft => registerKillForQuestsSnapshot(draft, monsterTypeId));
    return;
  }
  registerKillForQuestsSnapshot(player, monsterTypeId);
}

function registerKillForQuestsSnapshot(player: PlayerSnapshot, monsterTypeId: string): void {
  for (const [questId, quest] of QUEST_DATABASE) {
    if (quest.tierRequired !== player.playerTier) continue;
    if (!quest.targetMonsterTypes.includes(monsterTypeId)) continue;

    const current = player.questProgress[questId] ?? 0;
    if (current >= quest.killsRequired) continue;

    const next = current + 1;
    player.questProgress[questId] = next;

    if (next >= quest.killsRequired) {
      player.playerTier  += 1;
      player.skillPoints += 1;
    }
  }
}
