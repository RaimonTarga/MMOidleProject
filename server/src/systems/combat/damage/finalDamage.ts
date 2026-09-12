import { resolveFinalDamageMultipliers, scaleFinalDamage } from '@mmo-idle/shared';
import type { PlayerEntity } from '../../../ecs/entity';
import type { World } from '../../../world/World';

export function playerFinalDamageMultipliers(player: PlayerEntity, world?: World) {
  let aggressors = 0;
  if (world && player.tracksProgression.activeStance === 'brawler-stance') {
    for (const monster of world.aggroedMonsters) {
      if (monster.hasAggroTarget.targetKind === 'player' && monster.hasAggroTarget.targetId === player.isPlayer.id) aggressors++;
    }
  }
  return resolveFinalDamageMultipliers(player.usesSkills.passives, player.tracksProgression.activeStance,
    player.hasHealth.hp / Math.max(1, player.hasHealth.maxHp), player.tracksCombat, aggressors);
}

export function outgoingFinalDamage(world: World, sourceId: string, damage: number): number {
  const player = world.getPlayerEntity(sourceId);
  return scaleFinalDamage(damage, player ? playerFinalDamageMultipliers(player).dealt : 1);
}

export function incomingFinalDamage(world: World, player: PlayerEntity, damage: number): number {
  return scaleFinalDamage(damage, playerFinalDamageMultipliers(player, world).taken);
}
