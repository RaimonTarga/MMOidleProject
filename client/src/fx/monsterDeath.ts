import Phaser from 'phaser';
import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';
import { DEPTH } from '../render/depth';

type DyingSprite =
  | Phaser.GameObjects.Image
  | Phaser.GameObjects.Sprite
  | Phaser.GameObjects.Rectangle;

// Boss dissolve cadence and the overall flash/fade timing (ms).
const BOSS_BARS = 12;
const FLASH_MS = 90;
const FLASH_COUNT = 3;
const BOSS_DISSOLVE_MS = 620;

// Regular-mob dissolve: a cheaper, faster take on the same look.
const MOB_BARS = 6;
const MOB_DISSOLVE_MS = 280;
// Big AoE clears can drop many mobs on one tick — cap the simultaneous dissolves
// so we never spawn dozens of masked clones at once. Past the cap, a mob just
// vanishes (no FX) rather than hitching the frame.
const MAX_CONCURRENT_MOB_DEATHS = 14;
let activeMobDeaths = 0;

/**
 * Interlaced removal order — evens top-to-bottom, then odds. Reads as a classic
 * scanline/CRT wipe rather than a plain top-down curtain.
 */
function dissolveOrder(count: number): number[] {
  const evens: number[] = [];
  const odds: number[] = [];
  for (let i = 0; i < count; i++) (i % 2 === 0 ? evens : odds).push(i);
  return [...evens, ...odds];
}

/** Clone a dying sprite into a standalone copy positioned/sized over the original. */
function cloneDyingSprite(
  scene: GameScene,
  sprite: DyingSprite,
  depth: number,
): Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle {
  const x = sprite.x;
  const y = sprite.y;
  const w = sprite.displayWidth;
  const h = sprite.displayHeight;
  const isTextured =
    (sprite instanceof Phaser.GameObjects.Image ||
      sprite instanceof Phaser.GameObjects.Sprite) &&
    !!sprite.texture;
  let copy: Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle;
  if (isTextured) {
    const img = sprite as Phaser.GameObjects.Image;
    copy = scene.add
      .image(x, y, img.texture.key, img.frame.name)
      .setDisplaySize(w, h)
      .setFlipX(img.flipX);
  } else {
    const rect = sprite as Phaser.GameObjects.Rectangle;
    copy = scene.add.rectangle(x, y, w, h, rect.fillColor ?? 0xffffff);
  }
  copy.setOrigin(0.5, 0.5).setDepth(depth);
  return copy;
}

/**
 * Retro boss-death dissolve: clone the dying sprite (so it outlives the real
 * one's removal), flash it white a few times, then eat it away in horizontal
 * "bars" via a geometry mask while it fades and drifts up — capped with a bright
 * burst. The clone owns its own cleanup; callers may destroy the source sprite
 * immediately afterwards.
 */
