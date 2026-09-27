/**
 * WASTELAND boss, animated (redesign 2026-09-27) — the commander and its army.
 *
 *   HEXES        the hex's sigil draws itself over the victim as the clock; a hex
 *                bolt flies and the sigil sinks into them. Purple Ruin, pale Grave
 *                Chill, green Withering. A stun fizzles it.
 *   RECLAIM      it glides to the bodies (a necrotic trail), then the Raise sigil.
 *   THE WRATH    Grave Burst circles fill with runes and bone erupts; a Bone Spear's
 *                shadow narrows and the spear falls; a Soul Nova gathers souls in
 *                and bursts. The feeding glow is the `harvest-wrath` aura.
 */
import type { GameScene } from '../scenes/GameScene';
import { DEPTH } from '../render/depth';
import { burstFx } from './particles';
import { posePath, releasePose, tweenPose } from './bodyPose';
import { impact } from './impactFeel';
import { castTargetId, follow, registerWindup, spriteAt, type Pt } from './windups';
import { drawSigil, ring } from './bossKit';
import type { HuntPalette } from './jungleBoss';

const NECRO = 0x8fe0a0;
const NECRO_DEEP = 0x6a4a9e;
const BONE = 0xe8e0d0;

export const NECRO_HUNT: HuntPalette = { trail: NECRO, debris: [NECRO, NECRO_DEEP, 0x3a2a4a] };

export type HexKind = 'ruin' | 'chill' | 'wither';
const HEX_COLOR: Record<HexKind, number> = { ruin: 0xa76ae0, chill: 0x9fdcff, wither: 0x9ad65a };

/** A hex: the sigil forms over the victim as the clock; a bolt delivers it. */
export function fxHexWindup(scene: GameScene, id: string, castMs: number, kind: HexKind, fx: string): void {
  const me = spriteAt(scene, id);
  if (!me) return;
  const color = HEX_COLOR[kind];
  const targetId = castTargetId(scene, id);
  tweenPose(scene, id, { sx: 0.94, sy: 1.1, lift: 6, rot: -0.05 }, castMs * 0.8, 'Quad.easeOut');
  const g = scene.add.graphics().setDepth(DEPTH.FX + 1);
  const began = performance.now();
  let last: Pt = spriteAt(scene, targetId) ?? me;
  const stop = follow(scene, () => {
    const at = spriteAt(scene, targetId) ?? last;
    last = at;
    const k = Math.min(1, (performance.now() - began) / castMs);
    g.clear();
    drawSigil(g, at.x, at.y - 56, 15, k, color, 0.95, performance.now() / 700, kind === 'ruin' ? 5 : 3);
    // Wisps coiling at the caster's hand.
    const p = spriteAt(scene, id) ?? me;
    g.fillStyle(color, 0.35 + 0.4 * k);
    g.fillCircle(p.x + 18, p.y - 30, 5 + 4 * k);
    return true;
  });
  registerWindup(scene, id, {
    fire: (hit) => {
      stop();
      g.destroy();
      const from = spriteAt(scene, id) ?? me;
      const to = hit ?? last;
      posePath(scene, id, [
        { sx: 1.08, sy: 0.94, lift: 0, rot: 0.06, ms: 90, ease: 'Quad.easeIn' },
        { sx: 1, sy: 1, rot: 0, ms: 300, ease: 'Back.easeOut' },
      ]);
      // The bolt.
      const bolt = scene.add.graphics().setDepth(DEPTH.FX + 1).setBlendMode(Phaser.BlendModes.ADD);
      bolt.fillStyle(color, 1);
      bolt.fillCircle(0, 0, 6);
      bolt.fillStyle(0xffffff, 0.8);
      bolt.fillCircle(0, 0, 2.5);
      bolt.setPosition(from.x + 18, from.y - 30);
      scene.tweens.add({
        targets: bolt,
        x: to.x,
        y: to.y - 20,
        duration: 180,
        ease: 'Quad.easeIn',
        onUpdate: () => burstFx(scene, 'ptx-dot', bolt.x, bolt.y, 1, 300, {
          tint: color, speed: { min: 0, max: 15 }, scale: { start: 0.5, end: 0 }, alpha: { start: 0.8, end: 0 },
        }),
        onComplete: () => {
          bolt.destroy();
          // The sigil sinks into the victim.
          const mark = scene.add.graphics({ x: to.x, y: to.y - 56 }).setDepth(DEPTH.FX + 1);
          drawSigil(mark, 0, 0, 15, 1, color, 1, 0, kind === 'ruin' ? 5 : 3);
          scene.tweens.add({
            targets: mark, y: to.y - 10, scaleX: 0.3, scaleY: 0.3, alpha: 0, duration: 260,
            ease: 'Quad.easeIn', onComplete: () => mark.destroy(),
          });
          ring(scene, to.x, to.y, color, { from: 14, scale: 3, width: 3, ms: 320 });
        },
      });
    },
    cancel: () => {
      stop();
      burstFx(scene, 'ptx-dot', last.x, last.y - 56, 10, 380, {
        tint: color, speed: { min: 30, max: 90 }, angle: { min: 0, max: 360 },
        scale: { start: 0.5, end: 0 }, alpha: { start: 1, end: 0 },
      });
      g.destroy();
      releasePose(scene, id);
    },
  }, { fx });
}

