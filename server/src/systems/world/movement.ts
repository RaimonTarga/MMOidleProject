import {
  LAIR_DRAG_ROOT_EFFECT_ID,
  advanceMotion,
  buildNavGrid,
  cellToWorld,
  depenetrateToWalkable,
  distanceSq,
  getFlag,
  getStatusEffect,
  moverOverlapsBlockShapes,
  navigationBodyHalfExtents,
  nearestWalkableCell,
  FROST_RAMP_EFFECT_ID,
  frostRampMoveSlowPct,
  ambientRampMoveMult,
  ambientRampStatus,
  playerMoveSpeedMult,
  movePlayerWithCollisions,
  clampPlayerStepToNode,
  advancePlayerPath,
  slideMoveAgainstBlocks,
  type FeatureTarget,
  type Vec2,
} from '@mmo-idle/shared';
import { isMonsterStunned } from '../combat/status/stun';
import type { World } from '../../world/World';
import { NODE_REGISTRY } from '../../world/nodeRegistry';
import type { PlayerEntity, ServerEntity } from '../../ecs/entity';
import { detachComponent } from '../../ecs/markerHelpers';
import { markSliceDirty } from '../../ecs/dirtyHelpers';
import { resolveObstaclesForNode } from './nodeFeatures';
import { bootSpeedMultiplier, slowResistedMult } from './mobility/mobilityBoots';
import {
  advanceMovePath,
  clearMovePath,
  inferMoverTarget,
  replanIfBlocked,
  requestNavMotion,
  refreshMovePathMotion,
  suppressedFeatureIdsForEntity,
} from './pathMotion';

// Monsters stay this many pixels from the node edge at all times.
const MONSTER_MARGIN = 40;
const PROGRESS_EPS_SQ = 1;
const STUCK_REPLAN_MS = 800;
const STUCK_RECOVER_MS = 1_800;

interface StuckState {
  blockedMs: number;
  replanned: boolean;
}

const stuckByEntity = new Map<string, StuckState>();

interface PathStuckState {
  blockedMs: number;
  replanned: boolean;
}

// Entity identity keeps recovery state isolated between Worlds even when two
// test worlds reuse the same socket/entity id.
const pathStuckByEntity = new WeakMap<ServerEntity, PathStuckState>();

type MovableEntity = ServerEntity & {
  hasPosition: NonNullable<ServerEntity['hasPosition']>;
};

export interface SetEntityMotionOptions {
  mover?: FeatureTarget;
  mode?: 'path' | 'direct';
  avoidHazards?: boolean;
}

/** Validate and normalize a direct-input heading at the authority boundary. */
export function normalizedMoveDirection(direction: Vec2 | undefined): Vec2 | null {
  if (
    !direction ||
    !Number.isFinite(direction.x) ||
    !Number.isFinite(direction.y)
  ) return null;
  const magnitude = Math.hypot(direction.x, direction.y);
  if (!(magnitude > 0) || !Number.isFinite(magnitude)) return null;
  return { x: direction.x / magnitude, y: direction.y / magnitude };
}

export function directMoveTarget(
  from: Vec2,
  compatibilityTarget: Vec2,
  direction?: Vec2,
): Vec2 {
  const normalized = normalizedMoveDirection(direction);
  return normalized
    ? { x: from.x + normalized.x * 600, y: from.y + normalized.y * 600 }
    : compatibilityTarget;
}

export function setEntityMotion(
  world: World,
  entity: MovableEntity,
  target: Vec2,
  opts?: SetEntityMotionOptions,
): void {
  if (entity.isRooted) {
    stopEntity(world, entity);
    return;
  }

  const avoidHazards =
    opts?.avoidHazards ??
    (entity.isPlayer !== undefined && entity.tracksCombat !== undefined
      ? getFlag(entity.tracksCombat, 'rune.avoidNodeHazards')
      : false);

  requestNavMotion(world, entity, target, navigationPadForEntity(entity), {
    ...opts,
    avoidHazards,
  });
}

