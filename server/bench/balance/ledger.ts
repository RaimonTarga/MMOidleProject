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
  biomeXP: Record<string, number>;
  biomeXpTotal: number;
  biomeLevels: Record<string, number>;
  recipesUnlocked: number;
}

export function diffLedger(
  before: LedgerSnapshot,
  after: LedgerSnapshot,
): LedgerDelta {
  const essences = {} as Record<EssenceType, number>;
  let essenceTotal = 0;
  for (const type of ESSENCE_TYPES) {
    const delta = after.essences[type] - before.essences[type];
    essences[type] = delta;
    essenceTotal += delta;
  }

  const biomeXP = diffKeyed(before.biomeXP, after.biomeXP);
  let biomeXpTotal = 0;
  for (const value of Object.values(biomeXP)) biomeXpTotal += value;

  return {
    essences,
    essenceTotal,
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
