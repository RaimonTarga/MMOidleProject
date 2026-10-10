/**
 * Pure resolver for a player's effective empowered-attack multiplier.
 *
 * Mirrors the server's `registerEmpoweredMultiplier` resolution
 * (server/src/systems/combat/engine/empoweredAttacks.ts) so the HUD can display
 * the same value the combat pipeline applies:
 *
 *   effective = (base + archetypeAdd + sharedAdd) × (1 + multBonus)
 *
 * where `base` is the frame/spec multiplier from the archetype's empowered-mult
 * passive (frames sum additively with spec deltas — e.g. heavy 3.5 + Avenger
 * −1 = 2.5). Only cadence, cooldown and energy run an empowered multiplier;
 * other archetypes return null.
 */
import type { PassiveMap } from '../passives';
import {
  relicRatingsFromPassives,
  resolveCadenceRelicProfile,
  resolveCooldownRelicProfile,
  resolveEnergyRelicProfile,
} from './relics';
import { resolveEnergyMaxBeforeRelic } from './energyMax';

export type EmpoweredArchetype = 'cadence' | 'cooldown' | 'energy' | 'reload';

const BASE_KEY: Record<EmpoweredArchetype, keyof PassiveMap & string> = {
  cadence:  'cadence.empowered-mult',
  cooldown: 'cooldown.empowered-mult',
  energy:   'energy.empowered-mult',
  // No reload path authors this key since the T3 review retired the Duelist's
  // exploding last bullet (design §22.5), so the resolver returns null for every
  // reload spec; the layer stays for any future empowered reload attack.
  reload:   'reload.empowered-mult',
};

export interface EmpoweredMultBreakdown {
  /** Frame + spec base multiplier (archetype empowered-mult passive). */
  base: number;
  /** Archetype-specific additive (cadence.damage-mult-add); 0 for others. */
  archetypeAdd: number;
  /** Universal additive bonus (shared.empowered-mult-add). */
  sharedAdd: number;
  /** Multiplicative bonus fraction (weapon.empowered-mult-bonus). */
  multBonus: number;
  /** Final multiplier the execution/finisher applies. */
  effective: number;
}

function isEmpoweredArchetype(a: string | null | undefined): a is EmpoweredArchetype {
  return a === 'cadence' || a === 'cooldown' || a === 'energy' || a === 'reload';
}

/**
 * Resolve the effective empowered multiplier from a passive map, or null when
 * the archetype has no empowered attack or no base multiplier is configured.
 */
export function resolveEmpoweredMultiplier(
  passives: PassiveMap,
  archetype: string | null | undefined,
  playerTier = 0,
): EmpoweredMultBreakdown | null {
  if (!isEmpoweredArchetype(archetype)) return null;

  const base = passives[BASE_KEY[archetype]] ?? 0;
  if (base <= 0) return null;

  const archetypeAdd = archetype === 'cadence' ? (passives['cadence.damage-mult-add'] ?? 0) : 0;
  const sharedAdd    = passives['shared.empowered-mult-add'] ?? 0;
  const multBonus    = passives['weapon.empowered-mult-bonus'] ?? 0;

  let effective = base + archetypeAdd + sharedAdd;
  if (multBonus !== 0) effective *= 1 + multBonus;

  const ratings = relicRatingsFromPassives(passives);
  if (archetype === 'cadence') {
    effective = resolveCadenceRelicProfile(5, effective, ratings).empoweredMultiplier.after;
  } else if (archetype === 'cooldown') {
    effective = resolveCooldownRelicProfile(7000, effective, ratings).empoweredMultiplier.after;
  } else if (archetype === 'energy') {
    effective = resolveEnergyRelicProfile(
      passives['energy.per-hit'] ?? 14,
      resolveEnergyMaxBeforeRelic(passives, playerTier),
      effective,
      ratings,
    ).dischargeMultiplier.after;
  }

  return { base, archetypeAdd, sharedAdd, multBonus, effective };
}