export function stopEntity(world: World, entity: ServerEntity): void {
  clearMovePath(world, entity);
  detachComponent(world, entity, 'isMoving');
  detachComponent(world, entity, 'hasManualMoveIntent');
  pathStuckByEntity.delete(entity);
  stuckByEntity.delete(entity.entityId);
}

/** Mover half-extents so obstacle collision keeps the body — not just the center
 *  point — clear of block shapes (prevents bounding-box intersection). */
export function navigationPadForEntity(entity: ServerEntity): Vec2 {
  if (entity.isPlayer) return navigationBodyHalfExtents('player');
  if (entity.isMinion) return navigationBodyHalfExtents('minion');
  return navigationBodyHalfExtents('monster', entity.isMonster?.isBoss === true);
}

function blockShapesFor(
  world: World,
  entity: MovableEntity,
  mover: FeatureTarget,
): ReturnType<World['collision']['blockShapes']> {
  const suppressed = suppressedFeatureIdsForEntity(world, entity);
  if (suppressed.size === 0) return world.collision.blockShapes(entity.hasPosition.nodeId, mover);
  return world.collision
    .staticRegions(entity.hasPosition.nodeId)
    .filter(region => {
      if (region.kind !== 'block' || region.data?.blockTarget !== mover) return false;
      const id = region.data?.featureId;
      return typeof id !== 'string' || !suppressed.has(id);
    })
    .map(region => region.shape);
}

function pathRemainingDistance(pos: Vec2, waypoints: Vec2[]): number {
  if (waypoints.length === 0) return 0;
  let total = Math.hypot(pos.x - waypoints[0].x, pos.y - waypoints[0].y);
  for (let i = 1; i < waypoints.length; i++) {
    total += Math.hypot(
      waypoints[i - 1].x - waypoints[i].x,
      waypoints[i - 1].y - waypoints[i].y,
    );
  }
  return total;
}

function processManualDirectStep(
  world: World,
  entity: MovableEntity,
  dt: number,
  speedMult: number,
): void {
  if (!entity.isMoving) return;
  const from = entity.hasPosition.current;
  const pad = navigationPadForEntity(entity);
  const next = advanceMotion(
    from,
    entity.isMoving.motion,
    entity.hasPosition.speed * speedMult * (dt / 1000),
  );
  const node = NODE_REGISTRY.get(entity.hasPosition.nodeId);
  const bounded = node ? clampPlayerStepToNode(next.position, node.width, node.height) : next.position;
  const resolved = movePlayerWithCollisions(
    from,
    bounded,
    blockShapesFor(world, entity, 'player'),
    pad,
  );
  entity.hasPosition.current = resolved;
  markSliceDirty(world, entity, 'hasPosition');

  // Consume the requested budget even when the wall prevented displacement.
  // This bounds a stale held intent, while the marker remains attached so a
  // refreshed/changed input can immediately move away from the contact.
  if (next.motion.magnitude > 0) {
    entity.isMoving.motion = next.motion;
    markSliceDirty(world, entity, 'isMoving');
  } else {
    stopEntity(world, entity);
  }
}

