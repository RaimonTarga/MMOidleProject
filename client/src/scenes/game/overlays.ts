import {
  BIOME_DATABASE,
  GAME_CONFIG,
  NODE_BIOMES,
  NODE_FEATURES,
  TREE_CELL_PX,
  TREE_TRUNK_TOP_PX,
  getNodeTrees,
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
import { BIOME_TEXTURES, NODE_DECOR, TREES_KEY } from "../../sprites";
import type { GameScene } from "./GameScene";
import { MM_H, MM_PAD, MM_W } from "./nodeExits";
import { isVoidThroneUnblocked } from "./voidThrone";

const BG_DEPTH = -11;
const BOUNDARY_DEPTH = -9.5;
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
  bg: Phaser.GameObjects.TileSprite | Phaser.GameObjects.Rectangle | null;
  shade: Phaser.GameObjects.Rectangle | null;
  decor: Phaser.GameObjects.Image[];
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
): Phaser.GameObjects.TileSprite | Phaser.GameObjects.Rectangle | null {
  const biomeInfo = NODE_BIOMES[nodeId];
  if (!biomeInfo) return null;
  const biome = BIOME_DATABASE.get(biomeInfo.biomeGroup);
  if (!biome) return null;

  const textureKey = BIOME_TEXTURES[biomeInfo.biomeGroup];
  const depth = BG_DEPTH + depthBias;

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
  if (!arts) return [];

  const decor: Phaser.GameObjects.Image[] = [];
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
  return decor;
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
    decor: buildNodeDecorImages(
      scene,
      nodeId,
      offsetX,
      offsetY,
      depthBias,
      throneOpen,
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
  for (const img of group.decor) img.destroy();
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

  const textureKey = BIOME_TEXTURES[biomeInfo.biomeGroup];

  if (scene.bgTile) {
    scene.bgTile.destroy();
    scene.bgTile = null;
  }

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
  for (const img of scene.nodeDecor) img.destroy();
  scene.nodeDecor = [];
  for (const img of scene.nodeTrees) img.destroy();
  scene.nodeTrees = [];

  const throneOpen =
    nodeId === scene.state.ownNodeId && isVoidThroneUnblocked(scene);
  scene.nodeDecor = buildNodeDecorImages(
    scene,
    nodeId,
    0,
    0,
    0,
    throneOpen,
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

  scene.minimap.fillStyle(0x0a0a1a, 0.85);
  scene.minimap.fillRect(mmX, mmY, MM_W, MM_H);
  scene.minimap.lineStyle(1, 0x444466, 1);
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
