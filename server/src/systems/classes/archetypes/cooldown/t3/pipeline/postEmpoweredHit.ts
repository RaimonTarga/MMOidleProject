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
  VENGEANCE_MULTIPLIER, VENGEANCE_FLOOR,
  RUPTURE_WINDOW_MS,
  BAT_CHARGE_FX, EC_CHARGE_FX,
} from '../core/constants';
import { COOLDOWN_SUNDER_FX } from '@mmo-idle/shared';
import { pushClientEffect } from '../../../../../combat/engine/combatPipeline';
import { isMechanicProxy } from '../../../../../combat/engine/empoweredAttacks';
import { isReverbEcho, openReverbEcho } from './reverbEcho';

/**
 * Second onHit listener for empowered (execution) attacks — runs after
 * empoweredHit. Holds the ADDITIVE execution bonuses so they layer on top of the
 * standard execution multiplier:
 *
 *   - Eternal Cycle  : add banked flat stacks, then clear them.
 *   - Battery        : add stack bonus, then clear.
 *   - Reverb         : the execution marks its echo due at the halfway mark.
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

    // Only the execution SPENDING its charge opens an echo: never the echo itself
    // (an echo of an echo would chain forever), never a proxied hit.
    if (
      hasPassive(player, 'cooldown.reverb')
      && ctx.metadata['mechanicConsumed'] === true
      && !isReverbEcho(ctx)
      && !isMechanicProxy(ctx)
    ) {
      openReverbEcho(player);
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
      pushClientEffect(ctx, COOLDOWN_SUNDER_FX);
    }
  });
}
