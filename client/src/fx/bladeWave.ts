import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';
import { DEPTH } from '../render/depth';
import type { AttackTint } from './elementTint';

/**
 * Phantom-Blade (`cadence-range-far`) basic attack.
 *
 * A Striker who bought 120 extra range fights at 132px with a sword, and the
 * In-Fighter's crescent simply appeared on a target that far away with nothing
 * connecting the two — the swing had no cause.
 *
 * So the cut is thrown. A tapered crescent detaches from the blade and travels
 * the whole gap, thinning and stretching as it goes, then opens on the target.
 * The distance crossed IS the range node, so like the Lancer's thrust this FX
 * genuinely needs both endpoints.
 *
 * Palette follows cadence: white steel at baseline, blue on the surge.
 */

const BASE_CORE = 0xffffff;
const BASE_GLOW = 0xbcd4ff;
const EMP_CORE = 0xdfefff;
const EMP_GLOW = 0x4499ff;

const SEGMENTS = 20;

export function fxBladeWave(
  scene: GameScene,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  empowered: boolean,
  tint?: AttackTint,
): void {
  const core = empowered ? EMP_CORE : BASE_CORE;
  const glow = tint?.glow ?? (empowered ? EMP_GLOW : BASE_GLOW);
  const spark = tint?.particles ?? core;

  const angle = Math.atan2(toY - fromY, toX - fromX);
  const ax = Math.cos(angle);
  const ay = Math.sin(angle);
  const px = -ay;
  const py = ax;
  const dist = Math.hypot(toX - fromX, toY - fromY);

  const halfLen = empowered ? 40 : 32;
  const maxWidth = empowered ? 7 : 5;
  const bow = empowered ? 16 : 13;

  // Launch just ahead of the swing so the wave is never drawn inside the player.
  const launch = Math.min(24, dist * 0.3);

  const wave = scene.add.graphics().setDepth(DEPTH.FX);
  const flight = { t: 0 };

  const draw = (): void => {
    const t = flight.t;
    const travel = launch + (dist - launch) * t;
    const cx = fromX + ax * travel;
    const cy = fromY + ay * travel;
    // The crescent stretches along its own chord and thins as it flies — a
    // released edge losing coherence, rather than a rigid sprite sliding across.
    const stretch = 1 + t * 0.5;
    const thin = 1 - t * 0.35;

    wave.clear();
    for (let i = 0; i < SEGMENTS; i++) {
      const t0 = i / SEGMENTS;
      const t1 = (i + 1) / SEGMENTS;
      const pt = (u: number): { x: number; y: number } => {
        const along = (u * 2 - 1) * halfLen * stretch;
        const belly = Math.sin(Math.PI * u) * bow;
        return {
          x: cx + px * along + ax * belly,
          y: cy + py * along + ay * belly,
        };
      };
      const p0 = pt(t0);
      const p1 = pt(t1);
      const w =
        maxWidth * thin * Math.pow(Math.sin(Math.PI * ((t0 + t1) / 2)), 0.55);
      wave.lineStyle(w * 2.2, glow, 0.3);
      wave.lineBetween(p0.x, p0.y, p1.x, p1.y);
      wave.lineStyle(w, core, 0.95);
      wave.lineBetween(p0.x, p0.y, p1.x, p1.y);
    }
  };

  draw();
  scene.tweens.add({
    targets: flight,
    t: 1,
    duration: empowered ? 150 : 130,
    ease: 'Sine.easeIn',
    onUpdate: draw,
    onComplete: () => {
      wave.destroy();
      land();
    },
  });

  // A short release flare at the blade, so the throw has a visible origin.
  const release = scene.add
    .graphics({ x: fromX + ax * launch * 0.5, y: fromY + ay * launch * 0.5 })
    .setDepth(DEPTH.FX);
  release.lineStyle(empowered ? 3 : 2, core, 0.8);
  release.beginPath();
  release.arc(0, 0, empowered ? 20 : 15, angle - 1.1, angle + 1.1, false);
  release.strokePath();
  scene.tweens.add({
    targets: release,
    alpha: 0,
    scaleX: 1.5,
    scaleY: 1.5,
    duration: 160,
    ease: 'Quad.easeOut',
    onComplete: () => release.destroy(),
  });

  function land(): void {
    // The cut opens across the target, perpendicular to the flight path.
    // Drawn along LOCAL +x then rotated perpendicular to the flight path, so
    // the scaleX "open up" tween runs along the cut's own length at any angle.
    const cut = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
    const len = empowered ? 46 : 36;
    cut.lineStyle(empowered ? 5 : 3.5, glow, 0.4);
    cut.lineBetween(-len, 0, len, 0);
    cut.lineStyle(empowered ? 2.25 : 1.5, core, 1);
    cut.lineBetween(-len, 0, len, 0);
    cut.setRotation(angle + Math.PI / 2);
    cut.setScale(0.6, 1);
    scene.tweens.add({
      targets: cut,
      scaleX: 1.25,
      alpha: 0,
      duration: 220,
      ease: 'Quad.easeOut',
      onComplete: () => cut.destroy(),
    });

    const flash = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
    flash.fillStyle(glow, empowered ? 0.6 : 0.45);
    flash.fillCircle(0, 0, empowered ? 20 : 15);
    scene.tweens.add({
      targets: flash,
      alpha: 0,
      scaleX: 2,
      scaleY: 2,
      duration: 200,
      ease: 'Quad.easeOut',
      onComplete: () => flash.destroy(),
    });

    // Debris follows the flight direction — the wave carried through.
    const fwdDeg = (angle * 180) / Math.PI;
    burstFx(scene, 'ptx-spark', toX, toY, empowered ? 16 : 11, 380, {
      tint: spark,
      speed: { min: 80, max: empowered ? 270 : 200 },
      angle: { min: fwdDeg - 55, max: fwdDeg + 55 },
      scale: { start: empowered ? 0.9 : 0.7, end: 0 },
      alpha: { start: 1, end: 0 },
      rotate: { min: 0, max: 360 },
    });
  }
}
