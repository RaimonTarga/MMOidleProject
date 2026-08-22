import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';
import { DEPTH } from '../render/depth';

const RUSH_BRIGHT = 0xffe6a8;
const RUSH_CORE = 0xffa33d;
const BACK_BRIGHT = 0xdfeaff;
const BACK_CORE = 0x8fa9c8;

/**
 * Streak the path a reposition actually travelled.
 *
 * Both Charge and Disengage are instant server-side teleports: the player's
 * position simply changes between two ticks. Without a trail drawn along the old
 * path the movement is invisible — the sprite blinks and the player has no idea
 * an ability fired, let alone which one. That is why the event carries both
 * endpoints.
 */
function dashTrail(
  scene: GameScene,
  from: { x: number; y: number },
  to: { x: number; y: number },
  bright: number,
  core: number,
): void {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);
  if (length < 1) return;
  const nx = -dy / length;
  const ny = dx / length;

  // Four offset streaks along the path — a motion smear, not a single line.
  for (let i = 0; i < 4; i++) {
    const offset = (i - 1.5) * 7;
    const streak = scene.add.graphics().setDepth(DEPTH.FX);
    streak.lineStyle(i === 1 || i === 2 ? 4 : 2, i === 1 ? bright : core, 0.8);
    streak.beginPath();
    streak.moveTo(from.x + nx * offset, from.y - 8 + ny * offset);
    streak.lineTo(to.x + nx * offset, to.y - 8 + ny * offset);
    streak.strokePath();
    scene.tweens.add({
      targets: streak,
      alpha: 0,
      duration: 220 + i * 40,
      ease: 'Quad.easeOut',
      onComplete: () => streak.destroy(),
    });
  }

  // Dust kicked up where the movement started.
  burstFx(scene, 'ptx-dot', from.x, from.y + 8, 12, 460, {
    tint: core,
    speed: { min: 50, max: 150 },
    angle: { min: 0, max: 360 },
    scale: { start: 0.7, end: 0 },
    alpha: { start: 0.9, end: 0 },
    gravityY: 120,
  });
}

/**
 * Charge: a hot forward rush ending in a braced landing.
 *
 * The landing ring matters — Charge arrives INSIDE its target's guard and arms an
 * empowered blow, so the trail has to end somewhere emphatic rather than just
 * fading out, or the follow-up hit looks unrelated to the dash.
 */
export function fxCharge(
  scene: GameScene,
  from: { x: number; y: number },
  to: { x: number; y: number },
): void {
  dashTrail(scene, from, to, RUSH_BRIGHT, RUSH_CORE);

  const land = scene.add.graphics({ x: to.x, y: to.y + 8 }).setDepth(DEPTH.FX);
  land.lineStyle(3, RUSH_CORE, 0.9);
  land.strokeEllipse(0, 0, 30, 12);
  scene.tweens.add({
    targets: land,
    scaleX: 2.4,
    scaleY: 2.4,
    alpha: 0,
    duration: 340,
    ease: 'Expo.easeOut',
    onComplete: () => land.destroy(),
  });

  const flare = scene.add.graphics({ x: to.x, y: to.y - 6 }).setDepth(DEPTH.FX);
  flare.fillStyle(RUSH_BRIGHT, 0.6);
  flare.fillCircle(0, 0, 14);
  scene.tweens.add({
    targets: flare,
    alpha: 0,
    scaleX: 2,
    scaleY: 2,
    duration: 220,
    ease: 'Quad.easeOut',
    onComplete: () => flare.destroy(),
  });
}

/**
 * Disengage: a cold backward break with no landing punctuation.
 *
 * The reverse of Charge on purpose — cool grey-blue instead of hot amber, and the
 * emphasis sits at the point LEFT rather than the point arrived at, because the
 * ability's whole value is the space it opened up behind the player.
 */
export function fxDisengage(
  scene: GameScene,
  from: { x: number; y: number },
  to: { x: number; y: number },
): void {
  dashTrail(scene, from, to, BACK_BRIGHT, BACK_CORE);

  // A puff where the player broke contact.
  const puff = scene.add.graphics({ x: from.x, y: from.y + 6 }).setDepth(DEPTH.FX);
  puff.fillStyle(BACK_CORE, 0.45);
  puff.fillEllipse(0, 0, 34, 16);
  scene.tweens.add({
    targets: puff,
    scaleX: 1.8,
    scaleY: 1.8,
    alpha: 0,
    duration: 420,
    ease: 'Quad.easeOut',
    onComplete: () => puff.destroy(),
  });

  // A faint after-image left standing where they were.
  const ghost = scene.add.graphics({ x: from.x, y: from.y - 10 }).setDepth(DEPTH.FX);
  ghost.lineStyle(2, BACK_BRIGHT, 0.6);
  ghost.strokeEllipse(0, 0, 18, 30);
  scene.tweens.add({
    targets: ghost,
    alpha: 0,
    scaleX: 0.7,
    duration: 320,
    ease: 'Sine.easeOut',
    onComplete: () => ghost.destroy(),
  });
}
