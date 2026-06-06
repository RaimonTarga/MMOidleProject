import { distanceSq, type Vec2 } from "@mmo-idle/shared";
import type { MonsterEntity, PlayerEntity } from "../../../ecs/entity";
import type { World } from "../../../world/World";
import { grantMonsterRewards } from "../../player/progression/rewards";
import { markEngaged } from "../ai/engagement";
import { buildKillerFromMonster } from "../../world/deathCause";
import {
  actorFromMonster,
  actorFromPlayer,
} from "../../../world/worldLogActors";
import {
  buildPlatingDrBreakdown,
  recordMonsterDamagedByPlayer,
  recordPlayerDamaged,
} from "../../../world/worldLogCombat";
import { recordWorldLogEvent } from "../../../world/worldLog";
import { isInvulnerableMonster, isInvulnerablePlayer } from "../invulnerability";

/**
 * Apply splash AoE damage from a player to all monsters within radius of a
 * center point, skipping any excluded monster (the primary target).
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
  const source = actorFromPlayer(attacker);

  for (const monster of world.monsterEntitiesInNode(attackerNodeId)) {
    if (monster.isMonster.id === excludeId) continue;
    if (isInvulnerableMonster(monster)) continue;

    if (distanceSq(monster.hasPosition.current, center) > radiusSq) continue;

    const mitigation = buildPlatingDrBreakdown({
      grossDamage: baseDamage,
      effectivePlating: monster.mitigatesDamage.plating,
      platingMult: 1,
      damageReduction: monster.mitigatesDamage.damageReduction,
    });
    const effectiveDmg = mitigation.hpDamage;

    recordMonsterDamagedByPlayer(
      world,
      attackerId,
      source,
      monster,
      effectiveDmg,
      "aoe",
      mitigation,
    );

    monster.hasHealth.hp -= effectiveDmg;

    if (monster.hasHealth.hp <= 0) toKill.push(monster);
  }

  for (const monster of toKill) {
    const rewardInfo = grantMonsterRewards(world, attackerId, monster);
    recordWorldLogEvent(
      world,
      {
        kind: "kill",
        nodeId: attackerNodeId,
        killer: source,
        victim: actorFromMonster(monster),
        damage: 0,
        essenceGained: rewardInfo?.essenceGained ?? 0,
        essenceType: rewardInfo?.essenceType ?? "green",
        biomeXpGained: rewardInfo?.biomeXpGained ?? 0,
      },
      {
        visibility: "combat",
        relatedPlayerIds: [attackerId],
        nodeId: attackerNodeId,
      },
    );
    world.removeMonsterEntity(monster.isMonster.id);
  }
}

/**
 * Apply splash AoE damage from a monster to all players AND enemy summons within
 * radius of a center point, skipping the primary target (matched by id against
 * both players and minions — ids are globally unique).
 *
 * Minions take raw mitigated damage and are not killed here: their death is
 * observed lazily by the summoner tick (mirrors `runMonsterAttackOnMinion`).
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
  const source = actorFromMonster(attacker);

  for (const player of world.livePlayersInNode(attackerNodeId)) {
    if (player.isPlayer.id === excludeId) continue;
    if (isInvulnerablePlayer(player)) continue;

    if (distanceSq(player.hasPosition.current, center) > radiusSq) continue;

    const mitigation = buildPlatingDrBreakdown({
      grossDamage: baseDamage,
      effectivePlating: player.mitigatesDamage.plating,
      platingMult: 1,
      damageReduction: player.mitigatesDamage.damageReduction,
    });
    const effectiveDmg = mitigation.hpDamage;

    recordPlayerDamaged(
      world,
      player,
      source,
      effectiveDmg,
      0,
      "aoe",
      mitigation,
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

  for (const minion of world.minionEntitiesInNode(attackerNodeId)) {
    if (minion.isMinion.id === excludeId) continue;
    if (minion.hasHealth.hp <= 0) continue;

    if (distanceSq(minion.hasPosition.current, center) > radiusSq) continue;

    const effectiveDmg = buildPlatingDrBreakdown({
      grossDamage: baseDamage,
      effectivePlating: minion.mitigatesDamage.plating,
      platingMult: 1,
      damageReduction: minion.mitigatesDamage.damageReduction,
    }).hpDamage;

    minion.hasHealth.hp = Math.max(0, minion.hasHealth.hp - effectiveDmg);
  }
}
