import Phaser from 'phaser';
import {
  GAME_CONFIG,
  NODE_BIOMES,
  RESOLVED_NODE_FEATURES,
  type NodeFeatureShape,
} from '@mmo-idle/shared';
import { computeGroundLayout, hashString, mulberry32 } from './groundLayout';

/**
 * Wang-tileset ground: a painted base with deterministic patches of an upper
 * material, autotiled from a 4×4 corner-Wang sheet.
 *
 * Every node renders exactly ONE sheet — each sheet's base tile is an
 * independent generation, so two sheets can never mix inside a node without
 * visible square seams. Variety comes from two places:
 *   - DECORATIVE sheets: render/groundLayout.ts picks a per-node style
 *     (material + dirt pattern); the material selects the sheet here.
 *   - FUNCTIONAL sheets: on nodes that carry matching NODE_FEATURES (currently
 *     swamp rot pools), the functional sheet takes over the whole node and its
 *     upper region is autotiled from the AUTHORITATIVE feature
 *     shapes. Mountain ledges intentionally render as independent overlays over
 *     ordinary flat Wang ground.
 *
 * The sheet convention is fixed by the art pipeline (tools/pixellab/generate.ts
 * `wangTilesetSheet`): 16 tiles laid row-major into a 4×4 sheet, indexed by which
 * corners are the upper material: NW=1, NE=2, SW=4, SE=8. Tile index === that
 * slot, so a Phaser tileset built from the sheet maps slot → tile id with no remap.
 */
export interface WangSheet {
  /** Texture key + file for the 4×4 Wang sheet. */
  key: string;
  file: string;
}

export interface WangGroundConfig {
  /** groundLayout style material → decorative sheet. */
  sheets: Record<string, WangSheet>;
  /**
   * Sheet used INSTEAD of the decorative one on nodes that have features whose
   * id starts with one of these prefixes; the features' resolved shapes become
   * the upper region so the rendered terrain matches the server geometry.
   * `inflatePx` grows the sampled shapes: corner sampling systematically
   * undershoots a shape's true edge (a corner just outside it paints nothing),
   * so hazards whose damage starts a contact band OUTSIDE the hitbox (swamp
   * pools, 40px) want ~half a cell of inflation to put the painted rim where
   * the effect begins. Blocking walls want 0 — their painted edge should stop
   * the player exactly.
   */
  functional?: WangSheet & { featureIdPrefixes: string[]; inflatePx?: number };
  /**
   * Desired on-screen size of one ground cell, px. The layer scales the source
   * tile up by an INTEGER factor nearest this — integer scaling is what keeps a
   * pixel-art tilemap seam-free (fractional scale bleeds tile edges). The source
   * tile edge is read from the texture (sheet width ÷ 4), so this config stays
   * valid across resolution bumps of the art.
   */
  targetCell: number;
  /**
   * Per-corner wobble (in cells) applied to the DECORATIVE patch edges so
   * outlines stay ragged. Functional shapes never wobble — their edge is a
   * gameplay boundary.
   */
  edgeJitter: number;
  /**
   * The per-cell flips that break repetition on the uniform tiles assume the
   * material is direction-less noise. Set false when the UPPER material has
   * directional interior detail (lava flow channels): a mirrored tile can't
   * continue those lines into its neighbor. The base tile keeps flipping.
   */
  flipUniformUpper?: boolean;
}

