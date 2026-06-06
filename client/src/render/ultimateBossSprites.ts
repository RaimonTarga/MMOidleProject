import type { MonsterView, Vec2 } from "@mmo-idle/shared";
import type { RenderState } from "./state";
import type { GameScene } from "../scenes/GameScene";
import { DEPTH } from "./depth";
import {
  VOID_OVERLORD_ANIM_KEY,
  VOID_OVERLORD_DISPLAY,
  VOID_OVERLORD_TEXTURE_KEY,
  resolveVoidOverlordMinionFrame,
  shouldUseVoidOverlordSheet,
} from "../sprites/voidOverlordSheet";

export { shouldUseVoidOverlordSheet };

export function ensureVoidOverlordBossSprite(
  state: RenderState,
  id: string,
  pos: Vec2,
  scene: GameScene,
): Phaser.GameObjects.Sprite | Phaser.GameObjects.Rectangle {
  const { displayW, displayH, visualOffsetY } = VOID_OVERLORD_DISPLAY["void-overlord"];
  if (!scene.textures.exists(VOID_OVERLORD_TEXTURE_KEY)) {
    const drawY = pos.y + (visualOffsetY ?? 0);
    const fallback = scene.add.rectangle(pos.x, drawY, displayW, displayH, 0x220044);
    fallback.setDepth(DEPTH.SPRITE + pos.y);
    state.sprite.set(id, fallback);
    const meta = state.spriteMeta.get(id);
    if (meta) meta.visualOffsetY = visualOffsetY;
    return fallback;
  }

  const drawY = pos.y + (visualOffsetY ?? 0);
  const sprite = scene.add
    .sprite(pos.x, drawY, VOID_OVERLORD_TEXTURE_KEY, "boss-0")
    .setDisplaySize(displayW, displayH)
    .play(VOID_OVERLORD_ANIM_KEY);
  sprite.setDepth(DEPTH.SPRITE + pos.y);
  state.sprite.set(id, sprite);

  const meta = state.spriteMeta.get(id);
  if (meta) {
    meta.currentFrame = "boss-0";
    meta.textureKey = VOID_OVERLORD_TEXTURE_KEY;
    meta.skipFrameRefresh = true;
    meta.isAnimated = true;
    meta.visualOffsetY = visualOffsetY;
  }
  return sprite;
}

export function ensureVoidOverlordMinionSprite(
  state: RenderState,
  id: string,
  monster: MonsterView,
  scene: GameScene,
): Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle {
  const frame = resolveVoidOverlordMinionFrame(monster.monsterTypeId, monster.id);
  const { displayW, displayH } = VOID_OVERLORD_DISPLAY[monster.monsterTypeId] ?? {
    displayW: 64,
    displayH: 64,
  };

  const texture = scene.textures.get(VOID_OVERLORD_TEXTURE_KEY);
  const sprite =
    frame && texture?.has(frame)
      ? scene.add.image(monster.pos.x, monster.pos.y, VOID_OVERLORD_TEXTURE_KEY, frame)
      : scene.add.rectangle(
          monster.pos.x,
          monster.pos.y,
          displayW,
          displayH,
          monster.color,
        );
  sprite.setDisplaySize(displayW, displayH);
  sprite.setDepth(DEPTH.SPRITE + monster.pos.y);
  state.sprite.set(id, sprite);

  const meta = state.spriteMeta.get(id);
  if (meta) {
    meta.currentFrame = frame;
    meta.textureKey = VOID_OVERLORD_TEXTURE_KEY;
    meta.skipFrameRefresh = true;
    meta.isAnimated = false;
  }
  return sprite;
}
