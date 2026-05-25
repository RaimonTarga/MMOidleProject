import type { StatusEffect } from '../components/effects';

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
 * Tick damage for Eternal Doom: full rate for the first ED_BASE_STACKS stacks,
 * 50% per stack beyond that.
 */
export function computeEternalDoomDamage(stacks: number, basePerStack: number): number {
  if (stacks <= ED_BASE_STACKS) return stacks * basePerStack;
  return Math.round(
    ED_BASE_STACKS * basePerStack +
    (stacks - ED_BASE_STACKS) * basePerStack * ED_DIMINISH_RATE,
  );
}
