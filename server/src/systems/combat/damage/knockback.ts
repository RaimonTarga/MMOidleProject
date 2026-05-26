import type { World } from '../../../world/World';
import { NODE_REGISTRY } from '../../../world/nodeRegistry';
import type { HasKnockback, Vec2 } from '@mmo-idle/shared';
import { stopEntity } from '../../world/movement';
import { setAttackTarget } from '../ai/targeting';

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

    entity.hasPosition.current = {
      x: kb.start.x + (kb.end.x - kb.start.x) * ease,
      y: kb.start.y + (kb.end.y - kb.start.y) * ease,
    };
    stopEntity(world, entity);

    if (t >= 1) {
      entity.hasPosition.current = { x: kb.end.x, y: kb.end.y };
      stopEntity(world, entity);
      world.clearMonsterKnockback(entity.isMonster.id);
    }
  }
}
