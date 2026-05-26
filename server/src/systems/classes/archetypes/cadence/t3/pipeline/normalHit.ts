import { registerCombatListener } from '../../../../../combat/engine/combatPipeline';
import { MOMENTUM_ECHO_BONUS } from '../core/constants';

export function registerCadenceNormalHit(): void {
  registerCombatListener('onHit', (ctx, _world) => {
    if (ctx.attackerType !== 'player') return;
    if (ctx.metadata['empoweredAttack']) return;

    const entity = ctx.attacker;
    if (!entity.usesCadence) return;

    const cadence = entity.usesCadence;
    const passives = entity.usesSkills.passives;

    // Rising Tide echo bonus: boost this hit if the echo counter is running.
    if (cadence.echo > 0 && (passives['cadence.momentum-echo'] ?? 0) > 0) {
      ctx.damage = Math.round(ctx.damage * (1 + MOMENTUM_ECHO_BONUS));
      cadence.echo--;
    }

    // Delayed Verdict: accumulate this hit's damage for the eventual detonation.
    if ((passives['cadence.detonation'] ?? 0) > 0) {
      cadence.seqDmg += ctx.damage;
    }

    // Iron Patience: store a fraction of this hit as charge for the finisher.
    const chargePct = passives['cadence.charge-buildup'] ?? 0;
    if (chargePct > 0) {
      cadence.charge += Math.round(ctx.damage * chargePct);
    }
  });
}
