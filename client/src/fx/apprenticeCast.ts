import type { GameScene } from '../scenes/GameScene';
import type { DotPath } from './dot';
import { burstFx } from './particles';
import { DEPTH } from '../render/depth';

interface CastPalette {
  core: number;
  glow: number;
}

const PALETTE_BY_ELEMENT: Record<DotPath, CastPalette> = {
  poison: { core: 0x61d65a, glow: 0xc8ff8a },
  fire: { core: 0xff6338, glow: 0xffd166 },
  frost: { core: 0x71cfff, glow: 0xe4fbff },
  doom: { core: 0xbc6cff, glow: 0xf0b4ff },
};

/**
 * Apprentice basic attack: a compact, element-tinted rune forms at the caster,
 * then releases a slow spell mote. The impact is supplied by the selected DoT
 * path, keeping each frame's poison/fire/frost/doom hit treatment intact.
 */
export function fxApprenticeCast(
  scene: GameScene,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  element: DotPath,
  empowered: boolean,
  onImpact: () => void,
): void {
  const { core, glow } = PALETTE_BY_ELEMENT[element];
  const size = empowered ? 15 : 11;

  const rune = scene.add.graphics({ x: fromX, y: fromY - 10 }).setDepth(DEPTH.FX);
  rune.lineStyle(empowered ? 2.5 : 2, glow, 0.92);
  rune.strokeCircle(0, 0, size);
  rune.lineStyle(1.25, core, 0.9);
  rune.strokeCircle(0, 0, size * 0.54);
  for (let i = 0; i < 4; i++) {
    const angle = Math.PI / 4 + (i * Math.PI) / 2;
    const x = Math.cos(angle) * size;
    const y = Math.sin(angle) * size;
    rune.lineBetween(x * 0.58, y * 0.58, x, y);
  }
  scene.tweens.add({
    targets: rune,
    rotation: empowered ? Math.PI * 1.5 : Math.PI,
    scaleX: empowered ? 1.65 : 1.35,
    scaleY: empowered ? 1.65 : 1.35,
    alpha: 0,
    duration: empowered ? 260 : 210,
    ease: 'Quad.easeOut',
    onComplete: () => rune.destroy(),
  });

  burstFx(scene, 'ptx-spark', fromX, fromY - 10, empowered ? 8 : 5, 260, {
    tint: glow,
    speed: { min: 25, max: empowered ? 110 : 75 },
    angle: { min: 0, max: 360 },
    scale: { start: empowered ? 0.75 : 0.5, end: 0 },
    alpha: { start: 0.9, end: 0 },
  });

  const mote = scene.add.graphics({ x: fromX, y: fromY - 10 }).setDepth(DEPTH.FX);
  mote.fillStyle(glow, 0.92);
  mote.fillCircle(0, 0, empowered ? 7 : 5);
  mote.fillStyle(core, 1);
  mote.fillCircle(0, 0, empowered ? 4 : 3);

  scene.tweens.add({
    targets: mote,
    x: toX,
    y: toY,
    duration: empowered ? 160 : 190,
    ease: 'Sine.easeIn',
    onUpdate: () => {
      if (Math.random() < 0.45) {
        burstFx(scene, 'ptx-dot', mote.x, mote.y, 1, 220, {
          tint: core,
          speed: { min: 8, max: 28 },
          angle: { min: 0, max: 360 },
          scale: { start: 0.45, end: 0 },
          alpha: { start: 0.7, end: 0 },
        });
      }
    },
    onComplete: () => {
      mote.destroy();
      onImpact();
    },
  });
}

/**
 * Apprentice close-range attack: the caster pulls the same element into a
 * crescent rune at the target rather than releasing a projectile. This keeps
 * the close branch physically immediate while its palette still follows the
 * selected DoT frame/path.
 */
export function fxApprenticeCloseCast(
  scene: GameScene,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  element: DotPath,
  empowered: boolean,
  onImpact: () => void,
): void {
  const { core, glow } = PALETTE_BY_ELEMENT[element];
  const angle = Math.atan2(toY - fromY, toX - fromX);
  const radius = empowered ? 31 : 23;

  // Brief hand-sigil: the spell is being dragged into the enemy, not thrown.
  const handSigil = scene.add.graphics({ x: fromX, y: fromY - 10 }).setDepth(DEPTH.FX);
  handSigil.lineStyle(2, glow, 0.9);
  handSigil.strokeCircle(0, 0, empowered ? 10 : 7);
  scene.tweens.add({
    targets: handSigil,
    scaleX: empowered ? 1.8 : 1.45,
    scaleY: empowered ? 1.8 : 1.45,
    alpha: 0,
    duration: 120,
    ease: 'Quad.easeOut',
    onComplete: () => handSigil.destroy(),
  });

  const crescent = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
  crescent.lineStyle(empowered ? 6 : 4, glow, 0.22);
  crescent.beginPath();
  crescent.arc(0, 0, radius, angle - 1.25, angle + 1.05, false);
  crescent.strokePath();
  crescent.lineStyle(empowered ? 2.5 : 1.75, core, 1);
  crescent.beginPath();
  crescent.arc(0, 0, radius, angle - 1.25, angle + 1.05, false);
  crescent.strokePath();

  const sparkLength = empowered ? 20 : 14;
  const sx = Math.cos(angle) * sparkLength;
  const sy = Math.sin(angle) * sparkLength;
  crescent.lineStyle(1.5, glow, 0.9);
  crescent.lineBetween(-sx, -sy, sx, sy);
  scene.tweens.add({
    targets: crescent,
    rotation: empowered ? 0.8 : 0.55,
    scaleX: empowered ? 1.55 : 1.3,
    scaleY: empowered ? 1.55 : 1.3,
    alpha: 0,
    duration: empowered ? 220 : 170,
    ease: 'Quad.easeOut',
    onComplete: () => {
      crescent.destroy();
      onImpact();
    },
  });

  burstFx(scene, 'ptx-spark', toX, toY, empowered ? 10 : 6, 260, {
    tint: core,
    speed: { min: 45, max: empowered ? 180 : 120 },
    angle: { min: (angle * 180) / Math.PI - 80, max: (angle * 180) / Math.PI + 80 },
    scale: { start: empowered ? 0.85 : 0.6, end: 0 },
    alpha: { start: 0.9, end: 0 },
  });
}
