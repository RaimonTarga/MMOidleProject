import type { PassiveMap } from '../passives';

/**
 * Final Attack-stat effectiveness for ordinary Slinger shots. 1: fire rate is its own stat now
 * (bible §10.2), so there is no half-damage layer paying for a double-speed one.
 */
export const SLINGER_DIRECT_ATTACK_EFFECTIVENESS = 1;

/**
 * Effectiveness retained when a Slinger weapon converts direct hit damage into
 * a reservoir DoT. This is deliberately separate from flat on-hit damage and
 * from the Apprentice's class DoT profile.
 */
export const SLINGER_WEAPON_DOT_EFFECTIVENESS = 0.85;

/**
 * Convert the already-resolved, post-mitigation direct hit into the authored
 * weapon-reservoir basis. Slinger shots keep the full Attack stat and pay the
 * 85% weapon-DoT layer on the reservoir.
 */
export function weaponDotBasisFromResolvedDirectDamage(
  resolvedDirectDamage: number,
  archetype: string | null | undefined,
  _passives: PassiveMap,
): number {
  const basis = Math.max(0, resolvedDirectDamage);
  if (archetype !== 'reload') return basis;
  return basis * SLINGER_WEAPON_DOT_EFFECTIVENESS;
}
