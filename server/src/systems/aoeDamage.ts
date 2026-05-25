import { distanceSq } from '@mmo-idle/shared';
import type { MonsterEntity } from '../ecs/components/monster';
import type { PlayerEntity } from '../ecs/components/player';
import type { World } from '../world/World';
import { grantMonsterRewards } from './rewards';

/**
 * Apply splash AoE damage from a player to all monsters within radius of a
 * center point, skipping any excluded monster (the primary target).
 *
 * Damage is applied with per-target plating and DR reductions — identical math
 * to the main combat loop — but does NOT run through the combat pipeline. This
 * keeps splash cheap and avoids recursive AoE chains.
 *
 * @param attacker   - The player dealing the AoE.
 * @param centerX/Y  - World-space center of the blast (usually the primary target's position).
 * @param radius     - Blast radius in pixels.
 * @param baseDamage - Raw damage before per-target reductions (caller computes this).
 * @param excludeId  - Monster ID to skip (primary target already received full damage).
 */
export function applyPlayerAoe(
  world: World,
  attacker: PlayerEntity,
  centerX: number,
  centerY: number,
  radius: number,
  baseDamage: number,
  excludeId?: string,
): void {
  const radiusSq = radius * radius;
  const center = { x: centerX, y: centerY };
  const toKill: MonsterEntity[] = [];
  const attackerNodeId = attacker.hasPosition.nodeId;
  const attackerId = attacker.isPlayer.id;

  for (const monster of world.monsterEntitiesInNode(attackerNodeId)) {
    if (monster.isMonster.id === excludeId) continue;

    if (distanceSq(monster.hasPosition.current, center) > radiusSq) continue;

    const effectiveDmg = Math.max(1, Math.round(
      Math.max(0, baseDamage - monster.mitigatesDamage.plating) * (1 - monster.mitigatesDamage.damageReduction),
    ));

    monster.hasHealth.hp -= effectiveDmg;

    if (monster.hasHealth.hp <= 0) toKill.push(monster);
  }

  for (const monster of toKill) {
    grantMonsterRewards(world, attackerId, monster);
    world.removeMonsterEntity(monster.isMonster.id);
  }
}

/**
 * Apply splash AoE damage from a monster to all players within radius of a
 * center point, skipping the primary target.
 *
 * Intended for future monster abilities (e.g. boss slams). Not yet wired into
 * the combat loop — call explicitly from the monster's attack handler.
 */
export function applyMonsterAoe(
  world: World,
  attacker: MonsterEntity,
  centerX: number,
  centerY: number,
  radius: number,
  baseDamage: number,
  excludeId?: string,
): void {
  const radiusSq = radius * radius;
  const center = { x: centerX, y: centerY };
  const attackerNodeId = attacker.hasPosition.nodeId;

  for (const player of world.playerEntitiesInNode(attackerNodeId)) {
    if (player.isPlayer.id === excludeId) continue;

    if (distanceSq(player.hasPosition.current, center) > radiusSq) continue;

    const effectiveDmg = Math.max(1, Math.round(
      Math.max(0, baseDamage - player.mitigatesDamage.plating) * (1 - player.mitigatesDamage.damageReduction),
    ));

    player.hasHealth.hp -= effectiveDmg;

    if (player.hasHealth.hp <= 0) {
      world.respawnPlayer(player.isPlayer.id);
    } else {
      player.tracksEngagement = Date.now();
    }
  }
}
