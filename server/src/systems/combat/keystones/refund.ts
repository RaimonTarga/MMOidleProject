/**
 * KILL CHAIN — **Refund**. "A kill readies the mechanic: cadence counter to
 * threshold, cooldown recharge cleared, reload completed, energy to cap, dot:
 * next hit counts as max stacks." (design §4)
 *
 * THE SEAM. One `onKill` listener and the five roots' own slices. Component
 * presence is the switch: whichever of `usesCadence` / `usesCooldown` /
 * `usesReload` / `usesEnergy` / `appliesDots` is attached is the root the player
 * is, so there is no class string anywhere here and a sixth root joins by adding
 * a branch rather than by editing a switch over names.
 *
 * WHAT "READIES" MEANS PER ROOT. Not "fires" — a kill does not deal the
 * mechanic's damage, it puts the mechanic in the player's hand for the next
 * swing. So each branch writes the state the root's own code already treats as
 * ready, through that root's own door:
 *
 *   cadence   arm the empowered flag and zero the counter. The counter reaching
 *             its threshold IS arming it (`cadencePrototype`), so this is the
 *             same state one more hit would have produced.
 *   cooldown  clear the recharge. `updateCooldownArchetype` arms execution on the
 *             next tick when the timer is at zero and nothing is pending, which
 *             is the root's own readiness check rather than a second one here.
 *   reload    complete the reload through `completeReload`, so the hooks and the
 *             root's own `mechanic-fired` emission run exactly as a timed reload's
 *             would. This is the one branch that fires the moment rather than
 *             arming it, because a finished clip IS reload's moment.
 *   energy    fill the pool to its cap. The burst is spent by the player's next
 *             qualifying attack, not by the kill.
 *   dot       flag the next hit to land a FULL stack (consumed in
 *             `applyClassDotStack`), which is the dot root's own moment —
 *             reaching max stacks — handed over in one hit instead of five.
 *
 * A player carrying two roots' slices gets both refunded, and that is correct:
 * the rule readies "the mechanic", and their mechanic is both.
 */
import {
  getFlag,
  setFlag,
  type PacketId,
  type TracksCombat,
} from '@mmo-idle/shared';
import type { PlayerEntity } from '../../../ecs/entity';
import type { World } from '../../../world/World';
import { registerCombatListener } from '../engine/combatPipeline';
import { setEmpoweredAttack } from '../engine/empoweredAttacks';
import { completeReload } from '../../classes/archetypes/reload/reloadLifecycle';
import { markSliceDirty } from '../../../ecs/dirtyHelpers';
import { defineKeystone, keystoneActive, pushKeystoneFx } from './registry';

const LANE: PacketId = 'kill-chain';

/**
 * Set on a kill, spent by the next DoT application: that hit lands a full stack.
 * A flag rather than a counter because the rule is "the NEXT hit", singular.
 */
const DOT_FULL_FILL = 'keystone.refund.dotFill';

export const REFUND_KEYSTONE = defineKeystone({
  id: 'refund',
  lane: LANE,
  seam: "an onKill listener writing each root's own readiness state",
  register: () => {
    registerCombatListener('onKill', (ctx, world) => {
      if (ctx.attackerType !== 'player' || ctx.defenderType !== 'monster') return;
      const player = ctx.attacker;
      if (!keystoneActive(player, LANE)) return;
      if (refundMechanic(world, player)) {
        pushKeystoneFx(world, player, LANE);
      }
    });
  },
});

/**
 * Ready whichever mechanics this player has. Returns true when at least one was
 * readied, so a player with no root slice at all draws nothing.
 *
 * Exported for the test and for any future caller that wants the same refund from
 * another moment; the rule itself has exactly one trigger, above.
 */
export function refundMechanic(world: World, player: PlayerEntity): boolean {
  let readied = false;

  if (player.usesCadence) {
    // The counter reaching threshold is what arms the flag, so arm it and reset.
    setEmpoweredAttack(world, player);
    player.usesCadence.count = 0;
    readied = true;
  }

  if (player.usesCooldown) {
    // Zero is the root's own "ready": `updateCooldownArchetype` arms execution on
    // the next tick. Writing the flag here instead would race its bookkeeping.
    player.usesCooldown.executionCooldownMs = 0;
    readied = true;
  }

  if (player.usesEnergy) {
    const energy = player.usesEnergy;
    if (energy.energy < energy.energyMax) {
      energy.energy = energy.energyMax;
      markSliceDirty(world, player, 'usesEnergy');
    }
    readied = true;
  }

  if (player.usesReload) {
    // Through the lifecycle, so the hooks and reload's own `mechanic-fired`
    // emission run exactly as a timed reload's do.
    completeReload(world, player);
    readied = true;
  }

  if (player.appliesDots) {
    setFlag(player.tracksCombat, DOT_FULL_FILL, true);
    readied = true;
  }

  return readied;
}

/**
 * Whether this player's next DoT application should land a full stack, consuming
 * the flag if so.
 *
 * Called from `applyClassDotStack`, the one authoritative applier of a class DoT
 * stack. A flag read there rather than a listener because the fill has to be
 * decided inside the application, between the stack landing and the max-stack
 * check that emits the root's moment.
 */
export function consumeRefundedDotFill(cs: TracksCombat): boolean {
  if (!getFlag(cs, DOT_FULL_FILL)) return false;
  setFlag(cs, DOT_FULL_FILL, false);
  return true;
}

/** Visible for the test: is a full fill pending? Never read by game code. */
export function refundedDotFillPending(cs: TracksCombat): boolean {
  return getFlag(cs, DOT_FULL_FILL);
}
