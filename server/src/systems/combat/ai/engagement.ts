import { attachComponent, detachComponent } from '../../../ecs/markerHelpers';
import type { PlayerEntity } from '../../../ecs/entity';
import type { World } from '../../../world/World';

export function markEngaged(world: World, player: PlayerEntity, now: number): void {
  attachComponent(world, player, 'tracksEngagement', now);
}

export function clearEngagement(world: World, player: PlayerEntity): void {
  detachComponent(world, player, 'tracksEngagement');
}
