import {
  NODE_BIOMES,
  TREE_CELL_PX,
  getNodeTallProps,
  getNodeTrees,
  nodeExitsForNodeId,
  type TreeInstance,
} from "@mmo-idle/shared";
import {
  BIOME_DECOR,
  BIOME_TEXTURES,
  CAVE_ROCK_FILES,
  CAVE_ROCK_KEYS,
  DESERT_ROCK_FILES,
  DESERT_ROCK_KEYS,
  DUNGEON_ALTAR_ART,
  JUNGLE_TREE_FILES,
  JUNGLE_TREE_KEYS,
  NODE_DECOR,
  PLAINS_TREE_FILES,
  PLAINS_TREE_KEYS,
  SWAMP_TREE_FILES,
  SWAMP_TREE_KEYS,
  TREES_FILE,
  TREES_KEY,
  TRENCH_ROCK_FILES,
  TRENCH_ROCK_KEYS,
  TUNDRA_TREE_FILES,
  TUNDRA_TREE_KEYS,
  VOLCANIC_ROCK_FILES,
  VOLCANIC_ROCK_KEYS,
  WASTELAND_TREE_FILES,
  WASTELAND_TREE_KEYS,
} from "../../sprites";
import { PLAINS_GROUND_TEXTURE_KEY } from "../../render/proceduralGround";
import { WANG_GROUND, preloadWangGround } from "../../render/wangGround";
import type { GameScene } from "./GameScene";

/**
 * Zone art streams around the viewer instead of loading every biome at boot.
 *
 * Radius 2 because the neighbour layer paints the four adjacent nodes as edge
 * previews: the moment you step into a neighbour, ITS neighbours (two hops from
 * where you stood) are already on screen. Keeping two hops loaded means a
 * walked-into node and its previews are always textured; only a jump (death
 * respawn, dev teleport) can land somewhere unloaded, which paints the flat
 * biome fill until the batch lands and the node is re-skinned.
 */
const ART_RADIUS_HOPS = 2;

type TreeArtSet = TreeInstance["artSet"];

const TREE_IMAGE_SETS: Partial<Record<TreeArtSet, readonly [readonly string[], readonly string[]]>> = {
  jungle: [JUNGLE_TREE_KEYS, JUNGLE_TREE_FILES],
  plains: [PLAINS_TREE_KEYS, PLAINS_TREE_FILES],
  swamp: [SWAMP_TREE_KEYS, SWAMP_TREE_FILES],
  tundra: [TUNDRA_TREE_KEYS, TUNDRA_TREE_FILES],
  wasteland: [WASTELAND_TREE_KEYS, WASTELAND_TREE_FILES],
  "cave-rock": [CAVE_ROCK_KEYS, CAVE_ROCK_FILES],
  "desert-rock": [DESERT_ROCK_KEYS, DESERT_ROCK_FILES],
  "volcanic-rock": [VOLCANIC_ROCK_KEYS, VOLCANIC_ROCK_FILES],
  "trench-rock": [TRENCH_ROCK_KEYS, TRENCH_ROCK_FILES],
};

/** Nodes within `hops` cardinal steps of `centerNodeId`, center included. */
export function nodesWithinHops(centerNodeId: string, hops: number): Set<string> {
  const seen = new Set<string>([centerNodeId]);
  let frontier = [centerNodeId];
  for (let step = 0; step < hops; step++) {
    const next: string[] = [];
    for (const id of frontier) {
      for (const neighborId of Object.values(nodeExitsForNodeId(id))) {
        if (!neighborId || seen.has(neighborId)) continue;
        seen.add(neighborId);
        next.push(neighborId);
      }
    }
    frontier = next;
  }
  return seen;
}

/**
 * Queue biome-keyed art: ground textures, Wang sheets (incl. functional hazard
 * sheets), dungeon altars and optionally biome decor. `null` means every biome.
 * Already-loaded or already-queued keys are skipped by the loader.
 *
 * `groundFallbacks: false` skips the flat `biome_*.png` tiles for biomes that
 * paint with Wang sheets: there they are only a fallback and the travel
 * thought-bubble icon, ~3 MB each, and must not hold up first paint.
 */