export function fxBossDeath(scene: GameScene, sprite: DyingSprite): void {
  const x = sprite.x;
  const y = sprite.y;
  const w = sprite.displayWidth;
  const h = sprite.displayHeight;
  const depth = DEPTH.FX + 1;

  const copy = cloneDyingSprite(scene, sprite, depth);

  // Geometry mask of horizontal bars; we clear bars from it over time so the
  // copy is progressively eaten away band by band.
  const maskG = scene.make.graphics({});
  copy.setMask(maskG.createGeometryMask());
  const top = y - h / 2;
  const barH = h / BOSS_BARS;
  const order = dissolveOrder(BOSS_BARS);
  const removed = new Set<number>();

  const drawBars = (): void => {
    maskG.clear();
    maskG.fillStyle(0xffffff, 1);
    for (let i = 0; i < BOSS_BARS; i++) {
      if (removed.has(i)) continue;
      // Slight horizontal overscan so edges don't clip during the jitter nudge.
      maskG.fillRect(x - w / 2 - 6, top + i * barH, w + 12, barH + 1);
    }
  };
  drawBars();

  const cleanup = (): void => {
    copy.clearMask();
    copy.destroy();
    maskG.destroy();
  };

  // 1) Hit-flash: alternate a solid white silhouette with the real frame.
  const canTint = copy instanceof Phaser.GameObjects.Image;
  let flashes = 0;
  const flash = (): void => {
    if (canTint) {
      const img = copy as Phaser.GameObjects.Image;
      if (flashes % 2 === 0) img.setTintFill(0xffffff);
      else img.clearTint();
    }
    flashes++;
    if (flashes < FLASH_COUNT * 2) {
      scene.time.delayedCall(FLASH_MS, flash);
    } else {
      if (canTint) (copy as Phaser.GameObjects.Image).setTint(0xddeeff);
      startDissolve();
    }
  };

  // 2) Dissolve: remove bars over time per the interlaced order while the copy
  //    fades, drifts up a touch, and glitch-jitters horizontally.
  const startDissolve = (): void => {
    const prog = { t: 0 };
    scene.tweens.add({
      targets: prog,
      t: 1,
      duration: BOSS_DISSOLVE_MS,
      ease: 'Sine.easeIn',
      onUpdate: () => {
        const want = Math.floor(prog.t * BOSS_BARS);
        let changed = false;
        for (let k = 0; k < want && k < order.length; k++) {
          if (!removed.has(order[k])) {
            removed.add(order[k]);
            changed = true;
          }
        }
        if (changed) drawBars();
        copy.x = x + (Math.random() * 2 - 1) * 3 * prog.t;
      },
    });
    scene.tweens.add({
      targets: copy,
      y: y - 14,
      alpha: 0,
      duration: BOSS_DISSOLVE_MS,
      ease: 'Quad.easeIn',
    });
    // Payoff: a bright ring + spark burst as the last bars wink out.
    scene.time.delayedCall(BOSS_DISSOLVE_MS * 0.62, () => {
      const ring = scene.add.graphics({ x, y }).setDepth(depth);
      ring.lineStyle(3, 0xffffff, 1);
      ring.strokeCircle(0, 0, Math.max(w, h) * 0.35);
      scene.tweens.add({
        targets: ring,
        scaleX: 2.2,
        scaleY: 2.2,
        alpha: 0,
        duration: 360,
        ease: 'Power2',
        onComplete: () => ring.destroy(),
      });
      burstFx(scene, 'ptx-dot', x, y, 18, 520, {
        tint: 0xeef4ff,
        speed: { min: 80, max: 280 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.6, end: 0 },
        alpha: { start: 1, end: 0 },
        gravityY: 120,
      });
    });
    scene.time.delayedCall(BOSS_DISSOLVE_MS + 60, cleanup);
  };

  flash();
}

/**
 * Lightweight cousin of {@link fxBossDeath} for regular mobs: the same horizontal
 * "bars" dissolve, but fewer bars, one quick flash, faster, and no ring/particle
 * payoff. Concurrency-capped so big AoE clears can't spawn a swarm of masks.
 */
export function fxMobDeath(scene: GameScene, sprite: DyingSprite): void {
  if (activeMobDeaths >= MAX_CONCURRENT_MOB_DEATHS) return;

  const x = sprite.x;
  const y = sprite.y;
  const w = sprite.displayWidth;
  const h = sprite.displayHeight;
  const depth = DEPTH.FX + 1;

  const copy = cloneDyingSprite(scene, sprite, depth);

  const maskG = scene.make.graphics({});
  copy.setMask(maskG.createGeometryMask());
  const top = y - h / 2;
  const barH = h / MOB_BARS;
  const order = dissolveOrder(MOB_BARS);
  const removed = new Set<number>();

  const drawBars = (): void => {
    maskG.clear();
    maskG.fillStyle(0xffffff, 1);
    for (let i = 0; i < MOB_BARS; i++) {
      if (removed.has(i)) continue;
      maskG.fillRect(x - w / 2 - 2, top + i * barH, w + 4, barH + 1);
    }
  };
  drawBars();

  activeMobDeaths++;
  let released = false;
  const cleanup = (): void => {
    copy.clearMask();
    copy.destroy();
    maskG.destroy();
    if (!released) {
      released = true;
      activeMobDeaths--;
    }
  };

  // A single brief white flash, then straight into the dissolve.
  if (copy instanceof Phaser.GameObjects.Image) {
    copy.setTintFill(0xffffff);
    scene.time.delayedCall(45, () => copy.setTint(0xeef4ff));
  }

  const prog = { t: 0 };
  scene.tweens.add({
    targets: prog,
    t: 1,
    duration: MOB_DISSOLVE_MS,
    ease: 'Sine.easeIn',
    onUpdate: () => {
      const want = Math.floor(prog.t * MOB_BARS);
      let changed = false;
      for (let k = 0; k < want && k < order.length; k++) {
        if (!removed.has(order[k])) {
          removed.add(order[k]);
          changed = true;
        }
      }
      if (changed) drawBars();
    },
  });
  scene.tweens.add({
    targets: copy,
    y: y - 8,
    alpha: 0,
    duration: MOB_DISSOLVE_MS,
    ease: 'Quad.easeIn',
  });
  scene.time.delayedCall(MOB_DISSOLVE_MS + 40, cleanup);
}
