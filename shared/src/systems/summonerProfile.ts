import type { PassiveMap } from '../passives';
import type { MinionMonsterType } from '../components/archetypes/summoner/isMinion';
import type { SubVariant } from '../data/skillTree';
import type { RelicRatings } from './relics';
import {
  SUMMONER_BASELINE_ATTACK_MODE,
  SUMMONER_BASELINE_ATTACK_RANGE,
  SUMMONER_CORE_TUNING,
  SUMMONER_RANGE_TUNING,
  type SummonerAttackMode,
  type SummonerSlotRole,
} from '../data/summoner';

/** One body of the Conduit's Formation (class-first §7.3): a roster entry resolved from its piece. */
export interface RosterBody {
  pieceId: string;
  family: 'generic' | 'tank' | 'damage' | 'support';
  /** The piece's stat multipliers (kit params `hpMult`, `damageMult`, `cooldownMult`); 1 when absent. */
  hpMult?: number;
  damageMult?: number;
  cooldownMult?: number;
  /** What it costs to field; a slot's share of the formation's offense and HP follows it. 0 is free (a Soul): it counts as one more body and dilutes no one. */
  command: number;
  mode: SummonerAttackMode;
  row: 'front' | 'middle' | 'back';
  body: MinionMonsterType;
}

export interface SummonerProfileInput {
  /** The Formation's roster. Empty or absent fields no summons. */
  roster?: readonly RosterBody[];
  /**
   * Ignored. Frame, range, specialization and relic ratings used to build the
   * formation; the roster is the only path now (CD.8). Callers may still pass
   * them so old object literals typecheck.
   */
  selectedSubVariant?: SubVariant | null;
  selectedRange?: string | null;
  unlockedSkills?: readonly string[];
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
  /** Roster slots only: the piece, its role, row, attack mode and body. */
  pieceId?: string;
  family?: RosterBody['family'];
  row?: RosterBody['row'];
  mode?: SummonerAttackMode;
  body?: MinionMonsterType;
  /** Roster slots only: how far this body attacks from (its mode's range). */
  attackRange?: number;
  /** Roster slots only: this body's own multipliers on HP, damage and attack cooldown. */
  hpMult?: number;
  damageMult?: number;
  cooldownMult?: number;
}

export interface SummonerProfile {
  slots: SummonerSlotProfile[];
  formationOffenseMult: number;
  /** Formation-wide budget for flat on-hit magnitude and generic proc triggers. */
  secondaryEffectMult: number;
  /** Magnitude only. Relic ratings no longer scale a formation; this stays 1. */
  relicPotencyMult: number;
  totalSummonHpPct: number;
  summonMoveSpeedMult: number;
  summonAttackCooldownMult: number;
  attackMode: 'melee' | 'reach' | 'ranged';
  formationPolicy: 'guardian' | 'escort' | 'harrier';
  attackRange: number;
  preferredDistance: number;
  leashRadius: number;
  reconstructionIntervalMs: number;
  reconstructionHpCostRatio: number;
  reconstructionSafetyFloorPct: number;
  reconstructionCombatRegenPct: number;
  outOfCombatReconstructionSpeedMult: number;
}

/** Mode to attack range: reach and ranged use the ranges' values; melee fights close in, as the unpicked root did. */
const MODE_RANGE = { melee: 'close', reach: 'mid', ranged: 'far' } as const;

/**
 * The roster's slots: one per body, `<pieceId>#<n>`, weights by Command spent so a complete
 * formation delivering one attack each still totals 1.0 however it is composed.
 */
function rosterSlots(roster: readonly RosterBody[]): SummonerSlotProfile[] {
  const total = roster.reduce((sum, body) => sum + (body.command > 0 ? body.command : 0), 0) || 1;
  const seen = new Map<string, number>();
  return roster.map((body) => {
    const n = seen.get(body.pieceId) ?? 0;
    seen.set(body.pieceId, n + 1);
    const weight = (body.command > 0 ? body.command : 1) / total;
    return {
      slotId: `${body.pieceId}#${n}`,
      role: 'normal' as const,
      offenseWeight: weight,
      defenseWeight: weight,
      procWeight: weight,
      sizeMult: body.command > 1 || body.command === 0 ? 1.2 : 1,
      pieceId: body.pieceId,
      family: body.family,
      row: body.row,
      mode: body.mode,
      body: body.body,
      hpMult: body.hpMult ?? 1,
      damageMult: body.damageMult ?? 1,
      cooldownMult: body.cooldownMult ?? 1,
      attackRange: body.mode === 'melee' ? SUMMONER_BASELINE_ATTACK_RANGE : SUMMONER_RANGE_TUNING[MODE_RANGE[body.mode]].attackRange,
    };
  });
}

export function resolveSummonerProfile(input: SummonerProfileInput): SummonerProfile {
  const slots = input.roster && input.roster.length > 0 ? rosterSlots(input.roster) : [];
  const passives = input.passives ?? {};
  const passiveMult = Math.max(0.1, passives['summoner.reconstruction-interval-mult'] ?? 1);
  const floorMs = SUMMONER_CORE_TUNING.minimumReconstructionIntervalMs;
  const reconstructionBaseMs = Math.round(SUMMONER_CORE_TUNING.reconstructionIntervalMs * passiveMult);

  return {
    slots,
    relicPotencyMult: 1,
    formationOffenseMult: SUMMONER_CORE_TUNING.formationOffenseMult,
    secondaryEffectMult: 1,
    totalSummonHpPct: SUMMONER_CORE_TUNING.totalSummonHpPct,
    summonMoveSpeedMult: 1,
    summonAttackCooldownMult: 1 / SUMMONER_CORE_TUNING.apsInheritanceMult,
    attackMode: SUMMONER_BASELINE_ATTACK_MODE,
    formationPolicy: SUMMONER_RANGE_TUNING.mid.policy,
    // Melee bodies fight at the baseline reach. Reach and ranged bodies carry
    // their own attackRange from the roster slot.
    attackRange: SUMMONER_BASELINE_ATTACK_RANGE,
    preferredDistance: SUMMONER_RANGE_TUNING.mid.preferredDistance,
    leashRadius: SUMMONER_CORE_TUNING.leashRadius,
    reconstructionIntervalMs: Math.max(floorMs, reconstructionBaseMs),
    reconstructionHpCostRatio: SUMMONER_CORE_TUNING.reconstructionHpCostRatio,
    reconstructionSafetyFloorPct: SUMMONER_CORE_TUNING.reconstructionSafetyFloorPct,
    reconstructionCombatRegenPct: SUMMONER_CORE_TUNING.reconstructionCombatRegenPct,
    outOfCombatReconstructionSpeedMult: SUMMONER_CORE_TUNING.outOfCombatReconstructionSpeedMult,
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
    { offense: 0, defense: 0, proc: 0 },
  );
}

/**
 * Per-body damage multiplier when one area hit catches `caughtBodies` summons of
 * the same formation. See `SUMMONER_CORE_TUNING.areaShareExponent`.
 */
export function summonAreaShareMult(caughtBodies: number): number {
  if (caughtBodies <= 1) return 1;
  return caughtBodies ** -SUMMONER_CORE_TUNING.areaShareExponent;
}
