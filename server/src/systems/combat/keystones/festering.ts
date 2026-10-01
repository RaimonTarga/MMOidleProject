/**
 * AFFLICTION — **Festering**. "The player's DoT stacks on a target do not tick
 * down their duration while the player has hit that target within the last tick
 * interval." (design §4)
 *
 * THE SEAM. `updateCombatState`, immediately before `tickStatusEffectDurations`
 * takes `dt` off every effect. The hold gives that `dt` back, which is the only
 * honest way to express "does not tick down": the decay is one shared loop over a
 * bare `TracksCombat` and has no idea whose DoT it is looking at, and pruning at
 * zero means a refund AFTER the decay would arrive to find the effect gone.
 *
 * Only the DURATION is held. `nextTickIn` is untouched, so the DoT keeps dealing
 * damage on its own cadence — Festering makes an affliction permanent while the
 * pressure is kept up, it does not make it tick faster.
 *
 * WHAT COUNTS AS KEEPING IT UP. Every landed player hit on a monster stamps a
 * window on THAT monster, keyed by the player, as long as the window itself: the
 * player's own resolved DoT tick interval (so a class that ticks faster has to
 * hit more often to hold it, which is the trade the affliction lane already
 * makes). Not the player's cooldowns — a monster's state is ephemeral and node
 * freeze/thaw takes the window with it, which is exactly right for a per-fight
 * rule and is why nothing here is persisted.
 *
 * The stamp is written for any player with the keystone live; the hold then reads
 * it. Both halves check the keystone, so unequipping it stops the rule on the
 * same tick rather than leaving a stamped window behind.
 */
import {
  getCooldown,
  lineageUnit,
  resolveDotClassProfile,
  setCooldown,
  type PacketId,
} from '@mmo-idle/shared';
import type { MonsterEntity, PlayerEntity } from '../../../ecs/entity';
import type { World } from '../../../world/World';
import { registerCombatListener } from '../engine/combatPipeline';
import { playerDotsOnMonster } from '../damage/dotInventory';
import { defineKeystone, keystoneActive, pushKeystoneFx } from './registry';

const LANE: PacketId = 'affliction';

/** Per-player window on the monster: "this player hit me within a tick interval". */
const festerWindow = (playerId: string): string => `keystone.fester.${playerId}`;

/** The window's length: the player's own DoT tick cadence. */
function windowMs(player: PlayerEntity): number {
  const profile = resolveDotClassProfile(
    player.usesSkills.passives,
    player.usesSkills.selectedSubVariant,
  );
  return profile.tickIntervalMs > 0 ? profile.tickIntervalMs : lineageUnit('bleedTickMs');
}

export const FESTERING_KEYSTONE = defineKeystone({
  id: 'festering',
  lane: LANE,
  seam: 'a per-hit window on the monster, refunded in updateCombatState before the status decay',
  register: () => {
    registerCombatListener('onHit', (ctx, world) => {
      if (ctx.attackerType !== 'player' || ctx.defenderType !== 'monster') return;
      const player = ctx.attacker;
      if (!keystoneActive(player, LANE)) return;
      const monster = ctx.defender;
      const key = festerWindow(player.isPlayer.id);
      const wasHeld = getCooldown(monster.tracksCombat, key) > 0;
      setCooldown(monster.tracksCombat, key, windowMs(player));

      // ONE VISIBLE THING, and not one per tick (design §8). The readable moment
      // is the hit that STOPS the affliction expiring — so the effect is drawn on
      // the transition from lapsed to held, not on every tick the hold runs and
      // not on every hit that merely refreshes a hold already in place.
      if (wasHeld) return;
      const dots = playerDotsOnMonster(world, player, monster)
        .filter((entry) => entry.effect.remainingMs > 0);
      if (dots.length === 0) return;
      pushKeystoneFx(world, player, LANE, { target: monster, stacks: dots.length });
    });
  },
});

/**
 * Hold the duration of every held DoT for this tick.
 *
 * MUST run before `tickStatusEffectDurations`. Called from the top of
 * `updateCombatState`, which is both the decay's own site and the first thing the
 * world tick does — so the window the stamp wrote is also still un-ticked when it
 * is read, and a window exactly one tick long behaves as its length says.
 */
export function holdFesteringDots(world: World, dt: number): void {
  if (dt <= 0) return;
  for (const player of world.livePlayers) {
    if (!keystoneActive(player, LANE)) continue;
    const key = festerWindow(player.isPlayer.id);
    for (const monster of world.monsterEntitiesInNode(player.hasPosition.nodeId)) {
      if (getCooldown(monster.tracksCombat, key) <= 0) continue;
      holdDotsOn(world, player, monster, dt);
    }
  }
}

/**
 * Give this tick's `dt` back to every DoT this player owns on `monster`.
 *
 * No `card-fx` here: the hold runs every tick a window is live, and design §8's
 * contract is one effect per application and never one per tick. The effect for
 * this rule is pushed by the hit that opens the hold — see the listener above.
 */
function holdDotsOn(
  world: World,
  player: PlayerEntity,
  monster: MonsterEntity,
  dt: number,
): void {
  for (const entry of playerDotsOnMonster(world, player, monster)) {
    // A permanent effect (-1) has no duration to hold, and one already at zero is
    // about to be pruned by a decay that will not touch it again.
    if (entry.effect.remainingMs <= 0) continue;
    entry.effect.remainingMs += dt;
  }
}