/** Grave Burst wind-up: arms raised, the dead's power drawn up. */
export function fxGraveCast(scene: GameScene, id: string, castMs: number): void {
  const me = spriteAt(scene, id);
  if (!me) return;
  posePath(scene, id, [
    { sx: 0.9, sy: 1.16, lift: 8, ms: castMs * 0.7, ease: 'Quad.easeOut' },
    { sx: 1.08, sy: 0.92, lift: 0, ms: 90, ease: 'Quad.easeIn' },
    { sx: 1, sy: 1, ms: 300, ease: 'Back.easeOut' },
  ]);
  burstFx(scene, 'ptx-spark', me.x, me.y - 20, 16, castMs, {
    tint: [NECRO, NECRO_DEEP],
    speed: { min: 30, max: 90 },
    angle: { min: 250, max: 290 },
    scale: { start: 0.6, end: 0 },
    alpha: { start: 1, end: 0 },
    gravityY: -80,
  });
}

/** Grave Burst circle: runes fill the ring; bone tips push up at the end. */
export function drawGraveBurstTelegraph(
  g: Phaser.GameObjects.Graphics, x: number, y: number, radius: number, progress: number, seed: number,
): void {
  g.fillStyle(0x1a0f22, 0.22 + 0.2 * progress);
  g.fillCircle(x, y, radius);
  drawSigil(g, x, y, radius * 0.92, progress, NECRO, 0.5 + 0.4 * progress, seed + progress * 1.5, 5, 0.55);
  if (progress > 0.7) {
    const k = (progress - 0.7) / 0.3;
    g.fillStyle(BONE, 0.9);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + seed;
      const px = x + Math.cos(a) * radius * 0.45;
      const py = y + Math.sin(a) * radius * 0.25;
      g.fillTriangle(px - 4, py, px + 4, py, px, py - 12 * k);
    }
  }
}

/** Grave Burst eruption: bone spikes thrust up through necrotic flame. */
export function fxGraveBurst(scene: GameScene, x: number, y: number, radius: number): void {
  const spikes = scene.add.graphics({ x, y }).setDepth(DEPTH.FX);
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const px = Math.cos(a) * radius * 0.45;
    const py = Math.sin(a) * radius * 0.22;
    const h = 30 + (i % 3) * 12;
    spikes.fillStyle(BONE, 1);
    spikes.fillTriangle(px - 6, py, px + 6, py, px + (i % 2 ? 3 : -3), py - h);
  }
  spikes.fillStyle(BONE, 1);
  spikes.fillTriangle(-9, 0, 9, 0, 0, -58);
  spikes.setScale(1, 0.1);
  scene.tweens.add({
    targets: spikes, scaleY: 1, duration: 90, ease: 'Back.easeOut',
    onComplete: () => scene.tweens.add({ targets: spikes, alpha: 0, delay: 260, duration: 300, onComplete: () => spikes.destroy() }),
  });
  burstFx(scene, 'ptx-dot', x, y, 16, 620, {
    tint: [NECRO, NECRO_DEEP, BONE],
    speed: { min: 60, max: 180 },
    angle: { min: 220, max: 320 },
    scale: { start: 0.8, end: 0 },
    alpha: { start: 1, end: 0 },
    gravityY: 200,
  });
  impact(scene, 'light', { x, y });
}

/** Bone Spear circle: the spear's shadow narrows, then the spear drops in. */
export function drawBoneSpearTelegraph(
  g: Phaser.GameObjects.Graphics, x: number, y: number, radius: number, progress: number,
): void {
  g.fillStyle(0x000000, 0.15 + 0.3 * progress);
  g.fillEllipse(x, y, radius * 1.4 * (1.2 - 0.6 * progress), radius * 0.55 * (1.2 - 0.6 * progress));
  if (progress > 0.6) {
    const fall = 1 - (progress - 0.6) / 0.4;
    const top = y - 30 - fall * fall * 260;
    g.fillStyle(BONE, 1);
    g.fillTriangle(x - 5, top - 70, x + 5, top - 70, x, top);
    g.fillStyle(0xbfb3a0, 1);
    g.fillRect(x - 3, top - 110, 6, 42);
  }
}

/** Bone Spear landing: shards and a ring. */
export function fxBoneSpear(scene: GameScene, x: number, y: number, radius: number): void {
  burstFx(scene, 'ptx-dot', x, y, 16, 480, {
    tint: [BONE, 0xbfb3a0, NECRO],
    speed: { min: 90, max: 240 },
    angle: { min: 200, max: 340 },
    scale: { start: 0.7, end: 0 },
    alpha: { start: 1, end: 0 },
    gravityY: 420,
  });
  ring(scene, x, y, BONE, { from: radius * 0.5, scale: 2.2, width: 4, flat: true, ms: 320 });
  impact(scene, 'medium', { x, y });
}

/** Soul Nova circle: souls spiralling in toward the caster. */
export function drawSoulNovaTelegraph(
  g: Phaser.GameObjects.Graphics, x: number, y: number, radius: number, progress: number,
): void {
  const t = performance.now() / 1000;
  for (let i = 0; i < 8; i++) {
    const a = t * 3 + (i / 8) * Math.PI * 2;
    const r = radius * (1 - progress * 0.75);
    g.fillStyle(NECRO, 0.5 + 0.4 * progress);
    g.fillCircle(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.6, 4);
  }
}

/** Soul Nova bursting: a necrotic wave and souls thrown outward. */
export function fxSoulNova(scene: GameScene, x: number, y: number, radius: number): void {
  ring(scene, x, y, NECRO, { from: 30, scale: radius / 30, width: 8, ms: 420 });
  ring(scene, x, y, NECRO_DEEP, { from: 30, scale: radius / 34, width: 4, ms: 480, delay: 60 });
  burstFx(scene, 'ptx-dot', x, y, 24, 700, {
    tint: [NECRO, NECRO_DEEP],
    speed: { min: 180, max: 360 },
    angle: { min: 0, max: 360 },
    scale: { start: 0.8, end: 0 },
    alpha: { start: 1, end: 0 },
  });
  impact(scene, 'medium', { x, y });
}