export function queueBiomeAssets(
  scene: GameScene,
  biomes: ReadonlySet<string> | null,
  includeDecor = true,
  groundFallbacks = true,
): void {
  for (const [biomeGroup, key] of Object.entries(BIOME_TEXTURES)) {
    if (key === PLAINS_GROUND_TEXTURE_KEY) continue;
    if (biomes && !biomes.has(biomeGroup)) continue;
    if (!groundFallbacks && WANG_GROUND[biomeGroup]) continue;
    if (scene.textures.exists(key)) continue;
    scene.load.image(key, `/assets/${key}.png`);
  }
  preloadWangGround(scene, biomes);
  for (const [biomeGroup, altar] of Object.entries(DUNGEON_ALTAR_ART)) {
    if (biomes && !biomes.has(biomeGroup)) continue;
    if (scene.textures.exists(altar.key)) continue;
    scene.load.image(altar.key, altar.file);
  }
  if (!includeDecor) return;
  for (const [biomeGroup, specs] of Object.entries(BIOME_DECOR)) {
    if (!specs) continue;
    if (biomes && !biomes.has(biomeGroup)) continue;
    for (const s of specs) {
      if (!scene.textures.exists(s.key)) scene.load.image(s.key, s.file);
    }
  }
}

/** Tall props (trees, rock spires) for exactly the art sets these nodes use. */
function queueTreeAssets(scene: GameScene, nodeIds: Iterable<string>): void {
  const artSets = new Set<TreeArtSet>();
  for (const nodeId of nodeIds) {
    for (const tree of getNodeTrees(nodeId)) artSets.add(tree.artSet);
    for (const prop of getNodeTallProps(nodeId)) artSets.add(prop.artSet);
  }
  for (const artSet of artSets) {
    const imageSet = TREE_IMAGE_SETS[artSet];
    if (!imageSet) {
      // Forest (and any set without per-variant images) uses the shared sheet.
      if (!scene.textures.exists(TREES_KEY)) {
        scene.load.spritesheet(TREES_KEY, TREES_FILE, {
          frameWidth: TREE_CELL_PX,
          frameHeight: TREE_CELL_PX,
        });
      }
      continue;
    }
    const [keys, files] = imageSet;
    keys.forEach((key, i) => {
      const file = files[i];
      if (file && !scene.textures.exists(key)) scene.load.image(key, file);
    });
  }
}

/** Per-node set pieces (rune altars, thrones) for these nodes only. */
function queueNodeDecorAssets(scene: GameScene, nodeIds: Iterable<string>): void {
  for (const nodeId of nodeIds) {
    for (const s of NODE_DECOR[nodeId] ?? []) {
      if (!scene.textures.exists(s.key)) scene.load.image(s.key, s.file);
      if (s.openKey && s.openFile && !scene.textures.exists(s.openKey)) {
        scene.load.image(s.openKey, s.openFile);
      }
    }
  }
}

/**
 * Queue every zone-art file the given nodes need to paint fully. `essentialOnly`
 * leaves out what painting does not need (Wang-biome fallback tiles).
 */
export function queueNodeArt(
  scene: GameScene,
  nodeIds: ReadonlySet<string>,
  essentialOnly = false,
): void {
  const biomes = new Set<string>();
  for (const nodeId of nodeIds) {
    const biomeGroup = NODE_BIOMES[nodeId]?.biomeGroup;
    if (biomeGroup) biomes.add(biomeGroup);
  }
  queueBiomeAssets(scene, biomes, true, !essentialOnly);
  queueTreeAssets(scene, nodeIds);
  queueNodeDecorAssets(scene, nodeIds);
}

/**
 * Run whatever is queued, then `done`. Files added mid-load join the running
 * batch (Phaser's addFile bumps totalToLoad) and start() is a no-op while
 * loading, so overlapping calls are safe. When nothing is queued or loading,
 * `done(false)` runs synchronously.
 */
export function runLoadBatch(scene: GameScene, done: (loaded: boolean) => void): void {
  if (scene.load.list.size === 0 && !scene.load.isLoading()) {
    done(false);
    return;
  }
  scene.load.once("complete", () => done(true));
  scene.load.start();
}

/**
 * Stream zone art around `centerNodeId` in two phases: first what is on screen
 * (the node plus its four edge previews), then the rest of ART_RADIUS_HOPS,
 * which is off screen and only needs to be ready for the next step. `onLoaded`
 * runs after each phase (`loaded` is false when the phase needed nothing new);
 * phase two is skipped if `stillWanted()` says the viewer has already moved on.
 */
export function streamNodeArea(
  scene: GameScene,
  centerNodeId: string,
  stillWanted: () => boolean,
  onLoaded: (phase: "visible" | "area", loaded: boolean) => void,
): void {
  if (!NODE_BIOMES[centerNodeId]) return;
  queueNodeArt(scene, nodesWithinHops(centerNodeId, 1), true);
  runLoadBatch(scene, (loaded) => {
    onLoaded("visible", loaded);
    if (!stillWanted()) return;
    queueNodeArt(scene, nodesWithinHops(centerNodeId, ART_RADIUS_HOPS));
    runLoadBatch(scene, (areaLoaded) => onLoaded("area", areaLoaded));
  });
}
