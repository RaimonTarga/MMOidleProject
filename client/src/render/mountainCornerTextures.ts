import type Phaser from 'phaser';
import { drawMountainCornerPatch } from './mountainLedges';

// The patch extends at most 39 px from its lip, plus a 2 px stroke.
// Transparent padding keeps filtering away from the texture edge.
const SIZE = 84;
const LIP = SIZE / 2;

export function mountainCornerImage(
  scene: Phaser.Scene,
  x: number,
  y: number,
  dirX: number,
  dirY: number,
  depth: number,
): Phaser.GameObjects.Image {
  const key = `mountain-corner-v1-${dirX}-${dirY}`;
  if (!scene.textures.exists(key)) {
    const graphics = scene.make.graphics({ x: 0, y: 0 }, false);
    try {
      drawMountainCornerPatch(graphics, LIP, LIP, dirX, dirY);
      graphics.generateTexture(key, SIZE, SIZE);
    } finally {
      graphics.destroy();
    }
  }
  // Four small textures belong to the game's TextureManager and are reused by
  // active nodes and previews. Node teardown destroys only these image instances.
  return scene.add.image(x - LIP, y - LIP, key).setOrigin(0, 0).setDepth(depth);
}
