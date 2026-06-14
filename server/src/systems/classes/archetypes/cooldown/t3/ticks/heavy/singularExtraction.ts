import type { World } from '../../../../../../../world/World';
import { setEmpoweredAttack, isEmpoweredAttack } from '../../../../../../combat/engine/empoweredAttacks';
import { hasPassive } from '../../core/helpers';
import { SINGULAR_NO_TARGET_MS } from '../../core/constants';

/**
 * Singular Extraction tick. Tracks the time spent without an attack target.
 * After SINGULAR_NO_TARGET_MS without one, the execution is PRIMED — it sits
 * armed (full bar) so the Destroyer rests ready out of combat and the first hit
 * on re-engaging is an execution.
 *
 * (Earlier this reset the cooldown to full/empty instead; because the no-target
 * window equals the execution cooldown, the bar charged and reset in lockstep
 * out of combat and never latched.)
 */
export function updateSingularExtraction(world: World, dt: number): void {
  for (const entity of world.cooldownPlayers) {
    const cd = entity.usesCooldown;
    if (!hasPassive(entity, 'cooldown.singular-extraction')) continue;

    if (entity.hasAttackTarget) {
      cd.singularNoTargetMs = 0;
    } else {
      cd.singularNoTargetMs += dt;

      if (cd.singularNoTargetMs >= SINGULAR_NO_TARGET_MS) {
        cd.executionCooldownMs = 0;
        if (!isEmpoweredAttack(entity)) setEmpoweredAttack(world, entity);
        cd.singularNoTargetMs = 0;
      }
    }
  }
}
