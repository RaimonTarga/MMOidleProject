import {
  BIOME_DATABASE,
  GAME_CONFIG,
  getDungeonGauntletDef,
  NODE_BIOMES,
  NODE_FEATURES,
  RESOLVED_NODE_FEATURES,
  resolveFeatureShape,
  TREE_CELL_PX,
  TREE_TRUNK_TOP_PX,
  getNodeTrees,
  type NodeFeatureShape,
} from "@mmo-idle/shared";
import {
  buildClientCollisionLayer,
  minimapLayerProjection,
  minimapStaticKinds,
  paintCollisionLayer,
  paintEntityDotsOnMinimap,
  tacticalKinds,
  worldLayerProjection,
} from "../../render/collisionLayer";
import { DEPTH } from "../../render/depth";
import { sceneDepthY } from "../../render/sceneCoords";
import {
  BIOME_DECOR,
  BIOME_TEXTURES,
  FEATURE_SCATTER,
  NODE_DECOR,
  TREES_KEY,
} from "../../sprites";
import { computeGroundLayout } from "../../render/groundLayout";
import { drawMountainElevation } from "../../render/mountainLedges";
import {
  buildWangGroundLayer,
  wangFunctionalFeatureIds,
} from "../../render/wangGround";
import type { GameScene } from "./GameScene";
import { MM_H, MM_PAD, MM_W } from "./nodeExits";
import { isVoidThroneUnblocked } from "./voidThrone";
import { resolvedMinimapTierPalette, uiTierActivationIsActive } from "../../hud/uiTier";
import { isMobileViewport } from "../../breakpoints";

const BG_DEPTH = -11;
const BOUNDARY_DEPTH = -9.5;
/**
 * At the largest supported HUD font scale, this leaves room between the 220px
 * minimap and the centered Auto Combat control. The mobile decision itself is
 * based on the browser viewport, not Phaser's rail-narrowed canvas.
 */
const MINIMAP_MIN_SCENE_WIDTH = 760;
/** Tree trunk/root pass sits on the ground, just below shadows + entities. */
const TREE_ROOT_DEPTH = DEPTH.SHADOW - 0.5;
/**
 * Source-cell rows duplicated on both tree render passes so the over/under
 * crop seam does not show a hairline gap after display scaling.
 */
const TREE_SEAM_OVERLAP_PX = 18;

export interface NodeStaticGroup {
  nodeId: string;
  offsetX: number;
  offsetY: number;
  bg:
    | Phaser.GameObjects.TileSprite
    | Phaser.GameObjects.Rectangle
    | Phaser.Tilemaps.TilemapLayer
    | null;
  shade: Phaser.GameObjects.Rectangle | null;
  biomeDecor: Phaser.GameObjects.Image[];
  decor: Phaser.GameObjects.Image[];
  /** Placeholder fills for blocking features that have no decor sprite yet. */
  placeholders: Phaser.GameObjects.Graphics[];
  trees: Phaser.GameObjects.Image[];
  boundary: Phaser.GameObjects.Graphics;
}

export interface PaintNodeStaticOptions {
  preview?: boolean;
}

function ensureBgNodeFill(scene: GameScene): Phaser.GameObjects.Rectangle {
  if (scene.bgNodeFill) return scene.bgNodeFill;
  scene.bgNodeFill = scene.add
    .rectangle(0, 0, GAME_CONFIG.NODE_WIDTH, GAME_CONFIG.NODE_HEIGHT, 0x101a10)
    .setOrigin(0, 0)
    .setDepth(BG_DEPTH);
  return scene.bgNodeFill;
}

