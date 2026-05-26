import type { PlayerView } from '@mmo-idle/shared';
import type { GameScene } from '../GameScene';
import { burstFx } from './particles';

export function fxGunshot(scene: GameScene, fromX: number, fromY: number, toX: number, toY: number, empowered: boolean): void {
  const color = empowered ? 0xffee66 : 0xddeeff;
  const width = empowered ? 2.5 : 1.5;

  const g = scene.add.graphics().setDepth(12);
  g.lineStyle(width + 3, color, 0.15);
  g.lineBetween(fromX, fromY, toX, toY);
  g.lineStyle(width, color, 1);
  g.lineBetween(fromX, fromY, toX, toY);
  scene.tweens.add({ targets: g, alpha: 0, duration: 90, ease: 'Quad.easeIn', onComplete: () => g.destroy() });

  const muzzle = scene.add.graphics({ x: fromX, y: fromY }).setDepth(12);
  muzzle.fillStyle(color, 0.7);
  muzzle.fillCircle(0, 0, empowered ? 7 : 4);
  scene.tweens.add({ targets: muzzle, alpha: 0, scaleX: 2, scaleY: 2, duration: 80, onComplete: () => muzzle.destroy() });

  const flash = scene.add.graphics({ x: toX, y: toY }).setDepth(13);
  flash.fillStyle(color, 0.88);
  flash.fillCircle(0, 0, empowered ? 16 : 8);
  scene.tweens.add({ targets: flash, alpha: 0, scaleX: 2.5, scaleY: 2.5, duration: 150, onComplete: () => flash.destroy() });

  const travelAngleDeg = Math.atan2(toY - fromY, toX - fromX) * 180 / Math.PI;
  const backDeg = (travelAngleDeg + 180 + 360) % 360;
  burstFx(scene, 'ptx-spark', toX, toY, empowered ? 10 : 5, empowered ? 280 : 190, {
    tint: color,
    speed: { min: 80, max: empowered ? 260 : 180 },
    angle: { min: backDeg - 40, max: backDeg + 40 },
    scale: { start: empowered ? 1.0 : 0.65, end: 0 },
    alpha: { start: 1, end: 0 },
    rotate: { min: 0, max: 360 },
  });
}

export function activateLaserBeam(scene: GameScene, targetId: string): void {
  scene.laserBeamTargetId = targetId;
  // Broadcasts arrive every ~200ms; keep the beam alive across snapshots.
  scene.laserBeamUntil = Date.now() + 320;

  if (!scene.laserBeamGraphics) {
    scene.laserBeamGraphics = scene.add.graphics().setDepth(12);
  }
}

export function updateLaserBeam(scene: GameScene): void {
  if (!scene.laserBeamGraphics) return;

  const now = Date.now();
  const ownSprite = scene.state.ownId ? scene.state.sprite.get(scene.state.ownId) : undefined;
  const targetSprite = scene.laserBeamTargetId ? scene.state.sprite.get(scene.laserBeamTargetId) : undefined;
  const player = scene.state.ownId
    ? (scene.state.view.get(scene.state.ownId) as PlayerView | undefined)
    : undefined;

  if (
    now > scene.laserBeamUntil ||
    !ownSprite ||
    !targetSprite ||
    !player ||
    player.combatArchetype !== 'reload' ||
    (player.passives['reload.laser'] ?? 0) <= 0 ||
    player.laserOverheated
  ) {
    scene.laserBeamGraphics.clear();
    scene.laserBeamTargetId = null;
    return;
  }

  const fromX = ownSprite.x;
  const fromY = ownSprite.y;
  const toX = targetSprite.x;
  const toY = targetSprite.y;
  const pulse = 0.75 + Math.sin(now / 45) * 0.18;

  scene.laserBeamGraphics.clear();
  scene.laserBeamGraphics.lineStyle(10, 0xff5533, 0.16 * pulse);
  scene.laserBeamGraphics.lineBetween(fromX, fromY, toX, toY);
  scene.laserBeamGraphics.lineStyle(5, 0xffaa44, 0.34 * pulse);
  scene.laserBeamGraphics.lineBetween(fromX, fromY, toX, toY);
  scene.laserBeamGraphics.lineStyle(2, 0xffffdd, 0.92);
  scene.laserBeamGraphics.lineBetween(fromX, fromY, toX, toY);

  const impactRadius = 5 + Math.sin(now / 55) * 1.5;
  scene.laserBeamGraphics.fillStyle(0xffffcc, 0.7);
  scene.laserBeamGraphics.fillCircle(toX, toY, impactRadius);
  scene.laserBeamGraphics.fillStyle(0xff6633, 0.24);
  scene.laserBeamGraphics.fillCircle(toX, toY, impactRadius * 2.4);
}
