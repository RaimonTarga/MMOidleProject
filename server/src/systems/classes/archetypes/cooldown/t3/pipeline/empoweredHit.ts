import { registerCombatListener } from '../../../../../combat/engine/combatPipeline';
import { attachComponent } from '../../../../../../ecs/markerHelpers';
import { setAttackTarget } from '../../../../../combat/ai/targeting';
import { hasPassive } from '../core/helpers';
import {
  OVERDRIVE_BUFF_MS, OVERDRIVE_SPEED_FACTOR,
  BEAM_DURATION_MS, BEAM_TICK_MS,
} from '../core/constants';

/**
 * onHit listener for cooldown T3 empowered attacks. Each path with a unique
 * on-execution effect runs here. Additive execution bonuses (Eternal Cycle flat,
 * Reverb, Patience Paid, Vengeance) live in `registerPostEmpoweredHit` so they
 * stack on top of the standard execution multiplier.
 *
 *   1. Overdrive      — speed buff; the execution still deals its normal multiplier.
 *   2. Channeled Beam — start the channel, zero direct damage (STUB — see below).
 */
export function registerEmpoweredHit(): void {
  registerCombatListener('onHit', (ctx, world) => {
    if (ctx.attackerType !== 'player') return;
    if (!ctx.metadata['empoweredAttack']) return;

    const player = ctx.attacker;
    if (!player.usesCooldown) return;

    if (hasPassive(player, 'cooldown.overdrive')) {
      const active = player.hasOverdrive;
      if (!active) {
        const baseCd = player.performsAttack.attackCooldown;
        player.performsAttack.attackCooldown = Math.max(200, Math.round(player.performsAttack.attackCooldown * OVERDRIVE_SPEED_FACTOR));
        attachComponent(world, player, 'hasOverdrive', { remainingMs: OVERDRIVE_BUFF_MS, baseCd });
      } else {
        active.remainingMs = OVERDRIVE_BUFF_MS;
      }
      return;
    }

    if (hasPassive(player, 'cooldown.channeled-beam') && ctx.defenderType === 'monster') {
      // TODO(engine): Channeled Beam is a STUB — the channel firing mode is not
      // production-ready (see t3-spec-designs-reference.md). It zeroes the hit and
      // starts the placeholder channel tick; do not treat as balanced/shippable.
      console.warn(`[ChanneledBeam][STUB] ${player.isPlayer.id}: channel triggered — spec not production-ready`);
      attachComponent(world, player, 'isChanneling', {
        remainingMs: BEAM_DURATION_MS,
        nextTickMs: BEAM_TICK_MS,
        targetId: ctx.defender.isMonster.id,
        pct: 0,
      });
      setAttackTarget(world, player, ctx.defender.isMonster.id);
      ctx.damage = 0;
      return;
    }
  });
}
