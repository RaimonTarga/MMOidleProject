/**
 * IMPACT FEEL — camera shake and hit-stop for heavy boss impacts only.
 *
 * Deliberately subtle and gated by Settings -> Screen shake (on by default): the
 * effects themselves carry the read, these only add weight. Nothing here touches
 * gameplay; hit-stop slows the client's TWEENS and sprite animations for a few
 * dozen milliseconds (the effect "catches" on the hit), never the simulation.
 */
import { getGameplaySettings } from '../settings/gameplaySettings';
import type { GameScene } from '../scenes/GameScene';

/** Named strengths, so call sites say how heavy a hit is rather than a number. */
export type ImpactWeight = 'light' | 'medium' | 'heavy';

const SHAKE: Record<ImpactWeight, { ms: number; intensity: number }> = {
  light: { ms: 110, intensity: 0.0025 },
  medium: { ms: 170, intensity: 0.0045 },
  heavy: { ms: 260, intensity: 0.007 },
};

const HIT_STOP_MS: Record<ImpactWeight, number> = { light: 0, medium: 55, heavy: 85 };
/** Tween / animation speed while stopped: nearly frozen, not fully (a hitch, not a hang). */
const HIT_STOP_SCALE = 0.06;

let stopUntil = 0;
let stopTimer: ReturnType<typeof setTimeout> | null = null;

function enabled(): boolean {
  return getGameplaySettings().screenShakeEnabled && !document.hidden;
}

/**
 * Shake plus (for medium/heavy) a hit-stop. `onlyIfNear` skips it when the
 * impact is far from the camera: a boss slam across the arena is not your hit.
 */
export function impact(
  scene: GameScene,
  weight: ImpactWeight,
  at?: { x: number; y: number },
): void {
  if (!enabled()) return;
  const cam = scene.cameras.main;
  if (at) {
    const view = cam.worldView;
    const reach = Math.max(view.width, view.height) * 0.75;
    if (Math.hypot(at.x - view.centerX, at.y - view.centerY) > reach) return;
  }
  const shake = SHAKE[weight];
  cam.shake(shake.ms, shake.intensity, false);
  hitStop(scene, HIT_STOP_MS[weight]);
}

/** Briefly slow client tweens and animations. Overlapping stops extend, never stack. */
export function hitStop(scene: GameScene, ms: number): void {
  if (ms <= 0 || !enabled()) return;
  const until = performance.now() + ms;
  if (until <= stopUntil) return;
  stopUntil = until;
  scene.tweens.timeScale = HIT_STOP_SCALE;
  scene.anims.globalTimeScale = HIT_STOP_SCALE;
  if (stopTimer) clearTimeout(stopTimer);
  // Real time, not scene time: the scene clock is the thing being slowed.
  stopTimer = setTimeout(() => {
    stopTimer = null;
    stopUntil = 0;
    scene.tweens.timeScale = 1;
    scene.anims.globalTimeScale = 1;
  }, ms);
}
