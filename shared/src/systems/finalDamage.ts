import type { PassiveMap } from '../passives';
import type { TracksCombat } from '../components/combat/tracksCombat';
import { activeStanceModifiers, brawlerDamageReduction } from '../stances';
import { SUNLIGHT_EFFECT_ID } from './alphaWindow';

/**
 * Status `data` key carrying a FINAL damage-dealt fraction (0.15 = +15%).
 *
 * Historically named for the stance burst windows that introduced it; it is a
 * final layer, not an Attack-stat change. Distinct from `DAMAGE_DEALT_PCT_KEY`
 * (playerAmplifiers), which is summed separately in the direct-attack path — an
 * effect must carry one or the other, never both, or it applies twice.
 */
export const FINAL_DAMAGE_DEALT_PCT_KEY = 'attackPct';

/**
 * Status effects that act as a final damage-dealt layer. Folding them in here
 * (rather than in the direct-attack path) is what makes them reach every
 * player-owned channel that routes through `outgoingFinalDamage`: basic hits,
 * on-hit, AoE/cleave, procs, Technique payloads, DoT ticks and owned-summon damage.
 */
const FINAL_DAMAGE_DEALT_EFFECT_IDS: readonly string[] = [
  'stance-reaper-momentum',
  'stance-power-release',
  SUNLIGHT_EFFECT_ID,
];

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
    if (effect.remainingMs > 0 && FINAL_DAMAGE_DEALT_EFFECT_IDS.includes(effect.id)) {
      dealt *= Math.max(0, 1 + (effect.data[FINAL_DAMAGE_DEALT_PCT_KEY] ?? 0));
    }
  }
  return { dealt, taken };
}

/** Preserve zero; round once at the final damage boundary. */
export function scaleFinalDamage(damage: number, multiplier: number): number {
  return damage <= 0 || multiplier <= 0 ? 0 : Math.max(1, Math.round(damage * multiplier));
}
