import type { Vec2 } from '@mmo-idle/shared';

/**
 * Server-only per-minion AI slice. Mirrors `ControlsMonster` in purpose:
 * carries the bookkeeping the minion AI needs each tick. Never networked.
 */
export interface ControlsMinion {
  ownerPlayerId: string;
  /** Per-slot offset from the owner's position when the minion is idle. */
  followOffset: Vec2;
  /** Cached current attack target monster id (mirrors hasAttackTarget). */
  currentTargetId: string | null;
}

export function initControlsMinion(args: {
  ownerPlayerId: string;
  followOffset: Vec2;
}): ControlsMinion {
  return {
    ownerPlayerId:   args.ownerPlayerId,
    followOffset:    { ...args.followOffset },
    currentTargetId: null,
  };
}
