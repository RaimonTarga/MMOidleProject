import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';

export function fxSlash(scene: GameScene, fromX: number, fromY: number, toX: number, toY: number, empowered: boolean, blueEmpowered = false): void {
  const angle = Math.atan2(toY - fromY, toX - fromX);
  const perp = angle + Math.PI / 2;
  const empColor = blueEmpowered ? 0x4499ff : 0xffdd22;
  const shadowColor = blueEmpowered ? 0xaaccff : 0xffffcc;
  const mainColor = empowered ? empColor : 0xffffff;
  const shadow = empowered ? shadowColor : 0xeeeeff;
  const lineW = empowered ? 3.5 : 2.5;
  const len = empowered ? 62 : 48;

  for (let i = 0; i < 3; i++) {
    const a = perp + (i - 1) * 0.3;
    scene.time.delayedCall(i * 35, () => {
      const g = scene.add.graphics({ x: toX, y: toY }).setDepth(12);
      g.lineStyle(lineW, mainColor, 1);
      g.lineBetween(-Math.cos(a) * len, -Math.sin(a) * len, Math.cos(a) * len, Math.sin(a) * len);
      g.lineStyle(lineW * 0.5, shadow, 0.6);
      const off = 7;
      g.lineBetween(
        -Math.cos(a) * (len * 0.7) + Math.cos(angle) * off,
        -Math.sin(a) * (len * 0.7) + Math.sin(angle) * off,
        Math.cos(a) * (len * 0.7) + Math.cos(angle) * off,
        Math.sin(a) * (len * 0.7) + Math.sin(angle) * off,
      );
      scene.tweens.add({ targets: g, alpha: 0, duration: 210, ease: 'Quad.easeOut', onComplete: () => g.destroy() });
    });
  }

  burstFx(scene, 'ptx-spark', toX, toY, empowered ? 14 : 9, 280, {
    tint: mainColor,
    speed: { min: 60, max: 220 },
    angle: { min: 0, max: 360 },
    scale: { start: 0.9, end: 0.1 },
    alpha: { start: 1, end: 0 },
    rotate: { min: 0, max: 360 },
  });

  if (empowered) {
    const ring = scene.add.graphics({ x: toX, y: toY }).setDepth(12);
    ring.lineStyle(3, mainColor, 1);
    ring.strokeCircle(0, 0, 12);
    scene.tweens.add({ targets: ring, scaleX: 3.8, scaleY: 3.8, alpha: 0, duration: 320, ease: 'Quad.easeOut', onComplete: () => ring.destroy() });
  }
}

export function fxImpact(scene: GameScene, toX: number, toY: number, execution: boolean): void {
  const flash = scene.add.graphics({ x: toX, y: toY }).setDepth(13);
  flash.fillStyle(execution ? 0xffffff : 0xff8844, execution ? 0.9 : 0.8);
  flash.fillCircle(0, 0, execution ? 28 : 16);
  scene.tweens.add({ targets: flash, alpha: 0, scaleX: 1.6, scaleY: 1.6, duration: 90, onComplete: () => flash.destroy() });

  for (let i = 0; i < 2; i++) {
    const ringColor = execution ? (i === 0 ? 0xffffff : 0xaabbff) : (i === 0 ? 0xff7744 : 0xffaa22);
    const ring = scene.add.graphics({ x: toX, y: toY }).setDepth(11);
    ring.lineStyle(3 - i * 0.5, ringColor, 1);
    ring.strokeCircle(0, 0, 10 + i * 8);
    scene.tweens.add({ targets: ring, scaleX: 4.5 + i, scaleY: 4.5 + i, alpha: 0, duration: 320 + i * 60, ease: 'Power2', onComplete: () => ring.destroy() });
  }

  burstFx(scene, 'ptx-dot', toX, toY, execution ? 14 : 8, 380, {
    tint: execution ? 0xddeeff : 0xff7744,
    speed: { min: 80, max: 240 },
    angle: { min: 0, max: 360 },
    scale: { start: 0.55, end: 0 },
    alpha: { start: 1, end: 0 },
    gravityY: 180,
  });

  if (execution) {
    const cross = scene.add.graphics({ x: toX, y: toY }).setDepth(13);
    const cLen = 42;
    cross.lineStyle(3, 0xeeeeff, 1);
    cross.lineBetween(-cLen, -cLen, cLen, cLen);
    cross.lineBetween(cLen, -cLen, -cLen, cLen);
    cross.lineStyle(3, 0xffffff, 0.9);
    cross.lineBetween(-cLen, 0, cLen, 0);
    cross.lineBetween(0, -cLen, 0, cLen);
    scene.tweens.add({ targets: cross, alpha: 0, scaleX: 1.9, scaleY: 1.9, duration: 380, ease: 'Quad.easeOut', onComplete: () => cross.destroy() });
  }
}

