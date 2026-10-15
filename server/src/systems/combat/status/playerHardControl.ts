/**
 * What counts as HARD CONTROL on a player — the one list.
 *
 * Hard control is the class of effect that takes actions away rather than
 * degrading them: it breaks a cast wind-up, it satisfies Break Free's gate,
 * and it is what Break Free removes. Break Free also removes ROOTS (below),
 * which stop movement but leave actions free. Cleanse deliberately does NOT answer it —
 * ordinary debuffs and DoT stacks are Cleanse's job, and collapsing the two
 * would make Cleanse a universal answer and Break Free pointless.
 */
import {
  ABILITY_UNYIELDING_EFFECT_ID,
  CAVE_LOCKDOWN_EFFECT_ID,
  LAIR_DRAG_ROOT_EFFECT_ID,
  getStatusEffect,
  hasStatusEffect,
} from '@mmo-idle/shared';
import type { TracksCombat } from '@mmo-idle/shared';
import { FROZEN_EFFECT } from '../../combat/status/frost';
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

/**
 * Status-owned ROOTS on a player: movement stopped, actions free. The lair drag's
 * root is a speed-0 status rather than the `isRooted` marker, which is why this
 * list exists — a check on the marker alone misses it.
 */
export const PLAYER_ROOT_EFFECTS: readonly string[] = [LAIR_DRAG_ROOT_EFFECT_ID];

/** Root effects currently holding the player. */
export function activePlayerRoots(cs: TracksCombat): string[] {
  return PLAYER_ROOT_EFFECTS.filter((id) => (getStatusEffect(cs, id)?.remainingMs ?? 0) > 0);
}

/**
 * Hard-controlled or rooted — what `When Controlled` means and what Break Free
 * answers. `isRooted` covers roots owned by other mechanics (and by hard control).
 */
export function isPlayerControlled(player: { tracksCombat: TracksCombat; isRooted?: object }): boolean {
  return isHardControlled(player.tracksCombat)
    || player.isRooted !== undefined
    || activePlayerRoots(player.tracksCombat).length > 0;
}

/**
 * Whether NEW hard control or a root is refused on this player right now —
 * Endure's Unyielding keystone (design §22.4), a status any future "cannot be
 * controlled" source may apply too. Asked by the appliers, never by a cleanup:
 * a control already on the player when it went up runs its course.
 *
 * The appliers that ask: `applyStun` (every stun; it reads the status itself, as
 * this module imports `stun.ts`), `playerRefusesStatus` for the debuff writers
 * (a zero-speed root is hard control by `statusPolicyFor`), the Cave lockdown
 * (`beginEngageLock`) and the lair drag (`beginLairDrag`).
 */
export function refusesHardControl(cs: TracksCombat): boolean {
  return hasStatusEffect(cs, ABILITY_UNYIELDING_EFFECT_ID);
}

/** The most severe hard control currently on the player, or null. */
export function worstHardControl(cs: TracksCombat): string | null {
  for (const id of PLAYER_HARD_CONTROL_EFFECTS) {
    const effect = getStatusEffect(cs, id);
    if (effect && effect.remainingMs > 0) return id;
  }
  return null;
}
