import type { StatusEffect } from '../components/combat/effects';

/** Linear damage per tick for sigils and monster pressure DoTs. */
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
