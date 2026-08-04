import type { PassiveMap } from '../passives';
import type { SubVariant } from '../data/skillTree';
import { relicRatingsFromPassives, resolveSummonerRelicProfile } from './relics';
import {
  SUMMONER_CORE_TUNING,
  SUMMONER_FRAME_TUNING,
  SUMMONER_RANGE_TUNING,
  SUMMONER_SPECIALIZATION_TUNING,
  summonerSpecializationFor,
  type SummonerFrame,
  type SummonerSlotRole,
  type SummonerSpecialization,
  type SummonerRange,
} from '../data/summoner';

export interface SummonerProfileInput {
  selectedSubVariant: SubVariant | null;
  selectedRange: string | null;
  unlockedSkills: readonly string[];
  passives?: PassiveMap;
}

export interface SummonerSlotProfile {
  slotId: string;
  role: SummonerSlotRole;
  offenseWeight: number;
  defenseWeight: number;
  procWeight: number;
  sizeMult: number;
}

export interface SummonerProfile {
  frame: SummonerFrame;
  range: SummonerRange;
  specialization: SummonerSpecialization | null;
  slots: SummonerSlotProfile[];
  formationOffenseMult: number;
  totalSummonHpPct: number;
  summonMoveSpeedMult: number;
  summonAttackCooldownMult: number;
  attackMode: 'melee' | 'reach' | 'ranged';
  formationPolicy: 'guardian' | 'escort' | 'harrier';
  attackRange: number;
  preferredDistance: number;
  conduitDefenseShare: number;
  redirectionPct: number;
  leashRadius: number;
  reconstructionIntervalMs: number;
  reconstructionHpCostRatio: number;
  reconstructionSafetyFloorPct: number;
  reconstructionCombatRegenPct: number;
  battleBondConduitOffenseWeight: number;
}

function rangeFromSelection(selectedRange: string | null): SummonerRange {
  if (selectedRange === 'summoner-range-close') return 'close';
  if (selectedRange === 'summoner-range-far') return 'far';
  return 'mid';
}

function equalSlots(count: number, sizeMult: number): SummonerSlotProfile[] {
  const safeCount = Math.max(1, Math.min(SUMMONER_CORE_TUNING.hardEntityCap, Math.round(count)));
  const weight = 1 / safeCount;
  return Array.from({ length: safeCount }, (_, index) => ({
    slotId: `normal:${index}`,
    role: 'normal' as const,
    offenseWeight: weight,
    defenseWeight: weight,
    procWeight: weight,
    sizeMult,
  }));
}

function resolveSlots(
  frame: SummonerFrame,
  specialization: SummonerSpecialization | null,
): SummonerSlotProfile[] {
  const frameTuning = SUMMONER_FRAME_TUNING[frame];
  if (specialization === 'endless-swarm') {
    return equalSlots(SUMMONER_SPECIALIZATION_TUNING.endlessSwarm.count, frameTuning.sizeMult * 0.72);
  }
  if (specialization === 'colossus') {
    return [{
      slotId: 'colossus:0',
      role: 'colossus',
      offenseWeight: 1,
      defenseWeight: 1,
      procWeight: 1,
      sizeMult: frameTuning.sizeMult * SUMMONER_SPECIALIZATION_TUNING.colossus.sizeMult,
    }];
  }
  if (specialization === 'battle-bond') {
    const summonWeight = SUMMONER_SPECIALIZATION_TUNING.battleBond.summonOffenseWeight;
    return [{
      slotId: 'bonded:0',
      role: 'bonded',
      offenseWeight: summonWeight,
      defenseWeight: 1,
      procWeight: summonWeight,
      sizeMult: frameTuning.sizeMult,
    }];
  }
  if (specialization === 'twin-covenant') {
    const tuning = SUMMONER_SPECIALIZATION_TUNING.twinCovenant;
    return [
      {
        slotId: 'offense:0',
        role: 'offense-twin',
        offenseWeight: tuning.offenseTwinOffenseWeight,
        defenseWeight: tuning.offenseTwinDefenseWeight,
        procWeight: tuning.offenseTwinOffenseWeight,
        sizeMult: frameTuning.sizeMult * 0.92,
      },
      {
        slotId: 'defense:0',
        role: 'defense-twin',
        offenseWeight: tuning.defenseTwinOffenseWeight,
        defenseWeight: tuning.defenseTwinDefenseWeight,
        procWeight: tuning.defenseTwinOffenseWeight,
        sizeMult: frameTuning.sizeMult * 1.08,
      },
    ];
  }
  return equalSlots(frameTuning.count, frameTuning.sizeMult);
}

