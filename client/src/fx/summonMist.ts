import Phaser from 'phaser';
import type { GameScene } from '../scenes/GameScene';
import { burstFx } from './particles';
import { shouldRunClientFx } from './guard';
import { DEPTH } from '../render/depth';

/**
 * Conduit summons are bodies of red mist: they condense out of it when they
 * appear and blow apart into it when they die. The mist is a fixed crimson —
 * the Conduit's own material — whatever range tint the finished body wears, so
 * it never reads as the white bar-dissolve of a dying monster.
 */

type SummonSprite =
  | Phaser.GameObjects.Image
  | Phaser.GameObjects.Sprite
  | Phaser.GameObjects.Rectangle;

const MIST_DEEP = 0x7a0c1a;
const MIST = 0xb3182b;
const MIST_BRIGHT = 0xe63946;

const FORM_MS = 560;
const FORM_WISPS = 10;
const DISPERSE_MS = 460;
// A formation wipe or class reset can drop every summon on one tick; cap live
// effects so a big pack never stacks dozens of clones. Past the cap the summon
// simply pops in / vanishes.
const MAX_CONCURRENT = 12;
let active = 0;

function isTextured(sprite: SummonSprite): sprite is Phaser.GameObjects.Image | Phaser.GameObjects.Sprite {
  return (
    (sprite instanceof Phaser.GameObjects.Image || sprite instanceof Phaser.GameObjects.Sprite) &&
    !!sprite.texture
  );
}

/** A standalone red silhouette of `sprite`; null for the untextured fallback. */
function silhouette(scene: GameScene, sprite: SummonSprite, color: number): Phaser.GameObjects.Image | null {
  if (!isTextured(sprite)) return null;
  return scene.add
    .image(sprite.x, sprite.y, sprite.texture.key, sprite.frame.name)
    .setDisplaySize(sprite.displayWidth, sprite.displayHeight)
    .setFlipX(sprite.flipX)
    .setOrigin(0.5, 0.5)
    .setDepth(DEPTH.FX)
    .setTintFill(color)
    .setAlpha(0);
}

function acquire(): boolean {
  if (active >= MAX_CONCURRENT) return false;
  active++;
  return true;
}

/**
 * Wisps of mist drift in from a loose ring and pool into a red silhouette,
 * which then clears to reveal the real body. Follows the live sprite, since a
 * fresh summon starts moving with its Conduit straight away. Leaves the real
 * sprite at full alpha when done (or when it was replaced mid-effect).
 */
