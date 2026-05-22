import type { PlayerState, MonsterState } from '@mmo-idle/shared';
import type { World } from '../world/World';
import { getNodeMonsters, getNodePlayers } from '../world/nodeQueries';
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
  attacker: PlayerState,
  centerX: number,
  centerY: number,
  radius: number,
  baseDamage: number,
  excludeId?: string,
): void {
  const radiusSq = radius * radius;
  const toKill: MonsterState[] = [];

  for (const monster of getNodeMonsters(world, attacker.nodeId)) {
    if (monster.id === excludeId) continue;

    const dx = monster.x - centerX;
    const dy = monster.y - centerY;
    if (dx * dx + dy * dy > radiusSq) continue;

    const effectiveDmg = Math.max(1, Math.round(
      Math.max(0, baseDamage - monster.plating) * (1 - monster.damageReduction),
    ));

    monster.hp -= effectiveDmg;

    if (monster.hp <= 0) toKill.push(monster);
  }

  for (const monster of toKill) {
    grantMonsterRewards(world, attacker.id, monster);
    world.monsters.delete(monster.id);
    world.monsterAI.delete(monster.id);
    world.monsterCombatState.delete(monster.id);
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
  attacker: MonsterState,
  centerX: number,
  centerY: number,
  radius: number,
  baseDamage: number,
  excludeId?: string,
): void {
  const radiusSq = radius * radius;

  for (const player of getNodePlayers(world, attacker.nodeId)) {
    if (player.id === excludeId) continue;

    const dx = player.x - centerX;
    const dy = player.y - centerY;
    if (dx * dx + dy * dy > radiusSq) continue;

    const effectiveDmg = Math.max(1, Math.round(
      Math.max(0, baseDamage - player.plating) * (1 - player.damageReduction),
    ));

    player.hp -= effectiveDmg;

    if (player.hp <= 0) {
      world.respawnPlayer(player.id);
    } else {
      world.playerCombatAt.set(player.id, Date.now());
    }
  }
}
