import type { PassiveMap } from '../passives';

/** Final Attack-stat effectiveness for ordinary Slinger shots. */
export const SLINGER_DIRECT_ATTACK_EFFECTIVENESS = 0.65;

/**
 * Effectiveness retained when a Slinger weapon converts direct hit damage into
 * a reservoir DoT. This is deliberately separate from flat on-hit damage and
 * from the Apprentice's class DoT profile.
 */
export const SLINGER_WEAPON_DOT_EFFECTIVENESS = 0.85;

/** Snipe and the continuous laser are the existing exceptions to the 65% layer. */
export function slingerDirectAttackEffectiveness(passives: PassiveMap): number {
  return (passives['reload.snipe'] ?? 0) > 0 || (passives['reload.laser'] ?? 0) > 0
    ? 1
    : SLINGER_DIRECT_ATTACK_EFFECTIVENESS;
}

/**
 * Convert the already-resolved, post-mitigation direct hit into the authored
 * weapon-reservoir basis. Keeping the correction here preserves every existing
 * conversion percentage, hit modifier and target-defence decision while
 * replacing only Slinger's 65% Attack-stat layer with its 85% weapon-DoT layer.
 */
export function weaponDotBasisFromResolvedDirectDamage(
  resolvedDirectDamage: number,
  archetype: string | null | undefined,
  passives: PassiveMap,
): number {
  const basis = Math.max(0, resolvedDirectDamage);
  if (archetype !== 'reload') return basis;
  return basis
    * SLINGER_WEAPON_DOT_EFFECTIVENESS
    / slingerDirectAttackEffectiveness(passives);
}
