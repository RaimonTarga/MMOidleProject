import type { PassiveKey } from '@mmo-idle/shared';
import type { PlayerEntity } from '../../../../../../ecs/entity';
import type { World } from '../../../../../../world/World';
import { detachComponent } from '../../../../../../ecs/markerHelpers';
import { setAttackTarget } from '../../../../../combat/ai/targeting';

export function hasPassive(player: PlayerEntity, key: PassiveKey): boolean {
  return (player.usesSkills.passives[key] ?? 0) > 0;
}

/**
 * End an in-progress Channeled Beam. Detaches the `isChanneling` component
 * and drops the player's attack target so the next attack cycle starts fresh.
 */
export function endChannel(world: World, player: PlayerEntity): void {
  detachComponent(world, player, 'isChanneling');
  setAttackTarget(world, player, null);
}
