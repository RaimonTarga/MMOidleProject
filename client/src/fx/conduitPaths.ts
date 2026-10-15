/**
 * The summon-shatter drawer. The nine specialization strike layers are gone
 * with the specs (CD.8). The protocol event stays; nothing emits it now.
 */
import type { GameScene } from '../scenes/GameScene';
import { DEPTH } from '../render/depth';
import { ring } from './bossKit';
import { fadeOut } from './bespoke/kit';
import { shouldRunClientFx } from './guard';

type P = { x: number; y: number };

/** `summon-shatter`: a summon bursts (deliberate blasts are bigger). */
export function fxSummonShatter(scene: GameScene, at: P, radius: number, deliberate: boolean): void {
  if (!shouldRunClientFx()) return;
  const r = deliberate ? radius : radius * 0.65;
  ring(scene, at.x, at.y, 0xc8a0ff, { from: 10, scale: r / 10, width: deliberate ? 4 : 2, ms: 360 });
  for (let i = 0; i < (deliberate ? 12 : 7); i++) {
    const a = (i / (deliberate ? 12 : 7)) * Math.PI * 2 + Math.random() * 0.3;
    const sh = scene.add.graphics({ x: at.x, y: at.y }).setDepth(DEPTH.FX).setRotation(a);
    sh.fillStyle(i % 2 ? 0xd0c8e0 : 0x8a6ab0, 1);
    sh.fillTriangle(-4, -3, 7, 0, -4, 3);
    scene.tweens.add({
      targets: sh, x: at.x + Math.cos(a) * r, y: at.y + Math.sin(a) * r * 0.7, rotation: a + 5, alpha: 0,
      duration: 420, ease: 'Quad.easeOut', onComplete: () => sh.destroy(),
    });
  }
  const flash = scene.add.graphics({ x: at.x, y: at.y }).setDepth(DEPTH.FX);
  flash.fillStyle(0xffffff, 0.7);
  flash.fillCircle(0, 0, deliberate ? 18 : 10);
  fadeOut(scene, flash, 180, 0, 2);
}
