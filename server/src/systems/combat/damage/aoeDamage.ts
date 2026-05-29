import { distanceSq, type Vec2 } from "@mmo-idle/shared";
import type { MonsterEntity, PlayerEntity } from "../../../ecs/entity";
import type { World } from "../../../world/World";
import { grantMonsterRewards } from "../../player/progression/rewards";
import { markEngaged } from "../ai/engagement";
import { buildKillerFromMonster } from "../../world/deathCause";

/**
 * Apply splash AoE damage from a player to all monsters within radius of a
 * center point, skipping any excluded monster (the primary target).
 *
 * Damage is applied with per-target plating and DR reductions — identical math
 * to the main combat loop — but does NOT run through the combat pipeline. This
 * keeps splash cheap and avoids recursive AoE chains.
 *
 * @param attacker   - The player dealing the AoE.
 * @param center     - World-space center of the blast (usually the primary target's position).
 * @param radius     - Blast radius in pixels.
 * @param baseDamage - Raw damage before per-target reductions (caller computes this).
 * @param excludeId  - Monster ID to skip (primary target already received full damage).
 */
export function applyPlayerAoe(
  world: World,
  attacker: PlayerEntity,
  center: Vec2,
  radius: number,
  baseDamage: number,
  excludeId?: string,
): void {
  const radiusSq = radius * radius;
  const toKill: MonsterEntity[] = [];
  const attackerNodeId = attacker.hasPosition.nodeId;
  const attackerId = attacker.isPlayer.id;

  for (const monster of world.monsterEntitiesInNode(attackerNodeId)) {
    if (monster.isMonster.id === excludeId) continue;

    if (distanceSq(monster.hasPosition.current, center) > radiusSq) continue;

    const effectiveDmg = Math.max(
      1,
      Math.round(
        Math.max(0, baseDamage - monster.mitigatesDamage.plating) *
          (1 - monster.mitigatesDamage.damageReduction),
      ),
    );

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
  center: Vec2,
  radius: number,
  baseDamage: number,
  excludeId?: string,
): void {
  const radiusSq = radius * radius;
  const attackerNodeId = attacker.hasPosition.nodeId;

  for (const player of world.livePlayersInNode(attackerNodeId)) {
    if (player.isPlayer.id === excludeId) continue;

    if (distanceSq(player.hasPosition.current, center) > radiusSq) continue;

    const effectiveDmg = Math.max(
      1,
      Math.round(
        Math.max(0, baseDamage - player.mitigatesDamage.plating) *
          (1 - player.mitigatesDamage.damageReduction),
      ),
    );

    player.hasHealth.hp -= effectiveDmg;

    if (player.hasHealth.hp <= 0) {
      world.killPlayer(player.isPlayer.id, {
        kind: "aoe",
        killer: buildKillerFromMonster(attacker),
        damage: effectiveDmg,
      });
    } else {
      markEngaged(world, player, Date.now());
    }
  }
}
