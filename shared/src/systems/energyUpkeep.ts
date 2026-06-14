import type { UsesEnergy } from '../components/archetypes/energy/usesEnergy';

/**
 * Channeler (energy Upkeep) stack model. The upkeep timer (ms sustained above the
 * energy threshold) converts into UNCAPPED stacks — this is an infinite-scaling
 * class, kept in check by an energy decay that ramps the longer you sustain (see
 * updateEnergyState). Each stack adds flat ON-HIT damage that scales per tier
 * (counting from the unlock tier) with diminishing returns as stacks pile up.
 * Shared so the server (damage + buff) and the view layer (aura stage) agree.
 */
export const UPKEEP_MS_PER_STACK = 1000; // 1 stack per sustained second (no cap)
export const UPKEEP_UNLOCK_TIER  = 4;    // Channeler path node unlocks at playerTier 4 → 1× there

export function upkeepStacks(energy: UsesEnergy): number {
  return Math.floor((energy.upkeepTimerMs ?? 0) / UPKEEP_MS_PER_STACK);
}

/** Aura stage: 1 (1–10 stacks), 2 (11–20), 3 (21+). */
export function upkeepStage(stacks: number): 1 | 2 | 3 {
  return stacks <= 10 ? 1 : stacks <= 20 ? 2 : 3;
}

/** Tier multiplier, counting from the unlock tier (tier 3 → 1×, tier 4 → 2×, …). */
export function upkeepTierMult(playerTier: number): number {
  return Math.max(1, playerTier - UPKEEP_UNLOCK_TIER + 1);
}

/**
 * Per-tier on-hit total across all stacks, with diminishing returns:
 *   stacks 1–10  → 2  /tier each
 *   stacks 11–20 → 1  /tier each
 *   stacks 21–50 → 0.5/tier each
 *   stacks 51+   → 0.25/tier each
 */
function upkeepPerTierTotal(stacks: number): number {
  let v = 0;
  v += Math.min(stacks, 10) * 2;
  v += Math.min(Math.max(stacks - 10, 0), 10) * 1;
  v += Math.min(Math.max(stacks - 20, 0), 30) * 0.5;
  v += Math.max(stacks - 50, 0) * 0.25;
  return v;
}

/** Total flat on-hit damage bonus from the current stacks at the player's tier. */
export function upkeepOnHitBonus(stacks: number, playerTier: number): number {
  return Math.round(upkeepPerTierTotal(stacks) * upkeepTierMult(playerTier));
}
