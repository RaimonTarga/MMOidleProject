import type { World } from '../../../../../../../world/World';
import { consumeEmpoweredAttack } from '../../../../../../combat/engine/empoweredAttacks';
import { EXECUTION_COOLDOWN_MS } from '../../../cooldownPrototype';
import { hasPassive } from '../../core/helpers';
import { SINGULAR_NO_TARGET_MS } from '../../core/constants';

/**
 * Singular Extraction tick. Tracks the time spent without an attack target.
 * After SINGULAR_NO_TARGET_MS without one, the execution CD is reset and any
 * armed empowered is disarmed — keeps the player from sitting on a queued
 * empowered indefinitely.
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
        const cdMs = entity.usesSkills.passives['cooldown.empowered-cd-ms'] ?? EXECUTION_COOLDOWN_MS;
        cd.executionCooldownMs = cdMs;
        consumeEmpoweredAttack(world, entity); // disarm if already armed
        cd.singularNoTargetMs = 0;
        console.log(`[SingExtract] ${entity.isPlayer.id}: out of combat - cycle reset (${cdMs}ms)`);
      }
    }
  }
}
