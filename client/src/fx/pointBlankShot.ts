import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';
import { DEPTH } from '../render/depth';
import type { AttackTint } from './elementTint';

/**
 * Breacher (`reload-range-close`) basic attack.
 *
 * A Slinger who gave up all reach lands at exactly 12px — `stats.ts` floors
 * negative range bonuses at `PLAYER_ATTACK_RANGE` — so the standard shot drew a
 * tracer across almost no distance at all. A bullet's flight is the whole point
 * of that animation, and at contact there is no flight to show.
 *
 * So this has no tracer. It is the muzzle pressed into the target: a wide cone
 * of burning gas, one hard contact flash, and debris thrown back past the
 * shooter. The gun is still a gun, it is just being used as a battering tool.
 *
 * Palette follows reload: pale blue-white at baseline, warm yellow on the surge.
 */

const BASE_CORE = 0xddeeff;
const BASE_GLOW = 0xbfd6ee;
const EMP_CORE = 0xffee66;
const EMP_GLOW = 0xffcc44;

export function fxPointBlankShot(
  scene: GameScene,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  empowered: boolean,
  tint?: AttackTint,
): void {
  const core = empowered ? EMP_CORE : BASE_CORE;
  const glow = tint?.glow ?? (empowered ? EMP_GLOW : BASE_GLOW);
  const spark = tint?.particles ?? core;

  const angle = Math.atan2(toY - fromY, toX - fromX);
  const ax = Math.cos(angle);
  const ay = Math.sin(angle);

  // The blast cone starts at the muzzle — just ahead of the shooter — and opens
  // out to swallow the target. Length is deliberately independent of the actual
  // gap: at 12px a to-scale cone would be invisible, and the READ we want is
  // "everything between us is on fire", not a measured distance.
  const muzzleDist = 10;
  const coneLen = empowered ? 62 : 48;
  const coneHalfWidth = empowered ? 30 : 23;
  const mx = fromX + ax * muzzleDist;
  const my = fromY + ay * muzzleDist;

  // Drawn along LOCAL +x and then rotated, so the scaleX tween below always
  // lengthens the cone along the firing axis. Building it from the world-space
  // (ax, ay) vector instead would make scaleX squash the cone's WIDTH whenever
  // the shot was vertical.
  const cone = scene.add.graphics({ x: mx, y: my }).setDepth(DEPTH.FX);
  const wedge = (length: number, halfWidth: number): Phaser.Types.Math.Vector2Like[] => [
    { x: 0, y: 0 },
    { x: length, y: halfWidth },
    { x: length * 1.08, y: 0 },
    { x: length, y: -halfWidth },
  ];
  cone.fillStyle(glow, 0.42);
  cone.fillPoints(wedge(coneLen, coneHalfWidth), true);
  cone.fillStyle(core, 0.72);
  cone.fillPoints(wedge(coneLen * 0.66, coneHalfWidth * 0.5), true);
  cone.setRotation(angle);
  cone.setScale(0.45, 1);
  scene.tweens.add({
    targets: cone,
    scaleX: 1.15,
    alpha: 0,
    duration: empowered ? 170 : 140,
    ease: 'Quart.easeOut',
    onComplete: () => cone.destroy(),
  });

  // Contact flash ON the target, not at the end of a tracer.
  const flash = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
  flash.fillStyle(glow, 0.55);
  flash.fillCircle(0, 0, empowered ? 26 : 20);
  flash.fillStyle(core, 0.95);
  flash.fillCircle(0, 0, empowered ? 13 : 10);
  scene.tweens.add({
    targets: flash,
    alpha: 0,
    scaleX: 2.3,
    scaleY: 2.3,
    duration: 190,
    ease: 'Quad.easeOut',
    onComplete: () => flash.destroy(),
  });

  // The shove: a ring squashed along the firing axis, so the force reads as
  // directional rather than as an omnidirectional explosion.
  const shove = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
  shove.lineStyle(empowered ? 3 : 2.25, core, 0.9);
  shove.strokeEllipse(0, 0, 26, 14);
  shove.setRotation(angle);
  scene.tweens.add({
    targets: shove,
    scaleX: empowered ? 2.6 : 2.1,
    scaleY: empowered ? 1.5 : 1.25,
    alpha: 0,
    duration: 260,
    ease: 'Quad.easeOut',
    onComplete: () => shove.destroy(),
  });

  // Two debris sprays: burning wadding blown FORWARD through the target, and
  // hot gas kicked BACK past the shooter's shoulder. The backwash is what makes
  // it read as point-blank rather than as a distant hit.
  const fwdDeg = (angle * 180) / Math.PI;
  burstFx(scene, 'ptx-spark', toX, toY, empowered ? 18 : 12, 360, {
    tint: spark,
    speed: { min: 110, max: empowered ? 330 : 240 },
    angle: { min: fwdDeg - 48, max: fwdDeg + 48 },
    scale: { start: empowered ? 1.0 : 0.8, end: 0 },
    alpha: { start: 1, end: 0 },
    rotate: { min: 0, max: 360 },
  });
  burstFx(scene, 'ptx-dot', mx, my, empowered ? 12 : 8, 420, {
    tint: glow,
    speed: { min: 60, max: empowered ? 190 : 140 },
    angle: { min: fwdDeg + 150, max: fwdDeg + 210 },
    scale: { start: empowered ? 0.85 : 0.65, end: 0 },
    alpha: { start: 0.8, end: 0 },
    gravityY: 60,
  });
}
