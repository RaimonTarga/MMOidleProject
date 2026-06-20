import { getStatusEffect, removeStatusEffect } from '@mmo-idle/shared';
import { registerCombatListener } from '../../../../../combat/engine/combatPipeline';
import { hasPassive } from '../core/helpers';
import {
  batteryDamagePerStack,
  eternalCycleFlatPerStack,
  patienceExecutionMax,
  rampFactorFor,
} from '../core/selectors';
import {
  REVERB_BONUS_PER_ATTACK,
  VENGEANCE_MULTIPLIER, VENGEANCE_FLOOR,
  RUPTURE_WINDOW_MS,
  BAT_CHARGE_FX, EC_CHARGE_FX,
} from '../core/constants';

/**
 * Second onHit listener for empowered (execution) attacks — runs after
 * empoweredHit. Holds the ADDITIVE execution bonuses so they layer on top of the
 * standard execution multiplier:
 *
 *   - Eternal Cycle  : add banked flat stacks, then clear them.
 *   - Battery        : add stack bonus, then clear.
 *   - Reverb         : apply the bonus charged by the PRIOR window, then recharge.
 *   - Patience Paid  : amplify by the uninterrupted-cooldown ramp.
 *   - Vengeance      : add a portion of damage taken since the last execution (floored).
 *   - Rupture        : arm the post-execution plating-bypass window.
 */
export function registerPostEmpoweredHit(): void {
  registerCombatListener('onHit', (ctx, _world) => {
    if (ctx.attackerType !== 'player') return;
    if (!ctx.metadata['empoweredAttack']) return;

    const player = ctx.attacker;
    if (!player.usesCooldown) return;

    const state = player.tracksCombat;
    const cd    = player.usesCooldown;

    if (hasPassive(player, 'cooldown.eternal-cycle')) {
      const charge = getStatusEffect(state, EC_CHARGE_FX);
      if (charge && charge.stacks > 0) {
        ctx.damage += Math.round(charge.stacks * eternalCycleFlatPerStack(player));
        removeStatusEffect(state, EC_CHARGE_FX);
      }
    }

    if (hasPassive(player, 'cooldown.battery')) {
      const charge = getStatusEffect(state, BAT_CHARGE_FX);
      if (charge && charge.stacks > 0) {
        ctx.damage += Math.round(charge.stacks * batteryDamagePerStack(player));
      }
      removeStatusEffect(state, BAT_CHARGE_FX);
      cd.batteryTimerAcc = 0;
    }

    if (hasPassive(player, 'cooldown.reverb')) {
      // Apply the bonus charged by the previous window, then recharge from this one.
      if (cd.reverbStoredBonus > 0) {
        ctx.damage = Math.round(ctx.damage * (1 + cd.reverbStoredBonus));
      }
      const perAttack = player.usesSkills.passives['cooldown.reverb-bonus-per-attack'] ?? REVERB_BONUS_PER_ATTACK;
      cd.reverbStoredBonus = cd.reverbAttackCount * perAttack;
      cd.reverbAttackCount = 0;
    }

    if (hasPassive(player, 'cooldown.patience-paid')) {
      const ramp = rampFactorFor(cd, player);
      if (ramp > 0) ctx.damage = Math.round(ctx.damage * (1 + ramp * patienceExecutionMax(player)));
    }

    if (hasPassive(player, 'cooldown.vengeance')) {
      const mult  = player.usesSkills.passives['cooldown.vengeance-mult']  ?? VENGEANCE_MULTIPLIER;
      const floor = player.usesSkills.passives['cooldown.vengeance-floor'] ?? VENGEANCE_FLOOR;
      const bonus = Math.max(floor, Math.round(cd.vengeanceDamageTaken * mult));
      ctx.damage += bonus;
      cd.vengeanceDamageTaken = 0;
    }

    if (hasPassive(player, 'cooldown.rupture')) {
      cd.ruptureWindowMs = player.usesSkills.passives['cooldown.rupture-window-ms'] ?? RUPTURE_WINDOW_MS;
    }
  });
}
