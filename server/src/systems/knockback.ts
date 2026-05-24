import type { World } from '../world/World';
import { NODE_REGISTRY } from '../world/nodeRegistry';

// Matches MONSTER_MARGIN in movement.ts — keep monsters inside the playable area.
const MONSTER_BOUND_MARGIN = 40;

// Default slide duration when callers don't specify one.
const DEFAULT_KNOCKBACK_DURATION_MS = 300;

/**
 * Component data tracking an in-flight knockback slide for a single monster.
 *
 * Stored in `World.monsterKnockback` keyed by monster id. The presence of an
 * entry "registers" the monster as currently being knocked back; absence means
 * the monster is behaving normally. The `updateKnockback` system advances the
 * tween each tick and removes the entry when complete.
 */
export interface KnockbackComponent {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  elapsedMs: number;
  durationMs: number;
}

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
  const monster = world.monsters.get(monsterId);
  if (!monster) return;

  const dx = monster.x - fromX;
  const dy = monster.y - fromY;
  const distSq = dx * dx + dy * dy;
  if (distSq < 0.0001) return;

  const dist = Math.sqrt(distSq);
  let endX = monster.x + (dx / dist) * distance;
  let endY = monster.y + (dy / dist) * distance;

  const node = NODE_REGISTRY.get(monster.nodeId);
  if (node) {
    endX = Math.max(MONSTER_BOUND_MARGIN, Math.min(node.width  - MONSTER_BOUND_MARGIN, endX));
    endY = Math.max(MONSTER_BOUND_MARGIN, Math.min(node.height - MONSTER_BOUND_MARGIN, endY));
  }

  world.monsterKnockback.set(monsterId, {
    startX:    monster.x,
    startY:    monster.y,
    endX,
    endY,
    elapsedMs: 0,
    durationMs,
  });

  // Peak velocity of a cubic ease-out is ~3× the average. Pad the client-visible
  // speed so its baseX → targetX interpolation can keep pace with the eased
  // slide we write to `monster.x` each tick (otherwise the client visibly lags).
  const avgPxPerSec  = (distance / durationMs) * 1000;
  monster.speed      = Math.max(100, Math.round(avgPxPerSec * 3));
  monster.state      = 'knocked-back';
  monster.targetX    = monster.x;
  monster.targetY    = monster.y;
  monster.attackTargetId = null;
}

/** True while the monster has an active knockback component. */
export function isMonsterKnockedBack(world: World, monsterId: string): boolean {
  return world.monsterKnockback.has(monsterId);
}

/**
 * Advance every active knockback by `dt` ms. Must run BEFORE `updateMovement`
 * and `updateMonsters` so that the position it writes wins for the tick.
 *
 * Stale entries (monster died / despawned) are cleaned up lazily here, so
 * monster-removal sites don't have to know about this system.
 */
export function updateKnockback(world: World, dt: number): void {
  for (const [monsterId, kb] of world.monsterKnockback) {
    const monster = world.monsters.get(monsterId);
    if (!monster) {
      world.monsterKnockback.delete(monsterId);
      continue;
    }

    kb.elapsedMs += dt;
    const t = Math.min(1, kb.elapsedMs / kb.durationMs);
    // Cubic ease-out: fast initial slide, gentle settle.
    const ease = 1 - Math.pow(1 - t, 3);

    const newX = kb.startX + (kb.endX - kb.startX) * ease;
    const newY = kb.startY + (kb.endY - kb.startY) * ease;
    monster.x       = newX;
    monster.y       = newY;
    monster.targetX = newX;
    monster.targetY = newY;

    if (t >= 1) {
      monster.x       = kb.endX;
      monster.y       = kb.endY;
      monster.targetX = kb.endX;
      monster.targetY = kb.endY;
      world.monsterKnockback.delete(monsterId);
    }
  }
}
