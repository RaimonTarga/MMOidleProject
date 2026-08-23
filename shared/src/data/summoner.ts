import type { SubVariant } from './skillTree';

export type SummonerFrame = SubVariant | 'root';
export type SummonerRange = 'close' | 'mid' | 'far';
export type SummonerAttackMode = 'melee' | 'reach' | 'ranged';
export type SummonerFormationPolicy = 'guardian' | 'escort' | 'harrier';
export type SummonerSlotRole =
  | 'normal'
  | 'bonded'
  | 'colossus'
  | 'offense-twin'
  | 'defense-twin';

export type SummonerSpecialization =
  | 'volatile-brood'
  | 'endless-swarm'
  | 'harrier-brood'
  | 'coordinated-hunt'
  | 'withering-chorus'
  | 'grand-ritual'
  | 'colossus'
  | 'battle-bond'
  | 'twin-covenant';

export interface SummonerFrameTuning {
  count: number;
  offenseMult: number;
  totalSummonHpPct: number;
  moveSpeedMult: number;
  sizeMult: number;
  reconstructionIntervalMult: number;
}

export interface SummonerRangeTuning {
  attackMode: SummonerAttackMode;
  policy: SummonerFormationPolicy;
  /**
   * Range's visual signature, alongside the hue tint in `SUMMON_RANGE_TINT`.
   * Range never swaps the summon body (mirroring the player rule in
   * frameMaps.ts) — it colours and sizes it.
   *
   * NOT purely cosmetic: `sizeMult` feeds `resolveMinionHitbox`, so a Vigil
   * summon is genuinely easier for monster AoE to catch and a Harrier summon
   * genuinely harder. That matches what the rest of the tuning already says —
   * Vigil soaks (summonHpMult 1.25, redirect 0.55), Harrier kites (0.7, 0.08).
   */
  sizeMult: number;
  attackRange: number;
  preferredDistance: number;
  summonHpMult: number;
  conduitDefenseShare: number;
  redirectionPct: number;
  moveSpeedMult: number;
}

/**
 * First-pass balance values. The structural contract is locked; these numbers
 * deliberately live together so playtesting never has to hunt through AI code.
 */
export const SUMMONER_CORE_TUNING = {
  rootCount: 4,
  apsInheritanceMult: 1,
  formationOffenseMult: 1,
  reconstructionIntervalMs: 5_000,
  minimumReconstructionIntervalMs: 2_500,
  reconstructionHpCostRatio: 0.5,
  reconstructionSafetyFloorPct: 0.2,
  reconstructionCombatRegenPct: 0.2,
  leashRadius: 320,
  hardEntityCap: 9,
} as const;

export const SUMMONER_FRAME_TUNING: Record<SummonerFrame, SummonerFrameTuning> = {
  root: {
    count: 4,
    offenseMult: 1,
    totalSummonHpPct: 0.8,
    moveSpeedMult: 1,
    sizeMult: 1,
    reconstructionIntervalMult: 1,
  },
  light: {
    count: 6,
    offenseMult: 1.05,
    totalSummonHpPct: 0.66,
    moveSpeedMult: 1.18,
    sizeMult: 0.72,
    reconstructionIntervalMult: 0.92,
  },
  balanced: {
    count: 5,
    offenseMult: 1,
    totalSummonHpPct: 1,
    moveSpeedMult: 1,
    sizeMult: 1,
    reconstructionIntervalMult: 1,
  },
  heavy: {
    count: 2,
    offenseMult: 0.98,
    totalSummonHpPct: 1.4,
    moveSpeedMult: 0.78,
    sizeMult: 1.75,
    reconstructionIntervalMult: 1.12,
  },
};

export const SUMMONER_RANGE_TUNING: Record<SummonerRange, SummonerRangeTuning> = {
  close: {
    attackMode: 'melee',
    policy: 'guardian',
    sizeMult: 1.5,
    attackRange: 18,
    preferredDistance: 12,
    summonHpMult: 1.25,
    conduitDefenseShare: 0.25,
    redirectionPct: 0.55,
    moveSpeedMult: 1,
  },
  mid: {
    attackMode: 'reach',
    policy: 'escort',
    sizeMult: 1.25,
    attackRange: 96,
    preferredDistance: 72,
    summonHpMult: 1,
    conduitDefenseShare: 0.5,
    redirectionPct: 0.3,
    moveSpeedMult: 1,
  },
  far: {
    attackMode: 'ranged',
    policy: 'harrier',
    sizeMult: 1.0,
    attackRange: 190,
    preferredDistance: 165,
    summonHpMult: 0.7,
    conduitDefenseShare: 0.75,
    redirectionPct: 0.08,
    moveSpeedMult: 1.12,
  },
};

