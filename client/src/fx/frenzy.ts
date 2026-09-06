import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';
import { DEPTH } from '../render/depth';

const RAGE_BRIGHT = 0xffd07a;
const RAGE_CORE = 0xff6a1e;

/**
 * Frenzy (offensive-buff Technique): speed lines whip outward and the player
 * burns hot for as long as the window lasts.
 *
 * Frenzy grants attack SPEED and nothing else, so the FX is pure motion — no
 * shield, no impact, no numbers anywhere. A player who sees it should expect
 * their hands to move faster, not their hits to land harder.
 *
 * TWO PARTS, and the second is the important one. The original FX was a single
 * ~320 ms burst covering a four-second buff: it fired correctly and was simply
 * too brief and too small to notice, so the ability read as doing nothing at
 * all. A window you cannot see is a window you cannot feel. The burst now lands
 * harder AND a sustained aura rides the sprite for the buff's real duration, so
 * "am I still frenzied?" is answerable at a glance rather than only from the
 * buff bar.
 */

/** How often the trailing aura re-randomises. Fast enough to read as motion. */
const AURA_STEP_MS = 90;

export function fxFrenzy(
  scene: GameScene,
  x: number,
  y: number,
  options?: {
    /** Buff duration, so the aura matches the real window rather than guessing. */
    durationMs?: number;
    /** Live sprite position, so the aura follows a moving player. */
    follow?: () => { x: number; y: number } | null;
  },
): void {
  const cy = y - 6;

  // ── The ignition burst ─────────────────────────────────────────────────────
  // Larger and longer than the original: 12 streaks reaching 58px over 460ms,
  // rather than 10 reaching 34px over 320ms.
  for (let i = 0; i < 12; i++) {
    const angle = (Math.PI * 2 * i) / 12 + 0.15;
    const streak = scene.add.graphics({ x, y: cy }).setDepth(DEPTH.FX);
    streak.lineStyle(4, i % 2 === 0 ? RAGE_CORE : RAGE_BRIGHT, 0.95);
    streak.beginPath();
    streak.moveTo(Math.cos(angle) * 18, Math.sin(angle) * 18);
    streak.lineTo(Math.cos(angle) * 58, Math.sin(angle) * 58);
    streak.strokePath();
    scene.tweens.add({
      targets: streak,
      x: x + Math.cos(angle) * 34,
      y: cy + Math.sin(angle) * 34,
      alpha: 0,
      duration: 460,
      delay: (i % 3) * 45,
      ease: 'Quad.easeOut',
      onComplete: () => streak.destroy(),
    });
  }

  // An expanding shock ring: the single clearest "something just happened here"
  // shape, and the part most likely to catch the eye in peripheral vision.
  const ring = scene.add.graphics().setDepth(DEPTH.FX);
  const ringState = { radius: 10, alpha: 0.95 };
  scene.tweens.add({
    targets: ringState,
    radius: 64,
    alpha: 0,
    duration: 420,
    ease: 'Cubic.easeOut',
    onUpdate: () => {
      ring.clear();
      ring.lineStyle(3, RAGE_BRIGHT, ringState.alpha);
      ring.strokeCircle(x, cy, ringState.radius);
    },
    onComplete: () => ring.destroy(),
  });

  // Three quick flares — the tempo of the ability stated in the FX itself.
  for (let i = 0; i < 3; i++) {
    scene.time.delayedCall(i * 120, () => {
      const flare = scene.add.graphics({ x, y: cy }).setDepth(DEPTH.FX);
      flare.fillStyle(RAGE_BRIGHT, 0.6);
      flare.fillCircle(0, 0, 20);
      scene.tweens.add({
        targets: flare,
        alpha: 0,
        scaleX: 2.4,
        scaleY: 2.4,
        duration: 260,
        ease: 'Quad.easeOut',
        onComplete: () => flare.destroy(),
      });
    });
  }

  burstFx(scene, 'ptx-spark', x, cy, 26, 420, {
    tint: RAGE_CORE,
    speed: { min: 170, max: 380 },
    angle: { min: 0, max: 360 },
    scale: { start: 1.1, end: 0 },
    alpha: { start: 1, end: 0 },
    rotate: { min: 0, max: 360 },
  });

  // ── The sustained window ───────────────────────────────────────────────────
  const durationMs = options?.durationMs ?? 0;
  if (durationMs > 0) {
    sustainedHaste(scene, { x, y: cy }, durationMs, options?.follow);
  }
}

/**
 * Trailing speed lines that ride the player for the whole buff.
 *
 * Redrawn on a timer rather than tweened once, for two reasons: the player
 * MOVES (a static graphic would be left behind the moment they walk), and the
 * lines have to re-randomise or they stop reading as motion and start reading
 * as a decal stuck to the sprite.
 */
function sustainedHaste(
  scene: GameScene,
  origin: { x: number; y: number },
  durationMs: number,
  follow?: () => { x: number; y: number } | null,
): void {
  const gfx = scene.add.graphics().setDepth(DEPTH.FX);
  const steps = Math.max(1, Math.round(durationMs / AURA_STEP_MS));
  let step = 0;

  const timer = scene.time.addEvent({
    delay: AURA_STEP_MS,
    repeat: steps - 1,
    startAt: AURA_STEP_MS, // draw immediately rather than after one blank step
    callback: () => {
      step++;
      const pos = follow?.() ?? origin;
      const cy = follow ? pos.y - 6 : pos.y;

      // Fade out over the last third, so the window visibly ENDS instead of
      // being cut off — the player gets a moment of warning that it is going.
      const remaining = 1 - step / steps;
      const alpha = remaining > 0.33 ? 1 : Math.max(0, remaining / 0.33);

      gfx.clear();
      // Four short arcs orbiting the sprite at varied radii, so the silhouette
      // stays readable and the character is never hidden inside its own FX.
      for (let i = 0; i < 4; i++) {
        const a = (Math.PI * 2 * i) / 4 + step * 0.55;
        const radius = 22 + (i % 2) * 7;
        gfx.lineStyle(3, i % 2 === 0 ? RAGE_CORE : RAGE_BRIGHT, 0.75 * alpha);
        gfx.beginPath();
        gfx.arc(pos.x, cy, radius, a, a + 0.75);
        gfx.strokePath();
      }
    },
    callbackScope: scene,
  });

  scene.time.delayedCall(durationMs, () => {
    timer.remove();
    gfx.destroy();
  });
}
