import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';
import { DEPTH } from '../render/depth';

const SAND = 0xeecc66;
const SUN = 0xfff0c0;
const DEEP = 0xccaa55;

/**
 * Sandblast — the desert royals' signature swing (Dune-Stalker Emperor, Dune-
 * Carapace Monarch, Dune-Throne Sovereign). A spinning gout of sun-baked sand rips
 * from the boss to the target, trailing grit, then bursts in a golden sun-glint
 * ring. Replaces the generic arcane `magic` hit so the duel/Sun-Mark identity reads.
 */
export function fxSandblast(
  scene: GameScene,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
): void {
  // Spinning sand orb travelling to the target, trailing grit.
  const orb = scene.add.graphics({ x: fromX, y: fromY }).setDepth(DEPTH.FX);
  orb.fillStyle(SAND, 0.9);
  orb.fillCircle(0, 0, 7);
  orb.fillStyle(SUN, 0.7);
  orb.fillCircle(-2, -2, 3);

  scene.tweens.add({
    targets: orb,
    x: toX,
    y: toY,
    rotation: Math.PI * 2,
    duration: 230,
    ease: 'Quad.easeIn',
    onUpdate: () => {
      if (Math.random() < 0.6) {
        burstFx(scene, 'ptx-dot', orb.x, orb.y, 1, 260, {
          tint: DEEP,
          speed: { min: 10, max: 50 },
          angle: { min: 0, max: 360 },
          scale: { start: 0.5, end: 0 },
          alpha: { start: 0.7, end: 0 },
        });
      }
    },
    onComplete: () => {
      orb.destroy();
      spawnSandImpact(scene, toX, toY);
    },
  });
}

function spawnSandImpact(scene: GameScene, x: number, y: number): void {
  // Sun-glint ring.
  const ring = scene.add.graphics({ x, y }).setDepth(DEPTH.FX);
  ring.lineStyle(3, SUN, 0.9);
  ring.strokeCircle(0, 0, 10);
  ring.lineStyle(2, SAND, 0.7);
  ring.strokeCircle(0, 0, 16);
  scene.tweens.add({
    targets: ring,
    scaleX: 3.2,
    scaleY: 3.2,
    alpha: 0,
    duration: 320,
    ease: 'Quad.easeOut',
    onComplete: () => ring.destroy(),
  });

  const flash = scene.add.graphics({ x, y }).setDepth(DEPTH.FX);
  flash.fillStyle(SUN, 0.85);
  flash.fillCircle(0, 0, 12);
  scene.tweens.add({
    targets: flash,
    alpha: 0,
    scaleX: 2,
    scaleY: 2,
    duration: 200,
    ease: 'Quad.easeOut',
    onComplete: () => flash.destroy(),
  });

  // Spray of sand.
  burstFx(scene, 'ptx-dot', x, y, 16, 420, {
    tint: SAND,
    speed: { min: 70, max: 220 },
    angle: { min: 0, max: 360 },
    scale: { start: 1.0, end: 0 },
    alpha: { start: 0.9, end: 0 },
    gravityY: 120,
  });
}
