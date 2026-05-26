import { registerCombatListener } from '../../../../../combat/engine/combatPipeline';
import { isEmpoweredAttack } from '../../../../../combat/engine/empoweredAttacks';
import { hasPassive } from '../core/helpers';

/**
 * Suppress the standard empowered damage multiplier for cooldown T3 paths
 * that replace it with their own effect (Overdrive, Eternal Cycle,
 * Temporal Extension, Entropy Collapse, Channeled Beam). Sets
 * `ctx.metadata['suppressEmpoweredMult']` so `empoweredAttacks.ts` skips the
 * multiplication but still consumes the empowered flag.
 */
export function registerBeforeAttack(): void {
  registerCombatListener('beforeAttack', (ctx, _world) => {
    if (ctx.attackerType !== 'player') return;

    const entity = ctx.attacker;
    if (!entity.usesCooldown) return;
    if (!isEmpoweredAttack(entity)) return;

    if (
      hasPassive(entity, 'cooldown.overdrive')          ||
      hasPassive(entity, 'cooldown.eternal-cycle')      ||
      hasPassive(entity, 'cooldown.temporal-extension') ||
      hasPassive(entity, 'cooldown.entropy-collapse')   ||
      hasPassive(entity, 'cooldown.channeled-beam')
    ) {
      ctx.metadata['suppressEmpoweredMult'] = true;
    }
  });
}
