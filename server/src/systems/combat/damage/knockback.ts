import type { World } from '../../../world/World';
import { NODE_REGISTRY } from '../../../world/nodeRegistry';
import {
  navigationBodyHalfExtents,
  type HasKnockback,
  type Vec2,
} from '@mmo-idle/shared';
import type { PlayerEntity } from '../../../ecs/entity';
import { ABILITY_GUARD_EFFECT_IDS, getStatusEffect } from '@mmo-idle/shared';

/**
 * Hard ceiling on forced-movement resistance. Never total immunity: a player who
 * cannot be repositioned at all is immune to every mechanic built on repositioning,
 * which is most of what makes a boss's space control matter.
 */
const PLAYER_FORCED_MOVEMENT_RESIST_CAP = 0.9;
import { stopEntity } from '../../world/movement';
import { resolveObstaclesForNode } from '../../world/nodeFeatures';
import { setAttackTarget } from '../ai/targeting';
import { markSliceDirty } from '../../../ecs/dirtyHelpers';

// Matches MONSTER_MARGIN in movement.ts — keep monsters inside the playable area.
const MONSTER_BOUND_MARGIN = 40;

// Default slide duration when callers don't specify one.
const DEFAULT_KNOCKBACK_DURATION_MS = 300;

export type { HasKnockback } from '@mmo-idle/shared';

/**
 * Apply a sliding knockback to a monster. The monster is pushed from its
 * current position to a point `distance` px directly away from `from`,
 * easing out over `durationMs`.
 *
 * While the component is present:
 *   - The AI system skips this monster (no chase, no retargeting).
 *   - Combat skips this monster's attacks (state is `'knocked-back'`).
 *   - `updateKnockback` is the sole writer of position during the slide.
 *
 * The component clears automatically when the slide finishes or the monster
 * dies / leaves the world.
 */
export function applyKnockback(
  world: World,
  monsterId: string,
  from: Vec2,
  distance: number,
  durationMs: number = DEFAULT_KNOCKBACK_DURATION_MS,
): void {
  const entity = world.getMonsterEntity(monsterId);
  if (!entity) return;
  if (entity.isRooted) return;
  const position = entity.hasPosition;

  const dx = position.current.x - from.x;
  const dy = position.current.y - from.y;
  const distSq = dx * dx + dy * dy;
  if (distSq < 0.0001) return;

  const dist = Math.sqrt(distSq);
  const end: Vec2 = {
    x: position.current.x + (dx / dist) * distance,
    y: position.current.y + (dy / dist) * distance,
  };

  const node = NODE_REGISTRY.get(position.nodeId);
  if (node) {
    end.x = Math.max(MONSTER_BOUND_MARGIN, Math.min(node.width  - MONSTER_BOUND_MARGIN, end.x));
    end.y = Math.max(MONSTER_BOUND_MARGIN, Math.min(node.height - MONSTER_BOUND_MARGIN, end.y));
  }

  world.setMonsterKnockback(monsterId, {
    start: { x: position.current.x, y: position.current.y },
    end,
    elapsedMs: 0,
    durationMs,
  });

  const avgPxPerSec  = (distance / durationMs) * 1000;
  entity.hasPosition.speed = Math.max(100, Math.round(avgPxPerSec * 3));
  entity.hasAwareness.state = 'knocked-back';
  stopEntity(world, entity);
  setAttackTarget(world, entity, null);
}

/**
 * Recoil the shooter a fixed distance directly away from `awayFrom`
 * (the target it just fired at). The player is server-authoritative, so we
 * displace `hasPosition.current` directly and cancel any current move intent;
 * the client glides to the new position (within its reconcile threshold),
 * reading as a recoil. Auto-combat re-approaches on the next tick.
 */