export function fxSummonForm(scene: GameScene, sprite: SummonSprite): void {
  if (!shouldRunClientFx() || !acquire()) return;

  const w = sprite.displayWidth;
  const h = sprite.displayHeight;
  const reach = Math.max(w, h) * 0.95;
  let cx = sprite.x;
  let cy = sprite.y;

  sprite.setAlpha(0);
  const body = silhouette(scene, sprite, MIST);

  const wisps = Array.from({ length: FORM_WISPS }, (_, i) => {
    const angle = (i / FORM_WISPS) * Math.PI * 2 + Math.random() * 0.5;
    const dist = reach * (0.75 + Math.random() * 0.5);
    return {
      // Flattened ring: the ground plane is foreshortened.
      dx: Math.cos(angle) * dist,
      dy: Math.sin(angle) * dist * 0.6 - h * 0.1,
      scale: 0.9 + Math.random() * 0.6,
      // Stagger arrivals so the mist gathers rather than snaps shut.
      lag: Math.random() * 0.25,
      img: scene.add
        .image(cx, cy, 'ptx-mist')
        .setDepth(DEPTH.FX)
        .setTint(i % 3 === 0 ? MIST_BRIGHT : i % 3 === 1 ? MIST : MIST_DEEP)
        .setAlpha(0),
    };
  });

  let released = false;
  const finish = (): void => {
    if (released) return;
    released = true;
    active--;
    for (const wisp of wisps) wisp.img.destroy();
    body?.destroy();
    if (sprite.active) sprite.setAlpha(1);
  };

  const prog = { t: 0 };
  scene.tweens.add({
    targets: prog,
    t: 1,
    duration: FORM_MS,
    ease: 'Linear',
    onUpdate: () => {
      if (sprite.active) {
        cx = sprite.x;
        cy = sprite.y;
      }
      const t = prog.t;

      for (const wisp of wisps) {
        const local = Phaser.Math.Clamp((t - wisp.lag) / (0.7 - wisp.lag * 0.4), 0, 1);
        const pull = 1 - Phaser.Math.Easing.Quadratic.In(local);
        wisp.img.setPosition(cx + wisp.dx * pull, cy + wisp.dy * pull);
        wisp.img.setScale(wisp.scale * (0.45 + 0.55 * pull));
        wisp.img.setAlpha(Math.sin(Math.PI * local) * 0.85);
      }

      if (body) {
        // Gathers over the first half, then thins as the real body shows through.
        const shade = t < 0.5 ? t / 0.5 : 1 - (t - 0.5) / 0.5;
        const grow = 1.18 - 0.18 * Math.min(1, t / 0.6);
        body.setPosition(cx, cy);
        body.setDisplaySize(w * grow, h * grow);
        body.setAlpha(shade * 0.9);
      }
      if (sprite.active) sprite.setAlpha(Phaser.Math.Clamp((t - 0.4) / 0.6, 0, 1));
    },
    onComplete: () => {
      // The last haze settles at its feet.
      burstFx(scene, 'ptx-mist', cx, cy + h * 0.3, 5, 500, {
        tint: [MIST, MIST_DEEP],
        speed: { min: 10, max: 35 },
        angle: { min: 160, max: 380 },
        scale: { start: 0.7, end: 1.3 },
        alpha: { start: 0.5, end: 0 },
      });
      finish();
    },
    onStop: finish,
  });
}

/**
 * The body floods red, swells, and blows apart into drifting mist. Works off a
 * clone, so the caller may destroy the real sprite immediately afterwards.
 */
export function fxSummonDisperse(scene: GameScene, sprite: SummonSprite): void {
  if (!shouldRunClientFx() || !acquire()) return;

  const x = sprite.x;
  const y = sprite.y;
  const w = sprite.displayWidth;
  const h = sprite.displayHeight;

  const body = silhouette(scene, sprite, MIST);
  let released = false;
  const finish = (): void => {
    if (released) return;
    released = true;
    active--;
    body?.destroy();
  };

  // Main cloud rolls outward and rises; a few bright motes flick out faster.
  burstFx(scene, 'ptx-mist', x, y, 14, 850, {
    tint: [MIST_DEEP, MIST, MIST],
    speed: { min: 20, max: 75 },
    angle: { min: 0, max: 360 },
    scale: { start: 0.8, end: 1.8 },
    alpha: { start: 0.75, end: 0 },
    gravityY: -45,
  });
  burstFx(scene, 'ptx-mist', x, y - h * 0.15, 6, 520, {
    tint: MIST_BRIGHT,
    speed: { min: 60, max: 120 },
    angle: { min: 0, max: 360 },
    scale: { start: 0.45, end: 0.1 },
    alpha: { start: 0.9, end: 0 },
    gravityY: -60,
  });

  if (!body) {
    finish();
    return;
  }

  const prog = { t: 0 };
  scene.tweens.add({
    targets: prog,
    t: 1,
    duration: DISPERSE_MS,
    ease: 'Linear',
    onUpdate: () => {
      const t = prog.t;
      // A quick red flush, then the silhouette swells, rises, and thins away.
      const alpha = t < 0.15 ? (t / 0.15) * 0.95 : 0.95 * (1 - Phaser.Math.Easing.Quadratic.In((t - 0.15) / 0.85));
      const swell = 1 + 0.35 * Phaser.Math.Easing.Quadratic.Out(t);
      body.setAlpha(alpha);
      body.setDisplaySize(w * swell, h * (1 + 0.2 * t));
      body.setPosition(x, y - 12 * t);
    },
    onComplete: finish,
    onStop: finish,
  });
}
