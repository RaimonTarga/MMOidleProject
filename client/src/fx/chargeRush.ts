/**
 * CHARGE RUSH — the look of a `chargeOnAggro` speed burst (premium pass for mobs,
 * 2026-09-27). Twenty-odd mobs sprint at up to 3x speed for about a second when they
 * first notice you, and until now nothing said so: the body just arrived.
 *
 * Driven by the `charging` bit on the monster view (the `charge-rush` aura row), so
 * it is drawn exactly while the server applies the burst:
 *   KICK-OFF  a crouch, then a lean into the run; dirt thrown back, a flat ring.
 *   RUN       speed streaks trailing under the body; a sparse afterimage and a
 *             dust puff at the feet on a slow beat.
 *   SKID      the burst ends (it arrived, or was stopped): dust sprays forward
 *             and the body springs upright.
 *
 * The same bit also carries an engage opener's dash (Dive Bomb, Savage Rush, ...).
 * For those the opener module owns the pose, launch and landing, so this layer
 * only draws the run: streaks, and the animal's own beat (feathers, rubble, mist).
 *
 * Budget: a room can hold several chargers at once, so there is no body tint, no
 * shake and no per-frame follower; beats skip bodies off the camera.
 */
import { MONSTER_DATABASE, type MonsterView } from '@mmo-idle/shared';
import type { GameScene } from '../scenes/GameScene';
import { afterimages, posePath, releasePose } from './bodyPose';
import { deg, ring, travelDir } from './bossKit';
import { burstFx } from './particles';
import type { AuraContext } from './auraTypes';
import { OPENER_RUSH, isOpenerFx, openerDashEnd, type OpenerRush } from './engageOpeners';

interface RushPalette {
  /** Kicked-up ground, darkest to lightest. */
  dust: number[];
  /** Streaks and afterimage. */
  streak: number;
  /** Set when the dash is an engage opener's: it owns pose, launch and landing. */
  opener?: OpenerRush;
}

const EARTH: RushPalette = { dust: [0x8a7456, 0xb9a582, 0xd8c8a4], streak: 0xf3ead2 };
const PALETTES: Record<string, RushPalette> = {
  forest: { dust: [0x4f3d28, 0x6f8a3c, 0xa3b86a], streak: 0xe6f2cf },
  jungle: { dust: [0x3f5a26, 0x6fa048, 0xb2d67a], streak: 0xe4f5d0 },
  cave: { dust: [0x4a4550, 0x6f6878, 0x9a93a4], streak: 0xe0dcea },
  graveyard: { dust: [0x4a4a52, 0x7d7a84, 0xb4b0a4], streak: 0xdcd8f0 },
  mountain: { dust: [0x6e6660, 0x9a918a, 0xc8c0b4], streak: 0xf0ece6 },
  tundra: { dust: [0xa9c4d8, 0xd6e6f2, 0xffffff], streak: 0xe8f6ff },
  volcanic: { dust: [0x3a302c, 0x6a5a52, 0xff8a3a], streak: 0xffd2a0 },
  desert: { dust: [0xb8905a, 0xd8b476, 0xf0d9a0], streak: 0xfff0d0 },
  swamp: { dust: [0x3e4a2c, 0x5f6e3c, 0x8a9a5a], streak: 0xe0ecc8 },
};

/** The palette for the monster an aura context is drawing, by its biome. */
export function rushPaletteOf(c: AuraContext): RushPalette {
  const view = c.scene.state.view.get(c.id) as MonsterView | undefined;
  const def = view ? MONSTER_DATABASE.get(view.monsterTypeId) : undefined;
  const base = (def?.biome && PALETTES[def.biome]) || EARTH;
  const fx = def?.engageSequence && 'fx' in def.engageSequence ? def.engageSequence.fx : undefined;
  if (!isOpenerFx(fx)) return base;
  const opener = OPENER_RUSH[fx];
  return { ...base, streak: opener.streak, opener };
}

const feetY = (c: AuraContext): number => c.y + c.h * 0.38;

function onCamera(scene: GameScene, x: number, y: number): boolean {
  const v = scene.cameras.main.worldView;
  const pad = 120;
  return x > v.x - pad && x < v.right + pad && y > v.y - pad && y < v.bottom + pad;
}

