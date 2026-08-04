import type { PassiveMap } from '../passives';
import { relicRatingsFromPassives, resolveEnergyRelicProfile } from './relics';

/**
 * Base energy pool and the Voidwalker (singularity-execute) max-energy scaling.
 * Voidwalker adds `energy.max-bonus` per tier counting from the unlock tier:
 *   +100 (200 total) at unlock, +100 each tier after (300, 400, …).
 * Computed in recalc so it's the BASE max energy — future relics can add to it.
 *
 * NOTE: a tier-3 (0-indexed) node is unlocked at playerTier 4 — reaching skill tier 3
 * costs 3 unlocks (3 tier-ups) plus a 4th tier-up for the point to buy this node — so
 * the unlock-tier anchor is 4, not 3.
 */
export const ENERGY_MAX_BASE = 100;
export const ENERGY_VOID_UNLOCK_TIER = 4;

export function resolveEnergyMaxBeforeRelic(passives: PassiveMap, playerTier: number): number {
  const perTier = passives['energy.max-bonus'] ?? 0;
  let max = ENERGY_MAX_BASE;
  if (perTier > 0) {
    const tierMult = Math.max(1, playerTier - ENERGY_VOID_UNLOCK_TIER + 1);
    max += Math.round(perTier * tierMult);
  }
  return max;
}

export function resolveEnergyMax(passives: PassiveMap, playerTier: number): number {
  const base = resolveEnergyMaxBeforeRelic(passives, playerTier);
  return resolveEnergyRelicProfile(
    passives['energy.per-hit'] ?? 14,
    base,
    passives['energy.empowered-mult'] ?? 2,
    relicRatingsFromPassives(passives),
  ).maxEnergy.after;
}
