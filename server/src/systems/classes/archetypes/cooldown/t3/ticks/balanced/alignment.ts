import type { World } from '../../../../../../../world/World';
import { detachComponent } from '../../../../../../../ecs/markerHelpers';
import { hasPassive } from '../../core/helpers';

/**
 * Alignment tick. Decrements the buff timer; on expiry, restores attack
 * cooldown AND halves the remaining execution cooldown so the next
 * empowered fires sooner.
 */
export function updateAlignment(world: World, dt: number): void {
  for (const entity of world.alignedPlayers) {
    const cd        = entity.usesCooldown;
    const alignment = entity.hasAlignment;
    if (!hasPassive(entity, 'cooldown.alignment')) continue;

    alignment.remainingMs = Math.max(0, alignment.remainingMs - dt);
    if (alignment.remainingMs <= 0) {
      entity.performsAttack.attackCooldown = alignment.baseCd || entity.performsAttack.attackCooldown;
      detachComponent(world, entity, 'hasAlignment');

      if (cd.executionCooldownMs > 0) {
        const halved = Math.round(cd.executionCooldownMs * 0.5);
        console.log(`[Alignment] ${entity.isPlayer.id}: buff expired - CD halved (${cd.executionCooldownMs} -> ${halved}ms)`);
        cd.executionCooldownMs = halved;
      }
    }
  }
}
