import { resolveSummonerProfile, type SummonerProfile } from '@mmo-idle/shared';
import type { PlayerEntity } from '../../../../ecs/entity';

export function summonerProfileFor(owner: PlayerEntity): SummonerProfile {
  return resolveSummonerProfile({
    selectedSubVariant: owner.usesSkills.selectedSubVariant,
    selectedRange: owner.usesSkills.selectedRange,
    unlockedSkills: owner.usesSkills.unlockedSkills,
    passives: owner.usesSkills.passives,
  });
}