function processPlannedPathStep(
  world: World,
  entity: MovableEntity,
  dt: number,
  speedMult: number,
  mover: FeatureTarget,
  now: number,
): void {
  const path = entity.hasMovePath;
  if (!path) {
    stopEntity(world, entity);
    return;
  }

  const from = entity.hasPosition.current;
  const beforeRemaining = pathRemainingDistance(from, path.waypoints);
  const budget = entity.hasPosition.speed * speedMult * (dt / 1000);
  const result = advancePlayerPath(
    from,
    path.waypoints,
    budget,
    blockShapesFor(world, entity, mover),
    navigationPadForEntity(entity),
  );
  const afterRemaining = pathRemainingDistance(result.position, result.waypoints);
  const forwardProgress = beforeRemaining - afterRemaining;
  entity.hasPosition.current = result.position;
  markSliceDirty(world, entity, 'hasPosition');

  path.waypoints = result.waypoints;
  if (path.waypoints.length === 0) {
    stopEntity(world, entity);
    return;
  }
  refreshMovePathMotion(world, entity);

  const state = pathStuckByEntity.get(entity) ?? { blockedMs: 0, replanned: false };
  if (forwardProgress > PROGRESS_EPS_SQ || !result.blocked) {
    pathStuckByEntity.delete(entity);
    return;
  }

  state.blockedMs += dt;
  if (!state.replanned && state.blockedMs >= STUCK_REPLAN_MS) {
    state.replanned = true;
    pathStuckByEntity.set(entity, state);
    replanIfBlocked(world, entity, navigationPadForEntity(entity), now, true);
    refreshMovePathMotion(world, entity);
    if (!entity.hasMovePath || !entity.isMoving) stopEntity(world, entity);
    return;
  }
  if (state.blockedMs >= STUCK_RECOVER_MS) {
    stopEntity(world, entity);
    return;
  }
  pathStuckByEntity.set(entity, state);
}

function depenetrateIfWedged(
  world: World,
  entity: MovableEntity,
  mover: FeatureTarget,
): void {
  const pad = navigationPadForEntity(entity);
  const nodeId = entity.hasPosition.nodeId;
  const suppressed = suppressedFeatureIdsForEntity(world, entity);
  const shapes = suppressed.size > 0
    ? world.collision
        .staticRegions(nodeId)
        .filter(region =>
          region.kind === 'block' &&
          region.data?.blockTarget === mover &&
          (typeof region.data?.featureId !== 'string' ||
            !suppressed.has(region.data.featureId)))
        .map(region => region.shape)
    : world.collision.blockShapes(nodeId, mover);
  const from = entity.hasPosition.current;
  if (entity.controlsMonster && moverOverlapsBlockShapes(entity.controlsMonster.spawn, shapes, pad)) {
    const freedSpawn = depenetrateToWalkable(
      nodeId,
      mover,
      pad,
      entity.controlsMonster.spawn,
      suppressed,
    );
    if (freedSpawn) {
      entity.controlsMonster.spawn = freedSpawn;
    }
  }

  if (!moverOverlapsBlockShapes(from, shapes, pad)) return;

  const freed = depenetrateToWalkable(nodeId, mover, pad, from, suppressed);
  if (!freed) return;

  entity.hasPosition.current = freed;
  markSliceDirty(world, entity, 'hasPosition');
}

function recoverStuckEntity(
  world: World,
  entity: MovableEntity,
  mover: FeatureTarget,
  pad: Vec2,
): boolean {
  const path = entity.hasMovePath;
  const goal = path?.goal;
  const avoidHazards = path?.avoidHazards === true;
  const suppressed = suppressedFeatureIdsForEntity(world, entity);
  const grid = buildNavGrid(
    entity.hasPosition.nodeId,
    mover,
    pad,
    suppressed,
    avoidHazards,
  );
  const cell = nearestWalkableCell(grid, entity.hasPosition.current, 24);
  if (!cell) return false;

  const safe = cellToWorld(grid, cell.col, cell.row);
  if (moverOverlapsBlockShapes(safe, grid.shapes, grid.pad)) return false;

  entity.hasPosition.current = safe;
  markSliceDirty(world, entity, 'hasPosition');
  if (goal) {
    requestNavMotion(world, entity, goal, pad, { mover, avoidHazards });
  } else {
    stopEntity(world, entity);
  }
  return true;
}

