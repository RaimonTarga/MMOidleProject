import Phaser from 'phaser';
import type { PlayerView, MonsterView, Vec2 } from '@mmo-idle/shared';
import { ATLAS_KEY, getPlayerFrame, getMonsterFrame } from '../sprites';
import type { RenderState } from './state';
import type { GameScene } from '../scenes/GameScene';

export function tryMakeImage(
  scene: Phaser.Scene,
  pos: Vec2,
  frame: string | null,
  displayW: number,
  displayH: number,
): Phaser.GameObjects.Image | null {
  if (!frame) return null;
  if (!scene.textures.exists(ATLAS_KEY)) return null;
  if (!scene.textures.get(ATLAS_KEY).has(frame)) return null;
  return scene.add.image(pos.x, pos.y, ATLAS_KEY, frame).setDisplaySize(displayW, displayH);
}

export function ensureSprite(
  state: RenderState,
  id: string,
  snapshot: PlayerView | MonsterView,
  scene: GameScene,
  opts: {
    displayW: number;
    displayH: number;
    fallbackColor: number;
    depth: number;
    isPlayer: boolean;
  },
): void {
  if (state.sprite.has(id)) return;

  const frame = opts.isPlayer
    ? getPlayerFrame(snapshot as PlayerView)
    : getMonsterFrame((snapshot as MonsterView).monsterTypeId);

  const sprite =
    tryMakeImage(scene, snapshot.pos, frame, opts.displayW, opts.displayH) ??
    scene.add.rectangle(snapshot.pos.x, snapshot.pos.y, opts.displayW, opts.displayH, opts.fallbackColor);

  sprite.setDepth(opts.depth);
  state.sprite.set(id, sprite);

  const meta = state.spriteMeta.get(id);
  if (meta) meta.currentFrame = frame;
}

export function updateSpriteFrame(
  state: RenderState,
  id: string,
  snapshot: PlayerView | MonsterView,
  scene: GameScene,
  opts: {
    displayW: number;
    displayH: number;
    fallbackColor: number;
    depth: number;
    isPlayer: boolean;
  },
): void {
  const newFrame = opts.isPlayer
    ? getPlayerFrame(snapshot as PlayerView)
    : getMonsterFrame((snapshot as MonsterView).monsterTypeId);

  const meta = state.spriteMeta.get(id);
  if (!meta || newFrame === meta.currentFrame) return;

  const interp = state.interpolation.get(id);
  const base = interp?.base ?? snapshot.pos;

  state.sprite.get(id)?.destroy();
  const sprite =
    tryMakeImage(scene, base, newFrame, opts.displayW, opts.displayH) ??
    scene.add.rectangle(base.x, base.y, opts.displayW, opts.displayH, opts.fallbackColor);
  sprite.setDepth(opts.depth);
  state.sprite.set(id, sprite);
  meta.currentFrame = newFrame;
}

export function applySpriteTint(
  sprite: Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle,
  color: number,
): void {
  if (sprite instanceof Phaser.GameObjects.Image) {
    sprite.setTint(color);
    return;
  }
  sprite.setFillStyle(color, 1);
}

export function resetSpriteTint(
  sprite: Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle,
  fallbackColor: number,
): void {
  if (sprite instanceof Phaser.GameObjects.Image) {
    sprite.clearTint();
    return;
  }
  sprite.setFillStyle(fallbackColor, 1);
}

export function destroySprite(state: RenderState, id: string): void {
  state.sprite.get(id)?.destroy();
  state.sprite.delete(id);
}