export const WANG_GROUND: Partial<Record<string, WangGroundConfig>> = {
  plains: {
    sheets: {
      dirt: { key: 'plains_wang_ground', file: '/assets/environment/plains/grass-dirt-wang.png' },
    },
    targetCell: 64,
    edgeJitter: 1.4,
  },
  clearing: {
    sheets: {
      paving: { key: 'clearing_paving_wang', file: '/assets/environment/clearing/grass-paving-wang.png' },
      dirt: { key: 'clearing_dirt_wang', file: '/assets/environment/clearing/grass-dirt-wang.png' },
    },
    targetCell: 64,
    edgeJitter: 0.8,
  },
  forest: {
    sheets: {
      'light-undergrowth': { key: 'forest_light_undergrowth_wang', file: '/assets/environment/forest/floor-light-undergrowth-wang.png' },
      'heavy-foliage': { key: 'forest_heavy_foliage_wang', file: '/assets/environment/forest/floor-heavy-foliage-wang.png' },
    },
    targetCell: 64,
    edgeJitter: 1.4,
  },
  cave: {
    sheets: {
      rubble: { key: 'cave_rubble_wang', file: '/assets/environment/cave/floor-rubble-wang.png' },
      'patrol-path': { key: 'cave_patrol_path_wang', file: '/assets/environment/cave/floor-patrol-path-wang.png' },
    },
    targetCell: 64,
    edgeJitter: 1.2,
  },
  mountain: {
    sheets: {
      stone: { key: 'mountain_stone_wang', file: '/assets/environment/mountain/ground-stone-wang.png' },
    },
    targetCell: 64,
    edgeJitter: 1.2,
  },
  swamp: {
    sheets: {
      reeds: { key: 'swamp_reeds_wang', file: '/assets/environment/swamp/ground-reeds-wang.png' },
    },
    functional: {
      key: 'swamp_bogpool_wang',
      file: '/assets/environment/swamp/ground-bogpool-wang.png',
      featureIdPrefixes: ['rot_pool_', 'boss_rot_'],
      inflatePx: 32,
    },
    targetCell: 64,
    edgeJitter: 1.2,
  },
  desert: {
    sheets: {
      hardpan: { key: 'desert_hardpan_wang', file: '/assets/environment/desert/sand-hardpan-wang.png' },
    },
    targetCell: 64,
    edgeJitter: 1.4,
  },
  jungle: {
    sheets: {
      overgrowth: { key: 'jungle_overgrowth_wang', file: '/assets/environment/jungle/floor-overgrowth-wang.png' },
    },
    targetCell: 64,
    edgeJitter: 1.4,
  },
  tundra: {
    sheets: {
      ice: { key: 'tundra_ice_wang', file: '/assets/environment/tundra/snow-ice-wang.png' },
    },
    targetCell: 64,
    edgeJitter: 1.2,
  },
  // The volcano sheet's lava upper is a FUNCTIONAL hazard material: on the four
  // vent nodes (7-8, 8-8 and boss arenas 8-9, 10-10) the painted lava is the
  // server's lava-vent geometry, exactly like swamp rot pools (both use a 40px
  // contact band, hence the same half-cell inflation). Ventless volcanic nodes
  // render plain basalt via the 'plain' decorative layout — lava never appears
  // decoratively because it must always mean damage.
  volcanic: {
    sheets: {
      lava: { key: 'volcano_basalt_lava_wang', file: '/assets/environment/volcano/basalt-lava-wang.png' },
    },
    functional: {
      key: 'volcano_basalt_lava_wang',
      file: '/assets/environment/volcano/basalt-lava-wang.png',
      featureIdPrefixes: ['lava_vent_', 'boss_vent_'],
      inflatePx: 32,
    },
    targetCell: 64,
    edgeJitter: 1.2,
    // Lava flow channels are directional — mirrored tiles break line continuity.
    flipUniformUpper: false,
  },
  trench: {
    sheets: {
      biolume: { key: 'trench_biolume_wang', file: '/assets/environment/trench/silt-biolume-wang.png' },
    },
    targetCell: 64,
    edgeJitter: 1.2,
  },
  // Wasteland art direction; the biomeGroup id in NODE_BIOMES is still 'graveyard'.
  graveyard: {
    sheets: {
      ash: { key: 'wasteland_ash_wang', file: '/assets/environment/wasteland/ash-blight-wang.png' },
    },
    targetCell: 64,
    edgeJitter: 1.4,
  },
};

/**
 * DEV bake-off: per-biome lists of every sheet worth eyeballing in-game —
 * kept plains alternates, the accepted sheets themselves, and the variant-2
 * alternates saved from review. Cycle live with `[` / `]` (input/keyboard.ts);
 * the keys act on the biome of the node you are standing in.
 *
 * Selection 0 is always the implicit DEFAULT (no override: each node renders
 * its per-node style / functional sheet), so the wiring is harmless in prod.
 * Selecting a sheet forces it onto EVERY node of the biome — including
 * functional ledge/pool nodes, where the feature shapes keep driving the upper
 * region so a candidate sheet can be judged on the real geometry.
 */
