import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';
import { DEPTH } from '../render/depth';

const HORN = 0xe8dcc0;
const HORN_SHADOW = 0xa08b62;
const DUST = 0xb9a582;

/**
 * GORE — horn and tusk delivered by a charging body. The largest family pulled out
 * of the generic `impact` bloom.
 *
 * Eight mobs across Plains and Mountain share this verb: Boar, Stampede Bull and
 * both razorback bosses run with the herd; Avalanche Ram, Avalanche Tyrant, Cragback
 * Rhino and Granite Mammoth all lead with horn or tusk. Twenty-two mobs in the
 * bestiary carry `chargeOnAggro`, and for these the collision IS the read — "a moving
 * wall of horn and dust", as the Stampede Bull's own entry puts it.
 *
 * The motion is deliberately UPWARD: a gore hooks and lifts, where a slam drives
 * down and a fist drives straight in. Two tusk arcs sweep up through the target while
 * ground dust kicks out low behind them, so the same silhouette reads at any angle.
 */
export function fxGore(scene: GameScene, toX: number, toY: number, empowered: boolean): void {
  const reach = empowered ? 46 : 38;
  // Which way the head tosses. Alternating would read as mechanical; random keeps
  // a herd of eight boars from looking like one stamped decal.
  const sweep = Math.random() < 0.5 ? -1 : 1;

  // Two tusks, offset so the pair reads as a head rather than a single blade.
  for (let i = 0; i < 2; i++) {
    const offset = (i === 0 ? -1 : 1) * (empowered ? 13 : 10);
    const tusk = scene.add.graphics({ x: toX + offset, y: toY + 14 }).setDepth(DEPTH.FX);
    tusk.lineStyle(empowered ? 8 : 6.5, HORN_SHADOW, 0.55);
    tusk.beginPath();
    tusk.arc(0, 0, reach, Math.PI * 0.55, Math.PI * 0.05, true);
    tusk.strokePath();
    tusk.lineStyle(empowered ? 4.5 : 3.5, HORN, 1);
    tusk.beginPath();
    tusk.arc(0, 0, reach, Math.PI * 0.55, Math.PI * 0.05, true);
    tusk.strokePath();
    tusk.setScale(sweep, 1);
    tusk.setAlpha(0);

    scene.tweens.add({
      targets: tusk,
      alpha: 1,
      y: toY - (empowered ? 16 : 12),
      duration: 130,
      delay: i * 35,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        scene.tweens.add({
          targets: tusk,
          alpha: 0,
          y: toY - (empowered ? 30 : 24),
          duration: 210,
          ease: 'Quad.easeIn',
          onComplete: () => tusk.destroy(),
        });
      },
    });
  }

  // Impact bloom, warm and dusty rather than bright — this is bone and hide.
  const flash = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
  flash.fillStyle(HORN, empowered ? 0.6 : 0.48);
  flash.fillCircle(0, 0, empowered ? 24 : 19);
  scene.tweens.add({
    targets: flash,
    alpha: 0,
    scaleX: 2.2,
    scaleY: 1.6,
    duration: 250,
    ease: 'Quad.easeOut',
    onComplete: () => flash.destroy(),
  });

  // Ground dust thrown low and wide: the body arriving, not the horn landing.
  burstFx(scene, 'ptx-dot', toX, toY + 16, empowered ? 18 : 13, 520, {
    tint: DUST,
    speed: { min: 70, max: 210 },
    angle: { min: 150, max: 30 },
    scale: { start: 1, end: 0 },
    alpha: { start: 0.85, end: 0 },
    gravityY: 140,
  });
  // A few chips riding up with the toss.
  burstFx(scene, 'ptx-spark', toX, toY, empowered ? 12 : 8, 420, {
    tint: HORN,
    speed: { min: 90, max: 230 },
    angle: { min: 230, max: 310 },
    scale: { start: 0.85, end: 0 },
    alpha: { start: 1, end: 0 },
    gravityY: 200,
  });
}
