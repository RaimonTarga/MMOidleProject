export type SummonerRange = 'close' | 'mid' | 'far';
export type SummonerAttackMode = 'melee' | 'reach' | 'ranged';
export type SummonerFormationPolicy = 'guardian' | 'escort' | 'harrier';
export type SummonerSlotRole =
  | 'normal'
  | 'bonded'
  | 'colossus'
  | 'offense-twin'
  | 'defense-twin';

export interface SummonerRangeTuning {
  reconstructionIntervalMult: number;
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
  // DESIGNER BUFF, 2026-09-25: a FULL formation should sit at the top of its
  // tier's damage, because the Conduit has no damage of its own and every lost
  // body removes its share. At the T1 arrival build 1.0 measured second-lowest
  // of six roots (35.9 dps vs 35.7-41.0); 1.2 measures 43.1, and one dead body
  // drops it back to ~32. Per-summon attack rounds to an integer, so at low
  // attack this moves in steps (1.2 and 1.25 land on the same T1 value).
  formationOffenseMult: 1.2,
  // DESIGNER BUFF, 2026-08-25: Conduit's own bot playtesting hadn't reached a
  // boss fight yet when this was flagged, but the structural problem is
  // visible directly in the formula (`reconstruction.ts`): every fallen
  // summon slot paid HALF the new minion's max HP out of the OWNER's own
  // pool to come back, on top of a 5s queue delay — a cost that compounds
  // hard exactly when the formation is under the most pressure (a bad fight
  // loses slots faster than they can be afforded back). Cut on both axes:
  // the HP tax and the queue delay. Re-measure once Conduit clears a boss.
  reconstructionIntervalMs: 3_500, // was 5_000
  minimumReconstructionIntervalMs: 2_500,
  reconstructionHpCostRatio: 0.3, // was 0.5
  reconstructionSafetyFloorPct: 0.2,
  reconstructionCombatRegenPct: 0.2,
  // 2026-09-26, early-game attrition: out of combat the queue advances this many
  // times faster, so a formation wiped by one pack is back before the next pull
  // (a root wipe was 4 x 3.5s = 14s of half a formation). Time, not stats — it
  // does not compound with gear, and boss fights (all in combat) are untouched.
  outOfCombatReconstructionSpeedMult: 4,
  // Area damage is sized against one player's HP, but a formation is that HP cut
  // into bodies, so one circle over N bodies used to land N player-hits' worth.
  // Each body caught takes N^-exponent of the hit: 4 bodies take 50% each (2x a
  // single hit in total), 6 take 41% (2.45x) — swarms still pay more for area.
  areaShareExponent: 0.5,
  leashRadius: 320,
  hardEntityCap: 9,
  // The share of owner HP the roster inherited from the old root frame.
  // The summon-cap bench and the conduit study scale this one number.
  totalSummonHpPct: 0.8,
} as const;

export const SUMMONER_RANGE_TUNING: Record<SummonerRange, SummonerRangeTuning> = {
  close: {
    reconstructionIntervalMult: 1,
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
    reconstructionIntervalMult: 1,
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
    reconstructionIntervalMult: 0.85,
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
  melee:  'conduit-strike',
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
/** Base Conduit bodies close to near-melee reach before attacking. */
export const SUMMONER_BASELINE_ATTACK_RANGE = 24;

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