export const GROUND_BAKEOFF: Partial<Record<string, Array<{ key: string; file: string; label: string }>>> = {
  plains: [
    { key: 'plains_wang_ground', file: '/assets/environment/plains/grass-dirt-wang.png', label: 'canonical · wheat even-blades (64)' },
    { key: 'plains_ground_a', file: '/assets/environment/plains/ground-a.png', label: 'A · wheat uniform (64)' },
    { key: 'plains_ground_b', file: '/assets/environment/plains/ground-b.png', label: 'B · wheat fine-mottle (64)' },
    { key: 'plains_ground_d', file: '/assets/environment/plains/ground-d.png', label: 'D · wheat mottled (64)' },
  ],
  clearing: [
    { key: 'clearing_paving_wang', file: '/assets/environment/clearing/grass-paving-wang.png', label: 'paving · accepted' },
    { key: 'clearing_paving_wang_v2', file: '/assets/environment/clearing/grass-paving-wang-variant-2.png', label: 'paving · alt candidate' },
    { key: 'clearing_dirt_wang', file: '/assets/environment/clearing/grass-dirt-wang.png', label: 'dirt · accepted' },
    { key: 'clearing_dirt_wang_v2', file: '/assets/environment/clearing/grass-dirt-wang-variant-2.png', label: 'dirt · alt candidate' },
  ],
  forest: [
    { key: 'forest_light_undergrowth_wang', file: '/assets/environment/forest/floor-light-undergrowth-wang.png', label: 'light undergrowth · accepted' },
    { key: 'forest_heavy_foliage_wang', file: '/assets/environment/forest/floor-heavy-foliage-wang.png', label: 'heavy foliage · accepted' },
    { key: 'forest_heavy_foliage_wang_v2', file: '/assets/environment/forest/floor-heavy-foliage-wang-variant-2.png', label: 'heavy foliage · alt candidate' },
  ],
  cave: [
    { key: 'cave_rubble_wang', file: '/assets/environment/cave/floor-rubble-wang.png', label: 'rubble · accepted' },
    { key: 'cave_patrol_path_wang', file: '/assets/environment/cave/floor-patrol-path-wang.png', label: 'patrol path · accepted' },
  ],
  mountain: [
    { key: 'mountain_scree_wang', file: '/assets/environment/mountain/ground-scree-wang.png', label: 'scree · accepted' },
    { key: 'mountain_stone_wang', file: '/assets/environment/mountain/ground-stone-wang.png', label: 'flat stone · regular ground' },
  ],
  swamp: [
    { key: 'swamp_reeds_wang', file: '/assets/environment/swamp/ground-reeds-wang.png', label: 'reeds · accepted' },
    { key: 'swamp_bogpool_wang', file: '/assets/environment/swamp/ground-bogpool-wang.png', label: 'bog pool (functional) · accepted' },
  ],
  desert: [
    { key: 'desert_hardpan_wang', file: '/assets/environment/desert/sand-hardpan-wang.png', label: 'sand/hardpan · accepted' },
  ],
  jungle: [
    { key: 'jungle_overgrowth_wang', file: '/assets/environment/jungle/floor-overgrowth-wang.png', label: 'floor/overgrowth · accepted' },
    { key: 'jungle_overgrowth_wang_v2', file: '/assets/environment/jungle/floor-overgrowth-wang-variant-2.png', label: 'floor/overgrowth · alt candidate' },
  ],
  tundra: [
    { key: 'tundra_ice_wang', file: '/assets/environment/tundra/snow-ice-wang.png', label: 'snow/ice · accepted (roll 2)' },
    { key: 'tundra_ice_wang_v2', file: '/assets/environment/tundra/snow-ice-wang-variant-2.png', label: 'snow/ice · roll 2 alt candidate' },
  ],
  volcanic: [
    { key: 'volcano_basalt_lava_wang', file: '/assets/environment/volcano/basalt-lava-wang.png', label: 'basalt/lava (functional) · accepted' },
    { key: 'volcano_basalt_lava_wang_v2', file: '/assets/environment/volcano/basalt-lava-wang-variant-2.png', label: 'basalt/lava · roll 1 backup (channel lava)' },
  ],
  trench: [
    { key: 'trench_biolume_wang', file: '/assets/environment/trench/silt-biolume-wang.png', label: 'silt/biolume · accepted' },
  ],
  graveyard: [
    { key: 'wasteland_ash_wang', file: '/assets/environment/wasteland/ash-blight-wang.png', label: 'wasteland ash/blight · accepted' },
  ],
};

