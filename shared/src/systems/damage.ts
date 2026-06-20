import type { StatusEffect } from '../components/combat/effects';

const ED_BASE_STACKS    = 8;
const ED_DIMINISH_RATE  = 0.5;

/**
 * Diminishing-returns tick formula used by DoT stack effects.
 *
 * At full stacks: dmgPerStack × sqrt(max × max) = dmgPerStack × max (same as linear).
 * Below full stacks: damage is boosted above the linear amount so DoT classes stay
 * competitive in short fights where full ramp-up isn't reached.
 *
 * Uncapped effects (maxStacks === 0) fall back to linear scaling.
 */
export function computeScaledDotDamage(effect: StatusEffect): number {
  const { stacks, maxStacks, data } = effect;
  if (maxStacks > 0) {
    return Math.round(data.damagePerStack * Math.sqrt(stacks * maxStacks));
  }
  return Math.round(stacks * data.damagePerStack);
}

/**
 * Linear tick formula for enemy pressure DoTs.
 *
 * Monster-applied DoTs are not player build mechanics, so they do not get the
 * front-loaded class curve used by computeScaledDotDamage.
 */
export function computeLinearDotDamage(effect: StatusEffect): number {
  return Math.round(effect.stacks * effect.data.damagePerStack);
}

/**
 * Tick formula for generic weapon reservoir DoTs.
 *
 * Weapon DoTs store converted damage in `data.pool`, then drain a slice of that
 * pool each tick. This keeps their long-fight identity without borrowing the
 * front-loaded class DoT stack curve.
 */
export function computeReservoirDotTick(
  pool: number,
  tickIntervalMs: number,
  drainDurationMs: number,
): number {
  if (pool <= 0 || tickIntervalMs <= 0 || drainDurationMs <= 0) return 0;
  return Math.min(pool, Math.max(1, Math.round(pool * (tickIntervalMs / drainDurationMs))));
}

/**
 * Tick damage for Eternal Doom: full rate for the first ED_BASE_STACKS stacks,
 * 50% per stack beyond that.
 */
export function computeEternalDoomDamage(
  stacks: number,
  basePerStack: number,
  fullValueStacks = ED_BASE_STACKS,
  diminishRate = ED_DIMINISH_RATE,
): number {
  const fullStacks = Math.max(0, Math.round(fullValueStacks));
  const reducedRate = Math.max(0, diminishRate);
  if (stacks <= fullStacks) return stacks * basePerStack;
  return Math.round(
    fullStacks * basePerStack +
    (stacks - fullStacks) * basePerStack * reducedRate,
  );
}
