import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';
import { DEPTH } from '../render/depth';
import type { AttackTint } from './elementTint';

/**
 * Stormdancer (`energy-light-a`) basic attack.
 *
 * This is the one path whose design NAMES a look: "your lightning condenses into
 * daggers", with a Blue Shift at low energy that hits harder and a Red Shift at
 * high energy that hits lighter but faster. None of it was rendered — Stormdancer
 * fired the stock Spirit zigzag, and the only `dagger` strings in the client
 * belong to an unrelated weapon reservoir.
 *
 * So the bolt is condensed into an actual blade: an elongated diamond that stabs
 * along the attack vector, with a short crackling tail instead of a full zigzag.
 * `shiftPct` is energy/energyMax × 100 (the same number the HUD labels Blue below
 * 50 and Red above), and it drives BOTH the palette and the weight — a Blue
 * dagger is long and heavy, a Red one is short, bright and quick.
 */

/** Blue Shift: low energy, heavy hits. */
const BLUE_CORE = 0xdff0ff;
const BLUE_BODY = 0x4f8cff;
/** Red Shift: high energy, fast light hits. */
const RED_CORE = 0xffe8e0;
const RED_BODY = 0xff5a4a;

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Blue and red sit on opposite sides of the hue circle, so a channel-wise lerp
 * would pass through grey at the midpoint. Stepping instead of interpolating
 * keeps both shifts saturated, and the HUD already treats 50 as a hard boundary
 * ("Blue Shift" / "Red Shift") rather than a gradient — so the visual matches
 * the label instead of contradicting it.
 */
function shiftPalette(shiftPct: number): { core: number; body: number } {
  return shiftPct >= 50
    ? { core: RED_CORE, body: RED_BODY }
    : { core: BLUE_CORE, body: BLUE_BODY };
}

export function fxLightningDagger(
  scene: GameScene,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  shiftPct: number,
  empowered: boolean,
  tint?: AttackTint,
): void {
  const { core, body: shiftBody } = shiftPalette(shiftPct);
  const body = tint?.glow ?? shiftBody;
  const spark = tint?.particles ?? core;

  // Within a shift, weight still slides with energy: 0 is the heaviest Blue,
  // 100 the lightest Red.
  const weight = 1 - Math.max(0, Math.min(100, shiftPct)) / 100;
  const bladeLen = lerp(20, 34, weight) * (empowered ? 1.35 : 1);
  const bladeHalf = lerp(4, 7.5, weight) * (empowered ? 1.3 : 1);

  const angle = Math.atan2(toY - fromY, toX - fromX);
  const ax = Math.cos(angle);
  const ay = Math.sin(angle);
  const px = -ay;
  const py = ax;

  // The dagger sits ON the target, pointing the way it travelled.
  const g = scene.add.graphics({ x: toX, y: toY }).setDepth(DEPTH.FX);
  const diamond = (length: number, halfWidth: number): Phaser.Types.Math.Vector2Like[] => [
    { x: ax * length * 0.5, y: ay * length * 0.5 },
    { x: px * halfWidth, y: py * halfWidth },
    { x: -ax * length * 0.5, y: -ay * length * 0.5 },
    { x: -px * halfWidth, y: -py * halfWidth },
  ];
  g.fillStyle(body, 0.45);
  g.fillPoints(diamond(bladeLen * 1.25, bladeHalf * 1.8), true);
  g.fillStyle(core, 0.98);
  g.fillPoints(diamond(bladeLen, bladeHalf), true);

  // A short crackle behind it — the tail of the bolt that became the blade.
  // Two or three segments only; a full zigzag is what this replaces.
  g.lineStyle(1.5, core, 0.8);
  let tx = -ax * bladeLen * 0.5;
  let ty = -ay * bladeLen * 0.5;
  for (let i = 0; i < 3; i++) {
    const jitter = (Math.random() - 0.5) * 12;
    const nx = tx - ax * 11 + px * jitter;
    const ny = ty - ay * 11 + py * jitter;
    g.lineBetween(tx, ty, nx, ny);
    tx = nx;
    ty = ny;
  }

  // Red Shift is faster in fact, so it is faster on screen too.
  const dur = lerp(110, 190, weight);
  g.setScale(0.55, 1);
  scene.tweens.add({
    targets: g,
    scaleX: 1.15,
    alpha: 0,
    duration: dur,
    ease: 'Quart.easeOut',
    onComplete: () => g.destroy(),
  });

  burstFx(scene, 'ptx-spark', toX, toY, empowered ? 14 : 9, 300, {
    tint: spark,
    speed: { min: 70, max: empowered ? 250 : 180 },
    angle: { min: 0, max: 360 },
    scale: { start: empowered ? 0.9 : 0.7, end: 0 },
    alpha: { start: 1, end: 0 },
    rotate: { min: 0, max: 360 },
  });
}
