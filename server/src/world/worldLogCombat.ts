import type {
  DamageMitigationBreakdown,
  WorldLogActor,
  WorldLogDamageType,
} from '@mmo-idle/shared';
import type { MonsterEntity, PlayerEntity } from '../ecs/entity';
import type { World } from './World';
import { markUltimateContributor } from '../systems/combat/ai/ultimateContributors';
import { recordWorldLogEvent } from './worldLog';
import {
  actorFromMonster,
  actorFromPlayer,
  actorFromSourceId,
} from './worldLogActors';
import type { KillRewardInfo } from '../systems/player/progression/rewards';

export function applyDamageFloor(preFloor: number): {
  hpDamage: number;
  glancing: boolean;
} {
  const rounded = Math.round(preFloor);
  const hpDamage = Math.max(1, rounded);
  return { hpDamage, glancing: hpDamage === 1 && rounded < 1 };
}

export function buildPlatingDrBreakdown(params: {
  grossDamage: number;
  effectivePlating: number;
  platingMult: number;
  damageReduction: number;
  onHitBonus?: number;
}): DamageMitigationBreakdown {
  const afterPlating = Math.max(
    0,
    params.grossDamage - params.effectivePlating * params.platingMult,
  );
  const platingBlocked = params.grossDamage - afterPlating;
  const afterDr = afterPlating * (1 - params.damageReduction);
  const drBlocked = afterPlating - afterDr;
  const onHit = params.onHitBonus ?? 0;
  const { hpDamage, glancing } = applyDamageFloor(afterDr + onHit);
  return {
    grossDamage: params.grossDamage + onHit,
    platingBlocked,
    drBlocked,
    mitigatedTotal: platingBlocked + drBlocked,
    hpDamage,
    glancing,
  };
}

export function buildSimpleBreakdown(
  grossDamage: number,
  hpDamage: number,
): DamageMitigationBreakdown {
  const mitigatedTotal = Math.max(0, grossDamage - hpDamage);
  return {
    grossDamage,
    platingBlocked: 0,
    drBlocked: mitigatedTotal,
    mitigatedTotal,
    hpDamage,
    glancing: hpDamage === 1 && grossDamage < 1,
  };
}

export function recordMonsterDamagedByPlayer(
  world: World,
  ownerPlayerId: string,
  source: WorldLogActor,
  monster: MonsterEntity,
  hpDamage: number,
  damageType: WorldLogDamageType,
  mitigation?: DamageMitigationBreakdown,
  tags?: string[],
): void {
  markUltimateContributor(world, monster, ownerPlayerId);
  recordWorldLogEvent(
    world,
    {
      kind: 'damage',
      nodeId: monster.hasPosition.nodeId,
      source,
      target: {
        id: monster.isMonster.id,
        name: monster.isMonster.name,
        actorType: 'monster',
      },
      hpDamage,
      absorbed: 0,
      damageType,
      mitigation,
      glancing: mitigation?.glancing,
      tags,
    },
    {
      visibility: 'combat',
      relatedPlayerIds: [ownerPlayerId],
      nodeId: monster.hasPosition.nodeId,
    },
  );
}

export function recordPlayerDamaged(
  world: World,
  player: PlayerEntity,
  source: WorldLogActor,
  hpDamage: number,
  absorbed: number,
  damageType: WorldLogDamageType,
  mitigation?: DamageMitigationBreakdown,
  tags?: string[],
): void {
  recordWorldLogEvent(
    world,
    {
      kind: 'damage',
      nodeId: player.hasPosition.nodeId,
      source,
      target: {
        id: player.isPlayer.id,
        name: player.isPlayer.name,
        actorType: 'player',
      },
      hpDamage,
      absorbed,
      damageType,
      mitigation,
      glancing: mitigation?.glancing,
      tags,
    },
    {
      visibility: 'combat',
      relatedPlayerIds: [player.isPlayer.id],
      nodeId: player.hasPosition.nodeId,
    },
  );
}

export function recordPlayerKillMonster(
  world: World,
  sourceId: string,
  monster: MonsterEntity,
  damage: number,
  rewardInfo: KillRewardInfo | null,
): void {
  const player = world.getPlayerEntity(sourceId);
  const source = player
    ? actorFromPlayer(player)
    : actorFromSourceId(world, sourceId);
  recordWorldLogEvent(
    world,
    {
      kind: 'kill',
      nodeId: monster.hasPosition.nodeId,
      killer: source,
      victim: actorFromMonster(monster),
      damage,
      essenceGained: rewardInfo?.essenceGained ?? 0,
      essenceType: rewardInfo?.essenceType ?? 'green',
      biomeXpGained: rewardInfo?.biomeXpGained ?? 0,
    },
    {
      visibility: 'combat',
      relatedPlayerIds: [sourceId],
      nodeId: monster.hasPosition.nodeId,
    },
  );
}
