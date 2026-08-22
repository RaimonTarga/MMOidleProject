import {
  ABILITY_CONTROL_RESIST_EFFECT_ID,
  applyStatusEffect,
  getStatusEffect,
  hasStatusEffect,
  type TracksCombat,
} from '@mmo-idle/shared';
import type { World } from '../../../world/World';

export const STUN_EFFECT = 'stunned';
export const STUN_IMMUNE_EFFECT = 'stun-immune';

/** Never total immunity — a resistance buff shortens control, it does not delete it. */
const CONTROL_RESIST_CAP = 0.9;

/**
 * Control resistance currently on the target, as a fraction of duration removed.
 *
 * Applies to the incoming DURATION rather than gating the stun outright: a hard
 * control that sometimes simply doesn't happen is far harder to read than one
 * that visibly lasts less time, and duration scales smoothly with investment.
 */
function controlResistPct(targetCs: TracksCombat): number {
  const buff = getStatusEffect(targetCs, ABILITY_CONTROL_RESIST_EFFECT_ID);
  if (!buff || buff.remainingMs <= 0) return 0;
  return Math.min(CONTROL_RESIST_CAP, Math.max(0, buff.data['controlResistPct'] ?? 0));
}

/**
 * Applies stun to a combat state. Returns false if target is stun-immune.
 * Stun does not stack — refreshes duration only. Grants post-stun immunity
 * for 2× the stun duration to prevent chain-locking.
 *
 * Break Free's control resistance (and anything else that grants it) shortens
 * the duration here, at the single place stun enters the world, so no caller has
 * to remember it. The post-stun immunity window follows the SHORTENED duration:
 * resistance is meant to get the player moving sooner, not to hand them a longer
 * immunity as a side effect.
 */
export function applyStun(
  targetCs: TracksCombat,
  durationMs: number,
  sourceId: string,
): boolean {
  if (hasStatusEffect(targetCs, STUN_IMMUNE_EFFECT)) return false;
  const resisted = Math.max(1, Math.round(durationMs * (1 - controlResistPct(targetCs))));
  applyStatusEffect(targetCs, {
    id:           STUN_EFFECT,
    maxStacks:    1,
    remainingMs:  resisted,
    refreshable:  true,
    sourceId,
    data:         { totalMs: resisted },
  });
  applyStatusEffect(targetCs, {
    id:           STUN_IMMUNE_EFFECT,
    maxStacks:    1,
    remainingMs:  resisted * 2,
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
