import type { PassiveMap } from '../passives';
import type { TracksCombat } from '../components/combat/tracksCombat';
import { activeStanceModifiers, brawlerDamageReduction } from '../stances';

/** Independent final layers. Positive taken values are drawbacks; negative values reduce damage. */
export function resolveFinalDamageMultipliers(
  passives: PassiveMap,
  stanceId?: string | null,
  hpFraction = 1,
  combat?: TracksCombat,
  aggressors = 0,
): { dealt: number; taken: number } {
  const stance = activeStanceModifiers(stanceId, hpFraction);
  let dealt = Math.max(0, 1 + (passives['core.damage-dealt-pct'] ?? 0))
    * Math.max(0, 1 + (stance?.damageDealtPct ?? 0));
  const taken = Math.max(0.1, 1 + (passives['core.damage-taken-pct'] ?? 0))
    * (1 - Math.min(0.9, Math.max(0, passives['core.dr-layer-pct'] ?? 0)))
    * Math.max(0.1, 1 + (stance?.damageTakenPct ?? 0))
    * (stanceId === 'brawler-stance' ? 1 - brawlerDamageReduction(aggressors) : 1);
  for (const effect of combat?.statusEffects ?? []) {
    if (effect.remainingMs > 0 && (effect.id === 'stance-reaper-momentum' || effect.id === 'stance-power-release')) {
      dealt *= Math.max(0, 1 + (effect.data.attackPct ?? 0));
    }
  }
  return { dealt, taken };
}

/** Preserve zero; round once at the final damage boundary. */
export function scaleFinalDamage(damage: number, multiplier: number): number {
  return damage <= 0 || multiplier <= 0 ? 0 : Math.max(1, Math.round(damage * multiplier));
}
