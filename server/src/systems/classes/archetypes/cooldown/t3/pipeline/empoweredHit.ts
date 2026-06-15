import { registerCombatListener } from '../../../../../combat/engine/combatPipeline';
import { attachComponent } from '../../../../../../ecs/markerHelpers';
import { setAttackTarget } from '../../../../../combat/ai/targeting';
import { hasPassive } from '../core/helpers';
import {
  OVERDRIVE_BUFF_MS, OVERDRIVE_ATTACK_SPEED_PCT,
  BEAM_DURATION_MS,
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
        // "Burst": a flat +OVERDRIVE_ATTACK_SPEED_PCT attack-speed buff. Applied as
        // the standard attack-speed math (cooldown ÷ (1 + pct)); baseCd is cached so
        // the tick restores the pre-burst cooldown exactly when it expires.
        const baseCd = player.performsAttack.attackCooldown;
        player.performsAttack.attackCooldown = Math.max(
          200,
          Math.round(baseCd / (1 + OVERDRIVE_ATTACK_SPEED_PCT)),
        );
        attachComponent(world, player, 'hasOverdrive', { remainingMs: OVERDRIVE_BUFF_MS, baseCd });
      } else {
        active.remainingMs = OVERDRIVE_BUFF_MS;
      }
      return;
    }

    if (hasPassive(player, 'cooldown.channeled-beam') && ctx.defenderType === 'monster') {
      // Devout Priest: the execution becomes a beam channel instead of a single
      // spike. Zero the triggering hit's direct damage; updateChanneledBeam then
      // ticks damage (and on-hit) every BEAM_TICK_MS for BEAM_DURATION_MS. The
      // first tick fires immediately (nextTickMs 0) so the beam feels responsive.
      attachComponent(world, player, 'isChanneling', {
        remainingMs: BEAM_DURATION_MS,
        nextTickMs: 0,
        targetId: ctx.defender.isMonster.id,
        pct: 0,
      });
      setAttackTarget(world, player, ctx.defender.isMonster.id);
      ctx.damage = 0;
      // The execution hit itself deals no damage — it's the "cast". Tag it so the
      // client suppresses the normal melee lunge/ring and plays a holy flash instead.
      const existing = ctx.metadata['clientEffects'];
      ctx.metadata['clientEffects'] = Array.isArray(existing)
        ? [...existing, 'holy-flash']
        : ['holy-flash'];
      return;
    }
  });
}
