import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';
import { DEPTH } from '../render/depth';
import type { AttackTint } from './elementTint';

/**
 * Phalanx (`cooldown-range-mid`) basic attack.
 *
 * Squire's mid pick buys 60 reach (12 -> 72px), the same jump the Striker's
 * Lancer makes — so it needs a reach animation too, and it must not be mistaken
 * for the Lancer's. The two are deliberately opposite readings of a polearm:
 *
 *   Lancer   a committed LUNGE. Thin shaft, leaf head, fast out, slow recovery,
 *            a puncture. The weapon travels a long way.
 *   Phalanx  a planted BRACE. The pike is already set; it punches a short way
 *            and snaps back, with a broad blunt head and the Squire's concentric
 *            rings. The weapon barely moves — the weight does the work.
 *
 * Palette follows cooldown: hot orange at baseline, white on the execution.
 */

const BASE_CORE = 0xffd9a0;
const BASE_SHAFT = 0x8f7a5c;
const BASE_GLOW = 0xffaa22;
const EXEC_CORE = 0xffffff;
const EXEC_SHAFT = 0xa8b4cc;
const EXEC_GLOW = 0xaabbff;

export function fxPikeBrace(
  scene: GameScene,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  execution: boolean,
  tint?: AttackTint,
): void {
  const core = execution ? EXEC_CORE : BASE_CORE;
  const shaftColor = tint?.glow ?? (execution ? EXEC_SHAFT : BASE_SHAFT);
  const glow = tint?.glow ?? (execution ? EXEC_GLOW : BASE_GLOW);
  const spark = tint?.particles ?? core;

  const angle = Math.atan2(toY - fromY, toX - fromX);
  const ax = Math.cos(angle);
  const ay = Math.sin(angle);
  const px = -ay;
  const py = ax;
  const reach = Math.hypot(toX - fromX, toY - fromY);

  const headLen = execution ? 22 : 18;
  const headHalfWidth = execution ? 13 : 10.5;
  const shaftWidth = execution ? 7 : 5.5;

  // The pike starts ALREADY SET at most of its reach — the brace is the stance,
  // not a wind-up — and punches the last stretch. Compare the Lancer, which
  // starts at the grip and crosses the whole gap.
  const setDist = reach * 0.72;
  const punchDist = reach + (execution ? 12 : 8);

  // Brace flourish: a short bar planted across the attacker's front, so the
  // stance reads even though the weapon hardly travels.
  const brace = scene.add.graphics({ x: fromX, y: fromY + 4 }).setDepth(DEPTH.FX);
  brace.lineStyle(execution ? 3.5 : 2.5, glow, 0.75);
  brace.lineBetween(-px * 16, -py * 16, px * 16, py * 16);
  scene.tweens.add({
    targets: brace,
    alpha: 0,
    scaleX: 1.4,
    scaleY: 1.4,
    duration: 240,
    ease: 'Quad.easeOut',
    onComplete: () => brace.destroy(),
  });

  const g = scene.add.graphics({ x: fromX, y: fromY }).setDepth(DEPTH.FX);
  const state = { tip: setDist, alpha: 1 };

  const draw = (): void => {
    g.clear();
    const tip = state.tip;
    const butt = Math.max(0, tip - (execution ? 118 : 100));
    const a = state.alpha;

    g.lineStyle(shaftWidth * 2.4, glow, 0.18 * a);
    g.lineBetween(ax * butt, ay * butt, ax * tip, ay * tip);
    g.lineStyle(shaftWidth, shaftColor, 0.95 * a);
    g.lineBetween(ax * butt, ay * butt, ax * (tip - headLen * 0.6), ay * (tip - headLen * 0.6));

    // Broad blunt head: a wide wedge whose shoulders sit AT the base, giving a
    // hammer/axe silhouette rather than the Lancer's tapering leaf.
    const wedge = (length: number, halfWidth: number): Phaser.Types.Math.Vector2Like[] => {
      const baseD = tip - length;
      return [
        { x: ax * baseD + px * halfWidth * 0.55, y: ay * baseD + py * halfWidth * 0.55 },
        { x: ax * (tip - length * 0.2) + px * halfWidth, y: ay * (tip - length * 0.2) + py * halfWidth },
        { x: ax * tip, y: ay * tip },
        { x: ax * (tip - length * 0.2) - px * halfWidth, y: ay * (tip - length * 0.2) - py * halfWidth },
        { x: ax * baseD - px * halfWidth * 0.55, y: ay * baseD - py * halfWidth * 0.55 },
      ];
    };
    g.fillStyle(glow, 0.4 * a);
    g.fillPoints(wedge(headLen * 1.16, headHalfWidth * 1.55), true);
    g.fillStyle(core, a);
    g.fillPoints(wedge(headLen, headHalfWidth), true);
  };

  draw();

  // Snap out hard, hold at full extension, then withdraw slowly. The hold is
  // what makes it feel planted instead of thrown.
  scene.tweens.add({
    targets: state,
    tip: punchDist,
    duration: execution ? 110 : 95,
    ease: 'Expo.easeOut',
    onUpdate: draw,
    onComplete: () => {
      impact();
      scene.tweens.add({
        targets: state,
        tip: setDist * 0.9,
        alpha: 0,
        delay: 70,
        duration: execution ? 260 : 220,
        ease: 'Quad.easeInOut',
        onUpdate: draw,
        onComplete: () => g.destroy(),
      });
    },
  });

  function impact(): void {
    // Concentric rings — the Squire's blunt language, not the Lancer's puncture.
    for (let i = 0; i < 2; i++) {
      const ring = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
      ring.lineStyle(3 - i * 0.6, i === 0 ? core : glow, 1);
      ring.strokeCircle(0, 0, 8 + i * 7);
      scene.tweens.add({
        targets: ring,
        scaleX: 3.2 + i,
        scaleY: 3.2 + i,
        alpha: 0,
        duration: 280 + i * 60,
        ease: 'Power2',
        onComplete: () => ring.destroy(),
      });
    }

    const flash = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
    flash.fillStyle(glow, execution ? 0.75 : 0.6);
    flash.fillCircle(0, 0, execution ? 22 : 17);
    scene.tweens.add({
      targets: flash,
      alpha: 0,
      scaleX: 1.8,
      scaleY: 1.8,
      duration: 180,
      ease: 'Quad.easeOut',
      onComplete: () => flash.destroy(),
    });

    // Blunt trauma throws debris outward and down, not back along a shaft.
    burstFx(scene, 'ptx-dot', toX, toY, execution ? 16 : 10, 420, {
      tint: spark,
      speed: { min: 80, max: execution ? 260 : 190 },
      angle: { min: 0, max: 360 },
      scale: { start: execution ? 0.8 : 0.6, end: 0 },
      alpha: { start: 1, end: 0 },
      gravityY: 260,
    });
  }
}
