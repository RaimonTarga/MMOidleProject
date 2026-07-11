import Phaser from 'phaser';
import { GAME_CONFIG } from '@mmo-idle/shared';

/**
 * Wang-tileset ground: a painted grass base with deterministic dirt patches,
 * autotiled from a 4×4 corner-Wang sheet. This is the richer alternative to the
 * flat procedural base — the art half is an accepted asset; this is its runtime.
 *
 * The sheet convention is fixed by the art pipeline (tools/pixellab/generate.ts
 * `wangTilesetSheet`): 16 tiles laid row-major into a 4×4 sheet, indexed by which
 * corners are DIRT ("upper"): NW=1, NE=2, SW=4, SE=8. Tile index === that slot,
 * so a Phaser tileset built from the sheet maps slot → tile id with no remap.
 */
export interface WangGroundConfig {
  /** Texture key + file for the 4×4 Wang sheet. */
  key: string;
  file: string;
  /**
   * Desired on-screen size of one ground cell, px. The layer scales the source
   * tile up by an INTEGER factor nearest this — integer scaling is what keeps a
   * pixel-art tilemap seam-free (fractional scale bleeds tile edges). The source
   * tile edge is read from the texture (sheet width ÷ 4), so this config stays
   * valid across resolution bumps of the art.
   */
  targetCell: number;
  /** Dirt-patch field: a few soft discs of "dirt" over an otherwise grassy node. */
  dirt: { count: number; minRadius: number; maxRadius: number; jitter: number };
}

export const WANG_GROUND: Partial<Record<string, WangGroundConfig>> = {
  plains: {
    key: 'plains_wang_ground',
    file: '/assets/environment/plains/grass-dirt-wang.png',
    targetCell: 64,
    dirt: { count: 5, minRadius: 2, maxRadius: 4.5, jitter: 1.4 },
  },
};

/**
 * DEV bake-off: index 0 is the chosen canonical Plains ground; the rest are kept
 * alternates for reference. Cycle live with the dev keys (see input/keyboard.ts).
 * Default (index 0) is what the game renders, so this can stay wired harmlessly.
 */
export const PLAINS_BAKEOFF: Array<{ key: string; file: string; label: string }> = [
  { key: 'plains_wang_ground', file: '/assets/environment/plains/grass-dirt-wang.png', label: 'canonical · wheat even-blades (64)' },
  { key: 'plains_ground_a', file: '/assets/environment/plains/ground-a.png', label: 'A · wheat uniform (64)' },
  { key: 'plains_ground_b', file: '/assets/environment/plains/ground-b.png', label: 'B · wheat fine-mottle (64)' },
  { key: 'plains_ground_d', file: '/assets/environment/plains/ground-d.png', label: 'D · wheat mottled (64)' },
];
let plainsBakeoffIndex = 0;

/** Texture key the Plains ground should render right now (bake-off aware). */
export function activePlainsGroundKey(): string {
  return PLAINS_BAKEOFF[plainsBakeoffIndex]?.key ?? WANG_GROUND.plains!.key;
}

/** Advance the bake-off selection; caller repaints the node afterward. */
export function cyclePlainsGround(dir: 1 | -1): { label: string; index: number; total: number } {
  const n = PLAINS_BAKEOFF.length;
  plainsBakeoffIndex = (plainsBakeoffIndex + dir + n) % n;
  return { label: PLAINS_BAKEOFF[plainsBakeoffIndex].label, index: plainsBakeoffIndex, total: n };
}

export function preloadWangGround(scene: Phaser.Scene): void {
  const seen = new Set<string>();
  for (const cfg of Object.values(WANG_GROUND)) {
    if (!cfg || seen.has(cfg.key)) continue;
    seen.add(cfg.key);
    scene.load.image(cfg.key, cfg.file);
  }
  for (const v of PLAINS_BAKEOFF) {
    if (seen.has(v.key)) continue;
    seen.add(v.key);
    scene.load.image(v.key, v.file);
  }
}

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