/**
 * Clamp on the final per-slot size multiplier, after frame x spec x range.
 *
 * Floor raised from the originally planned 0.45 because MINION_BASE_DISPLAY_SIZE
 * dropped 48 -> 28: at 28px base, 0.6 is ~17px, which is about the smallest a
 * summon can be and still read as a skull. The binding case is Kilnmaster at
 * Harrier range (0.72 x 0.72 x 0.75 = 0.389), which the floor rescues.
 */
export const SUMMON_ATTACK_STYLE: Record<SummonerAttackMode, string> = {
  melee:  'impact',
  reach:  'conduit-bolt',
  ranged: 'conduit-beam',
};

/**
 * Baseline formation: a Conduit who has not taken the tier-2 range choice yet.
 * It inherits Procession's tuning, but NOT Procession's bolt — `conduit-bolt`
 * is that choice's signature and only earns its meaning once the choice exists.
 * An unchosen formation is just bodies that walk in and hit things.
 */
export const SUMMONER_BASELINE_RANGE: SummonerRange = 'mid';
export const SUMMONER_BASELINE_ATTACK_MODE: SummonerAttackMode = 'melee';

/**
 * Summon styles that fire from a distance. Drives the client's lunge gate the
 * same way `MonsterView.isRanged` does for monsters: a Procession bolt or a
 * Harrier beam must NOT animate a melee lunge into the target.
 */
export const SUMMON_RANGED_STYLES: ReadonlySet<string> = new Set([
  SUMMON_ATTACK_STYLE.reach,
  SUMMON_ATTACK_STYLE.ranged,
]);

export function isRangedSummonStyle(style: string): boolean {
  return SUMMON_RANGED_STYLES.has(style);
}

export const SUMMON_SIZE_MULT_MIN = 0.6;
export const SUMMON_SIZE_MULT_MAX = 3.0;

/** Existing persisted ids intentionally map to the new locked cast. */
export const SUMMONER_SPECIALIZATION_BY_SKILL_ID = new Map<string, SummonerSpecialization>([
  ['summoner-light-t3-a', 'harrier-brood'],
  ['summoner-light-t3-b', 'endless-swarm'],
  ['summoner-light-t3-c', 'volatile-brood'],
  ['summoner-balanced-t3-a', 'coordinated-hunt'],
  ['summoner-balanced-t3-b', 'withering-chorus'],
  ['summoner-balanced-t3-c', 'grand-ritual'],
  ['summoner-heavy-t3-a', 'twin-covenant'],
  ['summoner-heavy-t3-b', 'battle-bond'],
  ['summoner-heavy-t3-c', 'colossus'],
]);

export const SUMMONER_SPECIALIZATION_FRAME: Readonly<Record<SummonerSpecialization, SummonerFrame>> = {
  'volatile-brood': 'light',
  'endless-swarm': 'light',
  'harrier-brood': 'light',
  'coordinated-hunt': 'balanced',
  'withering-chorus': 'balanced',
  'grand-ritual': 'balanced',
  colossus: 'heavy',
  'battle-bond': 'heavy',
  'twin-covenant': 'heavy',
};

/** Resolve only specializations belonging to the currently selected frame. */
export function summonerSpecializationFor(
  frame: SummonerFrame,
  unlockedSkills: readonly string[],
): SummonerSpecialization | null {
  for (const skillId of unlockedSkills) {
    const specialization = SUMMONER_SPECIALIZATION_BY_SKILL_ID.get(skillId);
    if (specialization && SUMMONER_SPECIALIZATION_FRAME[specialization] === frame) {
      return specialization;
    }
  }
  return null;
}

/** Stable target-status identities used by the target frame. */
export const SUMMONER_HARRIER_EFFECT_ID = 'summoner-harried';
export const SUMMONER_CHORUS_EFFECT_ID = 'summoner-withering-chorus';

export const SUMMONER_SPECIALIZATION_TUNING = {
  volatileBrood: {
    detonationIntervalMs: 8_000,
    explosionDamageMult: 1.35,
    naturalDeathExplosionMult: 0.45,
    explosionRadius: 78,
  },
  endlessSwarm: { count: 8 },
  harrierBrood: { damageTakenPctPerSlot: 0.035, durationMs: 5_000 },
  coordinatedHunt: {
    openingDamageMult: 1.45,
    cyclesRequired: 4,
    coordinatedDamageMult: 1.65,
  },
  witheringChorus: { damagePctPerSlot: 0.045, durationMs: 6_000, tickMs: 1_000 },
  grandRitual: { intervalMs: 10_000, chargesPerLivingSlot: 2, damageMult: 1.6 },
  colossus: { reconstructionIntervalMult: 1.35, sizeMult: 1.5 },
  battleBond: { conduitOffenseWeight: 0.45, summonOffenseWeight: 0.55, threshold: 8 },
  twinCovenant: {
    offenseTwinOffenseWeight: 0.75,
    defenseTwinOffenseWeight: 0.25,
    offenseTwinDefenseWeight: 0.3,
    defenseTwinDefenseWeight: 0.7,
  },
} as const;
