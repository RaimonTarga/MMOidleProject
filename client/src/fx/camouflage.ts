/**
 * CAMOUFLAGE SHIFT — the moment a camouflaged mob breaks cover or melts back into
 * it (premium pass for mobs, 2026-09-27, step B3). The renderer used to snap the
 * body from faded to solid with nothing drawn, so an ambush read as a pop-in.
 *
 *   chameleon   (concealedWhileIdle) a colour-cycling shimmer runs over the body,
 *               with refraction rings: it changes its skin rather than stepping out.
 *   swamp-pool  (idleAnchor) it heaves out of the rot pool in a burst of mud.
 *   brush       (idleAnchor) the undergrowth it hid in bursts apart in leaves.
 *
 * `reveal` false plays the reverse, quieter: the skin shifts back and it fades.
 */
import { MONSTER_DATABASE } from '@mmo-idle/shared';
import type { GameScene } from '../scenes/GameScene';
import { DEPTH } from '../render/depth';
import { burstFx } from './particles';
import { shouldRunClientFx } from './guard';

const CHAMELEON = [0x5fc86a, 0x3ab0a0, 0xe0c040, 0xc060c0, 0x60a0e0];
const MUD = [0x4a3a22, 0x6a5236, 0x7f8f3a];
const LEAVES = [0x2f5d25, 0x4e8b3a, 0xa8d66a];

type Sprite = Phaser.GameObjects.Image | Phaser.GameObjects.Sprite | Phaser.GameObjects.Rectangle;

/** Last camouflage state drawn per monster, to catch the moment it changes. */
const camouflaged = new Map<string, boolean>();

/** Record the state; true only on a real change (never on the first sighting). */
export function camouflageChanged(id: string, concealed: boolean): boolean {
  const was = camouflaged.get(id);
  camouflaged.set(id, concealed);
  return was !== undefined && was !== concealed;
}

/** Forget a despawned monster's camouflage state. */
export function forgetCamouflage(id: string): void {
  camouflaged.delete(id);
}

export function fxCamouflageShift(scene: GameScene, sprite: Sprite, monsterTypeId: string, reveal: boolean): void {
  if (!shouldRunClientFx() || !('texture' in sprite)) return;
  const def = MONSTER_DATABASE.get(monsterTypeId);
  const kind = def?.concealedWhileIdle ? 'chameleon' : def?.idleAnchor === 'swamp-pool' ? 'mud' : 'leaves';
  const { x, y } = sprite;
  const feet = y + sprite.displayHeight * 0.38;

  // The shimmer: a copy of the body cycling through the skin's colours.
  const ghost = scene.add
    .image(x, y, sprite.texture.key, sprite.frame.name)
    .setScale(sprite.scaleX * (reveal ? 1.18 : 1), sprite.scaleY * (reveal ? 1.18 : 1))
    .setFlipX(sprite.flipX)
    .setDepth(sprite.depth + 0.01)
    .setBlendMode(Phaser.BlendModes.ADD)
    .setAlpha(reveal ? 0.75 : 0.45);
  const palette = kind === 'chameleon' ? CHAMELEON : kind === 'mud' ? MUD : LEAVES;
  let step = 0;
  ghost.setTintFill(palette[0]);
  const cycle = scene.time.addEvent({
    delay: 55,
    repeat: 7,
    callback: () => {
      step++;
      if (ghost.active) ghost.setTintFill(palette[step % palette.length]);
    },
  });
  scene.tweens.add({
    targets: ghost,
    scaleX: sprite.scaleX * (reveal ? 1 : 1.15),
    scaleY: sprite.scaleY * (reveal ? 1 : 1.15),
    alpha: 0,
    duration: reveal ? 420 : 360,
    ease: 'Quad.easeOut',
    onComplete: () => {
      cycle.remove();
      ghost.destroy();
    },
  });

  if (kind === 'chameleon') {
    // Refraction: thin rings of bent light off the body.
    for (let i = 0; i < (reveal ? 2 : 1); i++) {
      const r = scene.add.graphics({ x, y }).setDepth(DEPTH.FX);
      r.lineStyle(1.5, 0xffffff, 0.7);
      r.strokeEllipse(0, 0, sprite.displayWidth * 0.7, sprite.displayHeight * 0.8);
      scene.tweens.add({
        targets: r, scaleX: 1.6, scaleY: 1.6, alpha: 0, duration: 380, delay: i * 90,
        ease: 'Quad.easeOut', onComplete: () => r.destroy(),
      });
    }
    burstFx(scene, 'ptx-spark', x, y, reveal ? 10 : 5, 420, {
      tint: CHAMELEON, speed: { min: 30, max: 100 }, angle: { min: 0, max: 360 },
      scale: { start: 0.45, end: 0 }, alpha: { start: 0.9, end: 0 },
    });
    return;
  }

  // Terrain it hid in, thrown apart (or settling back over it).
  burstFx(scene, 'ptx-dot', x, feet, reveal ? 18 : 8, reveal ? 560 : 480, {
    tint: palette,
    speed: reveal ? { min: 70, max: 200 } : { min: 15, max: 50 },
    angle: { min: 200, max: 340 },
    scale: { start: reveal ? 0.9 : 0.6, end: 0.2 },
    alpha: { start: 0.95, end: 0 },
    gravityY: 380,
    rotate: kind === 'leaves' ? { min: 0, max: 360 } : undefined,
  });
}
