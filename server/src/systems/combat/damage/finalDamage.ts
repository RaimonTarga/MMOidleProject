import { resolveFinalDamageMultipliers, scaleFinalDamage } from '@mmo-idle/shared';
import type { PlayerEntity } from '../../../ecs/entity';
import type { World } from '../../../world/World';

export function playerFinalDamageMultipliers(player: PlayerEntity) {
  return resolveFinalDamageMultipliers(player.usesSkills.passives, player.tracksCombat);
}

export function outgoingFinalDamage(world: World, sourceId: string, damage: number): number {
  const player = world.getPlayerEntity(sourceId);
  return scaleFinalDamage(damage, player ? playerFinalDamageMultipliers(player).dealt : 1);
}

export function incomingFinalDamage(world: World, player: PlayerEntity, damage: number): number {
  return scaleFinalDamage(damage, playerFinalDamageMultipliers(player).taken);
}