function hashString(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Deterministic 0..1 hash for per-corner edge wobble (stable across sessions). */
function hash01(x: number, y: number, salt: number): number {
  let h = (x * 374761393 + y * 668265263 + salt * 2246822519) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/**
 * Builds the autotiled ground for one node, or null if the biome has no Wang
 * config or its sheet has not loaded (caller falls back to the flat base).
 */
export function buildWangGroundLayer(
  scene: Phaser.Scene,
  biomeGroup: string,
  nodeId: string,
  offsetX: number,
  offsetY: number,
  depth: number,
): Phaser.Tilemaps.TilemapLayer | null {
  const cfg = WANG_GROUND[biomeGroup];
  if (!cfg) return null;
  const texKey = biomeGroup === 'plains' ? activePlainsGroundKey() : cfg.key;
  if (!scene.textures.exists(texKey)) return null;

  const texture = scene.textures.get(texKey);
  // Pixel-art tilemaps must sample NEAREST or linear filtering bleeds each tile's
  // edge into its neighbor — the visible "seams". Phaser's default is linear.
  texture.setFilter(Phaser.Textures.FilterMode.NEAREST);

  // The sheet is always 4×4; derive the source tile edge so this survives an art
  // resolution bump (32→64px) without a code change.
  const srcTile = Math.floor((texture.getSourceImage() as { width: number }).width / 4);
  if (srcTile < 8) return null;
  // Integer upscale only — fractional tilemap scale reintroduces edge seams.
  const scale = Math.max(1, Math.round(cfg.targetCell / srcTile));
  const cellWorld = srcTile * scale;

  const cols = Math.ceil(GAME_CONFIG.NODE_WIDTH / cellWorld);
  const rows = Math.ceil(GAME_CONFIG.NODE_HEIGHT / cellWorld);
  const cCols = cols + 1;
  const cRows = rows + 1;

  // Seeded dirt discs over the corner grid; the node border stays grass so
  // patches never bleed to a node edge (clean seams between nodes + with decor).
  const rng = mulberry32(hashString(`${nodeId}:wang-ground:v1`));
  const discs: Array<{ cx: number; cy: number; r: number }> = [];
  for (let i = 0; i < cfg.dirt.count; i++) {
    discs.push({
      cx: rng() * cCols,
      cy: rng() * cRows,
      r: cfg.dirt.minRadius + rng() * (cfg.dirt.maxRadius - cfg.dirt.minRadius),
    });
  }

  const isDirt = (cx: number, cy: number): boolean => {
    if (cx <= 0 || cy <= 0 || cx >= cCols - 1 || cy >= cRows - 1) return false;
    for (let d = 0; d < discs.length; d++) {
      const disc = discs[d];
      const wobble = (hash01(cx, cy, d + 1) - 0.5) * 2 * cfg.dirt.jitter;
      const rr = disc.r + wobble;
      if (rr <= 0) continue;
      const ddx = cx - disc.cx;
      const ddy = cy - disc.cy;
      if (ddx * ddx + ddy * ddy < rr * rr) return true;
    }
    return false;
  };

  const map = scene.make.tilemap({
    tileWidth: srcTile,
    tileHeight: srcTile,
    width: cols,
    height: rows,
  });
  const tileset = map.addTilesetImage(texKey, texKey, srcTile, srcTile, 0, 0, 0);
  if (!tileset) {
    map.destroy();
    return null;
  }
  const layer = map.createBlankLayer(`wang-ground:${nodeId}`, tileset, offsetX, offsetY);
  if (!layer) {
    map.destroy();
    return null;
  }

  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const slot =
        (isDirt(i, j) ? 1 : 0) | // NW
        (isDirt(i + 1, j) ? 2 : 0) | // NE
        (isDirt(i, j + 1) ? 4 : 0) | // SW
        (isDirt(i + 1, j + 1) ? 8 : 0); // SE
      const tile = layer.putTileAt(slot, i, j);
      // Uniform grass (0) and dirt (15) tiles have symmetric edges, so flipping
      // them per-cell breaks the repeated-grid look without breaking Wang seams.
      if (tile && (slot === 0 || slot === 15)) {
        tile.flipX = rng() < 0.5;
        tile.flipY = rng() < 0.5;
      }
    }
  }

  layer.setScale(scale);
  layer.setDepth(depth);
  // TilemapLayer.destroy() leaves the parent Tilemap data object behind; free it
  // with the layer so repeated node repaints do not accumulate stale maps.
  layer.once(Phaser.GameObjects.Events.DESTROY, () => map.destroy());
  return layer;
}
