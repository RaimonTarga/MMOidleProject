import type { World } from '../../../../../../../world/World';
import { detachComponent } from '../../../../../../../ecs/markerHelpers';
import { hasPassive } from '../../core/helpers';

/**
 * Overdrive tick. Decrements the buff timer; when it expires, restores
 * `performsAttack.attackCooldown` to the captured `baseCd` and detaches
 * the marker.
 */
export function updateOverdrive(world: World, dt: number): void {
  for (const entity of world.overdrivenPlayers) {
    const od = entity.hasOverdrive;
    if (!hasPassive(entity, 'cooldown.overdrive')) continue;

    od.remainingMs = Math.max(0, od.remainingMs - dt);
    if (od.remainingMs <= 0) {
      entity.performsAttack.attackCooldown = od.baseCd || entity.performsAttack.attackCooldown;
      detachComponent(world, entity, 'hasOverdrive');
      console.log(`[Overdrive] ${entity.isPlayer.id}: buff expired - speed restored`);
    }
  }
}
