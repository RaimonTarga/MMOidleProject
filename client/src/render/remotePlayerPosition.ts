import type { Vec2 } from '@mmo-idle/shared';

/** Remote movement follows observed positions, never an unconfirmed path goal.
 * A short frame-independent ease hides the 5 Hz steps without extrapolating
 * through obstacles or continuing to walk when snapshots stop arriving.
 */
export function stepRemotePlayerPosition(from: Vec2, authoritative: Vec2, dt: number): Vec2 {
  const distance = Math.hypot(authoritative.x - from.x, authoritative.y - from.y);
  if (distance > 240 || distance < 0.25) return { ...authoritative };
  const alpha = 1 - Math.exp(-16 * Math.max(0, dt));
  return {
    x: from.x + (authoritative.x - from.x) * alpha,
    y: from.y + (authoritative.y - from.y) * alpha,
  };
}
