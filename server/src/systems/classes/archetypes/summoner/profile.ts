import {
  resolveSummonerProfile,
  summonerProfileWeightTotals,
  type SummonerProfile,
} from '@mmo-idle/shared';
import type { PlayerEntity } from '../../../../ecs/entity';

export function summonerProfileFor(owner: PlayerEntity): SummonerProfile {
  return resolveSummonerProfile({
    selectedSubVariant: owner.usesSkills.selectedSubVariant,
    selectedRange: owner.usesSkills.selectedRange,
    unlockedSkills: owner.usesSkills.unlockedSkills,
    passives: owner.usesSkills.passives,
  });
}


/**
 * One body's share of a single logical formation attack: its raw slot weight
 * over the whole AUTHORED formation's.
 *
 * A complete formation delivering one attack each therefore totals exactly 1.0
 * however many bodies it has — a relic-expanded army fires more often but each
 * shot is worth proportionally less, so more summons can never multiply a
 * cadence-normalized mechanic. Conversely a formation fighting bodies down
 * simply never delivers those shares: the survivors are not scaled up to cover
 * for the dead, which is what keeps a broken formation a real loss.
 *
 * Lives here rather than beside its caller in `formationAttack.ts` because
 * `combat.ts` needs it too for the bonded Conduit's own attacks, and
 * `formationAttack.ts` already imports `runPlayerAttack` from `combat.ts`.
 */
export function formationTempoWeight(
  profile: SummonerProfile,
  slotProcWeight: number,
): number {
  const total = summonerProfileWeightTotals(profile).proc;
  return total > 0 ? Math.max(0, slotProcWeight) / total : 0;
}
