import { MONSTER_DATABASE } from '@mmo-idle/shared';
import type {
  BalanceRating,
  BalanceRunResult,
  BalanceScore,
  BalanceWeights,
} from './types';

/**
 * Composite "balance" difficulty metric.
 *
 * Three normalized danger axes (each 0 = trivial, 1 = brutal) are weighted into
 * a single `difficulty` in [0,1], which is then bucketed into a rating. The
 * match outcome acts as a hard gate: a death or timeout is always `too_hard`.
 *
 *   survivalDanger  = 1 - hpFraction               (how close to death at the end)
 *   punishDanger    = (damageTaken / maxHp) / DMG_FULL_BARS   (incoming pressure)
 *   attritionDanger = (seconds - targetMax) / targetMax       (overlong grind)
 */

/** Total damage taken (as a multiple of max HP) that counts as max punishment. */
const DMG_FULL_BARS = 1.75;

const WEIGHTS: BalanceWeights = {
  survival: 0.5,
  punish: 0.35,
  attrition: 0.15,
};

/** Ideal fight-duration windows (seconds). Attrition danger climbs past max. */
const BOSS_TARGET = { minSecs: 60, maxSecs: 180 }; // regular dungeon boss: 1–3 min
const OVERLORD_TARGET = { minSecs: 1080, maxSecs: 1200 }; // overlord: ~18–20 min

/** Difficulty thresholds for each rating bucket (upper bound, exclusive). */
export const RATING_BANDS: { rating: BalanceRating; max: number }[] = [
  { rating: 'too_easy', max: 0.15 },
  { rating: 'easy', max: 0.35 },
  { rating: 'balanced', max: 0.6 },
  { rating: 'hard', max: 0.85 },
  { rating: 'too_hard', max: Infinity },
];

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

/** True when the node's boss is an objective-driven ultimate (overlord) fight. */
export function isOverlordBoss(bossTypeId: string | undefined): boolean {
  if (!bossTypeId) return false;
  return MONSTER_DATABASE.get(bossTypeId)?.ultimateEncounter !== undefined;
}

function ratingFromDifficulty(difficulty: number): BalanceRating {
  for (const band of RATING_BANDS) {
    if (difficulty < band.max) return band.rating;
  }
  return 'too_hard';
}

export function computeBalanceScore(result: BalanceRunResult): BalanceScore {
  const isOverlord = isOverlordBoss(result.bossTypeId);
  const target = isOverlord ? OVERLORD_TARGET : BOSS_TARGET;

  const seconds = result.simDurationMs / 1000;
  const hpFraction = result.maxHp > 0 ? result.botHpEnd / result.maxHp : 0;
  const dmgRatio = result.maxHp > 0 ? result.damageTaken / result.maxHp : 0;

  const survivalDanger = clamp01(1 - hpFraction);
  const punishDanger = clamp01(dmgRatio / DMG_FULL_BARS);
  const attritionDanger = clamp01((seconds - target.maxSecs) / target.maxSecs);

  const difficulty = clamp01(
    WEIGHTS.survival * survivalDanger +
      WEIGHTS.punish * punishDanger +
      WEIGHTS.attrition * attritionDanger,
  );

  // A failed encounter is always too hard, regardless of the composite.
  const outcomeGated = result.outcome !== 'clear';
  const rating: BalanceRating = outcomeGated
    ? 'too_hard'
    : ratingFromDifficulty(difficulty);

  return {
    rating,
    difficulty,
    survivalDanger,
    punishDanger,
    attritionDanger,
    hpFraction,
    dmgRatio,
    seconds,
    targetMinSecs: target.minSecs,
    targetMaxSecs: target.maxSecs,
    isOverlord,
    outcomeGated,
    weights: WEIGHTS,
  };
}
