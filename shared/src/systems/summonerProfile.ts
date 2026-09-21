import type { PassiveMap } from '../passives';
import type { SubVariant } from '../data/skillTree';
import { relicRatingsFromPassives, resolveSummonerRelicProfile, resolveRelicMagnitudeMultiplier, type RelicRatings } from './relics';
import {
  SUMMON_SIZE_MULT_MAX,
  SUMMON_SIZE_MULT_MIN,
  SUMMONER_BASELINE_ATTACK_MODE,
  SUMMONER_BASELINE_ATTACK_RANGE,
  SUMMONER_BASELINE_RANGE,
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
  /** Explicit isolated bench opt-in; never inferred from saved player state. */
  reconstructionExperiment?: 'reconstruction-r1';
  selectedSubVariant: SubVariant | null;
  selectedRange: string | null;
  unlockedSkills: readonly string[];
  passives?: PassiveMap;
  relicRatings?: RelicRatings;
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
  reconstructionFactors: { baseMs: number; frame: number; specialization: number; passive: number; range: number; preRelicMs: number; postRelicMs: number; floorMs: number; floorBinds: boolean };
  frame: SummonerFrame;
  range: SummonerRange;
  specialization: SummonerSpecialization | null;
  slots: SummonerSlotProfile[];
  formationOffenseMult: number;
  /** Formation-wide budget for flat on-hit magnitude and generic proc triggers. */
  secondaryEffectMult: number;
  /** Magnitude only for fixed formations; does not increase proc frequency. */
  relicPotencyMult: number;
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

/** null until the tier-2 range choice is taken - see SUMMONER_BASELINE_RANGE. */
function rangeFromSelection(selectedRange: string | null): SummonerRange | null {
  if (selectedRange === 'summoner-range-close') return 'close';
  if (selectedRange === 'summoner-range-mid') return 'mid';
  if (selectedRange === 'summoner-range-far') return 'far';
  return null;
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
  const selectedRange = rangeFromSelection(input.selectedRange);
  const range = selectedRange ?? SUMMONER_BASELINE_RANGE;
  const specialization = summonerSpecializationFor(frame, input.unlockedSkills);
  const frameTuning = SUMMONER_FRAME_TUNING[frame];
  const rangeTuning = SUMMONER_RANGE_TUNING[range];
  const passives = input.passives ?? {};
  // Range scales the body it never swaps (see SummonerRangeTuning.sizeMult).
  // Clamped so the extremes stay readable: Kilnmaster at Harrier range would
  // otherwise compound to 0.389, and Idolwright at Vigil range to 3.28.
  const baseSlots = resolveSlots(frame, specialization);
  const ratings = input.relicRatings ?? relicRatingsFromPassives(passives);
  const fixedFormation = baseSlots.some(slot => slot.role !== 'normal');
  const potencyMult = fixedFormation ? resolveRelicMagnitudeMultiplier(ratings.potency) : 1;
  const count = fixedFormation ? baseSlots.length : resolveSummonerRelicProfile(5000, baseSlots.length, ratings, SUMMONER_CORE_TUNING.hardEntityCap).summonCount.after;
  // Keep each ordinary body's original budget: a larger army must not dilute its members.
  const resolvedSlots = fixedFormation ? baseSlots : equalSlots(count, baseSlots[0].sizeMult).map(slot => ({ ...slot, offenseWeight: 1 / baseSlots.length, defenseWeight: 1 / baseSlots.length, procWeight: 1 / baseSlots.length }));
  const slots = resolvedSlots.map((slot) => ({
    ...slot,
    sizeMult: Math.min(
      SUMMON_SIZE_MULT_MAX,
      Math.max(SUMMON_SIZE_MULT_MIN, slot.sizeMult * rangeTuning.sizeMult),
    ),
  }));
  const colossusReconstructionMult = specialization === 'colossus'
    ? SUMMONER_SPECIALIZATION_TUNING.colossus.reconstructionIntervalMult
    : 1;
  const experiment = input.reconstructionExperiment === 'reconstruction-r1';
  const frameMult = experiment && frame === 'light' ? 2500 / 3500
    : experiment && frame === 'balanced' ? 3000 / 3500 : frameTuning.reconstructionIntervalMult;
  const rangeMult = experiment && selectedRange === 'far' ? 0.85 : 1;
  const specMult = colossusReconstructionMult * (experiment && specialization === 'endless-swarm' ? 0.80 : 1);
  const passiveMult = Math.max(0.1, passives['summoner.reconstruction-interval-mult'] ?? 1);
  const floorMs = experiment && (frame === 'light' || frame === 'balanced') ? 2000 : SUMMONER_CORE_TUNING.minimumReconstructionIntervalMs;
  const reconstructionBaseMs = Math.round(
    SUMMONER_CORE_TUNING.reconstructionIntervalMs
      * frameMult * specMult * passiveMult * rangeMult,
  );
  const relicReconstructionMs = resolveSummonerRelicProfile(
    reconstructionBaseMs,
    slots.length,
    ratings,
  ).respawnMs.after;

  return {
    reconstructionFactors: { baseMs: SUMMONER_CORE_TUNING.reconstructionIntervalMs, frame: frameMult,
      specialization: specMult, passive: passiveMult, range: rangeMult, preRelicMs: reconstructionBaseMs,
      postRelicMs: relicReconstructionMs, floorMs, floorBinds: relicReconstructionMs < floorMs },
    frame,
    range,
    specialization,
    slots,
    relicPotencyMult: potencyMult,
    formationOffenseMult:
      SUMMONER_CORE_TUNING.formationOffenseMult * frameTuning.offenseMult * potencyMult,
    secondaryEffectMult: specialization === 'endless-swarm'
      ? SUMMONER_SPECIALIZATION_TUNING.endlessSwarm.secondaryEffectMult
      : frameTuning.secondaryEffectMult,
    totalSummonHpPct: frameTuning.totalSummonHpPct * rangeTuning.summonHpMult * potencyMult,
    summonMoveSpeedMult: frameTuning.moveSpeedMult * rangeTuning.moveSpeedMult,
    summonAttackCooldownMult: 1 / SUMMONER_CORE_TUNING.apsInheritanceMult,
    attackMode: selectedRange ? rangeTuning.attackMode : SUMMONER_BASELINE_ATTACK_MODE,
    formationPolicy: rangeTuning.policy,
    // Before a range choice, summons fight close in rather than inheriting
    // Procession's reach with only a melee animation.
    attackRange: selectedRange ? rangeTuning.attackRange : SUMMONER_BASELINE_ATTACK_RANGE,
    preferredDistance: rangeTuning.preferredDistance,
    conduitDefenseShare: rangeTuning.conduitDefenseShare,
    redirectionPct: rangeTuning.redirectionPct,
    leashRadius: SUMMONER_CORE_TUNING.leashRadius,
    reconstructionIntervalMs: Math.max(
      floorMs,
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
