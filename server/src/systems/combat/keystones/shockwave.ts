/**
 * EMPOWERED — **Shockwave**. "The mechanic's hit (the hit that consumed the
 * empowered flag) becomes an area hit around the target, using the Sweep/aoe seam
 * at the lane's magnitude share." (design §4)
 *
 * THE SEAM. `applyPlayerAoe`, the authoritative splash path Sweep's cleave and
 * every ability payload already use — so a shockwave pays plating and DR, feeds
 * rewards and kill credit, and is written into the world log exactly like a
 * cleave. Nothing new resolves damage.
 *
 * WHEN. An `onHit` listener gated on `ctx.metadata.empoweredAttack`, which is set
 * by, and only by, the handler in `empoweredAttacks.ts` that CONSUMED the flag.
 * So "the hit that spent your mechanic" is precise rather than "a hit while a
 * flag exists", and the five roots that ride an empowered hit all qualify through
 * one gate.
 *
 * ONE MULTIPLIER PER HIT. The splash is a share of the hit as it was BEFORE the
 * empowered multiplier (`ctx.metadata.empoweredMultiplier`), the same basis a
 * Technique rider and every lineage payoff take. Otherwise a 2.5× finisher would
 * silently scale the area hit too, which is the second multiplicative layer
 * design §6 forbids.
 *
 * The primary target is excluded: it already took the mechanic's hit, and hitting
 * it twice is an echo, not an area.
 */
import { lineageUnit, type PacketId } from '@mmo-idle/shared';
import { registerCombatListener } from '../engine/combatPipeline';
import { applyPlayerAoe } from '../damage/aoeDamage';
import { evadeBlocksDebuffs } from '../../defense/mitigation/evasion';
import { defineKeystone, keystoneActive, keystoneShare, pushKeystoneFx } from './registry';

const LANE: PacketId = 'empowered';

export const SHOCKWAVE_KEYSTONE = defineKeystone({
  id: 'shockwave',
  lane: LANE,
  seam: 'an onHit listener on the empowered-flag-consuming hit, paid through applyPlayerAoe',
  register: () => {
    registerCombatListener('onHit', (ctx, world) => {
      if (ctx.attackerType !== 'player' || ctx.defenderType !== 'monster') return;
      if (ctx.metadata['mechanicConsumed'] !== true) return; // the charge was spent, not crit styling
      const player = ctx.attacker;
      if (!keystoneActive(player, LANE)) return;
      // A dodged mechanic hit did not land, so there is nothing to spread from.
      // Same early return every on-target applier in the runtime makes.
      if (evadeBlocksDebuffs(ctx)) return;

      const share = keystoneShare(player, LANE);
      if (share <= 0) return;

      const empowered = Number(ctx.metadata['empoweredMultiplier'] ?? 1);
      const basis = empowered > 1 ? ctx.damage / empowered : ctx.damage;
      const splash = Math.max(1, Math.round(basis * share));

      const target = ctx.defender;
      const radius = lineageUnit('shockwaveRadius');
      applyPlayerAoe(
        world,
        player,
        target.hasPosition.current,
        radius,
        splash,
        target.isMonster.id,
        'player',
        // Cosmetic only: the area hit reads as part of the mechanic that spawned it.
        { empowered: true },
        // The splash converts into the weapon reservoir like the swing it rides,
        // exactly as Sweep's cleave does.
        { feedsWeaponReservoir: true },
      );
      // One `card-fx` per application, anchored on the target so the ring is drawn
      // where the area actually was.
      pushKeystoneFx(world, player, LANE, { target });
    });
  },
});
