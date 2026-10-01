/**
 * BULWARK — **Immovable**. "Stationary DR and plating stacks persist 2 s after
 * the player moves; knockback, pull and drag on the player are refused while
 * either is live." (design §4)
 *
 * TWO HALVES, THREE SEAMS, NO LISTENER. This keystone changes rules that live in
 * per-tick reconcilers and in one authoritative displacement helper, so it is
 * expressed as predicates those seams ask rather than as a pipeline listener:
 *
 *  1. `runStationaryDr` asks {@link immovableMovementGraceMs} instead of its own
 *     250 ms grace, so the stance holds for the keystone's window after the
 *     player starts moving and only then begins to shed.
 *  2. `runReactivePlating` asks {@link immovableHoldsPlating}, which keeps the
 *     stacks from fading while the grace is live.
 *  3. `applyForcedMovement` (the one door knockback and pull both come through)
 *     and `beginLairDrag` (the one haul that is not a displacement but a
 *     component) ask {@link immovableRefusesDisplacement}.
 *
 * "WHILE EITHER IS LIVE" is read literally: the refusal needs a stance to be
 * standing. A player who has not built any stationary DR and carries no plating
 * stacks is displaced normally — the keystone protects what the lane earned, it
 * is not a blanket immunity bought with one card.
 *
 * THE GRACE CLOCK is the player's own movement accumulator, which
 * `runStationaryDr` already maintains for every player every tick
 * (`stationaryMovementMs`: time since movement began, zeroed the moment they
 * stop). Reading it rather than keeping a second clock is what makes the two
 * halves agree about when the two seconds are up, and it costs nothing.
 */
import { lineageUnit, type PacketId } from '@mmo-idle/shared';
import type { PlayerEntity } from '../../../ecs/entity';
import type { World } from '../../../world/World';
import {
  getStationaryDrBonus,
  stationaryMovementMs,
} from '../../defense/mitigation/stationaryDr';
import { getReactivePlatingStacks } from '../../defense/mitigation/reactivePlating';
import { defineKeystone, keystoneActive, pushKeystoneFx } from './registry';

const LANE: PacketId = 'bulwark';

export const IMMOVABLE_KEYSTONE = defineKeystone({
  id: 'immovable',
  lane: LANE,
  seam: 'predicates asked by runStationaryDr, runReactivePlating, applyForcedMovement and beginLairDrag',
  // No listener: nothing about this rule happens on a damage exchange.
});

/**
 * How long a moving player keeps a bulwark stance before it starts shedding.
 *
 * The default is `runStationaryDr`'s own 250 ms (a step out of a boss telegraph
 * should not cost the whole ramp); Immovable raises it to the authored grace.
 */
export function immovableMovementGraceMs(player: PlayerEntity, base: number): number {
  if (!keystoneActive(player, LANE)) return base;
  return Math.max(base, lineageUnit('immovableGraceMs'));
}

/**
 * True while Immovable is holding this player's plating stacks against the fade.
 *
 * Only while they are MOVING and inside the grace. Standing still is not the
 * keystone's business: the stacks' own hold window governs then, and claiming
 * them here would make them permanent for anybody who stops walking.
 */
export function immovableHoldsPlating(player: PlayerEntity): boolean {
  if (!keystoneActive(player, LANE)) return false;
  const moving = stationaryMovementMs(player.tracksCombat);
  return moving > 0 && moving <= lineageUnit('immovableGraceMs');
}

/**
 * True when knockback, pull and drag must be refused outright.
 *
 * Requires a stance to actually be standing — see "while either is live" above.
 */
export function immovableRefusesDisplacement(player: PlayerEntity): boolean {
  if (!keystoneActive(player, LANE)) return false;
  if (getStationaryDrBonus(player) > 0) return true;
  return getReactivePlatingStacks(player) > 0;
}

/**
 * Note a refused displacement on screen.
 *
 * Called by the seam that refused, not by the predicate: a predicate is asked in
 * places that then decide not to move the player for their own reasons too, and
 * an effect that said "Immovable held" when the push was simply out of range
 * would be a card drawing an effect it did not earn.
 */
export function pushImmovableRefusal(world: World, player: PlayerEntity): void {
  pushKeystoneFx(world, player, LANE);
}
