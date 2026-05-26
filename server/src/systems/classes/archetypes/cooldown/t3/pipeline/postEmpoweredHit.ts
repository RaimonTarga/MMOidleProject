import { getStatusEffect, removeStatusEffect } from '@mmo-idle/shared';
import { registerCombatListener } from '../../../../../combat/engine/combatPipeline';
import { attachComponent } from '../../../../../../ecs/markerHelpers';
import { hasPassive } from '../core/helpers';
import {
  BATTERY_ATK_PER_STACK,
  ALIGNMENT_BUFF_MS, ALIGNMENT_SPEED_FACTOR,
  BAT_CHARGE_FX,
} from '../core/constants';

/**
 * Second onHit listener for empowered attacks — runs after empoweredHit so
 * the path-specific effect has already fired.
 *
 *   - Battery   : add stack bonus to the empowered hit, then reset stacks.
 *   - Alignment : start the post-execution speed buff.
 */
export function registerPostEmpoweredHit(): void {
  registerCombatListener('onHit', (ctx, world) => {
    if (ctx.attackerType !== 'player') return;
    if (!ctx.metadata['empoweredAttack']) return;

    const player = ctx.attacker;
    if (!player.usesCooldown) return;

    const state  = player.tracksCombat;
    const cd     = player.usesCooldown;

    if (hasPassive(player, 'cooldown.battery')) {
      const charge = getStatusEffect(state, BAT_CHARGE_FX);
      if (charge && charge.stacks > 0) {
        ctx.damage += Math.round(charge.stacks * BATTERY_ATK_PER_STACK);
        console.log(`[Battery] ${player.isPlayer.id}: ${charge.stacks} stacks -> +${charge.stacks * BATTERY_ATK_PER_STACK} bonus on empowered`);
      }
      removeStatusEffect(state, BAT_CHARGE_FX);
      cd.batteryTimerAcc = 0;
    }

    if (hasPassive(player, 'cooldown.alignment')) {
      if (!player.hasAlignment) {
        const baseCd = player.performsAttack.attackCooldown;
        player.performsAttack.attackCooldown = Math.max(200, Math.round(player.performsAttack.attackCooldown * ALIGNMENT_SPEED_FACTOR));
        attachComponent(world, player, 'hasAlignment', { remainingMs: ALIGNMENT_BUFF_MS, baseCd });
      } else {
        player.hasAlignment.remainingMs = ALIGNMENT_BUFF_MS;
      }
      console.log(`[Alignment] ${player.isPlayer.id}: speed buff started (${ALIGNMENT_BUFF_MS}ms)`);
    }
  });
}