export function fxPoison(scene: GameScene, toX: number, toY: number): void {
  const ring = scene.add.graphics({ x: toX, y: toY }).setDepth(12);
  ring.lineStyle(2.5, 0x44ff66, 1);
  ring.strokeCircle(0, 0, 8);
  scene.tweens.add({ targets: ring, scaleX: 4.2, scaleY: 4.2, alpha: 0, duration: 380, ease: 'Power2', onComplete: () => ring.destroy() });

  burstFx(scene, 'ptx-dot', toX, toY, 9, 520, {
    tint: 0x44ff66,
    speed: { min: 30, max: 110 },
    angle: { min: 200, max: 340 },
    scale: { start: 0.65, end: 0 },
    alpha: { start: 1, end: 0 },
    gravityY: -70,
  });
}

export function fxMagic(scene: GameScene, fromX: number, fromY: number, toX: number, toY: number): void {
  const orb = scene.add.circle(fromX, fromY, 6, 0xaa44ff).setDepth(12);

  for (let i = 0; i < 3; i++) {
    scene.time.delayedCall(i * 45, () => {
      const trail = scene.add.circle(orb.x, orb.y, 3 - i * 0.5, 0xcc88ff, 0.75).setDepth(11);
      scene.tweens.add({ targets: trail, alpha: 0, scaleX: 0.1, scaleY: 0.1, duration: 180, onComplete: () => trail.destroy() });
    });
  }

  scene.tweens.add({
    targets: orb, x: toX, y: toY, duration: 200, ease: 'Quad.easeIn',
    onComplete: () => {
      orb.destroy();
      const ring = scene.add.graphics({ x: toX, y: toY }).setDepth(12);
      ring.lineStyle(2.5, 0xcc88ff, 1);
      ring.strokeCircle(0, 0, 6);
      scene.tweens.add({ targets: ring, scaleX: 3.5, scaleY: 3.5, alpha: 0, duration: 260, onComplete: () => ring.destroy() });

      burstFx(scene, 'ptx-dot', toX, toY, 10, 320, {
        tint: 0xaa44ff,
        speed: { min: 50, max: 180 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.65, end: 0 },
        alpha: { start: 1, end: 0 },
      });
    },
  });
}

export function fxFrost(scene: GameScene, toX: number, toY: number): void {
  const spokes = scene.add.graphics({ x: toX, y: toY }).setDepth(12);
  const sLen = 40;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const perpA = a + Math.PI / 2;
    const tx = Math.cos(a) * sLen;
    const ty = Math.sin(a) * sLen;
    spokes.lineStyle(2, 0xaaddff, 1);
    spokes.lineBetween(0, 0, tx, ty);
    spokes.lineStyle(1.5, 0xddeeff, 0.85);
    spokes.lineBetween(tx - Math.cos(perpA) * 7, ty - Math.sin(perpA) * 7, tx + Math.cos(perpA) * 7, ty + Math.sin(perpA) * 7);
  }
  scene.tweens.add({ targets: spokes, alpha: 0, duration: 300, ease: 'Quad.easeOut', onComplete: () => spokes.destroy() });

  const ring = scene.add.graphics({ x: toX, y: toY }).setDepth(11);
  ring.lineStyle(2.5, 0x66ccff, 1);
  ring.strokeCircle(0, 0, 10);
  scene.tweens.add({ targets: ring, scaleX: 3.8, scaleY: 3.8, alpha: 0, duration: 340, ease: 'Power2', onComplete: () => ring.destroy() });

  burstFx(scene, 'ptx-dot', toX, toY, 7, 330, {
    tint: 0xaaddff,
    speed: { min: 50, max: 140 },
    angle: { min: 0, max: 360 },
    scale: { start: 0.7, end: 0 },
    alpha: { start: 1, end: 0 },
  });
}

export function fxFire(scene: GameScene, toX: number, toY: number): void {
  const flash = scene.add.graphics({ x: toX, y: toY }).setDepth(13);
  flash.fillStyle(0xffffff, 0.88);
  flash.fillCircle(0, 0, 14);
  scene.tweens.add({ targets: flash, alpha: 0, scaleX: 1.5, scaleY: 1.5, duration: 85, onComplete: () => flash.destroy() });

  const ring = scene.add.graphics({ x: toX, y: toY }).setDepth(12);
  ring.lineStyle(3, 0xff6600, 1);
  ring.strokeCircle(0, 0, 12);
  scene.tweens.add({ targets: ring, scaleX: 3.8, scaleY: 3.8, alpha: 0, duration: 320, ease: 'Power2', onComplete: () => ring.destroy() });

  burstFx(scene, 'ptx-dot', toX, toY, 12, 460, {
    tint: 0xff6600,
    speed: { min: 80, max: 230 },
    angle: { min: 220, max: 320 },
    scale: { start: 0.75, end: 0 },
    alpha: { start: 1, end: 0 },
    gravityY: -110,
  });

  burstFx(scene, 'ptx-spark', toX, toY, 8, 560, {
    tint: 0xff8800,
    speed: { min: 50, max: 150 },
    angle: { min: 0, max: 360 },
    scale: { start: 0.9, end: 0 },
    alpha: { start: 1, end: 0 },
    gravityY: 130,
    rotate: { min: 0, max: 360 },
  });
}
