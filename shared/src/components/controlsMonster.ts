/**
 * Monster AI state — aggro, wander, kite prevention, leash.
 */
export interface ControlsMonster {
  spawnX: number;
  spawnY: number;
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
}

