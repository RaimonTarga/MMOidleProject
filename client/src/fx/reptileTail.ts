import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';
import { DEPTH } from '../render/depth';

const SCALE_DARK = 0x5c6b4a;
const SCALE_LIT = 0xa8bd7a;
const SAND = 0xd8c9a0;

/**
 * REPTILE TAIL — a low horizontal tail sweep, for the Desert basilisk line.
 *
 * The three Basilisks and Dune Tyrant were all on the generic `impact` bloom, which
 * is a punch — and these are large reptiles whose entire *named* identity is a stare
 * (Petrifying Gaze, now `fxPetrifyingGaze`). Their ordinary attack needed to stop
 * looking like a fist without stealing the gaze's thunder.
 *
 * A tail is the answer: low, wide, horizontal, and quiet. The sweep travels along the
 * ground rather than blooming at chest height, which also keeps it visually separate
 * from the vertical grammar of every slam in the game. Sand drags along behind it.
 */
export function fxReptileTail(scene: GameScene, toX: number, toY: number, empowered: boolean): void {
  const span = empowered ? 62 : 50;
  // Sweep direction alternates per cast so a desert pair does not mirror perfectly.
  const dir = Math.random() < 0.5 ? -1 : 1;
  const y = toY + 12;

  // The tail: a tapered arc drawn along local +x, then rotated. Rotation is how it
  // finds its angle — never scaleX, which squashes width on a vertical attack.
  const tail = scene.add.graphics({ x: toX, y }).setDepth(DEPTH.FX);
  tail.lineStyle(empowered ? 9 : 7, SCALE_DARK, 0.65);
  tail.beginPath();
  tail.arc(0, 0, span, Math.PI * 0.88, Math.PI * 0.12, true);
  tail.strokePath();
  tail.lineStyle(empowered ? 4.5 : 3.5, SCALE_LIT, 0.95);
  tail.beginPath();
  tail.arc(0, 0, span, Math.PI * 0.88, Math.PI * 0.12, true);
  tail.strokePath();
  tail.setScale(dir, 0.42);
  tail.setRotation(-dir * 0.5);

  scene.tweens.add({
    targets: tail,
    rotation: dir * 0.5,
    alpha: 0,
    duration: 300,
    ease: 'Cubic.easeOut',
    onComplete: () => tail.destroy(),
  });

  // Flat, low contact smear rather than a round bloom.
  const smear = scene.add.graphics({ x: toX, y }).setDepth(DEPTH.FX);
  smear.fillStyle(SCALE_LIT, empowered ? 0.45 : 0.34);
  smear.fillEllipse(0, 0, span * 1.1, empowered ? 16 : 13);
  scene.tweens.add({
    targets: smear,
    alpha: 0,
    scaleX: 1.5,
    duration: 260,
    ease: 'Quad.easeOut',
    onComplete: () => smear.destroy(),
  });

  // Sand dragged along the sweep, thrown in the direction the tail travelled.
  burstFx(scene, 'ptx-dot', toX + dir * span * 0.4, y, empowered ? 16 : 11, 480, {
    tint: SAND,
    speed: { min: 60, max: 185 },
    angle: dir > 0 ? { min: -35, max: 35 } : { min: 145, max: 215 },
    scale: { start: 0.95, end: 0 },
    alpha: { start: 0.85, end: 0 },
    gravityY: 170,
  });
}
