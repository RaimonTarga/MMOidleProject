/**
 * Damage resolution for ordered encounter patterns.
 *
 * Exists purely to break an import cycle. `combat.ts` reads pattern state to
 * decide whether ordinary attacks may run, so `bossPatterns.ts` cannot import
 * `combat.ts` back. This module sits below both and is injected at bootstrap.
 *
 * Every pattern hit goes through `runMonsterAttack` — the same path an ordinary
 * swing takes — so the player damage cap, DR, Brace, shields and evasion apply to a
 * charge exactly as they do to anything else. Nothing here bypasses the pipeline.
 */

import { geometryContains, circleGeometry, type Vec2 } from '@mmo-idle/shared';
import type { MinionEntity, MonsterEntity, PlayerEntity } from '../../../ecs/entity';
import type { World } from '../../../world/World';
import { setPatternCombatHooks } from '../ai/bossPatterns';
import {
  beginTelegraphResolutionTelemetry,
  finishTelegraphResolutionTelemetry,
  recordTelegraphResolutionVictim,
} from '../ai/telegraphEvasion';
import { markEngaged } from '../ai/engagement';
import { pullPlayer } from '../damage/forcedMovement';
import { canApplyPlayerDebuff } from '../status/debuffGuard';
import { applyStun } from '../status/stun';
import { harmfulStatusDurationMult } from '../status/harmfulStatus';
import { runMonsterAttack, runMonsterAttackOnMinion } from './combat';
import type { RuntimeSlamTelegraph } from '../../world/groundZones';

export function initBossPatternCombat(): void {
  setPatternCombatHooks({
    hitPlayer(world, monster, player, now, multiplier) {
      const outcome = runMonsterAttack(world, monster, player, now, multiplier);
      if (outcome === 'hit') {
        const refreshed = world.getPlayerEntity(player.isPlayer.id);
        if (refreshed) markEngaged(world, refreshed, now);
      }
    },
    hitMinion(world, monster, minion, now) {
      runMonsterAttackOnMinion(world, monster, minion, now);
    },
    pullPlayer(world, player, anchor, distance) {
      pullPlayer(world, player, anchor, distance);
    },
    resolveCircle(world, monster, at, radius, multiplier, stunMs, now) {
      resolvePatternCircle(world, monster, at, radius, multiplier, stunMs, now);
    },
  });
}

/**
 * Resolve one telegraphed pattern circle at its captured point.
 *
 * Mirrors `resolveChargedSlam`: the Step Back telemetry capture is taken BEFORE
 * any damage lands, so a player's position at the moment of resolution is what
 * decides success or failure — not where they ended up after being knocked around.
 */
function resolvePatternCircle(
  world: World,
  monster: MonsterEntity,
  at: Vec2,
  radius: number,
  multiplier: number,
  stunMs: number | undefined,
  now: number,
): void {
  const nodeId = monster.hasPosition.nodeId;
  const telegraph = (world.groundZones.get(nodeId) ?? []).find(
    (zone): zone is RuntimeSlamTelegraph =>
      zone.kind === 'slam-telegraph' && zone.ownerId === monster.isMonster.id,
  );
  const capture = telegraph
    ? beginTelegraphResolutionTelemetry(world, nodeId, telegraph, now)
    : null;

  const geometry = circleGeometry(at, radius);
  const victims: PlayerEntity[] = [];
  for (const player of world.collision.bodiesInCircle(
    world.livePlayersInNode(nodeId),
    at,
    radius,
  )) {
    if (!geometryContains(geometry, player.hasPosition.current)) continue;
    victims.push(player);
  }

  for (const victim of victims) {
    // Re-checked for liveness: an earlier victim's death can drain the node.
    if (!world.getPlayerEntity(victim.isPlayer.id)) continue;
    const outcome = runMonsterAttack(world, monster, victim, now, multiplier);
    if (capture) recordTelegraphResolutionVictim(world, capture, victim.isPlayer.id);
    if (outcome === 'hit') {
      if (stunMs && canApplyPlayerDebuff(victim)) {
        applyStun(
          victim.tracksCombat,
          stunMs,
          monster.isMonster.id,
          harmfulStatusDurationMult(victim),
        );
      }
      const refreshed = world.getPlayerEntity(victim.isPlayer.id);
      if (refreshed) markEngaged(world, refreshed, now);
    }
    if (!world.hasMonster(monster.isMonster.id)) {
      if (capture) finishTelegraphResolutionTelemetry(world, capture);
      return; // reflected to death
    }
  }
  if (capture) finishTelegraphResolutionTelemetry(world, capture);

  const minions: MinionEntity[] = [];
  for (const minion of world.collision.bodiesInCircle(
    world.minionEntitiesInNode(nodeId),
    at,
    radius,
  )) {
    if (!geometryContains(geometry, minion.hasPosition.current)) continue;
    minions.push(minion);
  }
  for (const minion of minions) runMonsterAttackOnMinion(world, monster, minion, now);

  // The circle ALWAYS erupts, hit or miss: a telegraph that resolves silently on
  // empty ground reads as a bug, and the eruption is what teaches that moving was
  // the answer. Anchored to the captured point, never the caster.
  world.pushEvent(nodeId, {
    kind: 'boss-fx',
    monsterId: monster.isMonster.id,
    pos: { ...at },
    fx: 'slam',
    radius,
  });
}
