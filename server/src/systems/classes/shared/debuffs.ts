import { registerCombatListener } from '../../combat/engine/combatPipeline';
import { getStatusEffect } from '@mmo-idle/shared';

/**
 * Register generic debuff listeners that modify incoming damage.
 * Called once at server startup.
 *
 * Current debuffs handled:
 *   'vulnerability' — increases damage taken by damageMultiplier (e.g. 1.25 = +25%).
 *                     Applied by Cursed Finale (cadence-light tier-3-b).
 */
export function initDebuffMechanics(): void {
  registerCombatListener('onDamageTaken', (ctx, _world) => {
    if (ctx.defenderType !== 'monster') return;

    const monsterState = ctx.defender.tracksCombat;

    const vuln = getStatusEffect(monsterState, 'vulnerability');
    if (!vuln) return;

    ctx.damage = Math.round(ctx.damage * vuln.data['damageMultiplier']);
  });
}
