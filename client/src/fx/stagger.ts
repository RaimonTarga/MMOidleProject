import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';
import { DEPTH } from '../render/depth';

const BREAK_CORE = 0xffffff;
const BREAK_GLOW = 0xffd166;
const DAZE = 0xfff0b8;

/**
 * STAGGER — a boss has been knocked out of its pattern and is now in its punish
 * window.
 *
 * This is the payoff for the only real counterplay a boss pattern offers: breaking
 * Stoneplate Juggernaut's plate, or breaking the escape-guard on the three Jungle
 * predators. The server has always published it (`bossPatterns.ts`, `fx: 'stagger'`)
 * and the client never drew it, so the reward for doing the hard thing was silence.
 *
 * Grammar per the class pass: OUTWARD shards mean something broke. So the cue is a
 * hard white break-flash with shards thrown outward, plus slow "dazed" arcs
 * wobbling over the boss for the duration of the opening — the shards say the guard
 * failed, the wobble says the window is open.
 */
export function fxStagger(scene: GameScene, x: number, y: number): void {
  // The break: a hard, bright flash. Deliberately whiter and snappier than any
  // damage cue so it cannot be mistaken for "you hit it".
  const flash = scene.add.graphics({ x, y }).setDepth(DEPTH.FX);
  flash.fillStyle(BREAK_CORE, 0.95);
  flash.fillCircle(0, 0, 20);
  flash.fillStyle(BREAK_GLOW, 0.45);
  flash.fillCircle(0, 0, 36);
  scene.tweens.add({
    targets: flash,
    alpha: 0,
    scaleX: 2.6,
    scaleY: 2.6,
    duration: 260,
    ease: 'Quad.easeOut',
    onComplete: () => flash.destroy(),
  });

  // Guard fragments thrown outward. Built along local +x and rotated, never
  // scaleX-tweened — the trap the class pass hit twice.
  for (let i = 0; i < 7; i++) {
    const angle = (i / 7) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
    const shard = scene.add.graphics({ x, y }).setDepth(DEPTH.FX);
    shard.fillStyle(i % 2 === 0 ? BREAK_CORE : BREAK_GLOW, 0.9);
    shard.fillTriangle(0, -3.5, 17, 0, 0, 3.5);
    shard.setRotation(angle);
    scene.tweens.add({
      targets: shard,
      x: x + Math.cos(angle) * 58,
      y: y + Math.sin(angle) * 58,
      alpha: 0,
      duration: 340 + Math.random() * 120,
      ease: 'Cubic.easeOut',
      onComplete: () => shard.destroy(),
    });
  }

  // Dazed wobble: two slow arcs rocking above the boss, so the open window reads
  // for a beat after the break flash has gone.
  for (let i = 0; i < 2; i++) {
    const arc = scene.add.graphics({ x, y: y - 30 - i * 7 }).setDepth(DEPTH.FX);
    arc.lineStyle(3 - i, DAZE, 0.85 - i * 0.25);
    arc.beginPath();
    arc.arc(0, 0, 15 + i * 7, Math.PI * 1.15, Math.PI * 1.85);
    arc.strokePath();
    arc.setRotation(-0.35);
    scene.tweens.add({
      targets: arc,
      rotation: 0.35,
      duration: 420,
      yoyo: true,
      repeat: 1,
      delay: i * 90,
      ease: 'Sine.easeInOut',
      onComplete: () => arc.destroy(),
    });
    scene.tweens.add({
      targets: arc,
      alpha: 0,
      delay: 900 + i * 90,
      duration: 300,
      ease: 'Quad.easeOut',
    });
  }

  burstFx(scene, 'ptx-spark', x, y, 22, 520, {
    tint: BREAK_GLOW,
    speed: { min: 100, max: 250 },
    angle: { min: 0, max: 360 },
    scale: { start: 1.05, end: 0 },
    alpha: { start: 1, end: 0 },
    gravityY: 90,
  });
}
