import type { PassiveMap } from '../passives';
import type { TracksCombat } from '../components/combat/tracksCombat';
import { SUNLIGHT_EFFECT_ID } from './alphaWindow';

/**
 * Status `data` key carrying a FINAL damage-dealt fraction (0.15 = +15%).
 *
 * Historically named for the burst windows that introduced it; it is a
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
  SUNLIGHT_EFFECT_ID,
];

/**
 * Independent final layers. Nothing authors a final damage-taken layer since the
 * cores went (class-first rework D2), so `taken` is 1; it stays because the HP
 * forecast and the view's `finalDamageTakenMult` read it.
 */
export function resolveFinalDamageMultipliers(
  _passives: PassiveMap,
  combat?: TracksCombat,
): { dealt: number; taken: number } {
  let dealt = 1;
  const taken = 1;
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