/** Per-biome bake-off cursor; 0 = default (per-node style), 1..n = forced sheet. */
const bakeoffIndex: Record<string, number> = {};

/** Forced bake-off texture key for a biome, or null when on the default. */
function activeBakeoffKey(biomeGroup: string): string | null {
  const idx = bakeoffIndex[biomeGroup] ?? 0;
  if (idx === 0) return null;
  return GROUND_BAKEOFF[biomeGroup]?.[idx - 1]?.key ?? null;
}

/** Advance a biome's bake-off selection; caller repaints the node afterward. */
export function cycleGroundBakeoff(
  biomeGroup: string,
  dir: 1 | -1,
): { label: string; index: number; total: number } | null {
  const entries = GROUND_BAKEOFF[biomeGroup];
  if (!entries || entries.length === 0) return null;
  const total = entries.length + 1;
  const idx = (((bakeoffIndex[biomeGroup] ?? 0) + dir) % total + total) % total;
  bakeoffIndex[biomeGroup] = idx;
  const label = idx === 0 ? 'default · per-node style' : entries[idx - 1].label;
  return { label, index: idx, total };
}

export function preloadWangGround(scene: Phaser.Scene): void {
  const seen = new Set<string>();
  const queue = (sheet: WangSheet): void => {
    if (seen.has(sheet.key)) return;
    seen.add(sheet.key);
    scene.load.image(sheet.key, sheet.file);
  };
  for (const cfg of Object.values(WANG_GROUND)) {
    if (!cfg) continue;
    for (const sheet of Object.values(cfg.sheets)) queue(sheet);
    if (cfg.functional) queue(cfg.functional);
  }
  for (const entries of Object.values(GROUND_BAKEOFF)) {
    for (const v of entries ?? []) queue(v);
  }
}

/** Resolved feature shapes that drive a node's functional Wang sheet, if any. */
function functionalShapes(cfg: WangGroundConfig, nodeId: string): NodeFeatureShape[] {
  const fn = cfg.functional;
  if (!fn) return [];
  return (RESOLVED_NODE_FEATURES[nodeId] ?? [])
    .filter((f) => fn.featureIdPrefixes.some((p) => f.id.startsWith(p)))
    .map((f) => f.shape);
}

/**
 * Feature ids whose visuals are painted by this node's functional ground sheet
 * (so the scene must not draw placeholder fills for them). Empty when the sheet
 * texture is missing — the placeholder then stays as the fallback visual.
 */
export function wangFunctionalFeatureIds(
  scene: Phaser.Scene,
  nodeId: string,
): Set<string> {
  const biomeGroup = NODE_BIOMES[nodeId]?.biomeGroup;
  const cfg = biomeGroup ? WANG_GROUND[biomeGroup] : undefined;
  const fn = cfg?.functional;
  if (!fn || !scene.textures.exists(fn.key)) return new Set();
  return new Set(
    (RESOLVED_NODE_FEATURES[nodeId] ?? [])
      .filter((f) => fn.featureIdPrefixes.some((p) => f.id.startsWith(p)))
      .map((f) => f.id),
  );
}

