import {
  applyStatusEffect,
  hasStatusEffect,
  type TracksCombat,
} from '@mmo-idle/shared';
import type { World } from '../../../world/World';

export const STUN_EFFECT = 'stunned';
export const STUN_IMMUNE_EFFECT = 'stun-immune';

/**
 * Applies stun to a combat state. Returns false if target is stun-immune.
 * Stun does not stack — refreshes duration only. Grants post-stun immunity
 * for 2× the stun duration to prevent chain-locking.
 */
export function applyStun(
  targetCs: TracksCombat,
  durationMs: number,
  sourceId: string,
): boolean {
  if (hasStatusEffect(targetCs, STUN_IMMUNE_EFFECT)) return false;
  applyStatusEffect(targetCs, {
    id:           STUN_EFFECT,
    maxStacks:    1,
    remainingMs:  durationMs,
    refreshable:  true,
    sourceId,
    data:         { totalMs: durationMs },
  });
  applyStatusEffect(targetCs, {
    id:           STUN_IMMUNE_EFFECT,
    maxStacks:    1,
    remainingMs:  durationMs * 2,
    refreshable:  false,
    sourceId,
  });
  return true;
}

export function isMonsterStunned(world: World, monsterId: string): boolean {
  const cs = world.getMonsterEntity(monsterId)?.tracksCombat;
  return !!cs && hasStatusEffect(cs, STUN_EFFECT);
}

export function isStunImmune(targetCs: TracksCombat): boolean {
  return hasStatusEffect(targetCs, STUN_IMMUNE_EFFECT);
}
