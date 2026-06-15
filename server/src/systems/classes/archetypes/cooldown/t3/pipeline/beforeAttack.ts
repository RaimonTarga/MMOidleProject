import { registerCombatListener } from '../../../../../combat/engine/combatPipeline';
import { isEmpoweredAttack } from '../../../../../combat/engine/empoweredAttacks';
import { hasPassive } from '../core/helpers';
import { RUPTURE_WINDOW_PLATING_MULT, RUPTURE_DR_PIERCE } from '../core/constants';

/**
 * Cooldown T3 beforeAttack hooks:
 *
 *   - suppressEmpoweredMult: Channeled Beam replaces the execution damage with a
 *     channel, so the standard multiplier is skipped (the flag is still consumed).
 *   - Rupture: the execution hit bypasses 100% of plating (platingMult 0); for a
 *     short window afterward, regular attacks bypass 50% plating (platingMult 0.5)
 *     and pierce a fraction of the target's damage reduction (drPierce).
 */
export function registerBeforeAttack(): void {
  registerCombatListener('beforeAttack', (ctx, _world) => {
    if (ctx.attackerType !== 'player') return;

    const entity = ctx.attacker;
    if (!entity.usesCooldown) return;

    const empowered = isEmpoweredAttack(entity);

    if (empowered && hasPassive(entity, 'cooldown.channeled-beam')) {
      ctx.metadata['suppressEmpoweredMult'] = true;
    }

    if (hasPassive(entity, 'cooldown.rupture')) {
      if (empowered) {
        ctx.platingMult = 0; // execution ignores plating entirely
      } else if (entity.usesCooldown.ruptureWindowMs > 0) {
        ctx.platingMult = Math.min(ctx.platingMult, RUPTURE_WINDOW_PLATING_MULT);
        ctx.drPierce = Math.max(
          ctx.drPierce,
          entity.usesSkills.passives['cooldown.rupture-dr-pierce'] ?? RUPTURE_DR_PIERCE,
        );
      }
    }
  });
}