function buildBiomeBg(
  scene: GameScene,
  nodeId: string,
  offsetX: number,
  offsetY: number,
  depthBias: number,
):
  | Phaser.GameObjects.TileSprite
  | Phaser.GameObjects.Rectangle
  | Phaser.Tilemaps.TilemapLayer
  | null {
  const biomeInfo = NODE_BIOMES[nodeId];
  if (!biomeInfo) return null;
  const biome = BIOME_DATABASE.get(biomeInfo.biomeGroup);
  if (!biome) return null;

  const depth = BG_DEPTH + depthBias;

  // Prefer a painted Wang-tileset ground (grass + deterministic dirt patches)
  // where the biome has one; otherwise fall back to the flat base texture/color.
  const wang = buildWangGroundLayer(
    scene,
    biomeInfo.biomeGroup,
    nodeId,
    offsetX,
    offsetY,
    depth,
  );
  if (wang) return wang;

  const textureKey = BIOME_TEXTURES[biomeInfo.biomeGroup];

  if (textureKey && scene.textures.exists(textureKey)) {
    const tile = scene.add
      .tileSprite(
        offsetX,
        offsetY,
        GAME_CONFIG.NODE_WIDTH,
        GAME_CONFIG.NODE_HEIGHT,
        textureKey,
      )
      .setOrigin(0, 0)
      .setDepth(depth);
    return tile;
  }

  const rect = scene.add
    .rectangle(
      offsetX,
      offsetY,
      GAME_CONFIG.NODE_WIDTH,
      GAME_CONFIG.NODE_HEIGHT,
      biome.backgroundColor,
    )
    .setOrigin(0, 0)
    .setDepth(depth);
  return rect;
}

function buildPreviewShade(
  scene: GameScene,
  offsetX: number,
  offsetY: number,
  depthBias: number,
  alpha = GAME_CONFIG.NEIGHBOR_FOG_ALPHA,
): Phaser.GameObjects.Rectangle {
  // Single fog overlay above the node's bg + decor so the whole adjacent map
  // reads as one uniform darker color (kept below shadows/sprites at depth 0+).
  return scene.add
    .rectangle(
      offsetX,
      offsetY,
      GAME_CONFIG.NODE_WIDTH,
      GAME_CONFIG.NODE_HEIGHT,
      0x000000,
      alpha,
    )
    .setOrigin(0, 0)
    .setDepth(DEPTH.SHADOW - 0.5 + depthBias);
}

/** Fog overlay for the active node during a map slide (fades out over the slide). */
export function createIncomingTransitionFog(
  scene: GameScene,
): Phaser.GameObjects.Rectangle {
  return buildPreviewShade(scene, 0, 0, 0, GAME_CONFIG.NEIGHBOR_FOG_ALPHA);
}

function buildNodeDecorImages(
  scene: GameScene,
  nodeId: string,
  offsetX: number,
  offsetY: number,
  depthBias: number,
  throneOpen: boolean,
): Phaser.GameObjects.Image[] {
  const arts = NODE_DECOR[nodeId];

  const decor: Phaser.GameObjects.Image[] = [];
  if (arts) {
    for (const art of arts) {
      const feature = NODE_FEATURES[nodeId]?.find((f) => f.id === art.featureId);
      const textureKey = throneOpen && art.openKey ? art.openKey : art.key;
      if (!feature || !scene.textures.exists(textureKey)) continue;
      const scale = art.artScale ?? 1;
      const img = scene.add
        .image(offsetX + feature.x, offsetY + feature.y, textureKey)
        .setOrigin(0.5, 0.5)
        .setDepth((art.depth ?? DEPTH.BG_DECOR) + depthBias)
        .setDisplaySize(feature.displayW * scale, feature.displayH * scale);
      img.setData("featureId", art.featureId);
      if (art.alpha != null) img.setAlpha(art.alpha);
      decor.push(img);
    }
  }

  const gauntlet = getDungeonGauntletDef(nodeId);
  if (gauntlet && scene.textures.exists("rune_altar")) {
    const img = scene.add
      .image(offsetX + gauntlet.altar.x, offsetY + gauntlet.altar.y, "rune_altar")
      .setOrigin(0.5, 0.5)
      .setDepth(DEPTH.BG_DECOR + depthBias)
      .setDisplaySize(220, 220);
    img.setData("featureId", "dungeon_altar");
    decor.push(img);
  }
  return decor;
}

