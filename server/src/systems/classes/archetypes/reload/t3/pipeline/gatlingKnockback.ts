import { registerCombatListener } from '../../../../../combat/engine/combatPipeline';
import { applyKnockback } from '../../../../../combat/damage/knockback';
import { GATLING_KNOCKBACK_DISTANCE, GATLING_KNOCKBACK_MS } from '../core/constants';

export function registerGatlingKnockback(): void {
  registerCombatListener('onHit', (ctx, world) => {
    if (ctx.attackerType !== 'player') return;
    if (ctx.defenderType !== 'monster') return;

    const player = ctx.attacker;
    const monster = ctx.defender;
    if ((player.usesSkills.passives['reload.gatling'] ?? 0) <= 0) return;

    applyKnockback(
      world,
      monster.isMonster.id,
      player.hasPosition.current,
      GATLING_KNOCKBACK_DISTANCE,
      GATLING_KNOCKBACK_MS,
    );
  });
}