function handleBlockedMover(
  world: World,
  entity: MovableEntity,
  mover: FeatureTarget,
  pad: Vec2,
  dt: number,
  now: number,
): void {
  const state = stuckByEntity.get(entity.entityId) ?? {
    blockedMs: 0,
    replanned: false,
  };
  state.blockedMs += dt;

  if (!state.replanned && state.blockedMs >= STUCK_REPLAN_MS) {
    state.replanned = true;
    if (replanIfBlocked(world, entity, pad, now, true)) {
      stuckByEntity.set(entity.entityId, state);
      return;
    }
  }

  if (state.blockedMs >= STUCK_RECOVER_MS) {
    recoverStuckEntity(world, entity, mover, pad);
    stuckByEntity.delete(entity.entityId);
    return;
  }

  stuckByEntity.set(entity.entityId, state);
  // Preserve hasMovePath so the watchdog can replan the same goal on the next
  // autonomous steering tick. Clearing it here turns a temporary corner catch
  // into repeated fresh direct motions with no recovery context.
  detachComponent(world, entity, 'isMoving');
  detachComponent(world, entity, 'hasManualMoveIntent');
}

function processMoverStep(
  world: World,
  entity: MovableEntity,
  dt: number,
  speedMult: number,
  mover: FeatureTarget,
  now: number,
): void {
  if (entity.isPlayer && (entity.hasManualMoveIntent || entity.hasMovePath)) {
    if (entity.hasMovePath) {
      processPlannedPathStep(world, entity, dt, speedMult, mover, now);
    } else {
      processManualDirectStep(world, entity, dt, speedMult);
    }
    return;
  }

  // Boss travel must retain unused distance at corners, just like player paths.
  if (entity.runsBossPattern && entity.hasMovePath) {
    processPlannedPathStep(world, entity, dt, speedMult, mover, now);
    return;
  }

  advanceMovePath(world, entity);

  if (!entity.isMoving) return;

  const from = entity.hasPosition.current;
  const pad = navigationPadForEntity(entity);
  const next = advanceMotion(
    from,
    entity.isMoving.motion,
    entity.hasPosition.speed * speedMult * (dt / 1000),
  );
  let resolved = resolveObstaclesForNode(
    world,
    entity.hasPosition.nodeId,
    from,
    next.position,
    mover,
    pad,
    suppressedFeatureIdsForEntity(world, entity),
  );
  const intendedBlocked = resolved !== next.position;

  if (intendedBlocked && distanceSq(from, resolved) < PROGRESS_EPS_SQ) {
    const suppressed = suppressedFeatureIdsForEntity(world, entity);
    const shapes = suppressed.size > 0
      ? world.collision
          .staticRegions(entity.hasPosition.nodeId)
          .filter(region =>
            region.kind === 'block' &&
            region.data?.blockTarget === mover &&
            (typeof region.data?.featureId !== 'string' ||
              !suppressed.has(region.data.featureId)))
          .map(region => region.shape)
      : world.collision.blockShapes(entity.hasPosition.nodeId, mover);
    const slid = slideMoveAgainstBlocks(from, next.position, shapes, pad);
    if (distanceSq(from, slid) >= PROGRESS_EPS_SQ) {
      resolved = slid;
    }
  }

  const madeProgress = distanceSq(from, resolved) >= PROGRESS_EPS_SQ;
  entity.hasPosition.current = resolved;
  markSliceDirty(world, entity, 'hasPosition');
  if (intendedBlocked && !madeProgress) {
    handleBlockedMover(world, entity, mover, pad, dt, now);
    return;
  }

  if (madeProgress) stuckByEntity.delete(entity.entityId);

  if (next.motion.magnitude > 0) {
    entity.isMoving.motion = next.motion;
    markSliceDirty(world, entity, 'isMoving');
  } else {
    stopEntity(world, entity);
  }
}

/**
 * Every move-speed multiplier acting on `player`, for `playerMoveSpeedMult` to
 * collapse. Distinct effect ids MULTIPLY, so this list is the whole reason the
 * clamp exists — a hazard slow, a frost ramp and an ambient chill can all be live
 * at once and each reads as "slowed a bit" on its own.
 *
 * The clamp is only applied to the slows; `bootSpeedMultiplier` is always >= 1 and
 * lands on top of the floor, so mobility boots still help a player being slowed by
 * everything at once.
 */
