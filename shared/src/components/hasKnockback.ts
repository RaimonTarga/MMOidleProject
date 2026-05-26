/**
 * In-flight knockback slide for a single monster.
 * Presence of this component means the monster is currently being knocked back.
 */
export interface HasKnockback {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  elapsedMs: number;
  durationMs: number;
}