/** Kick-off: crouch, lean into the run, and throw the ground back. */
export function chargeKickoff(c: AuraContext, palette: RushPalette): void {
  const { scene, id } = c;
  if (palette.opener || !onCamera(scene, c.x, c.y)) return;
  const dir = travelDir(scene, id) ?? { x: 1, y: 0 };
  const lean = Math.sign(dir.x || 1) * 0.16;
  posePath(scene, id, [
    { sx: 1.1, sy: 0.86, rot: -lean * 0.3, ms: 80 },
    { sx: 0.93, sy: 1.08, rot: lean, ms: 110 },
    // Held; the skid releases it early when the burst ends first.
    { sx: 0.96, sy: 1.04, rot: lean * 0.85, ms: 1600, ease: 'Sine.easeInOut' },
    { sx: 1, sy: 1, rot: 0, ms: 240, ease: 'Back.easeOut' },
  ]);
  const back = deg({ x: -dir.x, y: -dir.y });
  burstFx(scene, 'ptx-dot', c.x, feetY(c), 12, 480, {
    tint: palette.dust,
    speed: { min: 70, max: 190 },
    angle: { min: back - 30, max: back + 30 },
    scale: { start: 0.75, end: 0 },
    alpha: { start: 0.85, end: 0 },
    gravityY: 300,
  });
  ring(scene, c.x, feetY(c), palette.streak, { from: c.w * 0.3, scale: 2.2, width: 2, ms: 320, alpha: 0.5, flat: true });
}

/** Per frame: three speed streaks trailing behind the body, beneath it. */
export function drawChargeStreaks(g: Phaser.GameObjects.Graphics, c: AuraContext, palette: RushPalette): void {
  const dir = travelDir(c.scene, c.id);
  if (!dir) return;
  const len = c.w * 0.9;
  const phase = (c.age / 70) % 1;
  for (let i = -1; i <= 1; i++) {
    // Perpendicular offset spreads the streaks across the body's width.
    const off = i * c.w * 0.22;
    const ox = c.x - dir.y * off;
    const oy = c.y + c.h * 0.08 + dir.x * off;
    const start = c.w * (0.3 + Math.abs(i) * 0.12) + phase * 6;
    const l = len * (i === 0 ? 1 : 0.7);
    g.lineStyle(i === 0 ? 3 : 2, palette.streak, (i === 0 ? 0.55 : 0.38) * c.s);
    g.lineBetween(ox - dir.x * start, oy - dir.y * start, ox - dir.x * (start + l), oy - dir.y * (start + l));
  }
}

/** On a slow beat: a single afterimage and a puff of dust at the feet. */
export function chargeBeat(c: AuraContext, palette: RushPalette): void {
  if (!onCamera(c.scene, c.x, c.y)) return;
  afterimages(c.scene, c.id, { count: 1, everyMs: 0, tint: palette.streak, alpha: 0.28, fadeMs: 220 });
  if (palette.opener) {
    palette.opener.beat(c.scene, c.x, c.y);
    return;
  }
  burstFx(c.scene, 'ptx-dot', c.x, feetY(c), 3, 420, {
    tint: palette.dust,
    speed: { min: 10, max: 40 },
    angle: { min: 200, max: 340 },
    scale: { start: 0.9, end: 1.6 },
    alpha: { start: 0.45, end: 0 },
    gravityY: -20,
  });
}

/** The burst ends: skid dust sprays forward and the body springs upright. */
export function chargeSkid(c: AuraContext, palette: RushPalette): void {
  if (palette.opener) {
    openerDashEnd(c.scene, c.id);
    return;
  }
  releasePose(c.scene, c.id, 260);
  if (!onCamera(c.scene, c.x, c.y)) return;
  const dir = travelDir(c.scene, c.id);
  const fwd = dir ? deg(dir) : 90;
  burstFx(c.scene, 'ptx-dot', c.x, feetY(c), 8, 420, {
    tint: palette.dust,
    speed: { min: 40, max: 120 },
    angle: { min: fwd - 50, max: fwd + 50 },
    scale: { start: 0.8, end: 0.2 },
    alpha: { start: 0.7, end: 0 },
    gravityY: 200,
  });
}