export function resolveSummonerProfile(input: SummonerProfileInput): SummonerProfile {
  const frame: SummonerFrame = input.selectedSubVariant ?? 'root';
  const range = rangeFromSelection(input.selectedRange);
  const specialization = summonerSpecializationFor(frame, input.unlockedSkills);
  const frameTuning = SUMMONER_FRAME_TUNING[frame];
  const rangeTuning = SUMMONER_RANGE_TUNING[range];
  const passives = input.passives ?? {};
  const slots = resolveSlots(frame, specialization);
  const colossusReconstructionMult = specialization === 'colossus'
    ? SUMMONER_SPECIALIZATION_TUNING.colossus.reconstructionIntervalMult
    : 1;
  const reconstructionBaseMs = Math.round(
    SUMMONER_CORE_TUNING.reconstructionIntervalMs
      * frameTuning.reconstructionIntervalMult
      * colossusReconstructionMult
      * Math.max(0.1, passives['summoner.reconstruction-interval-mult'] ?? 1),
  );
  const relicReconstructionMs = resolveSummonerRelicProfile(
    reconstructionBaseMs,
    slots.length,
    relicRatingsFromPassives(passives),
  ).respawnMs.after;

  return {
    frame,
    range,
    specialization,
    slots,
    formationOffenseMult:
      SUMMONER_CORE_TUNING.formationOffenseMult * frameTuning.offenseMult,
    totalSummonHpPct: frameTuning.totalSummonHpPct * rangeTuning.summonHpMult,
    summonMoveSpeedMult: frameTuning.moveSpeedMult * rangeTuning.moveSpeedMult,
    summonAttackCooldownMult: 1 / SUMMONER_CORE_TUNING.apsInheritanceMult,
    attackMode: rangeTuning.attackMode,
    formationPolicy: rangeTuning.policy,
    attackRange: rangeTuning.attackRange,
    preferredDistance: rangeTuning.preferredDistance,
    conduitDefenseShare: rangeTuning.conduitDefenseShare,
    redirectionPct: rangeTuning.redirectionPct,
    leashRadius: SUMMONER_CORE_TUNING.leashRadius,
    reconstructionIntervalMs: Math.max(
      SUMMONER_CORE_TUNING.minimumReconstructionIntervalMs,
      relicReconstructionMs,
    ),
    reconstructionHpCostRatio: SUMMONER_CORE_TUNING.reconstructionHpCostRatio,
    reconstructionSafetyFloorPct: SUMMONER_CORE_TUNING.reconstructionSafetyFloorPct,
    reconstructionCombatRegenPct: SUMMONER_CORE_TUNING.reconstructionCombatRegenPct,
    battleBondConduitOffenseWeight: specialization === 'battle-bond'
      ? SUMMONER_SPECIALIZATION_TUNING.battleBond.conduitOffenseWeight
      : 0,
  };
}

export function summonerProfileWeightTotals(profile: SummonerProfile): {
  offense: number;
  defense: number;
  proc: number;
} {
  return profile.slots.reduce(
    (totals, slot) => ({
      offense: totals.offense + slot.offenseWeight,
      defense: totals.defense + slot.defenseWeight,
      proc: totals.proc + slot.procWeight,
    }),
    { offense: profile.battleBondConduitOffenseWeight, defense: 0, proc: profile.battleBondConduitOffenseWeight },
  );
}
