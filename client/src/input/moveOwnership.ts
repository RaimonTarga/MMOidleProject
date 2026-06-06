import type { Vec2 } from '@mmo-idle/shared';

/**
 * Cross-module ownership state for the OWN player's predicted heading.
 *
 * The client predicts its own movement ahead of the 5 Hz authoritative stream.
 * While the client owns the heading, render code must NOT overwrite the predicted
 * target with the ~1 RTT stale authoritative target, and the reconcile must never
 * pull the predicted base backward toward the lagging server position. Ownership
 * spans two states:
 *
 *  - `manualActive` — keyboard/gamepad is actively driving movement.
 *  - `pendingStop`  — a stop intent was sent but the authoritative position has
 *                     not yet converged to it. This window (≈1 RTT + one
 *                     broadcast) is what caused the "backtrack on stop": dropping
 *                     ownership the instant the stop was queued let the lagging
 *                     authoritative state drive (and then yank back) the sprite.
 *
 * This module is a dependency-free leaf (only shared types) so `movement.ts`,
 * `players.ts`, and `interpolation.ts` can all share it without import cycles.
 */

// Authoritative position is "converged" to the stop once within this distance.
// Mirrors the reconcile dead zone in interpolation.ts.
const STOP_CONVERGE_SQ = 80 * 80;
// Hard cap on how long we hold ownership after a stop if the server never quite
// converges (packet loss, large divergence). Bounds any interference with other
// movement sources (auto-combat, knockback) that might start during the window.
const STOP_GRACE_MS = 500;

let manualActive = false;
let pendingStop: Vec2 | null = null;
let pendingStopAt = 0;

/** Mark active keyboard/gamepad movement. Starting movement cancels any
 *  unconfirmed stop latch. */
export function setManualActive(active: boolean): void {
  manualActive = active;
  if (active) pendingStop = null;
}

export function isManualActive(): boolean {
  return manualActive;
}

/** Latch a sent-but-unconfirmed stop at `stop`, owning the heading until the
 *  authoritative position converges to it or {@link STOP_GRACE_MS} elapses. */
export function beginPendingStop(stop: Vec2, now: number): void {
  manualActive = false;
  pendingStop = { x: stop.x, y: stop.y };
  pendingStopAt = now;
}

/** Drop the stop latch immediately (e.g. a new click-to-move / auto intent). */
export function clearPendingStop(): void {
  pendingStop = null;
}

/** Clear the stop latch once the server has converged or the grace window ends. */
export function maintainPendingStop(serverPos: Vec2, now: number): void {
  if (!pendingStop) return;
  const dx = serverPos.x - pendingStop.x;
  const dy = serverPos.y - pendingStop.y;
  if (dx * dx + dy * dy <= STOP_CONVERGE_SQ || now - pendingStopAt >= STOP_GRACE_MS) {
    pendingStop = null;
  }
}

export function isStopPending(): boolean {
  return pendingStop !== null;
}

export function getPendingStop(): Vec2 | null {
  return pendingStop;
}

/** True while the client owns the own player's heading (active manual movement
 *  or an unconfirmed stop). Render code uses this to refuse authoritative-target
 *  overwrites and backward reconciliation for the own player. */
export function isOwnHeadingClientOwned(): boolean {
  return manualActive || pendingStop !== null;
}
