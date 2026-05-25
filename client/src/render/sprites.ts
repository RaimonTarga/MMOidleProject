import type Phaser from 'phaser';
import type { PlayerSnapshot, MonsterSnapshot } from '@mmo-idle/shared';
import { ATLAS_KEY, getPlayerFrame, getMonsterFrame } from '../sprites';
import type { RenderState } from './state';
import type { GameScene } from '../scenes/GameScene';

export function tryMakeImage(
  scene: Phaser.Scene,
  x: number,
  y: number,
  frame: string | null,
  displayW: number,
  displayH: number,
): Phaser.GameObjects.Image | null {
  if (!frame) return null;
  if (!scene.textures.exists(ATLAS_KEY)) return null;
  if (!scene.textures.get(ATLAS_KEY).has(frame)) return null;
  return scene.add.image(x, y, ATLAS_KEY, frame).setDisplaySize(displayW, displayH);
}

export function ensureSprite(
  state: RenderState,
  id: string,
  snapshot: PlayerSnapshot | MonsterSnapshot,
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
    ? getPlayerFrame(snapshot as PlayerSnapshot)
    : getMonsterFrame((snapshot as MonsterSnapshot).monsterTypeId);

  const sprite =
    tryMakeImage(scene, snapshot.x, snapshot.y, frame, opts.displayW, opts.displayH) ??
    scene.add.rectangle(snapshot.x, snapshot.y, opts.displayW, opts.displayH, opts.fallbackColor);

  sprite.setDepth(opts.depth);
  state.sprite.set(id, sprite);

  const meta = state.spriteMeta.get(id);
  if (meta) meta.currentFrame = frame;
}

export function updateSpriteFrame(
  state: RenderState,
  id: string,
  snapshot: PlayerSnapshot | MonsterSnapshot,
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
    ? getPlayerFrame(snapshot as PlayerSnapshot)
    : getMonsterFrame((snapshot as MonsterSnapshot).monsterTypeId);

  const meta = state.spriteMeta.get(id);
  if (!meta || newFrame === meta.currentFrame) return;

  const interp = state.interpolation.get(id);
  const bx = interp?.baseX ?? snapshot.x;
  const by = interp?.baseY ?? snapshot.y;

  state.sprite.get(id)?.destroy();
  const sprite =
    tryMakeImage(scene, bx, by, newFrame, opts.displayW, opts.displayH) ??
    scene.add.rectangle(bx, by, opts.displayW, opts.displayH, opts.fallbackColor);
  sprite.setDepth(opts.depth);
  state.sprite.set(id, sprite);
  meta.currentFrame = newFrame;
}

export function destroySprite(state: RenderState, id: string): void {
  state.sprite.get(id)?.destroy();
  state.sprite.delete(id);
}
