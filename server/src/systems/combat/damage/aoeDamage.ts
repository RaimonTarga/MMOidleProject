import { pushDamageEvent } from './damageEvent';
import { platingAfterShred, type Vec2 } from "@mmo-idle/shared";
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
import { applyMonsterDamageTakenDebuffs } from "../../classes/shared/debuffs";
import { emitPlayerMonsterOnKill } from "./killHooks";

/**
 * Authoritative target selection shared by direct AoE and class-specific riders.
 * Body overlap (not origin distance) defines Sweep's valid secondary targets.
 */
export function playerAoeTargets(
  world: World,
  attacker: PlayerEntity,
  center: Vec2,
  radius: number,
  excludeId?: string,
): MonsterEntity[] {
  return world.collision.bodiesInCircle(
    world.monsterEntitiesInNode(attacker.hasPosition.nodeId),
    center,
    radius,
  ).filter(
    (monster) =>
      monster.isMonster.id !== excludeId && !isInvulnerableMonster(monster),
  );
}

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
  physicalSource: "player" | "summon" = "player",
): void {
  const toKill: Array<{ monster: MonsterEntity; damage: number }> = [];
  const attackerNodeId = attacker.hasPosition.nodeId;
  const attackerId = attacker.isPlayer.id;
  const source = actorFromPlayer(attacker);

  const victims = playerAoeTargets(world, attacker, center, radius, excludeId);

  for (const monster of victims) {
    const mitigation = buildPlatingDrBreakdown({
      grossDamage: baseDamage,
      effectivePlating: monster.mitigatesDamage.plating,
      platingMult: 1,
      damageReduction: monster.mitigatesDamage.damageReduction,
    });
    const effectiveDmg = applyMonsterDamageTakenDebuffs(monster.tracksCombat, mitigation.hpDamage);
    mitigation.hpDamage = effectiveDmg;

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
    pushDamageEvent(world, monster, effectiveDmg, { sourceId: attackerId });

    if (monster.hasHealth.hp <= 0) toKill.push({ monster, damage: effectiveDmg });
  }

  for (const { monster, damage } of toKill) {
    emitPlayerMonsterOnKill(world, attackerId, monster, damage, "aoe", physicalSource);
    const rewardInfo = grantMonsterRewards(world, attackerId, monster);
    recordWorldLogEvent(
      world,
      {
        kind: "kill",
        nodeId: attackerNodeId,
        killer: source,
        victim: actorFromMonster(monster),
        damage,
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
  const attackerNodeId = attacker.hasPosition.nodeId;
  const source = actorFromMonster(attacker);

  const players = world.collision.bodiesInCircle(
    world.livePlayersInNode(attackerNodeId),
    center,
    radius,
  );

  for (const player of players) {
    if (player.isPlayer.id === excludeId) continue;
    if (isInvulnerablePlayer(player)) continue;

    const mitigation = buildPlatingDrBreakdown({
      grossDamage: baseDamage,
      effectivePlating: platingAfterShred(
        player.mitigatesDamage.plating,
        player.tracksCombat,
      ),
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
    pushDamageEvent(world, player, effectiveDmg, { sourceId: attacker.isMonster.id });

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

  const minions = world.collision.bodiesInCircle(
    world.minionEntitiesInNode(attackerNodeId),
    center,
    radius,
  );

  for (const minion of minions) {
    if (minion.isMinion.id === excludeId) continue;
    if (minion.hasHealth.hp <= 0) continue;

    const effectiveDmg = buildPlatingDrBreakdown({
      grossDamage: baseDamage,
      effectivePlating: minion.mitigatesDamage.plating,
      platingMult: 1,
      damageReduction: minion.mitigatesDamage.damageReduction,
    }).hpDamage;

    minion.hasHealth.hp = Math.max(0, minion.hasHealth.hp - effectiveDmg);
    pushDamageEvent(world, minion, effectiveDmg, { sourceId: attacker.isMonster.id });
  }
}
