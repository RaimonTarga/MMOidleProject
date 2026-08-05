import { hasStatusEffect } from '@mmo-idle/shared';
import type { PlayerEntity } from '../../../ecs/entity';

/**
 * Generic player debuff-immunity gate, checked before any monster-sourced
 * debuff (mark, slow, antiheal, ramp, DoT) lands on a player.
 *
 * This used to live under the Conduit's tier-3 path folder because Vital Burst
 * was its only producer. That path system is gone, so today NOTHING grants this
 * effect and the guard always passes. It is kept because the mechanism is
 * generic and the six call sites in the combat engine are the correct place to
 * ask the question — a future immunity source only has to apply the effect.
 */
export const DEBUFF_IMMUNE_EFFECT = 'debuff-immune';

export function canApplyPlayerDebuff(player: PlayerEntity): boolean {
  if (!player.tracksCombat) return true;
  return !hasStatusEffect(player.tracksCombat, DEBUFF_IMMUNE_EFFECT);
}
