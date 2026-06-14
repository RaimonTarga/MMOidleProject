import type { UsesEnergy } from '../components/archetypes/energy/usesEnergy';

/**
 * Channeler (energy Upkeep) stack model. The upkeep timer (ms sustained above the
 * energy threshold) converts into discrete stacks; each stack adds flat ON-HIT
 * damage, and the stack count drives the 3-stage channel aura. Shared so the server
 * (damage + buff) and the view layer (aura stage) agree on the math.
 */
export const UPKEEP_MS_PER_STACK   = 1000; // 1 stack per sustained second
export const UPKEEP_MAX_STACKS     = 9;    // ramp cap (3 aura stages of 3)
export const UPKEEP_ONHIT_PER_STACK = 4;   // flat on-hit damage added per stack

export function upkeepStacks(energy: UsesEnergy): number {
  return Math.min(UPKEEP_MAX_STACKS, Math.floor((energy.upkeepTimerMs ?? 0) / UPKEEP_MS_PER_STACK));
}

/** Aura stage 1–3 from the current stack count (thirds of the cap). */
export function upkeepStage(stacks: number): 1 | 2 | 3 {
  const third = UPKEEP_MAX_STACKS / 3;
  return stacks <= third ? 1 : stacks <= third * 2 ? 2 : 3;
}
