import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';
import { DEPTH } from '../render/depth';
import type { AttackTint } from './elementTint';

/**
 * Sniper (`reload-light-c`) basic attack.
 *
 * Sniper loads 3 heavy shells, fires at a hard-set 0.5 APS ignoring weapon
 * attack speed entirely, and converts its attack-speed stat into per-shot
 * damage. It was firing the identical thin, 90ms tracer as a Scout emptying a
 * 10-round clip — opposite weapons, same picture.
 *
 * So: a fat tracer that lingers, a real barrel flare, and an impact with a
 * shockwave rather than a spark. Everything here is bigger and slower than
 * `fxGunshot`, because that contrast IS the identity.
 */

const BASE_CORE = 0xfff4d6;
const BASE_BODY = 0xffc46a;
const EMP_CORE = 0xffffff;
const EMP_BODY = 0xffee66;

export function fxHeavyShell(
  scene: GameScene,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  empowered: boolean,
  tint?: AttackTint,
): void {
  const core = empowered ? EMP_CORE : BASE_CORE;
  const body = tint?.glow ?? (empowered ? EMP_BODY : BASE_BODY);
  const spark = tint?.particles ?? core;

  const angle = Math.atan2(toY - fromY, toX - fromX);
  const ax = Math.cos(angle);
  const ay = Math.sin(angle);
  const px = -ay;
  const py = ax;

  // Three stacked strokes, all noticeably fatter than the standard shot, and
  // held for ~2.5x as long so the eye registers a single deliberate round.
  const tracer = scene.add.graphics().setDepth(DEPTH.FX);
  tracer.lineStyle(empowered ? 13 : 10, body, 0.16);
  tracer.lineBetween(fromX, fromY, toX, toY);
  tracer.lineStyle(empowered ? 6 : 4.5, body, 0.6);
  tracer.lineBetween(fromX, fromY, toX, toY);
  tracer.lineStyle(empowered ? 2.5 : 2, core, 1);
  tracer.lineBetween(fromX, fromY, toX, toY);
  scene.tweens.add({
    targets: tracer,
    alpha: 0,
    duration: empowered ? 260 : 220,
    ease: 'Quad.easeIn',
    onComplete: () => tracer.destroy(),
  });

  // Barrel flare: a short wedge off the muzzle. Drawn along local +x and
  // rotated so its "open outward" scale runs along the barrel at any angle.
  const muzzleDist = 12;
  const flare = scene.add
    .graphics({ x: fromX + ax * muzzleDist, y: fromY + ay * muzzleDist })
    .setDepth(DEPTH.FX);
  const half = empowered ? 13 : 10;
  const len = empowered ? 30 : 24;
  flare.fillStyle(body, 0.6);
  flare.fillPoints(
    [
      { x: 0, y: 0 },
      { x: len, y: half },
      { x: len * 1.1, y: 0 },
      { x: len, y: -half },
    ],
    true,
  );
  flare.setRotation(angle);
  flare.setScale(0.5, 1);
  scene.tweens.add({
    targets: flare,
    scaleX: 1.2,
    alpha: 0,
    duration: 150,
    ease: 'Quart.easeOut',
    onComplete: () => flare.destroy(),
  });

  // Recoil: a short kick-back streak behind the shooter. A heavy shell moves the
  // person firing it, and nothing else in the reload family shows that.
  const recoil = scene.add.graphics({ x: fromX, y: fromY }).setDepth(DEPTH.FX);
  recoil.lineStyle(3, body, 0.5);
  recoil.lineBetween(0, 0, -ax * 18, -ay * 18);
  scene.tweens.add({
    targets: recoil,
    alpha: 0,
    duration: 170,
    onComplete: () => recoil.destroy(),
  });

  // Impact: a shockwave ring plus a hard bloom, not the standard flash-and-spark.
  const ring = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
  ring.lineStyle(empowered ? 3.5 : 2.75, core, 0.95);
  ring.strokeCircle(0, 0, 11);
  scene.tweens.add({
    targets: ring,
    scaleX: empowered ? 4.6 : 3.8,
    scaleY: empowered ? 4.6 : 3.8,
    alpha: 0,
    duration: 380,
    ease: 'Power2',
    onComplete: () => ring.destroy(),
  });

  const bloom = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
  bloom.fillStyle(body, 0.7);
  bloom.fillCircle(0, 0, empowered ? 24 : 18);
  bloom.fillStyle(core, 0.95);
  bloom.fillCircle(0, 0, empowered ? 11 : 8);
  scene.tweens.add({
    targets: bloom,
    alpha: 0,
    scaleX: 2.1,
    scaleY: 2.1,
    duration: 220,
    ease: 'Quad.easeOut',
    onComplete: () => bloom.destroy(),
  });

  // Debris sprays back along the flight path, and a couple of chips fly wide.
  const backDeg = (angle * 180) / Math.PI + 180;
  burstFx(scene, 'ptx-spark', toX, toY, empowered ? 20 : 14, 460, {
    tint: spark,
    speed: { min: 120, max: empowered ? 340 : 260 },
    angle: { min: backDeg - 46, max: backDeg + 46 },
    scale: { start: empowered ? 1.1 : 0.9, end: 0 },
    alpha: { start: 1, end: 0 },
    rotate: { min: 0, max: 360 },
  });
  burstFx(scene, 'ptx-dot', toX + px * 2, toY + py * 2, 5, 520, {
    tint: body,
    speed: { min: 60, max: 180 },
    angle: { min: 0, max: 360 },
    scale: { start: 0.6, end: 0 },
    alpha: { start: 0.8, end: 0 },
    gravityY: 240,
  });
}
