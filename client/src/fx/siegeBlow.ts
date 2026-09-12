import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';
import { DEPTH } from '../render/depth';
import type { AttackTint } from './elementTint';

/**
 * Sentinel (`cooldown-range-far`) basic attack.
 *
 * A Squire with 120 extra range punishes from 132px, where the shared blunt
 * `fxImpact` bloomed on the target with no cause at all — the heaviest, slowest
 * chassis in the game appeared to be hitting things by looking at them.
 *
 * The answer keeps the Squire blunt, and sends it through the ground: the maul
 * comes down, and a compression wave runs out along the floor to erupt under the
 * target. Deliberately the slowest of the range animations — the wave takes real
 * time to arrive, which is the whole identity of a tank punishing from afar.
 *
 * Palette follows cooldown: hot orange at baseline, white on the execution.
 */

const BASE_CORE = 0xff8844;
const BASE_GLOW = 0xffaa22;
const EXEC_CORE = 0xffffff;
const EXEC_GLOW = 0xaabbff;

/** Arcs laid down along the path. Each is one "chunk" of travelling ground. */
const RIPPLES = 4;

export function fxSiegeBlow(
  scene: GameScene,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  execution: boolean,
  tint?: AttackTint,
): void {
  const core = execution ? EXEC_CORE : BASE_CORE;
  const glow = tint?.glow ?? (execution ? EXEC_GLOW : BASE_GLOW);
  const spark = tint?.particles ?? core;

  const angle = Math.atan2(toY - fromY, toX - fromX);
  const ax = Math.cos(angle);
  const ay = Math.sin(angle);
  const px = -ay;
  const py = ax;
  const dist = Math.hypot(toX - fromX, toY - fromY);

  // The strike that starts it, at the attacker's feet.
  const stamp = scene.add.graphics({ x: fromX, y: fromY + 6 }).setDepth(DEPTH.FX);
  stamp.lineStyle(execution ? 4 : 3, core, 0.9);
  stamp.strokeEllipse(0, 0, 30, 14);
  scene.tweens.add({
    targets: stamp,
    scaleX: 1.8,
    scaleY: 1.8,
    alpha: 0,
    duration: 240,
    ease: 'Quad.easeOut',
    onComplete: () => stamp.destroy(),
  });

  // A crack drawn along the floor toward the target, written progressively so
  // the ground visibly splits ahead of the wave.
  const crack = scene.add.graphics().setDepth(DEPTH.FX);
  const crackState = { reach: 0 };
  const jags = 7;
  const offsets = Array.from({ length: jags + 1 }, (_, i) =>
    i === 0 || i === jags ? 0 : (Math.random() - 0.5) * 14,
  );
  const drawCrack = (): void => {
    crack.clear();
    crack.lineStyle(execution ? 4 : 3, glow, 0.5);
    let prevX = fromX;
    let prevY = fromY + 6;
    for (let i = 1; i <= jags; i++) {
      const t = i / jags;
      if (t > crackState.reach) break;
      const along = dist * t;
      const x = fromX + ax * along + px * offsets[i];
      const y = fromY + 6 + ay * along + py * offsets[i];
      crack.lineBetween(prevX, prevY, x, y);
      prevX = x;
      prevY = y;
    }
  };

  const travelMs = execution ? 300 : 260;
  scene.tweens.add({
    targets: crackState,
    reach: 1,
    duration: travelMs,
    ease: 'Sine.easeOut',
    onUpdate: drawCrack,
    onComplete: () => {
      scene.tweens.add({
        targets: crack,
        alpha: 0,
        duration: 260,
        onComplete: () => crack.destroy(),
      });
      erupt();
    },
  });

  // Ripples riding the crack: short arcs perpendicular to travel, each fired as
  // the wave passes it, so the motion reads even on a still frame.
  for (let i = 0; i < RIPPLES; i++) {
    const t = (i + 1) / (RIPPLES + 1);
    scene.time.delayedCall(travelMs * t * 0.9, () => {
      const along = dist * t;
      const x = fromX + ax * along;
      const y = fromY + 6 + ay * along;
      const arc = scene.add.graphics({ x, y }).setDepth(DEPTH.FX);
      arc.lineStyle(execution ? 3 : 2.25, glow, 0.7);
      arc.beginPath();
      arc.arc(0, 0, 14, angle - 1.2, angle + 1.2, false);
      arc.strokePath();
      // The wider X than Y growth is ground PERSPECTIVE, deliberately in screen
      // space rather than along the travel axis — a ripple on the floor should
      // flatten vertically no matter which way the wave is heading.
      scene.tweens.add({
        targets: arc,
        scaleX: 1.7,
        scaleY: 1.1,
        alpha: 0,
        duration: 200,
        ease: 'Quad.easeOut',
        onComplete: () => arc.destroy(),
      });
      burstFx(scene, 'ptx-dot', x, y, 3, 300, {
        tint: glow,
        speed: { min: 30, max: 90 },
        angle: { min: 200, max: 340 },
        scale: { start: 0.5, end: 0 },
        alpha: { start: 0.7, end: 0 },
        gravityY: 220,
      });
    });
  }

  function erupt(): void {
    // Concentric rings, the Squire's blunt vocabulary, but rising out of the
    // floor rather than landing on it: debris is thrown UP.
    for (let i = 0; i < 2; i++) {
      const ring = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
      ring.lineStyle(3 - i * 0.5, i === 0 ? core : glow, 1);
      ring.strokeCircle(0, 0, 10 + i * 8);
      scene.tweens.add({
        targets: ring,
        scaleX: 4 + i,
        scaleY: 4 + i,
        alpha: 0,
        duration: 340 + i * 70,
        ease: 'Power2',
        onComplete: () => ring.destroy(),
      });
    }

    const flash = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
    flash.fillStyle(glow, execution ? 0.8 : 0.65);
    flash.fillCircle(0, 0, execution ? 28 : 21);
    scene.tweens.add({
      targets: flash,
      alpha: 0,
      scaleX: 1.9,
      scaleY: 1.9,
      duration: 200,
      ease: 'Quad.easeOut',
      onComplete: () => flash.destroy(),
    });

    burstFx(scene, 'ptx-dot', toX, toY, execution ? 18 : 12, 520, {
      tint: spark,
      speed: { min: 90, max: execution ? 300 : 220 },
      angle: { min: 232, max: 308 },
      scale: { start: execution ? 0.9 : 0.7, end: 0 },
      alpha: { start: 1, end: 0 },
      gravityY: 340,
    });
  }
}