function shapeContains(
  shape: NodeFeatureShape,
  x: number,
  y: number,
  inflate: number,
): boolean {
  switch (shape.kind) {
    case 'circle': {
      const dx = x - shape.x;
      const dy = y - shape.y;
      const r = shape.radius + inflate;
      return dx * dx + dy * dy < r * r;
    }
    case 'ellipse': {
      const dx = (x - shape.x) / (shape.halfW + inflate);
      const dy = (y - shape.y) / (shape.halfH + inflate);
      return dx * dx + dy * dy < 1;
    }
    case 'rect':
      return (
        Math.abs(x - shape.x) < shape.halfW + inflate &&
        Math.abs(y - shape.y) < shape.halfH + inflate
      );
  }
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

  // Functional nodes: the ledge/pool sheet owns the whole node and the upper
  // region is the server geometry itself. Fall through to the decorative sheet
  // if the functional texture is missing.
  const shapes = functionalShapes(cfg, nodeId);
  const functional =
    shapes.length > 0 && cfg.functional && scene.textures.exists(cfg.functional.key)
      ? cfg.functional
      : null;

  const layout = functional ? null : computeGroundLayout(biomeGroup, nodeId);
  let texKey: string | null = null;
  if (functional) {
    texKey = functional.key;
  } else if (layout) {
    texKey = cfg.sheets[layout.material]?.key ?? null;
  }
  // DEV bake-off override forces one sheet onto every node of the biome
  // (functional shapes still drive the upper region on ledge/pool nodes).
  const forced = activeBakeoffKey(biomeGroup);
  if (forced && scene.textures.exists(forced)) texKey = forced;
  if (!texKey || !scene.textures.exists(texKey)) return null;

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

  const rng = mulberry32(hashString(`${nodeId}:wang-ground:v1`));

  // Corner test in corner-grid units. Decorative patches (world-space discs from
  // the shared per-node ground layout) get per-corner wobble; functional shapes
  // are sampled exactly so the painted edge tracks the hitbox. The node border
  // stays the DOMINANT material (base normally, upper on inverted layouts) so
  // patches never bleed to a node edge (clean seams between nodes + with decor).
  const invert = layout?.invert ?? false;
  const discs = (layout?.discs ?? []).map((d) => ({
    cx: d.x / cellWorld,
    cy: d.y / cellWorld,
    r: d.r / cellWorld,
  }));
  const isUpper = (cx: number, cy: number): boolean => {
    if (cx <= 0 || cy <= 0 || cx >= cCols - 1 || cy >= cRows - 1) {
      return functional ? false : invert;
    }
    if (functional) {
      const wx = cx * cellWorld;
      const wy = cy * cellWorld;
      const inflate = functional.inflatePx ?? 0;
      for (const shape of shapes) {
        if (shapeContains(shape, wx, wy, inflate)) return true;
      }
      return false;
    }
    for (let d = 0; d < discs.length; d++) {
      const disc = discs[d];
      const wobble = (hash01(cx, cy, d + 1) - 0.5) * 2 * cfg.edgeJitter;
      const rr = disc.r + wobble;
      if (rr <= 0) continue;
      const ddx = cx - disc.cx;
      const ddy = cy - disc.cy;
      if (ddx * ddx + ddy * ddy < rr * rr) return !invert;
    }
    return invert;
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
        (isUpper(i, j) ? 1 : 0) | // NW
        (isUpper(i + 1, j) ? 2 : 0) | // NE
        (isUpper(i, j + 1) ? 4 : 0) | // SW
        (isUpper(i + 1, j + 1) ? 8 : 0); // SE
      const tile = layer.putTileAt(slot, i, j);
      // Uniform base (0) and upper (15) tiles have symmetric edges, so flipping
      // them per-cell breaks the repeated-grid look without breaking Wang seams.
      // Skipped for uppers with directional detail (cfg.flipUniformUpper), but
      // the rng still advances so layouts stay stable across config changes.
      if (tile && (slot === 0 || slot === 15)) {
        const fx = rng() < 0.5;
        const fy = rng() < 0.5;
        if (slot === 0 || cfg.flipUniformUpper !== false) {
          tile.flipX = fx;
          tile.flipY = fy;
        }
      }
    }
  }

  layer.setScale(scale);
  layer.setDepth(depth);
  // ceil() rows/cols overflow the node when its size is not a multiple of the
  // cell (2400 / 64 = 37.5): the extra strip of base tiles spills onto the
  // southern/eastern neighbor and its mismatched grain reads as a seam along
  // the node edge. Clip the layer to the node rect.
  if (cols * cellWorld > GAME_CONFIG.NODE_WIDTH || rows * cellWorld > GAME_CONFIG.NODE_HEIGHT) {
    const clip = scene.add
      .graphics()
      .fillRect(offsetX, offsetY, GAME_CONFIG.NODE_WIDTH, GAME_CONFIG.NODE_HEIGHT)
      .setVisible(false);
    const mask = clip.createGeometryMask();
    layer.setMask(mask);
    layer.once(Phaser.GameObjects.Events.DESTROY, () => {
      mask.destroy();
      clip.destroy();
    });
  }
  // TilemapLayer.destroy() leaves the parent Tilemap data object behind; free it
  // with the layer so repeated node repaints do not accumulate stale maps.
  layer.once(Phaser.GameObjects.Events.DESTROY, () => map.destroy());
  return layer;
}