export function applyPlayerKnockback(
  world: World,
  player: PlayerEntity,
  awayFrom: Vec2,
  distance: number,
): Vec2 | null {
  if (player.isRooted) return null;
  const position = player.hasPosition;

  const dx = position.current.x - awayFrom.x;
  const dy = position.current.y - awayFrom.y;
  const dist = Math.hypot(dx, dy);
  // Degenerate (player on top of target): pick an arbitrary fixed direction
  // so the recoil still fires rather than silently no-op.
  const ux = dist < 0.0001 ? 1 : dx / dist;
  const uy = dist < 0.0001 ? 0 : dy / dist;

  const end: Vec2 = {
    x: position.current.x + ux * distance,
    y: position.current.y + uy * distance,
  };

  const node = NODE_REGISTRY.get(position.nodeId);
  if (node) {
    end.x = Math.max(MONSTER_BOUND_MARGIN, Math.min(node.width  - MONSTER_BOUND_MARGIN, end.x));
    end.y = Math.max(MONSTER_BOUND_MARGIN, Math.min(node.height - MONSTER_BOUND_MARGIN, end.y));
  }

  const pad = navigationBodyHalfExtents('player');
  const resolved = resolveObstaclesForNode(
    world,
    position.nodeId,
    position.current,
    end,
    'player',
    pad,
  );

  position.current = resolved;
  markSliceDirty(world, player, 'hasPosition');
  stopEntity(world, player);
  return resolved;
}

/**
 * Reposition the player relative to a point — the primitive behind the Charge /
 * Disengage reposition abilities (abilities evolution §5.3).
 *
 * Reuses `applyPlayerKnockback` wholesale (bounds clamping, obstacle resolution,
 * move-intent cancellation, dirty-slice marking) rather than duplicating it. To
 * move TOWARD a point, we reflect it through the player: pushing "away from" the
 * mirrored point is the same vector as pulling toward the real one.
 */
export function repositionPlayer(
  world: World,
  player: PlayerEntity,
  anchor: Vec2,
  distance: number,
  toward: boolean,
): Vec2 | null {
  if (distance <= 0) return null;
  const from = player.hasPosition.current;
  const awayFrom: Vec2 = toward
    ? { x: 2 * from.x - anchor.x, y: 2 * from.y - anchor.y }
    : anchor;
  return applyPlayerKnockback(world, player, awayFrom, distance);
}

/** True while the monster has an active knockback component. */
export function isMonsterKnockedBack(world: World, monsterId: string): boolean {
  return world.getMonsterKnockback(monsterId) !== undefined;
}

/**
 * Advance every active knockback by `dt` ms. Must run BEFORE `updateMovement`
 * and `updateMonsters` so that the position it writes wins for the tick.
 */
export function updateKnockback(world: World, dt: number): void {
  for (const entity of world.knockbackedMonsters) {
    if (entity.isRooted) {
      stopEntity(world, entity);
      world.clearMonsterKnockback(entity.isMonster.id);
      continue;
    }

    const kb = entity.hasKnockback;

    kb.elapsedMs += dt;
    const t = Math.min(1, kb.elapsedMs / kb.durationMs);
    const ease = 1 - Math.pow(1 - t, 3);

    entity.hasPosition.current = {
      x: kb.start.x + (kb.end.x - kb.start.x) * ease,
      y: kb.start.y + (kb.end.y - kb.start.y) * ease,
    };
    markSliceDirty(world, entity, 'hasPosition');
    stopEntity(world, entity);

    if (t >= 1) {
      entity.hasPosition.current = { x: kb.end.x, y: kb.end.y };
      markSliceDirty(world, entity, 'hasPosition');
      stopEntity(world, entity);
      world.clearMonsterKnockback(entity.isMonster.id);
    }
  }
}

/**
 * How much forced movement the player currently shrugs off, 0..cap.
 *
 * Named for FORCED MOVEMENT rather than knockback because it governs both
 * directions: a stat that helped against being shoved but not against being dragged
 * would be a lie in the item text. Any active Guard slot can carry it, and the BEST
 * is taken rather than the sum — stacking two Guards must never make a player
 * immovable outright, because immunity to a boss's repositioning is immunity to the
 * mechanic it sets up.
 */
export function playerForcedMovementResistPct(player: PlayerEntity): number {
  let best = 0;
  for (const effectId of ABILITY_GUARD_EFFECT_IDS) {
    const guard = getStatusEffect(player.tracksCombat, effectId);
    if (!guard || guard.remainingMs <= 0) continue;
    best = Math.max(best, guard.data['knockbackResistPct'] ?? 0);
  }
  return Math.max(0, Math.min(PLAYER_FORCED_MOVEMENT_RESIST_CAP, best));
}
