/**
 * Minion AI driver — runs once per minion per tick.
 *
 * Each slime:
 *   1. Picks an attack target (closest monster within the player's leash).
 *   2. Moves toward that target up to the leash boundary.
 *   3. If no target is in leash range, returns toward its follow offset.
 *   4. If in attack range and cooldown ready, drives `runPlayerAttack` with
 *      the slime's position as the FX origin (player retains all modifiers).
 */
import {
  distanceSq,
  inAttackRange,
  posHitboxFromEntity,
  type Vec2,
} from '@mmo-idle/shared';

function distance(a: Vec2, b: Vec2): number {
  return Math.sqrt(distanceSq(a, b));
}
import type { World } from '../../../../world/World';
import type { MinionEntity, MonsterEntity, PlayerEntity } from '../../../../ecs/entity';
import { markSliceDirty } from '../../../../ecs/dirtyHelpers';
import { setEntityMotion, stopEntity } from '../../../world/movement';
import { setAttackTarget } from '../../../combat/ai/targeting';
import { runPlayerAttack } from '../../../combat/engine/combat';
import { computeMinionSpeed, getFollowOffset } from './spawn';

// Pixels — how close to the follow offset is "close enough" to idle.
const FOLLOW_HOVER_TOL = 10;
// Pixels — stay this much inside the leash boundary to avoid jitter at the edge.
const LEASH_MARGIN = 4;

/**
 * Leash radius around the player. Pulled from a passive so future T1/T3 paths
 * can shift it without touching the AI body.
 */
export function computeLeashRadius(owner: PlayerEntity): number {
  const mult = owner.usesSkills.passives['summoner.leash-mult'] ?? 2.0;
  return Math.max(40, owner.performsAttack.attackRange * mult);
}

/** Pick the closest in-leash monster. Returns null if none in range. */
function findMinionTarget(
  world: World,
  owner: PlayerEntity,
  leashRadius: number,
): MonsterEntity | null {
  const leashSq = leashRadius * leashRadius;
  let best: MonsterEntity | null = null;
  let bestDistSq = Infinity;
  for (const m of world.monsterEntitiesInNode(owner.hasPosition.nodeId)) {
    const distSq = distanceSq(m.hasPosition.current, owner.hasPosition.current);
    if (distSq > leashSq) continue;
    if (distSq < bestDistSq) {
      bestDistSq = distSq;
      best = m;
    }
  }
  return best;
}

/**
 * Constrain `desired` so it lies within `leashRadius` of `owner.hasPosition`.
 * If `desired` is already in range it's returned unchanged; otherwise we
 * project it back onto the leash boundary (minus a small margin).
 */
function clampToLeash(
  owner: PlayerEntity,
  desired: Vec2,
  leashRadius: number,
): Vec2 {
  const op = owner.hasPosition.current;
  const dx = desired.x - op.x;
  const dy = desired.y - op.y;
  const distSq = dx * dx + dy * dy;
  const max = Math.max(0, leashRadius - LEASH_MARGIN);
  if (distSq <= max * max) return desired;
  const d = Math.sqrt(distSq) || 1;
  return {
    x: op.x + (dx / d) * max,
    y: op.y + (dy / d) * max,
  };
}

function restoreBoarSpeed(world: World, minion: MinionEntity, owner: PlayerEntity): void {
  const base = computeMinionSpeed(owner);
  if (minion.hasPosition.speed !== base) {
    minion.hasPosition.speed = base;
    markSliceDirty(world, minion, 'hasPosition');
  }
}

