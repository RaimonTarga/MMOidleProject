import { ESSENCE_TYPES, type EssenceType } from '@mmo-idle/shared';
import type { PlayerEntity } from '../../src/ecs/entity';

/**
 * A point-in-time reading of everything a kill can pay out.
 *
 * Farm income is measured by DIFFING two of these, not by instrumenting the
 * reward code: `grantMonsterRewards` already writes all of it to
 * `tracksProgression` through the live path, so a before/after diff is the
 * whole ledger and cannot drift from in-game rewards.
 */
export interface LedgerSnapshot {
  essences: Record<EssenceType, number>;
  /** Minted catalysts by pace family. */
  catalysts: Record<string, number>;
  /** Sub-threshold progress toward the next catalyst, by pace family. */
  catalystProgress: Record<string, number>;
  biomeXP: Record<string, number>;
  biomeLevel: Record<string, number>;
  unlockedRecipes: number;
}

export function snapshotLedger(entity: PlayerEntity): LedgerSnapshot {
  const p = entity.tracksProgression;
  const essences = {} as Record<EssenceType, number>;
  for (const type of ESSENCE_TYPES) essences[type] = p.essences[type] ?? 0;
  return {
    essences,
    catalysts: { ...p.catalysts },
    catalystProgress: { ...p.catalystProgress },
    biomeXP: { ...p.biomeXP },
    biomeLevel: { ...p.biomeLevel },
    unlockedRecipes: p.unlockedRecipes.length,
  };
}

function diffKeyed(
  before: Record<string, number>,
  after: Record<string, number>,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
    const delta = (after[key] ?? 0) - (before[key] ?? 0);
    if (delta !== 0) out[key] = delta;
  }
  return out;
}

/** Everything earned between two snapshots, as raw totals (not rates). */
export interface LedgerDelta {
  essences: Record<EssenceType, number>;
  essenceTotal: number;
  /**
   * Catalysts earned, counting partial progress as a fraction of a catalyst.
   * A 30-minute run that mints 2 catalysts and banks 80% of a third earned 2.8
   * — reporting a flat 2 would understate income by up to one whole catalyst,
   * which matters when the run is short relative to the mint threshold.
   */
  catalysts: Record<string, number>;
  catalystTotal: number;
  /** Whole catalysts actually minted (the integer part of the above). */
  catalystsMinted: Record<string, number>;
  biomeXP: Record<string, number>;
  biomeXpTotal: number;
  biomeLevels: Record<string, number>;
  recipesUnlocked: number;
}

export function diffLedger(
  before: LedgerSnapshot,
  after: LedgerSnapshot,
  catalystProgressPerUnit: number,
): LedgerDelta {
  const essences = {} as Record<EssenceType, number>;
  let essenceTotal = 0;
  for (const type of ESSENCE_TYPES) {
    const delta = after.essences[type] - before.essences[type];
    essences[type] = delta;
    essenceTotal += delta;
  }

  const minted = diffKeyed(before.catalysts, after.catalysts);
  const progress = diffKeyed(before.catalystProgress, after.catalystProgress);
  const catalysts: Record<string, number> = {};
  let catalystTotal = 0;
  for (const family of new Set([
    ...Object.keys(minted),
    ...Object.keys(progress),
  ])) {
    const fractional =
      catalystProgressPerUnit > 0
        ? (progress[family] ?? 0) / catalystProgressPerUnit
        : 0;
    const value = (minted[family] ?? 0) + fractional;
    catalysts[family] = value;
    catalystTotal += value;
  }

  const biomeXP = diffKeyed(before.biomeXP, after.biomeXP);
  let biomeXpTotal = 0;
  for (const value of Object.values(biomeXP)) biomeXpTotal += value;

  return {
    essences,
    essenceTotal,
    catalysts,
    catalystTotal,
    catalystsMinted: minted,
    biomeXP,
    biomeXpTotal,
    biomeLevels: diffKeyed(before.biomeLevel, after.biomeLevel),
    recipesUnlocked: after.unlockedRecipes - before.unlockedRecipes,
  };
}

/** Scale a keyed total to a per-hour rate. */
export function perHour(
  totals: Record<string, number>,
  hours: number,
): Record<string, number> {
  const out: Record<string, number> = {};
  if (hours <= 0) return out;
  for (const [key, value] of Object.entries(totals)) out[key] = value / hours;
  return out;
}
