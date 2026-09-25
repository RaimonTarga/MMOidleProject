import type { PassiveMap } from '../passives';

/** Laser ticks retain the first 30 flat damage; excess contributes at 60%, before Catalyst. */
export function laserOnHitDamage(base: number): number {
  return Math.min(30, Math.max(0, base)) + Math.max(0, base - 30) * 0.6;
}

/** Existing flat on-hit damage before target defenses and final damage layers. The stored stat remains unscaled. */
export function resolveOnHitDamage(
  base: number,
  passives: PassiveMap,
  shotMultiplier = 1,
  formationWeight = 1,
): number {
  return Math.max(0, Math.round(
    Math.max(0, base) * Math.max(0, 1 + (passives['core.onhit-mult'] ?? 0))
      * shotMultiplier * formationWeight,
  ));
}

/**
 * Marginal damage of the flat on-hit component. The attack and on-hit share one
 * plating payment and one damage floor. Attack-only multipliers never enter here.
 */
export function mitigateOnHitDamage(onHit: number, baseAttack: number, plating: number, damageReduction: number): number {
  const mitigate = (damage: number) => Math.max(1, Math.round(
    Math.max(0, damage - Math.max(0, plating)) * (1 - Math.min(1, Math.max(0, damageReduction))),
  ));
  return Math.max(0, mitigate(Math.max(0, baseAttack) + Math.max(0, onHit)) - mitigate(Math.max(0, baseAttack)));
}
