import { TEST_ROOM_NODE_ID } from '@mmo-idle/shared';
import type { MonsterEntity, PlayerEntity } from '../../../ecs/entity';
import type { World } from '../../../world/World';
import { grantMonsterRewards } from '../../player/progression/rewards';
import { isInvulnerableMonster } from '../invulnerability';
import { setAggroTarget } from '../ai/targeting';
import { markEngaged } from '../ai/engagement';
import { markUltimateContributor } from '../ai/ultimateContributors';
import { recordWorldLogEvent } from '../../../world/worldLog';
import {
  actorFromMonster,
  actorFromPlayer,
} from '../../../world/worldLogActors';
import {
  buildSimpleBreakdown,
  recordMonsterDamagedByPlayer,
  recordPlayerKillMonster,
} from '../../../world/worldLogCombat';

export interface PlayerProcDamageOpts {
  tags?: string[];
  clientEffects?: string[];
  /** Tag the damage number with empowered (yellow "!") styling. Proc damage never
   *  splashes, so this is purely cosmetic — no AoE is involved. */
  empowered?: boolean;
}

/**
 * Apply direct proc damage from a player to a monster outside the normal attack
 * pipeline. Handles invulnerability, world log, combat events, kills, and removal.
 */
export function applyPlayerProcDamage(
  world: World,
  player: PlayerEntity,
  target: MonsterEntity,
  damage: number,
  opts: PlayerProcDamageOpts = {},
): 'hit' | 'killed' | 'skipped' {
  if (damage <= 0) return 'skipped';
  if (isInvulnerableMonster(target)) return 'skipped';

  const hpDamage = Math.max(1, Math.round(damage));
  const nodeId = player.hasPosition.nodeId;
  const playerId = player.isPlayer.id;
  const source = actorFromPlayer(player);

  recordMonsterDamagedByPlayer(
    world,
    playerId,
    source,
    target,
    hpDamage,
    'proc',
    buildSimpleBreakdown(hpDamage, hpDamage),
    opts.tags,
  );

  target.hasHealth.hp -= hpDamage;
  markUltimateContributor(world, target, playerId);

  if (
    target.isMonster.isBoss &&
    target.hasPosition.nodeId === TEST_ROOM_NODE_ID
  ) {
    world.testRoomEngagedBossId = target.isMonster.id;
  }

  world.pushEvent(nodeId, {
    kind: 'player-hit',
    playerId,
    targetId: target.isMonster.id,
    targetName: target.isMonster.name,
    damage: hpDamage,
    empowered: opts.empowered ?? false,
    execution: false,
    effects:
      opts.clientEffects && opts.clientEffects.length > 0
        ? opts.clientEffects
        : undefined,
    playerPos: { ...player.hasPosition.current },
    targetPos: { ...target.hasPosition.current },
  });

  if (target.hasHealth.hp <= 0) {
    const rewardInfo = grantMonsterRewards(world, playerId, target);
    recordPlayerKillMonster(world, playerId, target, hpDamage, rewardInfo);
    recordWorldLogEvent(
      world,
      {
        kind: 'kill',
        nodeId,
        killer: source,
        victim: actorFromMonster(target),
        damage: hpDamage,
        essenceGained: rewardInfo?.essenceGained ?? 0,
        essenceType: rewardInfo?.essenceType ?? 'green',
        biomeXpGained: rewardInfo?.biomeXpGained ?? 0,
      },
      {
        visibility: 'combat',
        relatedPlayerIds: [playerId],
        nodeId,
      },
    );
    world.pushEvent(nodeId, {
      kind: 'player-kill',
      playerId,
      targetId: target.isMonster.id,
      targetName: target.isMonster.name,
      damage: hpDamage,
      biomeXpGained: rewardInfo?.biomeXpGained ?? 0,
      essenceGained: rewardInfo?.essenceGained ?? 0,
      essenceType: rewardInfo?.essenceType ?? 'green',
    });
    world.removeMonsterEntity(target.isMonster.id);
    return 'killed';
  }

  const now = Date.now();
  if (!target.hasAggroTarget) {
    setAggroTarget(world, target, { id: playerId, kind: 'player' }, now);
    markEngaged(world, player, now);
  }

  return 'hit';
}
