import { getResource, isMonsterDotStatusEffectId, removeStatusEffect, setResource } from '@mmo-idle/shared';
import type { PlayerEntity } from '../../../ecs/entity';

const TIMER_KEY = 'defense.dotCleanse.ms';

/**
 * The periodic DoT cleanse (`defense.dot-cleanse-interval-ms`; the Striker's Antidote,
 * class-first build plan CS.4): every interval, the poison or bleed on the player with the
 * most time left ends. The clock runs whether or not anything is on you: it is a cadence, not
 * a charge that waits for the next DoT.
 */
export function runDotCleanse(player: PlayerEntity, dt: number): void {
  const interval = player.usesSkills.passives['defense.dot-cleanse-interval-ms'] ?? 0;
  if (interval <= 0) return;
  const cs = player.tracksCombat;
  const elapsed = getResource(cs, TIMER_KEY) + dt;
  if (elapsed < interval) {
    setResource(cs, TIMER_KEY, elapsed);
    return;
  }
  setResource(cs, TIMER_KEY, elapsed - interval);
  let longest: { id: string; remainingMs: number } | undefined;
  for (const effect of cs.statusEffects) {
    if (!isMonsterDotStatusEffectId(effect.id) || effect.remainingMs <= 0) continue;
    if (!longest || effect.remainingMs > longest.remainingMs) longest = effect;
  }
  if (longest) removeStatusEffect(cs, longest.id);
}
