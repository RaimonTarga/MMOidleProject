/**
 * What counts as HARD CONTROL on a player — the one list.
 *
 * Hard control is the class of effect that takes actions away rather than
 * degrading them: it breaks a cast wind-up, it satisfies Break Free's trigger,
 * and it is what Break Free removes. Cleanse deliberately does NOT answer it —
 * ordinary debuffs and DoT stacks are Cleanse's job, and collapsing the two
 * would make Cleanse a universal answer and Break Free pointless.
 */
import { CAVE_LOCKDOWN_EFFECT_ID, getStatusEffect, hasStatusEffect } from '@mmo-idle/shared';
import type { TracksCombat } from '@mmo-idle/shared';
import { FROZEN_EFFECT } from '../../classes/archetypes/dot/t3/core/constants';
import { STUN_EFFECT } from './stun';

/**
 * Ordered by severity, which is also the removal order: Break Free strips the
 * worst thing holding the player, not an arbitrary map entry.
 */
export const PLAYER_HARD_CONTROL_EFFECTS: readonly string[] = [
  STUN_EFFECT,
  CAVE_LOCKDOWN_EFFECT_ID,
  FROZEN_EFFECT,
];

export function isHardControlled(cs: TracksCombat): boolean {
  return PLAYER_HARD_CONTROL_EFFECTS.some((id) => hasStatusEffect(cs, id));
}

/** The most severe hard control currently on the player, or null. */
export function worstHardControl(cs: TracksCombat): string | null {
  for (const id of PLAYER_HARD_CONTROL_EFFECTS) {
    const effect = getStatusEffect(cs, id);
    if (effect && effect.remainingMs > 0) return id;
  }
  return null;
}
