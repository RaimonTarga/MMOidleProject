import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';
import { DEPTH } from '../render/depth';
import { elementColor } from './elementTint';

/**
 * Hemomancer (`cadence-heavy-b`) finisher.
 *
 * Hemomancer's finisher deals NO direct damage at all — it converts into a
 * bleeding wound worth 150% of the finisher over 4 seconds. It was playing the
 * full blue-surge crescent, i.e. the loudest hit in the class, for a hit that
 * lands nothing on impact.
 *
 * So the impact is quiet and the WOUND is the event: a clean cut opens, then
 * blood wells out of it and runs. The `bleed` element colour ties it to the
 * damage numbers and to the per-tick FX that now follows it (`fxDotTick`), so
 * the finisher and its four seconds of payout read as one thing.
 */

const DARK = 0x5e0d0d;

export function fxBleedOpen(
  scene: GameScene,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  empowered: boolean,
): void {
  const blood = elementColor('bleed');
  const angle = Math.atan2(toY - fromY, toX - fromX);
  // The cut runs ACROSS the attack path, like a drawn blade.
  const cutAngle = angle + Math.PI / 2 + (Math.random() - 0.5) * 0.5;
  const len = empowered ? 30 : 24;

  // The cut opens: a thin dark line that widens from the middle outward.
  const cut = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
  cut.lineStyle(empowered ? 5 : 4, DARK, 0.9);
  cut.lineBetween(-len, 0, len, 0);
  cut.lineStyle(empowered ? 2 : 1.5, blood, 1);
  cut.lineBetween(-len, 0, len, 0);
  cut.setRotation(cutAngle);
  cut.setScale(0.15, 1);
  scene.tweens.add({
    targets: cut,
    scaleX: 1,
    duration: 130,
    ease: 'Quart.easeOut',
    onComplete: () => {
      scene.tweens.add({
        targets: cut,
        alpha: 0,
        duration: 420,
        onComplete: () => cut.destroy(),
      });
    },
  });

  // Blood wells up at the wound, then runs down under gravity. Deliberately no
  // ring and no flash — there was no impact to announce.
  scene.time.delayedCall(90, () => {
    const well = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
    well.fillStyle(blood, 0.8);
    well.fillCircle(0, 0, empowered ? 9 : 7);
    scene.tweens.add({
      targets: well,
      y: toY + 14,
      scaleX: 0.5,
      scaleY: 1.4,
      alpha: 0,
      duration: 420,
      ease: 'Quad.easeIn',
      onComplete: () => well.destroy(),
    });

    burstFx(scene, 'ptx-dot', toX, toY, empowered ? 14 : 9, 620, {
      tint: blood,
      speed: { min: 40, max: empowered ? 150 : 110 },
      angle: { min: 200, max: 340 },
      scale: { start: empowered ? 0.85 : 0.65, end: 0 },
      alpha: { start: 1, end: 0 },
      gravityY: 420,
    });
  });
}
