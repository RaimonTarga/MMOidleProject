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
  /** Index of the patrol waypoint to head toward next (monsters with a patrol def). */
  patrolIndex?: number;
  /** Patrol traversal direction for pingpong mode (+1 forward / -1 backward). */
  patrolDir?: number;
}

/**
 * Pack membership — SERVER-ONLY runtime link minted at spawn for monsters spawned
 * as a coordinated pack. Never networked, never persisted (monsters are ephemeral).
 * The pack system groups members by `packId` each tick to propagate shared aggro.
 */
export interface InPack {
  /** Shared id for all members of one spawned pack. */
  packId: string;
  role: 'alpha' | 'follower';
}
