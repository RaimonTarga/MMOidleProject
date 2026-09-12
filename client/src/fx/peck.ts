import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';
import { DEPTH } from '../render/depth';

const BEAK = 0xd8cbb0;
const NECROTIC = 0x8fa85c;

/**
 * PECK — a carrion bird's beak jab, delivered from range.
 *
 * Carrion Vulture is a `ranged` mob that was authored on `poison`, whose FX draws
 * only on the target — so its attack arrived from off-screen with nothing in
 * between. Its bestiary line is "its own peck", and its support cast (Necrotic
 * Screech) is the loud part of the mob; the peck should read as the small, mean
 * chip damage it actually is.
 *
 * A single hard wedge drives along the firing axis into the target, then a tight
 * necrotic spatter. Built along local +x and rotated to the shot angle — never
 * scaleX-tweened, which would squash the wedge's width on a vertical shot.
 */
export function fxPeck(
  scene: GameScene,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  empowered: boolean,
): void {
  const angle = Math.atan2(toY - fromY, toX - fromX);
  const len = empowered ? 26 : 20;

  // The beak: a wedge that travels the last stretch of the shot line and lands.
  const startX = toX - Math.cos(angle) * 54;
  const startY = toY - Math.sin(angle) * 54;
  const beak = scene.add.graphics({ x: startX, y: startY }).setDepth(DEPTH.FX);
  beak.fillStyle(BEAK, 0.95);
  beak.fillTriangle(0, -4.5, len, 0, 0, 4.5);
  beak.setRotation(angle);
  scene.tweens.add({
    targets: beak,
    x: toX,
    y: toY,
    duration: 120,
    ease: 'Quad.easeIn',
    onComplete: () => {
      scene.tweens.add({
        targets: beak,
        alpha: 0,
        duration: 130,
        ease: 'Quad.easeOut',
        onComplete: () => beak.destroy(),
      });

      const hit = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
      hit.fillStyle(NECROTIC, 0.55);
      hit.fillCircle(0, 0, empowered ? 13 : 10);
      scene.tweens.add({
        targets: hit,
        alpha: 0,
        scaleX: 1.9,
        scaleY: 1.9,
        duration: 200,
        ease: 'Quad.easeOut',
        onComplete: () => hit.destroy(),
      });

      // Small, sour spatter — the vulture is a nuisance, not a bruiser.
      burstFx(scene, 'ptx-dot', toX, toY, empowered ? 9 : 6, 340, {
        tint: NECROTIC,
        speed: { min: 55, max: 165 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.5, end: 0 },
        alpha: { start: 1, end: 0 },
        gravityY: 140,
      });
    },
  });
}
