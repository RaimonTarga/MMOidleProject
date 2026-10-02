/**
 * ENGAGEMENT — **Always First**. "The first hit on each new target counts as
 * mechanic-fired (emits it, does not set the empowered flag)." (design §4)
 *
 * THE SEAM. `emitMechanicFired`, the class-agnostic "your mechanic just paid out"
 * event (`engine/mechanicFired.ts`). The keystone does not touch any root: it
 * announces the moment, and everything hung off `mechanic-fired` — the lane's own
 * payoff cards, a capstone, an ability rune keyed to it — answers as it always
 * does. That is the whole point of having the seam.
 *
 * WHAT IT DOES NOT DO. It never calls `setEmpoweredAttack`. Arming the flag would
 * hand the player the mechanic's DAMAGE multiplier on every new body, which is a
 * different and far stronger card than the one design §4 describes, and it would
 * also desync the root's own counter (cadence would arm at a count it never
 * reached). The rule is "counts as the mechanic firing", and what the mechanic
 * firing means to the rest of the game is this event.
 *
 * ONCE PER TARGET. The latch is a flag on the MONSTER keyed by the player, the
 * same device `first-hit`'s per-body amplifier uses: monster combat state is
 * ephemeral, node freeze/thaw takes the latch with it, nothing is persisted, and
 * two players opening on one body stay independent. A re-pull of the same body is
 * the same body, which is why a fresh engagement does not re-arm it — the rule
 * says "each NEW target", and this one is not new.
 *
 * `emitMechanicFired` latches on the exchange, so a hit that genuinely fired the
 * root's own mechanic emits exactly once, not twice.
 */
import { getFlag, setFlag, type PacketId } from '@mmo-idle/shared';
import { registerCombatListener } from '../engine/combatPipeline';
import { emitMechanicFired, mechanicAlreadyFired } from '../engine/mechanicFired';
import { defineKeystone, keystoneActive, pushKeystoneFx } from './registry';

const LANE: PacketId = 'engagement';

/** Per-player latch on the monster: "this player has opened on me". */
const openedFlag = (playerId: string): string => `keystone.alwaysFirst.${playerId}`;

export const ALWAYS_FIRST_KEYSTONE = defineKeystone({
  id: 'always-first',
  lane: LANE,
  seam: 'an onHit listener emitting mechanicFired once per body, latched on the monster',
  register: () => {
    registerCombatListener('onHit', (ctx, world) => {
      if (ctx.attackerType !== 'player' || ctx.defenderType !== 'monster') return;
      const player = ctx.attacker;
      if (!keystoneActive(player, LANE)) return;

      const cs = ctx.defender.tracksCombat;
      const flag = openedFlag(player.isPlayer.id);
      if (getFlag(cs, flag)) return;
      setFlag(cs, flag, true);

      // The root's own mechanic already fired on this exchange: the moment has
      // happened, so the keystone has nothing to announce and must not draw an
      // effect claiming it did. The latch is still spent — this body's opener is
      // used up either way, which is what keeps it once per target.
      if (mechanicAlreadyFired(ctx)) return;

      emitMechanicFired(world, player, ctx);
      pushKeystoneFx(world, player, LANE, { target: ctx.defender });
    });
  },
});
