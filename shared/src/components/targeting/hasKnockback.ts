/**
 * In-flight knockback slide for a single monster.
 * Presence of this component means the monster is currently being knocked back.
 */
import type { Vec2 } from '../../systems/spatial';

export interface HasKnockback {
  start: Vec2;
  end: Vec2;
  elapsedMs: number;
  durationMs: number;
}
