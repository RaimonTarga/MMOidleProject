import { registerCombatListener } from '../../combat/engine/combatPipeline';
import { EXPOSE_WEAKNESS_EFFECT_ID, getStatusEffect, type TracksCombat } from '@mmo-idle/shared';

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

    ctx.damage = applyMonsterDamageTakenDebuffs(ctx.defender.tracksCombat, ctx.damage);
  });
}

export function applyMonsterDamageTakenDebuffs(
  monsterState: TracksCombat,
  damage: number,
): number {
  let next = damage;

  const vuln = getStatusEffect(monsterState, 'vulnerability');
  if (vuln) {
    next = Math.round(next * (vuln.data['damageMultiplier'] ?? 1));
  }

  const exposed = getStatusEffect(monsterState, EXPOSE_WEAKNESS_EFFECT_ID);
  if (exposed) {
    next = Math.round(next * (1 + Math.max(0, exposed.data['damageTakenPct'] ?? 0)));
  }

  return Math.max(0, next);
}