/** Trampled Path: sprint toward the target while gap-closing charge is active. */
function applyBoarChargeMotion(
  world: World,
  minion: MinionEntity,
  owner: PlayerEntity,
  target: MonsterEntity,
  leashRadius: number,
): void {
  const cm = minion.controlsMinion;
  const passives = owner.usesSkills.passives;
  const base = computeMinionSpeed(owner);
  const speedMult = passives['summoner.trample-charge-speed-mult'] ?? 3.5;
  const chargeSpeed = Math.round(base * speedMult);
  if (minion.hasPosition.speed !== chargeSpeed) {
    minion.hasPosition.speed = chargeSpeed;
    markSliceDirty(world, minion, 'hasPosition');
  }
  const desired = clampToLeash(owner, target.hasPosition.current, leashRadius);
  setEntityMotion(world, minion, desired);
  setAttackTarget(world, minion, target.isMonster.id);
  cm.currentTargetId = target.isMonster.id;
}

export function driveMinion(
  world: World,
  minion: MinionEntity,
  owner: PlayerEntity,
  now: number,
): void {
  const leashRadius = computeLeashRadius(owner);
  const target = findMinionTarget(world, owner, leashRadius);
  const passives = owner.usesSkills.passives;
  const isTrampleBoar =
    passives['summoner.trampled-path'] && minion.isMinion.monsterTypeId === 'boar';
  const cm = minion.controlsMinion;

  if (target) {
    const ph = posHitboxFromEntity(minion);
    const th = posHitboxFromEntity(target);

    if (inAttackRange(ph, th, minion.performsAttack.attackRange)) {
      // In range — stop and attack on cooldown.
      stopEntity(world, minion);
      setAttackTarget(world, minion, target.isMonster.id);
      cm.currentTargetId = target.isMonster.id;

      if (isTrampleBoar && cm.isCharging) {
        cm.isCharging = false;
        restoreBoarSpeed(world, minion, owner);
      }

      if (now - minion.performsAttack.lastAttackAt >= minion.performsAttack.attackCooldown) {
        const attackMetadata: Record<string, unknown> = {};
        if (isTrampleBoar && cm.chargeCooldownMs <= 0) {
          attackMetadata.boarCharge = 1;
          cm.chargeCooldownMs = Math.round(
            passives['summoner.trample-charge-cd-ms'] ?? 10_000,
          );
        }
        const outcome = runPlayerAttack(world, owner, target, now, {
          attackOrigin: minion.hasPosition.current,
          aggroSource:  { id: minion.isMinion.id, kind: 'minion' },
          metadata:     Object.keys(attackMetadata).length > 0 ? attackMetadata : undefined,
        });
        if (outcome !== 'cancelled') {
          minion.performsAttack.lastAttackAt = now;
        }
      }
      return;
    }

    // Out of range — begin or continue a gap-closing charge when off cooldown.
    if (isTrampleBoar && (cm.isCharging || cm.chargeCooldownMs <= 0)) {
      if (!cm.isCharging) cm.isCharging = true;
      applyBoarChargeMotion(world, minion, owner, target, leashRadius);
      return;
    }

    // Normal chase, but only as far as the leash allows.
    const desired = clampToLeash(owner, target.hasPosition.current, leashRadius);
    const distToDesired = distance(minion.hasPosition.current, desired);
    if (distToDesired > FOLLOW_HOVER_TOL) {
      setEntityMotion(world, minion, desired);
    } else {
      stopEntity(world, minion);
    }
    setAttackTarget(world, minion, null);
    cm.currentTargetId = null;
    return;
  }

  if (isTrampleBoar && cm.isCharging) {
    cm.isCharging = false;
    restoreBoarSpeed(world, minion, owner);
  }

  // No in-range target — return to follow offset.
  const off = getFollowOffset(minion.isMinion.slot, owner.summonsMinions?.targetCount ?? 1);
  const idleAt: Vec2 = {
    x: owner.hasPosition.current.x + off.x,
    y: owner.hasPosition.current.y + off.y,
  };
  if (distance(minion.hasPosition.current, idleAt) > FOLLOW_HOVER_TOL) {
    setEntityMotion(world, minion, idleAt);
  } else {
    stopEntity(world, minion);
  }
  setAttackTarget(world, minion, null);
  minion.controlsMinion.currentTargetId = null;
}
