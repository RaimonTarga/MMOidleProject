import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';
import { DEPTH } from '../render/depth';

let mirrorNextRake = false;

/** A heavy four-claw rake for Forest bears; distinct from Swiftblade's clean X. */
export function fxBearClaws(scene: GameScene, toX: number, toY: number, empowered: boolean): void {
  const mainColor = empowered ? 0x8fc5ff : 0xffd166;
  const glowColor = empowered ? 0xd9eeff : 0xff7148;
  const angle = -Math.PI / 4 + (Math.random() - 0.5) * 0.18;
  const perpendicular = angle + Math.PI / 2;
  const lineLength = empowered ? 92 : 78;
  const mirrorX = mirrorNextRake ? -1 : 1;
  mirrorNextRake = !mirrorNextRake;

  // One enormous paw print: all four talons rake together. Each mark writes from
  // its base to its tip, then the trailing edge follows it so the cut dissolves
  // in the same direction instead of alternately blinking into place.
  const claws = [-24, -8, 8, 24].map(offset => {
    const length = lineLength * (0.9 + Math.random() * 0.16);
    return {
      startX: (-Math.cos(angle) * length + Math.cos(perpendicular) * offset) * mirrorX,
      startY: -Math.sin(angle) * length + Math.sin(perpendicular) * offset,
      endX: (Math.cos(angle) * length + Math.cos(perpendicular) * offset) * mirrorX,
      endY: Math.sin(angle) * length + Math.sin(perpendicular) * offset,
    };
  });
  const rake = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
  const rakeState = { progress: 0 };
  const drawRake = () => {
    const head = Math.min(1, rakeState.progress / 0.55);
    const tail = Math.max(0, (rakeState.progress - 0.35) / 0.65);
    rake.clear();
    for (const claw of claws) {
      const fromX = claw.startX + (claw.endX - claw.startX) * tail;
      const fromY = claw.startY + (claw.endY - claw.startY) * tail;
      const toX = claw.startX + (claw.endX - claw.startX) * head;
      const toY = claw.startY + (claw.endY - claw.startY) * head;
      rake.lineStyle(empowered ? 7 : 6, glowColor, 0.58);
      rake.lineBetween(fromX, fromY, toX, toY);
      rake.lineStyle(empowered ? 4 : 3.5, mainColor, 1);
      rake.lineBetween(fromX, fromY, toX, toY);
    }
  };
  scene.tweens.add({
    targets: rakeState,
    progress: 1,
    duration: 360,
    ease: 'Cubic.easeOut',
    onUpdate: drawRake,
    onComplete: () => rake.destroy(),
  });

  const flash = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
  flash.fillStyle(glowColor, empowered ? 0.75 : 0.62);
  flash.fillCircle(0, 0, empowered ? 34 : 29);
  scene.tweens.add({
    targets: flash,
    alpha: 0,
    scaleX: 2.2,
    scaleY: 2.2,
    duration: 280,
    ease: 'Quad.easeOut',
    onComplete: () => flash.destroy(),
  });

  burstFx(scene, 'ptx-spark', toX, toY, empowered ? 34 : 28, 520, {
    tint: mainColor,
    speed: { min: 90, max: 270 },
    angle: { min: 0, max: 360 },
    scale: { start: 1.15, end: 0 },
    alpha: { start: 1, end: 0 },
    rotate: { min: 0, max: 360 },
  });
}
