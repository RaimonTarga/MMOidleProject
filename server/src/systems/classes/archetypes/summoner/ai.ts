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
import { runFormationAttack } from './formationAttack';
import { computeMinionSpeed, despawnMinion, getFollowOffset } from './spawn';
import {
  resolveCommandedFocusTarget,
  resolveCommandedMoveDestination,
} from './command';
import { summonerProfileFor } from './profile';

// Pixels — how close to the follow offset is "close enough" to idle.
const FOLLOW_HOVER_TOL = 10;
// Pixels — stay this much inside the leash boundary to avoid jitter at the edge.
const LEASH_MARGIN = 4;

/**
 * Leash radius around the player. Pulled from a passive so future T1/T3 paths
 * can shift it without touching the AI body.
 */
export function computeLeashRadius(owner: PlayerEntity): number {
  return summonerProfileFor(owner).leashRadius;
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
    if (m.hasHealth.hp <= 0) continue;
    const distSq = distanceSq(m.hasPosition.current, owner.hasPosition.current);
    if (distSq > leashSq) continue;
    if (distSq < bestDistSq) {
      bestDistSq = distSq;
      best = m;
    }
  }
  return best;
}

function countMinionsTargetingMonster(
  world: World,
  ownerId: string,
  monsterId: string,
  excludeMinionId?: string,
): number {
  let count = 0;
  for (const m of world.minionEntities) {
    if (m.isMinion.ownerPlayerId !== ownerId) continue;
    if (excludeMinionId && m.isMinion.id === excludeMinionId) continue;
    if (m.hasHealth.hp <= 0) continue;
    if (m.controlsMinion.currentTargetId === monsterId) count++;
  }
  return count;
}

/**
 * Swarm: prefer in-leash monsters with the fewest minions already assigned,
 * breaking ties by distance to this minion. Sticky while the target stays valid.
 */
function findSwarmMinionTarget(
  world: World,
  owner: PlayerEntity,
  minion: MinionEntity,
  leashRadius: number,
): MonsterEntity | null {
  const leashSq = leashRadius * leashRadius;
  const ownerPos = owner.hasPosition.current;
  const minionPos = minion.hasPosition.current;
  const nodeId = owner.hasPosition.nodeId;
  const candidates: MonsterEntity[] = [];

  for (const m of world.monsterEntitiesInNode(nodeId)) {
    if (m.hasHealth.hp <= 0) continue;
    if (distanceSq(m.hasPosition.current, ownerPos) > leashSq) continue;
    candidates.push(m);
  }
  if (candidates.length === 0) return null;

  const currentId = minion.controlsMinion.currentTargetId;
  if (currentId) {
    const current = candidates.find((c) => c.isMonster.id === currentId);
    if (current) return current;
  }

  let best: MonsterEntity | null = null;
  let bestCount = Infinity;
  let bestDistSq = Infinity;
  for (const m of candidates) {
    const count = countMinionsTargetingMonster(
      world,
      owner.isPlayer.id,
      m.isMonster.id,
      minion.isMinion.id,
    );
    const distSq = distanceSq(m.hasPosition.current, minionPos);
    if (count < bestCount || (count === bestCount && distSq < bestDistSq)) {
      bestCount = count;
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

export function driveMinion(
  world: World,
  minion: MinionEntity,
  owner: PlayerEntity,
  now: number,
): void {
  const leashRadius = computeLeashRadius(owner);
  const profile = summonerProfileFor(owner);
  const isSwarm = profile.specialization === 'endless-swarm';
  const focusOverride = resolveCommandedFocusTarget(world, owner);
  const moveDest = resolveCommandedMoveDestination(owner, leashRadius);
  const cm = minion.controlsMinion;

  if (moveDest) {
    const distToDest = distance(minion.hasPosition.current, moveDest);
    if (distToDest > FOLLOW_HOVER_TOL) {
      setEntityMotion(world, minion, moveDest);
    } else {
      stopEntity(world, minion);
    }
    setAttackTarget(world, minion, null);
    cm.currentTargetId = null;
    return;
  }

  const target = focusOverride ?? (isSwarm
    ? findSwarmMinionTarget(world, owner, minion, leashRadius)
    : findMinionTarget(world, owner, leashRadius));
  const stickyTarget = isSwarm || !!focusOverride;

  if (target) {
    if (stickyTarget) {
      setAttackTarget(world, minion, target.isMonster.id);
      cm.currentTargetId = target.isMonster.id;
    }

    if (world.collision.canReach(minion, target, minion.performsAttack.attackRange)) {
      // Harriers keep moving away when crowded; guardian/escort formations hold.
      const targetDistance = distance(minion.hasPosition.current, target.hasPosition.current);
      if (profile.formationPolicy === 'harrier'
        && targetDistance < profile.preferredDistance * 0.65) {
        const dx = minion.hasPosition.current.x - target.hasPosition.current.x;
        const dy = minion.hasPosition.current.y - target.hasPosition.current.y;
        const length = Math.sqrt(dx * dx + dy * dy) || 1;
        const retreat = profile.preferredDistance - targetDistance;
        setEntityMotion(world, minion, clampToLeash(owner, {
          x: minion.hasPosition.current.x + (dx / length) * retreat,
          y: minion.hasPosition.current.y + (dy / length) * retreat,
        }, leashRadius));
      } else {
        stopEntity(world, minion);
      }
      if (!stickyTarget) {
        setAttackTarget(world, minion, target.isMonster.id);
        cm.currentTargetId = target.isMonster.id;
      }

      if (now - minion.performsAttack.lastAttackAt >= minion.performsAttack.attackCooldown) {
        const outcome = runFormationAttack(world, owner, minion, target, now);
        if (outcome !== 'cancelled') {
          minion.performsAttack.lastAttackAt = now;
        }
      }
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
    if (!stickyTarget) {
      setAttackTarget(world, minion, null);
      cm.currentTargetId = null;
    }
    return;
  }

  // No in-range target — return to follow offset around the owner.
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
