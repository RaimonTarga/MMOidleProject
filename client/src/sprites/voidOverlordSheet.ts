import type Phaser from 'phaser';
import {
  buildVoidOverlordAtlasFrames,
  VOID_OVERLORD_BOSS_FRAME_NAMES,
  VOID_OVERLORD_DISPLAY,
  VOID_OVERLORD_MINION_POOLS,
  isVoidOverlordSheetMonster,
  resolveVoidOverlordMinionFrameName,
  shouldUseVoidOverlordSheet,
  stableFrameIndex,
} from '@mmo-idle/shared';

export const VOID_OVERLORD_TEXTURE_KEY = 'void_overlord';
export const VOID_OVERLORD_FILE = '/assets/ultimate_bosses/void_overlord.png';
export const VOID_OVERLORD_ANIM_KEY = 'void-overlord-idle';

export {
  VOID_OVERLORD_DISPLAY,
  VOID_OVERLORD_MINION_POOLS,
  isVoidOverlordSheetMonster,
  shouldUseVoidOverlordSheet,
  stableFrameIndex,
};

/** @deprecated Use resolveVoidOverlordMinionFrameName from shared */
export function resolveVoidOverlordMinionFrame(
  monsterTypeId: string,
  entityId: string,
): string | null {
  return resolveVoidOverlordMinionFrameName(monsterTypeId, entityId);
}

export function initVoidOverlordSheet(scene: Phaser.Scene): void {
  if (!scene.textures.exists(VOID_OVERLORD_TEXTURE_KEY)) {
    console.warn(
      `[voidOverlordSheet] Texture "${VOID_OVERLORD_TEXTURE_KEY}" not loaded`,
    );
    return;
  }

  const texture = scene.textures.get(VOID_OVERLORD_TEXTURE_KEY);

  for (const atlasFrame of buildVoidOverlordAtlasFrames()) {
    const { filename, frame } = atlasFrame;
    if (texture.has(filename)) continue;
    texture.add(filename, 0, frame.x, frame.y, frame.w, frame.h);
  }

  if (!scene.anims.exists(VOID_OVERLORD_ANIM_KEY)) {
    scene.anims.create({
      key: VOID_OVERLORD_ANIM_KEY,
      frames: VOID_OVERLORD_BOSS_FRAME_NAMES.map((frame) => ({
        key: VOID_OVERLORD_TEXTURE_KEY,
        frame,
      })),
      frameRate: 6,
      repeat: -1,
    });
  }
}
