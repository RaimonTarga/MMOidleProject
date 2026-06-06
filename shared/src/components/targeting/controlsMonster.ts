/**
 * Monster AI state — aggro, wander, kite prevention, leash.
 */
import type { Vec2 } from '../../systems/spatial';

export interface ControlsMonster {
  spawn: Vec2;
  wanderRadius: number;
  idleUntil: number;
  leashRange: number;
  idleMinMs: number;
  idleMaxMs: number;
  /** Timestamp of the last tick this monster had an active aggro target. */
  lastAggroAt: number;
  /** Unmodified speed from the database — kite ramp restores to this. */
  baseSpeed: number;
  /** Ms spent chasing without landing an attack — drives the kite speed ramp. */
  kiteTimer: number;
  /** Remaining milliseconds of a charge-on-aggro speed burst. */
  chargeRemainingMs?: number;
  /** Unmodified attack captured at first ramp tick — rampOnCombat multiplies this. */
  baseAttack?: number;
  /** Current in-combat attack ramp fraction (0..rampOnCombat.maxPct). */
  rampPct?: number;
  /** Ms accumulated toward the next rampOnCombat tick. */
  rampAccumMs?: number;
}
