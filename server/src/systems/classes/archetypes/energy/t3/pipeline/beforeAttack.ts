import { registerCombatListener } from '../../../../../combat/engine/combatPipeline';
import { isEmpoweredAttack, setEmpoweredAttack } from '../../../../../combat/engine/empoweredAttacks';
import { hasPassive } from '../core/helpers';

/**
 * Energy T3 beforeAttack listener.
 *
 *   1. Suppress the standard empowered multiplier for paths with a custom
 *      discharge formula (Polarity Decay, Cascading Induction,
 *      Superconducting Mass, Capacitor Shunt).
 *   2. Singularity Execute: force discharge early if the target would die
 *      from the projected empowered damage.
 */
export function registerBeforeAttack(): void {
  registerCombatListener('beforeAttack', (ctx, world) => {
    if (ctx.attackerType !== 'player') return;

    const entity = ctx.attacker;
    if (!entity?.usesEnergy) return;

    const player = entity;
    const passives = player.usesSkills.passives;

    if (isEmpoweredAttack(entity) && (
      hasPassive(player, 'energy.polarity-decay')       ||
      hasPassive(player, 'energy.cascading-induction')  ||
      hasPassive(player, 'energy.superconducting-mass') ||
      hasPassive(player, 'energy.capacitor-shunt')
    )) {
      ctx.metadata['suppressEmpoweredMult'] = true;
    }

    if (
      hasPassive(player, 'energy.singularity-execute') &&
      ctx.defenderType === 'monster' &&
      !isEmpoweredAttack(entity)
    ) {
      const empMult   = passives['energy.empowered-mult'] ?? 6.0;
      const projected = Math.floor(player.dealsDamage.attack * empMult);
      if (ctx.defender.hasHealth.hp <= projected) {
        setEmpoweredAttack(world, entity);
        console.log(`[SingularityExec] ${player.isPlayer.id}: execute — ${ctx.defender.hasHealth.hp} HP <= ${projected} projected`);
      }
    }
  });
}
