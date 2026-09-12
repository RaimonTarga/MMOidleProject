import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';
import { DEPTH } from '../render/depth';

const HIDE = 0x8a6f52;
const BRUISE = 0xc46a4a;

/**
 * TROLL FIST — a heavy organic knuckle, the Cave lineage's ordinary swing.
 *
 * Cave Brute, Cave Troll and Cavern Troll were drawing the same cue as Granite Titan
 * and Mountain Colossus, which made a fistful of knuckles indistinguishable from a
 * rock golem's slab. Their named Ground Slam already covers the mineral half of the
 * fight (see `fxGroundSlam`); the basic attack should read as MEAT.
 *
 * So: no chips, no crystalline sparkle, no bright core. One broad soft-edged
 * compression at the point of contact, a low dull ring, and heavy debris that falls
 * fast. Deliberately duller than the stone family it used to share a cue with — the
 * contrast is the point.
 */
export function fxTrollFist(scene: GameScene, toX: number, toY: number, empowered: boolean): void {
  const r = empowered ? 21 : 17;

  // The knuckle: a squat rounded mass that compresses into the target rather than
  // flashing. Scale-up on BOTH axes so it never squashes directionally.
  const fist = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
  fist.fillStyle(HIDE, 0.8);
  fist.fillCircle(0, 0, r);
  fist.fillStyle(BRUISE, 0.45);
  fist.fillCircle(-r * 0.25, -r * 0.25, r * 0.55);
  fist.setScale(0.4);
  scene.tweens.add({
    targets: fist,
    scaleX: 1.35,
    scaleY: 1.1,
    alpha: 0,
    duration: 240,
    ease: 'Quad.easeOut',
    onComplete: () => fist.destroy(),
  });

  // Low dull shockwave — wide and flat, no rim highlight.
  const ring = scene.add.graphics({ x: toX, y: toY + 6 }).setDepth(DEPTH.FX);
  ring.lineStyle(empowered ? 5 : 4, BRUISE, 0.5);
  ring.strokeEllipse(0, 0, r * 2.2, r * 1.1);
  scene.tweens.add({
    targets: ring,
    scaleX: empowered ? 2.6 : 2.2,
    scaleY: empowered ? 2.6 : 2.2,
    alpha: 0,
    duration: 320,
    ease: 'Cubic.easeOut',
    onComplete: () => ring.destroy(),
  });

  // Heavy, slow, falling debris. No upward spray: nothing shattered here.
  burstFx(scene, 'ptx-dot', toX, toY + 4, empowered ? 13 : 9, 460, {
    tint: HIDE,
    speed: { min: 45, max: 135 },
    angle: { min: 200, max: 340 },
    scale: { start: 1.05, end: 0 },
    alpha: { start: 0.9, end: 0 },
    gravityY: 260,
  });
}