function hashString(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
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

/** Point-in-shape with a padding margin, for decor placement rejection. */
function nearFeatureShape(shape: NodeFeatureShape, x: number, y: number, pad: number): boolean {
  switch (shape.kind) {
    case "circle": {
      const dx = x - shape.x;
      const dy = y - shape.y;
      const r = shape.radius + pad;
      return dx * dx + dy * dy < r * r;
    }
    case "ellipse": {
      const dx = (x - shape.x) / (shape.halfW + pad);
      const dy = (y - shape.y) / (shape.halfH + pad);
      return dx * dx + dy * dy < 1;
    }
    case "rect":
      return (
        Math.abs(x - shape.x) < shape.halfW + pad &&
        Math.abs(y - shape.y) < shape.halfH + pad
      );
  }
}

/**
 * Scatter visual-only biome dressing in stable node-local positions. Keeping
 * this separate from NODE_FEATURES means an art iteration can never affect the
 * authoritative collision or hazard layout. A broad center clearing protects
 * combat readability and leaves dungeon arenas open.
 *
 * Placement is blue-noise-ish: every candidate must keep a size-scaled gap to
 * every prop already placed (across ALL specs), so dressing spreads instead of
 * clumping. Specs flagged `avoidsDirt` also reject spots the ground layout
 * marks as dirt, so greenery does not sprout out of a bare path.
 */
function buildBiomeDecorImages(
  scene: GameScene,
  nodeId: string,
  offsetX: number,
  offsetY: number,
  depthBias: number,
  preview: boolean,
): Phaser.GameObjects.Image[] {
  const biomeGroup = NODE_BIOMES[nodeId]?.biomeGroup;
  if (!biomeGroup) return [];
  const specs = BIOME_DECOR[biomeGroup] ?? [];
  if (specs.length === 0) return [];

  const rng = mulberry32(hashString(`${nodeId}:biome-decor:v2`));
  const groundLayout = computeGroundLayout(biomeGroup, nodeId);
  const out: Phaser.GameObjects.Image[] = [];
  const edgeMargin = 110;
  const centerX = GAME_CONFIG.NODE_WIDTH / 2;
  const centerY = GAME_CONFIG.NODE_HEIGHT / 2;
  const centerClearRadius = 340;
  const spacingPad = 34;
  // Dressing never lands inside a node feature's footprint (altar, rot pool,
  // ledge wall, …) — those are either painted by the functional ground sheet
  // or covered by their own decor sprite.
  const featureShapes = (RESOLVED_NODE_FEATURES[nodeId] ?? []).map((f) => f.shape);
  const featurePad = 30;
  const placed: Array<{ x: number; y: number; r: number }> = [];

  for (const spec of specs) {
    if (!scene.textures.exists(spec.key)) continue;
    let count = 0;
    const maxAttempts = spec.count * 24;
    for (let attempt = 0; attempt < maxAttempts && count < spec.count; attempt++) {
      const x = edgeMargin + rng() * (GAME_CONFIG.NODE_WIDTH - edgeMargin * 2);
      const y = edgeMargin + rng() * (GAME_CONFIG.NODE_HEIGHT - edgeMargin * 2);
      const dx = x - centerX;
      const dy = y - centerY;
      if (dx * dx + dy * dy < centerClearRadius * centerClearRadius) continue;
      if (spec.avoidsDirt && groundLayout?.isDirt(x, y)) continue;
      if (featureShapes.some((s) => nearFeatureShape(s, x, y, featurePad))) continue;

      const scale = 0.82 + rng() * 0.36;
      const radius = (Math.max(spec.displayW, spec.displayH) * scale) / 2;
      let crowded = false;
      for (const p of placed) {
        const gap = p.r + radius + spacingPad;
        const px = x - p.x;
        const py = y - p.y;
        if (px * px + py * py < gap * gap) {
          crowded = true;
          break;
        }
      }
      if (crowded) continue;
      placed.push({ x, y, r: radius });
      const ySort = !!spec.ySort && !preview;
      const image = scene.add
        .image(offsetX + x, offsetY + y, spec.key)
        .setOrigin(0.5, 0.5)
        .setDisplaySize(spec.displayW * scale, spec.displayH * scale)
        .setDepth((ySort ? DEPTH.SPRITE + sceneDepthY(y) : DEPTH.BG_DECOR) + depthBias);
      if (spec.flipX && rng() < 0.5) image.setFlipX(true);
      if (spec.alpha != null) image.setAlpha(spec.alpha);
      out.push(image);
      count++;
    }
  }

  return out;
}


/** The scatter spec covering a feature, if any of its textures are loaded. */
function featureScatterFor(scene: GameScene, featureId: string) {
  return FEATURE_SCATTER.find(
    (spec) =>
      featureId.startsWith(spec.featureIdPrefix) &&
      spec.variants.some((v) => scene.textures.exists(v.key)),
  );
}

/**
 * Fill a scatter-dressed feature footprint with overlapping props.
 *
 * Placement is a JITTERED GRID rather than the blue-noise rejection sampling the
 * biome dressing uses: dressing wants props spread apart, a thicket wants them
 * touching and evenly dense with no bald patches. Props are allowed to overhang
 * the shape edge, which is what keeps the silhouette ragged instead of tracing a
 * visible circle. Deterministic per node+feature, so the same bush looks the same
 * on every visit and across clients.
 */
function buildFeatureScatterImages(
  scene: GameScene,
  nodeId: string,
  offsetX: number,
  offsetY: number,
  depthBias: number,
  preview: boolean,
): Phaser.GameObjects.Image[] {
  const features = NODE_FEATURES[nodeId];
  if (!features) return [];
  const out: Phaser.GameObjects.Image[] = [];

  for (const feature of features) {
    const spec = featureScatterFor(scene, feature.id);
    if (!spec) continue;
    const loaded = spec.variants.filter((v) => scene.textures.exists(v.key));
    if (loaded.length === 0) continue;

    const shape = resolveFeatureShape(feature);
    const rng = mulberry32(hashString(`${nodeId}:${feature.id}:scatter:v1`));
    const step = Math.max(24, spec.displayW * spec.spacing);
    // Half a prop of slop so the outermost ring can hang over the boundary.
    const reach = spec.displayW * 0.5;
    const halfW = shape.kind === "circle" ? shape.radius : shape.halfW;
    const halfH = shape.kind === "circle" ? shape.radius : shape.halfH;

    for (let gy = -halfH - reach; gy <= halfH + reach; gy += step) {
      for (let gx = -halfW - reach; gx <= halfW + reach; gx += step) {
        // Jitter each cell by up to half a step so no row or column lines up.
        const x = shape.x + gx + (rng() - 0.5) * step;
        const y = shape.y + gy + (rng() - 0.5) * step;
        // Keep a prop when its CENTRE is within the shape plus the overhang.
        if (!nearFeatureShape(shape, x, y, reach)) continue;

        const variant = loaded[Math.floor(rng() * loaded.length) % loaded.length];
        const scale = 0.78 + rng() * 0.46;
        const image = scene.add
          .image(offsetX + x, offsetY + y, variant.key)
          .setOrigin(0.5, 0.5)
          .setDisplaySize(spec.displayW * scale, spec.displayH * scale)
          .setDepth(
            (spec.ySort && !preview ? DEPTH.SPRITE + sceneDepthY(y) : DEPTH.BG_DECOR) +
              depthBias,
          );
        if (rng() < 0.5) image.setFlipX(true);
        if (spec.alpha != null) image.setAlpha(spec.alpha);
        image.setData("featureId", feature.id);
        out.push(image);
      }
    }
  }

  return out;
}

const PLACEHOLDER_BLOCK_FILL = 0x4a4640;
const PLACEHOLDER_BLOCK_LINE = 0x6f6a60;
// Hazard zones (damage / status) render as a translucent toxic splotch so the
// player can read & avoid them. Generic rot-green placeholder; real per-biome
// hazard art (lava, rot, chill) replaces it via NODE_DECOR.
const PLACEHOLDER_HAZARD_FILL = 0x6a8a2a;
const PLACEHOLDER_HAZARD_LINE = 0x9ab84a;

/**
 * Visible placeholder for features that have no decor sprite yet:
 *   - `blocksMovement` → flat gray rock fill (an obstacle).
 *   - `damage` / `statusWhileInside` → translucent toxic splotch (a hazard zone).
 * Without this a feature is invisible — the geometry blocks/hurts but nothing
 * renders. Real biome art replaces it later by adding a NODE_DECOR entry (which
 * suppresses the placeholder), with zero change to the collision/hazard geometry.
 */
function buildNodePlaceholderFeatures(
  scene: GameScene,
  nodeId: string,
  offsetX: number,
  offsetY: number,
  depthBias: number,
): Phaser.GameObjects.Graphics[] {
  const features = NODE_FEATURES[nodeId];
  if (!features) return [];
  const arts = NODE_DECOR[nodeId];
  // Features painted by a functional Wang ground sheet (currently swamp rot
  // pools) need no placeholder. Mountain ledges use their dedicated overlay.
  const groundPainted = wangFunctionalFeatureIds(scene, nodeId);
  const out: Phaser.GameObjects.Graphics[] = [];
  const isMountain = NODE_BIOMES[nodeId]?.biomeGroup === "mountain";
  if (isMountain) {
    const ledges = features
      .filter((feature) => feature.id.startsWith("mountain_"))
      .map((feature) => ({ id: feature.id, shape: resolveFeatureShape(feature) }));
    const elevation = scene.add.graphics().setDepth(DEPTH.BG_DECOR + depthBias);
    if (drawMountainElevation(elevation, ledges, offsetX, offsetY)) {
      out.push(elevation);
    } else {
      elevation.destroy();
    }
  }

  for (const feature of features) {
    const isBlock = !!feature.blocksMovement?.length;
    const isHazard = !!(feature.damage || feature.statusWhileInside);
    if (!isBlock && !isHazard) continue;
    if (isMountain && feature.id.startsWith("mountain_")) continue;
    if (groundPainted.has(feature.id)) continue;
    // Skip if a real decor sprite already covers this feature.
    const hasSprite = arts?.some(
      (a) => a.featureId === feature.id && scene.textures.exists(a.key),
    );
    if (hasSprite) continue;
    // …or if scattered props dress it (jungle ambush bushes).
    if (featureScatterFor(scene, feature.id)) continue;

    const shape = resolveFeatureShape(feature);
    const g = scene.add.graphics().setDepth(DEPTH.BG_DECOR + depthBias);
    if (isBlock) {
      g.fillStyle(PLACEHOLDER_BLOCK_FILL, 0.95);
      g.lineStyle(4, PLACEHOLDER_BLOCK_LINE, 1);
    } else {
      g.fillStyle(PLACEHOLDER_HAZARD_FILL, 0.34);
      g.lineStyle(4, PLACEHOLDER_HAZARD_LINE, 0.9);
    }
    const cx = offsetX + shape.x;
    const cy = offsetY + shape.y;
    if (shape.kind === "circle") {
      g.fillCircle(cx, cy, shape.radius);
      g.strokeCircle(cx, cy, shape.radius);
      if (isHazard && !isBlock) {
        g.lineStyle(2, PLACEHOLDER_HAZARD_LINE, 0.35);
        g.strokeCircle(cx, cy, shape.radius * 0.72);
        g.strokeCircle(cx, cy, shape.radius * 0.46);
      }
    } else if (shape.kind === "ellipse") {
      g.fillEllipse(cx, cy, shape.halfW * 2, shape.halfH * 2);
      g.strokeEllipse(cx, cy, shape.halfW * 2, shape.halfH * 2);
      if (isHazard && !isBlock) {
        g.lineStyle(2, PLACEHOLDER_HAZARD_LINE, 0.35);
        g.strokeEllipse(cx, cy, shape.halfW * 1.45, shape.halfH * 1.45);
        g.strokeEllipse(cx, cy, shape.halfW * 0.9, shape.halfH * 0.9);
      }
    } else {
      g.fillRect(cx - shape.halfW, cy - shape.halfH, shape.halfW * 2, shape.halfH * 2);
      g.strokeRect(cx - shape.halfW, cy - shape.halfH, shape.halfW * 2, shape.halfH * 2);
    }
    out.push(g);
  }
  return out;
}

/**
 * Scattered forest trees for a node. In the active node (`ySort`) each tree is
 * drawn in two passes: the full canopy sprite is depth-sorted by the bottom of
 * its trunk (so entities north of the trunk render behind it and those south of
 * it render in front — walk-behind), and the trunk/root sheet is drawn on the
 * ground beneath all entities so players appear to step on the roots. Neighbor
 * previews stay flat below the sprite band (the player is never in a preview).
 */
function buildNodeTreeImages(
  scene: GameScene,
  nodeId: string,
  offsetX: number,
  offsetY: number,
  opts: { ySort: boolean; depthBias: number },
): Phaser.GameObjects.Image[] {
  if (!scene.textures.exists(TREES_KEY)) return [];

  const images: Phaser.GameObjects.Image[] = [];
  for (const tree of getNodeTrees(nodeId)) {
    const x = offsetX + tree.spriteX;
    const y = offsetY + tree.spriteY;

    if (!opts.ySort) {
      // Preview: the whole tree, flat, below the sprite band (no player here).
      images.push(
        scene.add
          .image(x, y, TREES_KEY, tree.variant)
          .setOrigin(0.5, 0.5)
          .setDisplaySize(tree.displaySize, tree.displaySize)
          .setDepth(DEPTH.BG_DECOR + opts.depthBias),
      );
      continue;
    }

    // Active node: split the canopy sheet at the trunk-base seam so the two
    // passes are slices of the *same* image. Extend each crop slightly past the
    // seam so both layers redraw the same trunk band — hides the hard edge after
    // scaling (selection rings, collision debug, etc. straddle this line).
    const seam = TREE_TRUNK_TOP_PX[tree.variant] ?? TREE_CELL_PX;
    const rootsCropY = Math.max(0, seam - TREE_SEAM_OVERLAP_PX);
    const canopyCropH = Math.min(TREE_CELL_PX, seam + TREE_SEAM_OVERLAP_PX);

    // Pass 2: trunk/roots (bottom slice) under the player — they step on it.
    const roots = scene.add
      .image(x, y, TREES_KEY, tree.variant)
      .setOrigin(0.5, 0.5)
      .setDisplaySize(tree.displaySize, tree.displaySize)
      .setDepth(TREE_ROOT_DEPTH);
    roots.setCrop(0, rootsCropY, TREE_CELL_PX, TREE_CELL_PX - rootsCropY);
    images.push(roots);

    // Pass 1: canopy + upper trunk (top slice) over the player — walk-behind.
    const canopy = scene.add
      .image(x, y, TREES_KEY, tree.variant)
      .setOrigin(0.5, 0.5)
      .setDisplaySize(tree.displaySize, tree.displaySize)
      .setDepth(DEPTH.SPRITE + sceneDepthY(tree.baseY));
    canopy.setCrop(0, 0, TREE_CELL_PX, canopyCropH);
    images.push(canopy);
  }
  return images;
}

function buildBoundary(
  scene: GameScene,
  offsetX: number,
  offsetY: number,
  depthBias: number,
): Phaser.GameObjects.Graphics {
  const w = GAME_CONFIG.NODE_WIDTH;
  const h = GAME_CONFIG.NODE_HEIGHT;
  const g = scene.add.graphics().setDepth(BOUNDARY_DEPTH + depthBias);
  g.lineStyle(2, 0x444466, 0.9);
  g.strokeRect(offsetX + 0.5, offsetY + 0.5, w - 1, h - 1);
  return g;
}

/** Builds bg + decor + boundary for `nodeId` at the given scene offset. */
export function paintNodeStatic(
  scene: GameScene,
  nodeId: string,
  offsetX: number,
  offsetY: number,
  depthBias = 0,
  throneOpen = false,
  options: PaintNodeStaticOptions = {},
): NodeStaticGroup {
  const preview = options.preview ?? false;
  return {
    nodeId,
    offsetX,
    offsetY,
    bg: buildBiomeBg(scene, nodeId, offsetX, offsetY, depthBias),
    shade: preview
      ? buildPreviewShade(scene, offsetX, offsetY, depthBias)
      : null,
    // Scattered feature dressing rides in the biomeDecor bucket: same lifetime,
    // same teardown, no extra scene field to keep in sync.
    biomeDecor: [
      ...buildBiomeDecorImages(scene, nodeId, offsetX, offsetY, depthBias, preview),
      ...buildFeatureScatterImages(scene, nodeId, offsetX, offsetY, depthBias, preview),
    ],
    decor: buildNodeDecorImages(
      scene,
      nodeId,
      offsetX,
      offsetY,
      depthBias,
      throneOpen,
    ),
    placeholders: buildNodePlaceholderFeatures(
      scene,
      nodeId,
      offsetX,
      offsetY,
      depthBias,
    ),
    trees: buildNodeTreeImages(scene, nodeId, offsetX, offsetY, {
      ySort: false,
      depthBias,
    }),
    boundary: preview
      ? scene.add.graphics().setVisible(false)
      : buildBoundary(scene, offsetX, offsetY, depthBias),
  };
}

export function destroyNodeStatic(group: NodeStaticGroup): void {
  group.bg?.destroy();
  group.shade?.destroy();
  for (const img of group.biomeDecor) img.destroy();
  for (const img of group.decor) img.destroy();
  for (const g of group.placeholders) g.destroy();
  for (const img of group.trees) img.destroy();
  group.boundary.destroy();
}

/** Strokes the active node gameplay boundary (0..NODE_WIDTH/HEIGHT). */
export function updateNodeBoundaryFrame(scene: GameScene): void {
  const w = GAME_CONFIG.NODE_WIDTH;
  const h = GAME_CONFIG.NODE_HEIGHT;
  scene.nodeBoundaryFrame.clear();
  scene.nodeBoundaryFrame.lineStyle(2, 0x444466, 0.9);
  scene.nodeBoundaryFrame.strokeRect(0.5, 0.5, w - 1, h - 1);
}

export function createGridBackground(scene: GameScene): void {
  const cell = 64;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  g.fillStyle(0x000000, 0);
  g.fillRect(0, 0, cell, cell);
  g.lineStyle(1, 0x2a2a4a, 0.45);
  g.strokeRect(0.5, 0.5, cell - 1, cell - 1);
  g.generateTexture("grid-cell", cell, cell);
  g.destroy();

  scene.bgGrid = scene.add
    .tileSprite(
      0,
      0,
      GAME_CONFIG.NODE_WIDTH,
      GAME_CONFIG.NODE_HEIGHT,
      "grid-cell",
    )
    .setOrigin(0, 0)
    .setDepth(-10);
}

export function paintActiveNode(scene: GameScene, nodeId: string): void {
  updateBiomeBackgroundForNode(scene, nodeId);
  updateNodeDecorForNode(scene, nodeId);
  updateNodeBoundaryFrame(scene);
}

function updateBiomeBackgroundForNode(scene: GameScene, nodeId: string): void {
  const biomeInfo = NODE_BIOMES[nodeId];
  if (!biomeInfo) return;
  const biome = BIOME_DATABASE.get(biomeInfo.biomeGroup);
  if (!biome) return;

  if (scene.bgTile) {
    scene.bgTile.destroy();
    scene.bgTile = null;
  }
  if (scene.bgWang) {
    scene.bgWang.destroy();
    scene.bgWang = null;
  }

  // A painted Wang ground takes precedence over the flat base, matching the
  // neighbor-node path so the active node and its neighbors render identically.
  const wang = buildWangGroundLayer(scene, biomeInfo.biomeGroup, nodeId, 0, 0, BG_DEPTH);
  if (wang) {
    scene.bgWang = wang;
    scene.bgNodeFill?.setVisible(false);
    scene.bgGrid.setVisible(false);
    return;
  }

  const textureKey = BIOME_TEXTURES[biomeInfo.biomeGroup];

  if (textureKey && scene.textures.exists(textureKey)) {
    scene.bgNodeFill?.setVisible(false);
    scene.bgTile = scene.add
      .tileSprite(
        0,
        0,
        GAME_CONFIG.NODE_WIDTH,
        GAME_CONFIG.NODE_HEIGHT,
        textureKey,
      )
      .setOrigin(0, 0)
      .setDepth(BG_DEPTH);
    scene.bgGrid.setVisible(false);
  } else {
    const nodeFill = ensureBgNodeFill(scene);
    nodeFill.setPosition(0, 0);
    nodeFill.setVisible(true).setFillStyle(biome.backgroundColor);
    scene.bgGrid.setVisible(true);
  }
}

function updateNodeDecorForNode(scene: GameScene, nodeId: string): void {
  for (const img of scene.nodeBiomeDecor) img.destroy();
  scene.nodeBiomeDecor = [];
  for (const img of scene.nodeDecor) img.destroy();
  scene.nodeDecor = [];
  for (const g of scene.nodePlaceholders) g.destroy();
  scene.nodePlaceholders = [];
  for (const img of scene.nodeTrees) img.destroy();
  scene.nodeTrees = [];

  const throneOpen =
    nodeId === scene.state.ownNodeId && isVoidThroneUnblocked(scene);
  scene.nodeBiomeDecor = [
    ...buildBiomeDecorImages(scene, nodeId, 0, 0, 0, false),
    ...buildFeatureScatterImages(scene, nodeId, 0, 0, 0, false),
  ];
  scene.nodeDecor = buildNodeDecorImages(
    scene,
    nodeId,
    0,
    0,
    0,
    throneOpen,
  );
  scene.nodePlaceholders = buildNodePlaceholderFeatures(
    scene,
    nodeId,
    0,
    0,
    0,
  );
  scene.nodeTrees = buildNodeTreeImages(scene, nodeId, 0, 0, {
    ySort: true,
    depthBias: 0,
  });
}

export function updateBiomeBackground(scene: GameScene): void {
  updateBiomeBackgroundForNode(scene, scene.state.ownNodeId);
}

export function updateNodeDecor(scene: GameScene): void {
  updateNodeDecorForNode(scene, scene.state.ownNodeId);
}

export function refreshNodeDecorState(scene: GameScene): void {
  const arts = NODE_DECOR[scene.state.ownNodeId];
  if (!arts) return;

  const throneOpen = isVoidThroneUnblocked(scene);
  for (const img of scene.nodeDecor) {
    const featureId = img.getData("featureId") as string | undefined;
    const art = arts.find((a) => a.featureId === featureId);
    if (!art) continue;
    const textureKey = throneOpen && art.openKey ? art.openKey : art.key;
    if (img.texture.key === textureKey || !scene.textures.exists(textureKey))
      continue;
    const displayW = img.displayWidth;
    const displayH = img.displayHeight;
    img.setTexture(textureKey).setDisplaySize(displayW, displayH);
  }
}

export function drawExitMarkers(scene: GameScene): void {
  scene.exitMarkers.clear();
}

export function drawMinimap(scene: GameScene): void {
  // Mobile: no minimap — the full Map panel is one tap away in the HUD tab bar.
  // On desktop, keep it hidden only when the rail-narrowed canvas cannot fit it
  // beside the centered Auto Combat control.
  if (isMobileViewport() || scene.scale.width < MINIMAP_MIN_SCENE_WIDTH) {
    scene.minimap.setVisible(false);
    return;
  }
  scene.minimap.setVisible(true);

  const now = scene.time.now;
  if (now - scene.state.throttles.minimapAt < 100) return;
  scene.state.throttles.minimapAt = now;

  const mmX = scene.scale.width - MM_W - MM_PAD;
  const mmY = scene.scale.height - MM_H - MM_PAD;
  const projection = minimapLayerProjection(
    scene.scale.width,
    scene.scale.height,
  );
  const layer = buildClientCollisionLayer(scene.state);

  scene.minimap.clear();

  const tierPalette = resolvedMinimapTierPalette();
  scene.minimap.fillStyle(tierPalette.background, tierPalette.backgroundAlpha);
  scene.minimap.fillRect(mmX, mmY, MM_W, MM_H);
  scene.minimap.lineStyle(3, tierPalette.innerEdge, 0.9);
  scene.minimap.strokeRect(mmX + 1, mmY + 1, MM_W - 2, MM_H - 2);
  if (uiTierActivationIsActive()) {
    const ignitionPulse = 0.58 + Math.sin(now / 72) * 0.32;
    scene.minimap.lineStyle(5, tierPalette.edge, ignitionPulse);
    scene.minimap.strokeRect(mmX - 2, mmY - 2, MM_W + 4, MM_H + 4);
  }
  scene.minimap.lineStyle(1, tierPalette.edge, 1);
  scene.minimap.strokeRect(mmX, mmY, MM_W, MM_H);

  paintCollisionLayer(scene.minimap, layer, projection, {
    mode: "minimap",
    kinds: minimapStaticKinds(),
  });
  paintEntityDotsOnMinimap(scene.minimap, scene.state, projection);
}

export function drawTacticalMode(scene: GameScene): void {
  if (!scene.tacticalMode) {
    if (scene.state.throttles.debugClearedAt !== -1) {
      scene.debugGraphics.clear();
      scene.state.throttles.debugClearedAt = -1;
    }
    return;
  }

  const gfx = scene.debugGraphics;
  gfx.clear();
  scene.state.throttles.debugClearedAt = scene.time.now;

  const layer = buildClientCollisionLayer(scene.state);
  paintCollisionLayer(gfx, layer, worldLayerProjection(), {
    mode: "world",
    kinds: tacticalKinds(),
  });
}
