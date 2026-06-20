import { applyStatusEffect, getStatusEffect } from '@mmo-idle/shared';
import { registerCombatListener } from '../../../../../combat/engine/combatPipeline';
import { hasPassive } from '../core/helpers';
import {
  batteryDamagePerStack,
  eternalCycleFlatPerStack,
  patienceAttackMax,
  rampFactorFor,
} from '../core/selectors';
import {
  ETERNAL_CHARGE_DURATION_MS,
  EC_CHARGE_FX, BAT_CHARGE_FX,
} from '../core/constants';

/**
 * onHit listener for cooldown T3 normal (non-empowered) attacks. All paths are
 * additive (no early returns).
 *
 *   1. Eternal Cycle      — bank one flat-damage stack per attack (spent on execution).
 *   2. Battery            — flat bonus from accumulated stacks.
 *   3. Patience Paid      — ramp regular-attack damage with the uninterrupted CD.
 *   4. Reverb             — count attacks landed this CD window.
 *   5. Singular Extraction — zero direct damage (on-hit/charm still fire).
 */
export function registerNormalHit(): void {
  registerCombatListener('onHit', (ctx, _world) => {
    if (ctx.attackerType !== 'player') return;
    if (ctx.metadata['empoweredAttack']) return;

    const player = ctx.attacker;
    if (!player.usesCooldown) return;

    const state = player.tracksCombat;
    const cd    = player.usesCooldown;

    if (hasPassive(player, 'cooldown.eternal-cycle')) {
      // Bank a stack, then add flat damage per banked stack to THIS attack — the
      // bonus ramps as stacks build (Metronome-style). The execution adds the full
      // stacked bonus again and clears the stacks (see postEmpoweredHit).
      const charge = applyStatusEffect(state, {
        id:          EC_CHARGE_FX,
        instanced:   false,
        remainingMs: player.usesSkills.passives['cooldown.eternal-charge-duration-ms'] ?? ETERNAL_CHARGE_DURATION_MS,
        refreshable: true,
        sourceId:    player.isPlayer.id,
        data:        {},
      });
      ctx.damage += Math.round(charge.stacks * eternalCycleFlatPerStack(player));
    }

    if (hasPassive(player, 'cooldown.battery')) {
      const charge = getStatusEffect(state, BAT_CHARGE_FX);
      if (charge && charge.stacks > 0) {
        ctx.damage += Math.round(charge.stacks * batteryDamagePerStack(player));
      }
    }

    if (hasPassive(player, 'cooldown.patience-paid')) {
      const ramp = rampFactorFor(cd, player);
      if (ramp > 0) ctx.damage = Math.round(ctx.damage * (1 + ramp * patienceAttackMax(player)));
    }

    if (hasPassive(player, 'cooldown.reverb')) {
      cd.reverbAttackCount++;
    }

    if (hasPassive(player, 'cooldown.singular-extraction')) {
      ctx.damage = 0;
    }
  });
}
