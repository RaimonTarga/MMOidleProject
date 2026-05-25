import type { World } from '../world/World';
import { NODE_REGISTRY } from '../world/nodeRegistry';
import type { HasKnockback } from '@mmo-idle/shared';
import { stopEntity } from './movement';
import { setAttackTarget } from './targeting';

// Matches MONSTER_MARGIN in movement.ts — keep monsters inside the playable area.
const MONSTER_BOUND_MARGIN = 40;

// Default slide duration when callers don't specify one.
const DEFAULT_KNOCKBACK_DURATION_MS = 300;

export type { HasKnockback, KnockbackComponent } from '@mmo-idle/shared';

/**
 * Apply a sliding knockback to a monster. The monster is pushed from its
 * current position to a point `distance` px directly away from
 * `(fromX, fromY)`, easing out over `durationMs`.
 *
 * While the component is present:
 *   - The AI system skips this monster (no chase, no retargeting).
 *   - Combat skips this monster's attacks (state is `'knocked-back'`).
 *   - `updateKnockback` is the sole writer of `x`, `y`, `targetX`, `targetY`.
 *
 * The component clears automatically when the slide finishes or the monster
 * dies / leaves the world.
 */
export function applyKnockback(
  world: World,
  monsterId: string,
  fromX: number,
  fromY: number,
  distance: number,
  durationMs: number = DEFAULT_KNOCKBACK_DURATION_MS,
): void {
  const entity = world.getMonsterEntity(monsterId);
  if (!entity) return;
  const position = entity.hasPosition;

  const dx = position.current.x - fromX;
  const dy = position.current.y - fromY;
  const distSq = dx * dx + dy * dy;
  if (distSq < 0.0001) return;

  const dist = Math.sqrt(distSq);
  let endX = position.current.x + (dx / dist) * distance;
  let endY = position.current.y + (dy / dist) * distance;

  const node = NODE_REGISTRY.get(position.nodeId);
  if (node) {
    endX = Math.max(MONSTER_BOUND_MARGIN, Math.min(node.width  - MONSTER_BOUND_MARGIN, endX));
    endY = Math.max(MONSTER_BOUND_MARGIN, Math.min(node.height - MONSTER_BOUND_MARGIN, endY));
  }

  world.setMonsterKnockback(monsterId, {
    startX:    position.current.x,
    startY:    position.current.y,
    endX,
    endY,
    elapsedMs: 0,
    durationMs,
  });

  const avgPxPerSec  = (distance / durationMs) * 1000;
  entity.hasPosition.speed = Math.max(100, Math.round(avgPxPerSec * 3));
  entity.hasAwareness.state = 'knocked-back';
  stopEntity(world, entity);
  setAttackTarget(world, entity, null);
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
    const kb = entity.hasKnockback;

    kb.elapsedMs += dt;
    const t = Math.min(1, kb.elapsedMs / kb.durationMs);
    const ease = 1 - Math.pow(1 - t, 3);

    const newX = kb.startX + (kb.endX - kb.startX) * ease;
    const newY = kb.startY + (kb.endY - kb.startY) * ease;
    entity.hasPosition.current = { x: newX, y: newY };
    stopEntity(world, entity);

    if (t >= 1) {
      entity.hasPosition.current = { x: kb.endX, y: kb.endY };
      stopEntity(world, entity);
      world.clearMonsterKnockback(entity.isMonster.id);
    }
  }
}
