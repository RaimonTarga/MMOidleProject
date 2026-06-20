import { GAME_CONFIG } from '@mmo-idle/shared';
import { attachComponent, detachComponent } from '../../../ecs/markerHelpers';
import type { PlayerEntity } from '../../../ecs/entity';
import type { World } from '../../../world/World';

export function markEngaged(world: World, player: PlayerEntity, now: number): void {
  attachComponent(world, player, 'tracksEngagement', now);
}

export function clearEngagement(world: World, player: PlayerEntity): void {
  detachComponent(world, player, 'tracksEngagement');
}

/**
 * True while the player has a live attack target or a monster is actively
 * aggroed on them. Unlike {@link isPlayerInCombat}, this deliberately excludes
 * the post-combat regen cooldown so rune recovery actions can claim control as
 * soon as the fight itself is over.
 */
export function isPlayerActivelyInCombat(
  world: World,
  player: PlayerEntity,
): boolean {
  const targetId = player.hasAttackTarget?.targetId;
  if (targetId && world.hasMonster(targetId)) return true;

  for (const monster of world.aggroedMonsters) {
    if (
      monster.hasAggroTarget.targetKind === 'player' &&
      monster.hasAggroTarget.targetId === player.isPlayer.id
    ) {
      return true;
    }
  }
  return false;
}

/**
 * True while the player is engaged: actively targeting a monster, or within
 * `COMBAT_REGEN_DELAY` of the last combat interaction. Single source of truth for
 * the in-combat/OOC distinction (mirrors the inline check in defense/index.ts and
 * combat.ts); read by mobility boots (Plains OOC speed, etc.).
 */
export function isPlayerInCombat(player: PlayerEntity, now: number): boolean {
  if (player.hasAttackTarget !== undefined) return true;
  const last = player.tracksEngagement;
  return last !== undefined && now - last < GAME_CONFIG.COMBAT_REGEN_DELAY;
}
