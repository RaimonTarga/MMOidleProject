import Phaser from "phaser";
import type {
  PlayerView,
  MonsterView,
  MinionView,
  Vec2,
} from "@mmo-idle/shared";
import {
  ATLAS_KEY,
  GRAVES_KEY,
  GRAVE_DISPLAY_W,
  GRAVE_DISPLAY_H,
  getPlayerFrame,
  getMonsterFrame,
} from "../sprites";
import type { RenderState } from "./state";
import type { GameScene } from "../scenes/GameScene";
import { DEPTH } from "./depth";

type SpriteSnapshot = PlayerView | MonsterView | MinionView;

function getMonsterTypeIdFromSnapshot(snapshot: SpriteSnapshot): string {
  if ("monsterTypeId" in snapshot) return snapshot.monsterTypeId;
  return "";
}

export function tryMakeImage(
  scene: Phaser.Scene,
  pos: Vec2,
  frame: string | null,
  displayW: number,
  displayH: number,
  textureKey: string = ATLAS_KEY,
): Phaser.GameObjects.Image | null {
  if (!frame) return null;
  if (!scene.textures.exists(textureKey)) return null;
  if (!scene.textures.get(textureKey).has(frame)) return null;
  return scene.add
    .image(pos.x, pos.y, textureKey, frame)
    .setDisplaySize(displayW, displayH);
}

export function tryMakeGraveImage(
  scene: Phaser.Scene,
  pos: Vec2,
  frameIndex: number,
): Phaser.GameObjects.Image | null {
  const frame = String(frameIndex);
  return tryMakeImage(
    scene,
    pos,
    frame,
    GRAVE_DISPLAY_W,
    GRAVE_DISPLAY_H,
    GRAVES_KEY,
  );
}

export function ensureSprite(
  state: RenderState,
  id: string,
  snapshot: SpriteSnapshot,
  scene: GameScene,
  opts: {
    displayW: number;
    displayH: number;
    fallbackColor: number;
    isPlayer: boolean;
  },
): void {
  if (state.sprite.has(id)) return;

  const frame = opts.isPlayer
    ? getPlayerFrame(snapshot as PlayerView)
    : getMonsterFrame(getMonsterTypeIdFromSnapshot(snapshot));

  const sprite =
    tryMakeImage(scene, snapshot.pos, frame, opts.displayW, opts.displayH) ??
    scene.add.rectangle(
      snapshot.pos.x,
      snapshot.pos.y,
      opts.displayW,
      opts.displayH,
      opts.fallbackColor,
    );

  sprite.setDepth(DEPTH.SPRITE + snapshot.pos.y);
  state.sprite.set(id, sprite);

  const meta = state.spriteMeta.get(id);
  if (meta) {
    meta.currentFrame = frame;
    meta.textureKey = ATLAS_KEY;
  }
}

export function updateSpriteFrame(
  state: RenderState,
  id: string,
  snapshot: SpriteSnapshot,
  scene: GameScene,
  opts: {
    displayW: number;
    displayH: number;
    fallbackColor: number;
    isPlayer: boolean;
  },
): void {
  const playerView = opts.isPlayer ? (snapshot as PlayerView) : null;
  const newFrame = playerView?.isDead
    ? String(playerView.graveFrame ?? 0)
    : opts.isPlayer
      ? getPlayerFrame(snapshot as PlayerView)
      : getMonsterFrame(getMonsterTypeIdFromSnapshot(snapshot));

  const textureKey = playerView?.isDead ? GRAVES_KEY : ATLAS_KEY;
  const displayW = playerView?.isDead ? GRAVE_DISPLAY_W : opts.displayW;
  const displayH = playerView?.isDead ? GRAVE_DISPLAY_H : opts.displayH;

  const meta = state.spriteMeta.get(id);
  const existing = state.sprite.get(id);
  if (!meta) return;
  if (existing) existing.setDisplaySize(displayW, displayH);

  const sameFrame =
    newFrame === meta.currentFrame && meta.textureKey === textureKey;
  if (sameFrame) return;

  const interp = state.interpolation.get(id);
  const base = interp?.base ?? snapshot.pos;
  const prevDepth = existing?.depth ?? DEPTH.SPRITE + base.y;

  existing?.destroy();

  const sprite =
    (playerView?.isDead
      ? tryMakeGraveImage(scene, base, playerView.graveFrame ?? 0)
      : tryMakeImage(scene, base, newFrame, displayW, displayH, textureKey)) ??
    scene.add.rectangle(base.x, base.y, displayW, displayH, opts.fallbackColor);

  sprite.setDepth(prevDepth);
  state.sprite.set(id, sprite);
  meta.currentFrame = newFrame;
  meta.textureKey = textureKey;
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
