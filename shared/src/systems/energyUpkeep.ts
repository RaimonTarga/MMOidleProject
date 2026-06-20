import type { UsesEnergy } from '../components/archetypes/energy/usesEnergy';
import type { PassiveMap } from '../passives';

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

export interface UpkeepConfig {
  stackIntervalMs: number;
  band1End: number;
  band2End: number;
  band3End: number;
  band1OnHitPerTier: number;
  band2OnHitPerTier: number;
  band3OnHitPerTier: number;
  overflowOnHitPerTier: number;
}

export function resolveUpkeepConfig(passives: PassiveMap): UpkeepConfig {
  const band1End = Math.max(1, Math.round(passives['energy.upkeep-band-1-end'] ?? 10));
  const band2End = Math.max(band1End, Math.round(passives['energy.upkeep-band-2-end'] ?? 20));
  const band3End = Math.max(band2End, Math.round(passives['energy.upkeep-band-3-end'] ?? 50));
  return {
    stackIntervalMs: Math.max(1, Math.round(passives['energy.upkeep-stack-interval-ms'] ?? UPKEEP_MS_PER_STACK)),
    band1End,
    band2End,
    band3End,
    band1OnHitPerTier: Math.max(0, passives['energy.upkeep-band-1-onhit-per-tier'] ?? 2),
    band2OnHitPerTier: Math.max(0, passives['energy.upkeep-band-2-onhit-per-tier'] ?? 1),
    band3OnHitPerTier: Math.max(0, passives['energy.upkeep-band-3-onhit-per-tier'] ?? 0.5),
    overflowOnHitPerTier: Math.max(0, passives['energy.upkeep-overflow-onhit-per-tier'] ?? 0.25),
  };
}

export function upkeepStacks(energy: UsesEnergy, stackIntervalMs = UPKEEP_MS_PER_STACK): number {
  return Math.floor((energy.upkeepTimerMs ?? 0) / Math.max(1, stackIntervalMs));
}

/** Aura stage: 1 (1–10 stacks), 2 (11–20), 3 (21+). */
export function upkeepStage(stacks: number, config?: UpkeepConfig): 1 | 2 | 3 {
  const band1End = config?.band1End ?? 10;
  const band2End = config?.band2End ?? 20;
  return stacks <= band1End ? 1 : stacks <= band2End ? 2 : 3;
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
export function upkeepPerTierTotal(stacks: number, config?: UpkeepConfig): number {
  const band1End = config?.band1End ?? 10;
  const band2End = config?.band2End ?? 20;
  const band3End = config?.band3End ?? 50;
  const band1Value = config?.band1OnHitPerTier ?? 2;
  const band2Value = config?.band2OnHitPerTier ?? 1;
  const band3Value = config?.band3OnHitPerTier ?? 0.5;
  const overflowValue = config?.overflowOnHitPerTier ?? 0.25;
  let v = 0;
  v += Math.min(stacks, band1End) * band1Value;
  v += Math.min(Math.max(stacks - band1End, 0), band2End - band1End) * band2Value;
  v += Math.min(Math.max(stacks - band2End, 0), band3End - band2End) * band3Value;
  v += Math.max(stacks - band3End, 0) * overflowValue;
  return v;
}

/** Total flat on-hit damage bonus from the current stacks at the player's tier. */
export function upkeepOnHitBonus(stacks: number, playerTier: number, config?: UpkeepConfig): number {
  return Math.round(upkeepPerTierTotal(stacks, config) * upkeepTierMult(playerTier));
}