function playerSpeedMults(
  world: World,
  player: PlayerEntity,
  now: number,
): number[] {
  const cs = player.tracksCombat;
  const mults: number[] = [];

  // Every soft slow is piped through `slowResistedMult`, so Swamp's Slow
  // Resistance softens the whole family with one rule instead of each source
  // having to remember the stat. Roots pass through it untouched — a root is
  // hard control, and only tenacity/control resistance speaks to those.

  // Shared 'slow' id — monster slowEffects, hazard/ground-zone pools, dungeon
  // hazards. speedMult 0 is a ROOT and short-circuits the whole product.
  const slow = getStatusEffect(cs, 'slow');
  if (getStatusEffect(cs, LAIR_DRAG_ROOT_EFFECT_ID)) mults.push(0);
  if (slow) mults.push(slowResistedMult(player, Math.max(0, slow.data['speedMult'] ?? 1)));

  // Tundra rampDebuff — stacking, self-capped.
  const frostRamp = getStatusEffect(cs, FROST_RAMP_EFFECT_ID);
  if (frostRamp) mults.push(slowResistedMult(player, 1 - frostRampMoveSlowPct(frostRamp)));

  // P4 ambient node ramp, when its payload carries a move slow (Tundra chill).
  const ambient = ambientRampStatus(cs);
  if (ambient) mults.push(slowResistedMult(player, ambientRampMoveMult(ambient)));

  // An ability charge is a temporary speed layer, not a mutation of the player's
  // normal position speed. This lets stat recalculation and ordinary movement
  // resume cleanly once the charge component detaches.
  if (player.isChargingAbility) mults.push(Math.max(0, player.isChargingAbility.speedMult));

  mults.push(bootSpeedMultiplier(world, player, now));
  return mults;
}

export function updateMovement(world: World, dt: number, now: number) {
  for (const entity of world.livePlayers) {
    depenetrateIfWedged(world, entity, 'player');
  }
  for (const entity of world.minionEntities) {
    if (entity.hasHealth.hp <= 0) continue;
    depenetrateIfWedged(world, entity, inferMoverTarget(entity));
  }
  for (const entity of world.monsterEntities) {
    if (entity.hasHealth.hp <= 0) continue;
    depenetrateIfWedged(world, entity, 'monster');
  }

  for (const entity of world.movingPlayers) {
    if (entity.isRooted || entity.isChanneling) {
      stopEntity(world, entity);
      continue;
    }

    processMoverStep(
      world,
      entity,
      dt,
      playerMoveSpeedMult(playerSpeedMults(world, entity, now)),
      'player',
      now,
    );
  }

  for (const e of world.movingMonsters) {
    if (e.isRooted || isMonsterStunned(world, e.isMonster.id)) {
      stopEntity(world, e);
      continue;
    }

    processMoverStep(world, e, dt, e.hasStatus.monsterMoveSpeedMult ?? 1, 'monster', now);

    const node = NODE_REGISTRY.get(e.hasPosition.nodeId);
    if (node) {
      e.hasPosition.current.x = Math.max(
        MONSTER_MARGIN,
        Math.min(node.width - MONSTER_MARGIN, e.hasPosition.current.x),
      );
      e.hasPosition.current.y = Math.max(
        MONSTER_MARGIN,
        Math.min(node.height - MONSTER_MARGIN, e.hasPosition.current.y),
      );
    }
  }

  for (const e of world.movingMinions) {
    if (e.isRooted) {
      stopEntity(world, e);
      continue;
    }

    processMoverStep(world, e, dt, e.isChargingAbility?.speedMult ?? 1, 'monster', now);

    const node = NODE_REGISTRY.get(e.hasPosition.nodeId);
    if (node) {
      e.hasPosition.current.x = Math.max(
        MONSTER_MARGIN,
        Math.min(node.width - MONSTER_MARGIN, e.hasPosition.current.x),
      );
      e.hasPosition.current.y = Math.max(
        MONSTER_MARGIN,
        Math.min(node.height - MONSTER_MARGIN, e.hasPosition.current.y),
      );
    }
  }
}
