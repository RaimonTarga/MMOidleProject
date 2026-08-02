import {
  FIRST_SEAL_GATED_TIER,
  QUEST_DATABASE,
  tierAdvancementProgress,
} from '@mmo-idle/shared';
import type { PlayerEntity } from '../../../ecs/entity';

export interface QuestTierAdvance {
  advanced: boolean;
  questId?: string;
  questName?: string;
  prevTier?: number;
  newTier?: number;
}

/** Apply a tier advance to the entity, returning the caller-facing record. */
function advanceTier(
  entity: PlayerEntity,
  reason: { questId?: string; questName?: string },
): QuestTierAdvance {
  const prevTier = entity.tracksProgression.playerTier;
  entity.tracksProgression.playerTier += 1;
  entity.tracksProgression.skillPoints += 1;
  return {
    advanced: true,
    ...reason,
    prevTier,
    newTier: entity.tracksProgression.playerTier,
  };
}

/**
 * Called after every monster kill. Advances quest kill-counters.
 *
 * **Quests no longer advance the tier at or above {@link FIRST_SEAL_GATED_TIER}** —
 * seals do (see `shared/src/systems/tierAdvancement.ts` and
 * {@link checkSealTierAdvance}). Tier 0 is the exception and still advances by
 * quest, because there are no bosses at tier 0 to mint a seal from.
 *
 * The higher-tier quest definitions are deliberately KEPT rather than deleted:
 * their `questProgress` counters still drive auto-combat target priority
 * (`combat/ai/targetPriority.ts`) and HUD unlock gating (`hud/uiUnlocks.ts`), so
 * they remain useful as "the notable targets at this tier". They simply no longer
 * carry advancement authority, which keeps tier-up single-sourced.
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

    if (next >= quest.killsRequired && quest.tierRequired < FIRST_SEAL_GATED_TIER) {
      result = advanceTier(entity, { questId, questName: quest.name });
    }
  }
  return result;
}

/**
 * Called after a boss first-clear is recorded. Advances the tier when the player
 * now holds enough seals for their current tier.
 *
 * Safe to call on every boss kill: it is a pure read of `bossesCleared`, and a
 * repeat clear mints no new seal, so it cannot double-advance.
 */
export function checkSealTierAdvance(entity: PlayerEntity): QuestTierAdvance {
  const progress = tierAdvancementProgress(
    entity.tracksProgression.bossesCleared,
    entity.tracksProgression.playerTier,
  );
  if (!progress.canAdvance) return { advanced: false };
  return advanceTier(entity, {});
}
