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
  /** Trampled Path: ms remaining before Charge is ready again (0 = ready). */
  chargeCooldownMs: number;
  /** Trampled Path: sprinting toward target to close distance before the stunning hit. */
  isCharging: boolean;
  /** Acid Brood: ms until this lurker decays and detonates (undefined = not an acid lurker). */
  lifetimeRemainingMs?: number;
  /** Acid Brood: prevents double explosion if hp hits 0 and despawn in the same tick. */
  acidDetonated?: boolean;
}

export function initControlsMinion(args: {
  ownerPlayerId: string;
  followOffset: Vec2;
}): ControlsMinion {
  return {
    ownerPlayerId:   args.ownerPlayerId,
    followOffset:    { ...args.followOffset },
    currentTargetId: null,
    chargeCooldownMs: 0,
    isCharging:       false,
  };
}
