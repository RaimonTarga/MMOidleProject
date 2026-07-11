import Phaser from 'phaser';

/**
 * A deliberately quiet base material for the Plains. Unlike AI-generated scene
 * images, this is a repeatable texture by construction: no objects touch the
 * edge, and all visual identity comes from separately scattered decor.
 */
export const PLAINS_GROUND_TEXTURE_KEY = 'biome_plains_ground';

const TILE_SIZE = 192;

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function initProceduralGroundTextures(scene: Phaser.Scene): void {
  if (scene.textures.exists(PLAINS_GROUND_TEXTURE_KEY)) return;

  const rng = mulberry32(0x504c4149); // "PLAI" — stable across sessions.
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  g.fillStyle(0x596825, 1);
  g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);

  // Low-contrast grain prevents a flat fill without creating a focal pattern.
  const grainColors = [0x526120, 0x5e6f2a, 0x65762e, 0x4b591d];
  for (let i = 0; i < 2100; i++) {
    const x = 2 + Math.floor(rng() * (TILE_SIZE - 4));
    const y = 2 + Math.floor(rng() * (TILE_SIZE - 4));
    g.fillStyle(grainColors[Math.floor(rng() * grainColors.length)], 0.25 + rng() * 0.22);
    g.fillRect(x, y, rng() < 0.16 ? 2 : 1, 1);
  }

  // A few tiny, edge-safe grass strokes give the material a living surface;
  // larger grass belongs to the independently generated overlay assets.
  for (let i = 0; i < 190; i++) {
    const x = 3 + Math.floor(rng() * (TILE_SIZE - 6));
    const y = 4 + Math.floor(rng() * (TILE_SIZE - 8));
    const dx = rng() < 0.5 ? -1 : 1;
    g.lineStyle(1, rng() < 0.5 ? 0x78863a : 0x415318, 0.34 + rng() * 0.2);
    g.lineBetween(x, y, x + dx, y - (1 + Math.floor(rng() * 2)));
  }

  g.generateTexture(PLAINS_GROUND_TEXTURE_KEY, TILE_SIZE, TILE_SIZE);
  g.destroy();
}
