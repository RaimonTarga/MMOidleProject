import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';
import { DEPTH } from '../render/depth';
import type { AttackTint } from './elementTint';

/**
 * Lancer (`cadence-range-mid`) basic attack.
 *
 * The range choice is the animation: a Striker who bought reach should not keep
 * swinging the In-Fighter's crescent. This is a committed straight thrust — the
 * shaft drives out along the attack vector, the leaf-shaped head punches the
 * target, then the whole weapon is pulled back. The distance crossed IS the
 * ability, so unlike a slash both endpoints matter.
 *
 * Palette follows cadence: white steel at baseline, blue on the surge. An
 * optional elemental `tint` recolors the glow, the shaft and the debris; the
 * bright head keeps the archetype color so the empowered read survives.
 */

const BASE_CORE = 0xffffff;
const BASE_SHAFT = 0xc8b394;
const BASE_GLOW = 0xffe3a0;
const EMP_CORE = 0xdfefff;
const EMP_SHAFT = 0x9fb6d8;
const EMP_GLOW = 0x4499ff;

export function fxSpearThrust(
  scene: GameScene,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  empowered: boolean,
  tint?: AttackTint,
): void {
  const core = empowered ? EMP_CORE : BASE_CORE;
  const shaftColor = tint?.glow ?? (empowered ? EMP_SHAFT : BASE_SHAFT);
  const glow = tint?.glow ?? (empowered ? EMP_GLOW : BASE_GLOW);
  const spark = tint?.particles ?? core;

  const angle = Math.atan2(toY - fromY, toX - fromX);
  const ax = Math.cos(angle);
  const ay = Math.sin(angle);
  const px = -ay;
  const py = ax;
  const reach = Math.hypot(toX - fromX, toY - fromY);

  // Grip sits a little ahead of the body; the tip overshoots the target so the
  // head visibly passes through it rather than stopping politely at the edge.
  const gripDist = Math.min(22, reach * 0.25);
  const tipDist = reach + (empowered ? 16 : 11);
  const headLen = empowered ? 26 : 20;
  const headHalfWidth = empowered ? 7.5 : 5.5;
  const shaftWidth = empowered ? 5 : 3.75;

  const g = scene.add.graphics({ x: fromX, y: fromY }).setDepth(DEPTH.FX);
  const state = { extend: 0, alpha: 1 };

  const draw = (): void => {
    g.clear();
    const tip = gripDist + (tipDist - gripDist) * state.extend;
    // The butt of the shaft trails the tip, so the weapon reads as a fixed
    // length being driven forward instead of a line growing out of the player.
    const butt = Math.max(0, tip - (empowered ? 108 : 88));
    const a = state.alpha;

    // Motion blur behind the shaft, widest while the thrust is still travelling.
    const blur = (1 - Math.abs(state.extend - 0.55) * 1.6) * 0.35;
    if (blur > 0) {
      g.lineStyle(shaftWidth * 3.4, glow, blur * a);
      g.lineBetween(ax * butt, ay * butt, ax * tip, ay * tip);
    }

    g.lineStyle(shaftWidth, shaftColor, 0.95 * a);
    g.lineBetween(ax * butt, ay * butt, ax * (tip - headLen * 0.7), ay * (tip - headLen * 0.7));

    // Leaf head: a narrow kite along the axis, bright edge over a soft glow.
    const kite = (length: number, halfWidth: number): Phaser.Types.Math.Vector2Like[] => {
      const baseD = tip - length;
      const shoulderD = tip - length * 0.34;
      return [
        { x: ax * baseD, y: ay * baseD },
        { x: ax * shoulderD + px * halfWidth, y: ay * shoulderD + py * halfWidth },
        { x: ax * tip, y: ay * tip },
        { x: ax * shoulderD - px * halfWidth, y: ay * shoulderD - py * halfWidth },
      ];
    };

    g.fillStyle(glow, 0.45 * a);
    g.fillPoints(kite(headLen * 1.14, headHalfWidth * 1.7), true);
    g.fillStyle(core, a);
    g.fillPoints(kite(headLen, headHalfWidth), true);
  };

  draw();

  // Thrust out fast, hold nothing, pull back slower — the recovery is what sells
  // the weight of a two-handed reach weapon.
  scene.tweens.add({
    targets: state,
    extend: 1,
    duration: empowered ? 105 : 90,
    ease: 'Quart.easeOut',
    onUpdate: draw,
    onComplete: () => {
      impact();
      scene.tweens.add({
        targets: state,
        extend: 0.12,
        alpha: 0,
        duration: empowered ? 200 : 165,
        ease: 'Quad.easeIn',
        onUpdate: draw,
        onComplete: () => g.destroy(),
      });
    },
  });

  function impact(): void {
    // A tight puncture ring rather than a broad shockwave: the damage went into
    // one point, not across an arc.
    const ring = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
    ring.lineStyle(empowered ? 3 : 2.25, core, 1);
    ring.strokeEllipse(0, 0, 10, 22);
    ring.setRotation(angle);
    scene.tweens.add({
      targets: ring,
      scaleX: empowered ? 2.2 : 1.7,
      scaleY: empowered ? 3.4 : 2.6,
      alpha: 0,
      duration: 260,
      ease: 'Quad.easeOut',
      onComplete: () => ring.destroy(),
    });

    const flash = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
    flash.fillStyle(glow, empowered ? 0.65 : 0.5);
    flash.fillCircle(0, 0, empowered ? 17 : 13);
    scene.tweens.add({
      targets: flash,
      alpha: 0,
      scaleX: 1.9,
      scaleY: 1.9,
      duration: 180,
      ease: 'Quad.easeOut',
      onComplete: () => flash.destroy(),
    });

    // Debris sprays BACK along the shaft, the way a puncture actually throws it.
    const backDeg = (angle * 180) / Math.PI + 180;
    burstFx(scene, 'ptx-spark', toX, toY, empowered ? 16 : 11, 340, {
      tint: spark,
      speed: { min: 80, max: empowered ? 260 : 190 },
      angle: { min: backDeg - 34, max: backDeg + 34 },
      scale: { start: empowered ? 0.9 : 0.7, end: 0 },
      alpha: { start: 1, end: 0 },
      rotate: { min: 0, max: 360 },
    });
  }
}
