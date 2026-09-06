import type { GameScene } from '../scenes/GameScene';
import type { DamageElement } from '@mmo-idle/shared';
import { ELEMENT_STYLE } from '../render/damageNumberStyle';
import { DEPTH } from '../render/depth';

/**
 * Contagion — afflictions crawling outward from one host to the next.
 *
 * The FX has one job the mechanics cannot do on their own: say WHAT moved and
 * WHERE it went. So each tendril is drawn per (victim × element) and tinted with
 * that element's own colour from the shared damage-number palette — spread a
 * burn and a poison at once and you see an orange line and a green line reach
 * each new host, not one averaged streak.
 *
 * They are drawn as SINUOUS curves rather than straight beams because a straight
 * line reads as a projectile — something fired. A crawling, wavering line reads
 * as something spreading, which is what actually happened.
 */

/** Perpendicular wave amplitude as a fraction of the tendril's length. */
const WAVE_AMPLITUDE = 0.16;
/** Cap so a long tendril doesn't wave halfway across the screen. */
const MAX_AMPLITUDE_PX = 34;
/** Full sine periods along a tendril. Non-integer so the ends aren't symmetric. */
const WAVE_PERIODS = 1.75;
const SEGMENTS = 24;
const GROW_MS = 260;
const HOLD_MS = 180;
const FADE_MS = 260;

function elementColor(element: DamageElement): number {
  return Number.parseInt(ELEMENT_STYLE[element].color.replace('#', ''), 16);
}

/**
 * Points along a sine wave laid on the axis from `from` to `to`.
 *
 * `phase` offsets the wave so several tendrils sharing one pair of endpoints
 * (one per element) never overlap into a single thick line.
 */
function sinuousPoints(
  from: { x: number; y: number },
  to: { x: number; y: number },
  phase: number,
  progress: number,
): Array<{ x: number; y: number }> {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy) || 1;
  const ux = dx / length;
  const uy = dy / length;
  // Perpendicular, for the wave's displacement.
  const px = -uy;
  const py = ux;
  const amplitude = Math.min(MAX_AMPLITUDE_PX, length * WAVE_AMPLITUDE);

  const points: Array<{ x: number; y: number }> = [];
  const steps = Math.max(2, Math.round(SEGMENTS * progress));
  for (let i = 0; i <= steps; i++) {
    const t = (i / SEGMENTS) * progress;
    // Taper the wave to zero at both ends so the tendril actually TOUCHES its
    // host instead of floating beside it.
    const taper = Math.sin(Math.PI * Math.min(1, t));
    const wave = Math.sin(t * Math.PI * 2 * WAVE_PERIODS + phase) * amplitude * taper;
    points.push({
      x: from.x + ux * length * t + px * wave,
      y: from.y + uy * length * t + py * wave,
    });
  }
  return points;
}

export function fxContagion(
  scene: GameScene,
  from: { x: number; y: number },
  links: Array<{ to: { x: number; y: number }; element: DamageElement }>,
): void {
  // Phase is keyed per element WITHIN a destination, so the burn and the poison
  // heading to the same host bow in different directions.
  const phaseByKey = new Map<string, number>();

  links.forEach((link, index) => {
    const key = `${Math.round(link.to.x)}:${Math.round(link.to.y)}`;
    const seen = phaseByKey.get(key) ?? 0;
    phaseByKey.set(key, seen + 1);
    const phase = seen * Math.PI;

    const color = elementColor(link.element);
    const gfx = scene.add.graphics().setDepth(DEPTH.FX);
    // Staggered so a five-target spread reads as a chain reaction rather than a
    // starburst that appears all at once.
    const delay = index * 35;

    const state = { progress: 0 };
    scene.tweens.add({
      targets: state,
      progress: 1,
      duration: GROW_MS,
      delay,
      ease: 'Quad.easeOut',
      onUpdate: () => {
        gfx.clear();
        const points = sinuousPoints(from, link.to, phase, state.progress);
        if (points.length < 2) return;
        // Two passes: a wide translucent bloom under a bright thin core, which is
        // what keeps a 2px line legible over busy terrain.
        for (const [width, alpha] of [[7, 0.28], [2.5, 0.95]] as const) {
          gfx.lineStyle(width, color, alpha);
          gfx.beginPath();
          gfx.moveTo(points[0]!.x, points[0]!.y);
          for (const point of points.slice(1)) gfx.lineTo(point.x, point.y);
          gfx.strokePath();
        }
      },
      onComplete: () => {
        // A small bloom where it took hold — the moment of infection.
        const burst = scene.add
          .circle(link.to.x, link.to.y - 4, 5, color, 0.8)
          .setDepth(DEPTH.FX);
        scene.tweens.add({
          targets: burst,
          scale: 3.2,
          alpha: 0,
          duration: FADE_MS + 80,
          ease: 'Quad.easeOut',
          onComplete: () => burst.destroy(),
        });
        scene.tweens.add({
          targets: gfx,
          alpha: 0,
          duration: FADE_MS,
          delay: HOLD_MS,
          ease: 'Quad.easeIn',
          onComplete: () => gfx.destroy(),
        });
      },
    });
  });
}
