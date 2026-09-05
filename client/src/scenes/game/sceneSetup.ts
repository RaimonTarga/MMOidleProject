import {
  EFFECT_DEFS,
  EMOTE_SPRITESHEETS,
  GAME_CONFIG,
  NODE_BIOMES,
  TREE_CELL_PX,
  directionBetweenNodes,
  peekSceneBounds,
  nodeToSceneCoords,
} from "@mmo-idle/shared";
import { DEPTH } from "../../render/depth";
import { getDefaultStore } from "jotai";
import {
  statusAtom,
  syncPlayerAtoms,
  nodeLoadingAtom,
  showReleaseAnnouncement,
  triggerDeathOverlay,
  setBossFelledMarkers,
  setRewardMultiplier,
  setHumanPlaytestStatus,
} from "../../hud/atoms";
import { applyWorldLogEvents } from "../../worldLog/formatWorldLog";
import { loadGameplaySettings } from "../../settings/gameplaySettings";
import {
  sendRequestSync,
  sendSetActive,
  sendSetAutocombatConfig,
  sendSetAutoTraverse,
} from "../../net/intents";
import { connectGameSocket, wireSocketHandlers } from "../../net/socket";
import {
  bindLobbySocket,
  handleCharacterList,
  handleCreateResult,
  handleDeleteResult,
  handleInitialStateSync,
  handleSelectResult,
  handleSocketConnected,
  handleSocketUnauthorized,
  handleSpectateError,
  handleSpectateStatus,
  unbindLobbySocket,
} from "../../auth/lobbyState";
import { applyDelta } from "../../net/deltaApplier";
import { hydrateSpectatorSnapshot } from "../../net/spectatorSnapshot";
import { watchTargetFromUrl } from "../../net/session";
import {
  ATLAS_KEY,
  BIOME_DECOR,
  BIOME_TEXTURES,
  CAVE_ROCK_FILES,
  CAVE_ROCK_KEYS,
  DESERT_ROCK_FILES,
  DESERT_ROCK_KEYS,
  DUNGEON_ALTAR_ART,
  HAZARD_POOL_ART,
  GRAVES_KEY,
  GRAVE_FRAME_SIZE,
  FEATURE_SCATTER,
  JUNGLE_TREE_FILES,
  JUNGLE_TREE_KEYS,
  PLAINS_TREE_FILES,
  PLAINS_TREE_KEYS,
  SWAMP_TREE_FILES,
  SWAMP_TREE_KEYS,
  TRENCH_ROCK_FILES,
  TRENCH_ROCK_KEYS,
  TUNDRA_TREE_FILES,
  TUNDRA_TREE_KEYS,
  VOLCANIC_ROCK_FILES,
  VOLCANIC_ROCK_KEYS,
  WASTELAND_TREE_FILES,
  WASTELAND_TREE_KEYS,
  NODE_DECOR,
  emoteAnimKey,
  emoteTextureKey,
  initVoidOverlordSheet,
  THOUGHT_BUBBLE_FILE,
  THOUGHT_BUBBLE_KEY,
  TREES_FILE,
  TREES_KEY,
  VOID_OVERLORD_FILE,
  VOID_OVERLORD_TEXTURE_KEY,
  VOID_TOMB_FILE,
  VOID_TOMB_TEXTURE_KEY,
} from "../../sprites";
import { stepInterpolation, getOwnBase } from "../../render/interpolation";
import { drawShadows } from "../../render/shadows";
import { drawTargetIndicator } from "../../render/targetIndicator";
import { setShadowDefs } from "../../render/shadowDefs";
import { drawLabels } from "../../render/labels";
import { drawThoughtBubbles } from "../../render/thoughtBubbles";
import { drawHealthBars } from "../../render/healthBars";
import { drawCooldownBars } from "../../render/cooldownBars";
import { drawCastBars } from "../../render/castBars";
import { drawSkillCallouts } from "../../render/skillCallouts";
import { updateEffectOverlays } from "../../render/effectOverlays";
import { updateMovementEffects } from "../../render/movementEffects";
import {
  beginTabResync,
  isClientRenderPaused,
  onDocumentHidden,
} from "../../fx/guard";
import { maybeNotifyDeath } from "../../notifications/deathNotification";
import { initAudio, playSfx } from "../../audio/audioEngine";
import {
  MUSIC_MANIFEST,
  SFX_MANIFEST,
  musicKey,
  sfxFiles,
  sfxKey,
  type SfxId,
} from "../../audio/manifest";
import { initParticleTextures, initEffectFrames } from "../../fx/particles";
import { initProceduralGroundTextures, PLAINS_GROUND_TEXTURE_KEY } from "../../render/proceduralGround";
import { preloadWangGround } from "../../render/wangGround";
import { updateLaserBeam } from "../../fx/laser";
import { updateHolyBeam } from "../../fx/holyBeam";
import { updateCannonCharge } from "../../fx/cannonFx";
import { updatePlayerAuras } from "../../fx/aura";
import { updateIdentityAccents } from "../../fx/identityAccent";
import { initMistPostFx, updateMistPostFx } from "../../fx/mistPostFx";
import { updateAltarGlow } from "../../fx/altarGlow";
import { updateAltarPrompt } from "../../render/altarPrompt";
import { updateVoidOverlordRespawn } from "../../render/voidOverlordTomb";
import { isVoidFloodActive } from "./voidThrone";
import { attachClickToMove } from "../../input/clickToMove";
import { attachGamepad } from "../../input/gamepad";
import { attachHudEvents } from "../../input/hudEvents";
import { attachKeyboard } from "../../input/keyboard";
import { startMovementTick } from "../../input/movement";
import {
  createGridBackground,
  drawTacticalMode,
  drawExitMarkers,
  drawMinimap,
  updateNodeBoundaryFrame,
  paintActiveNode,
} from "./overlays";
import { cameraWorldViewSize } from "../../render/cameraZoom";
import {
  applyCameraZoom,
  applyPeekCameraBounds,
  syncSceneBackdrop,
} from "./peekCamera";
import { showAscensionOverlay, showOverlordFelledOverlay } from "./screenOverlays";
import type { GameScene } from "./GameScene";
import { rebuildNeighborLayer } from "../../render/neighborScenes";
import {
  abortMapSlide,
  beginMapSlide,
  fastForwardMapSlide,
  tickMapSlide,
} from "./mapTransition";
import { tickSpectatorReadiness } from "./spectatorReady";
import { drawGroundZones } from "../../render/groundZones";
import { drawCorpses } from "../../render/corpses";
import { drawStunOrbits } from "../../render/stunOrbit";
import { createCinematicCamera, tickCinematicCamera } from "./cinematic/camera";
import { initBeacon, setPhase } from "./cinematic/mode";
import {
  createCinematicStaging,
  onCinematicEnteredWorld,
  stagingSettled,
  tickCinematicStaging,
} from "./cinematic/staging";
import {
  suppressCinematicChrome,
  suppressCinematicOverlays,
} from "./cinematic/suppress";

const CAMERA_HOLD_MARGIN = 80;
const CAMERA_LERP = 0.1;
const CAMERA_EDGE_PIN_DIST = 80;
const SHADOW_DEFS_KEY = "shadowDefs";

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function computeCameraScroll(
  scene: GameScene,
  scenePos: { x: number; y: number },
  nodePos: { x: number; y: number },
): { x: number; y: number; maxX: number; maxY: number } {
  const cam = scene.cameras.main;
  const nodeId = scene.state.ownNodeId || scene.lastDrawnNodeId;
  // Peek is half a VIEW away in world px, so it has to be measured after zoom.
  const view = cameraWorldViewSize(cam);
  const bounds = peekSceneBounds(nodeId, view.width, view.height);

  // Phaser keeps `scrollX/Y` in screen px while the world view spans
  // `size / zoom`, so the scroll value and the view's top-left corner separate by
  // this offset once zoom < 1. Everything below clamps the CORNER and converts
  // back, otherwise a zoomed-out camera stops short of the node edge.
  const offX = (cam.width - view.width) / 2;
  const offY = (cam.height - view.height) / 2;
  const minX = bounds.x - offX;
  const minY = bounds.y - offY;
  const maxX = Math.max(minX, bounds.x + bounds.width - view.width - offX);
  const maxY = Math.max(minY, bounds.y + bounds.height - view.height - offY);
  // Centering is zoom-independent: the view's center is always
  // `scroll + camSize / 2`, whatever the zoom.
  let x = clamp(scenePos.x - cam.width / 2, minX, maxX);
  let y = clamp(scenePos.y - cam.height / 2, minY, maxY);

  const W = GAME_CONFIG.NODE_WIDTH;
  const H = GAME_CONFIG.NODE_HEIGHT;
  if (nodePos.x <= CAMERA_EDGE_PIN_DIST) {
    x = minX;
  } else if (nodePos.x >= W - CAMERA_EDGE_PIN_DIST) {
    x = maxX;
  }
  if (nodePos.y <= CAMERA_EDGE_PIN_DIST) {
    y = minY;
  } else if (nodePos.y >= H - CAMERA_EDGE_PIN_DIST) {
    y = maxY;
  }

  return { x, y, maxX, maxY };
}

function initEmoteAnimations(scene: GameScene): void {
  for (const [emoteId, sheet] of Object.entries(EMOTE_SPRITESHEETS)) {
    const key = emoteAnimKey(emoteId);
    if (scene.anims.exists(key)) continue;
    const texKey = emoteTextureKey(emoteId);
    if (!scene.textures.exists(texKey)) continue;
    scene.anims.create({
      key,
      frames: scene.anims.generateFrameNumbers(texKey, {
        start: 0,
        end: sheet.frameCount - 1,
      }),
      frameRate: sheet.frameRate,
      repeat: -1,
    });
  }
}

function isPointComfortablyOnScreen(
  scene: GameScene,
  x: number,
  y: number,
): boolean {
  const view = scene.cameras.main.worldView;
  return (
    x >= view.x + CAMERA_HOLD_MARGIN &&
    x <= view.right - CAMERA_HOLD_MARGIN &&
    y >= view.y + CAMERA_HOLD_MARGIN &&
    y <= view.bottom - CAMERA_HOLD_MARGIN
  );
}

function instantReskinNode(scene: GameScene, nodeId: string): void {
  paintActiveNode(scene, nodeId);
  rebuildNeighborLayer(scene, nodeId);
  scene.lastDrawnNodeId = nodeId;
  applyPeekCameraBounds(scene, nodeId);
  syncSceneBackdrop(scene, nodeId);
}

/**
 * Queue biome ground textures, Wang sheets, and biome decor, optionally
 * restricted to a set of biome groups. Already-loaded textures are skipped, so
 * the spectator's deferred unfiltered pass only fetches what its slim boot
 * pass left out.
 */
function queueBiomeAssets(
  scene: GameScene,
  biomes: ReadonlySet<string> | null,
): void {
  const biomeTextureKeysSeen = new Set<string>();
  for (const [biomeGroup, key] of Object.entries(BIOME_TEXTURES)) {
    if (key === PLAINS_GROUND_TEXTURE_KEY) continue;
    if (biomes && !biomes.has(biomeGroup)) continue;
    if (biomeTextureKeysSeen.has(key) || scene.textures.exists(key)) continue;
    biomeTextureKeysSeen.add(key);
    scene.load.image(key, `/assets/${key}.png`);
  }
  preloadWangGround(scene, biomes);
  for (const [biomeGroup, altar] of Object.entries(DUNGEON_ALTAR_ART)) {
    if (biomes && !biomes.has(biomeGroup)) continue;
    if (scene.textures.exists(altar.key)) continue;
    scene.load.image(altar.key, altar.file);
  }
  const biomeDecorKeysSeen = new Set<string>();
  for (const [biomeGroup, specs] of Object.entries(BIOME_DECOR)) {
    if (!specs) continue;
    if (biomes && !biomes.has(biomeGroup)) continue;
    for (const s of specs) {
      if (biomeDecorKeysSeen.has(s.key) || scene.textures.exists(s.key)) continue;
      biomeDecorKeysSeen.add(s.key);
      scene.load.image(s.key, s.file);
    }
  }
}

function queueTreeAssets(scene: GameScene): void {
  scene.load.spritesheet(TREES_KEY, TREES_FILE, {
    frameWidth: TREE_CELL_PX,
    frameHeight: TREE_CELL_PX,
  });
  JUNGLE_TREE_KEYS.forEach((key, i) => {
    const file = JUNGLE_TREE_FILES[i];
    if (file) scene.load.image(key, file);
  });
  PLAINS_TREE_KEYS.forEach((key, i) => {
    const file = PLAINS_TREE_FILES[i];
    if (file) scene.load.image(key, file);
  });
  SWAMP_TREE_KEYS.forEach((key, i) => {
    const file = SWAMP_TREE_FILES[i];
    if (file) scene.load.image(key, file);
  });
  const imageSets: readonly [readonly string[], readonly string[]][] = [
    [TUNDRA_TREE_KEYS, TUNDRA_TREE_FILES],
    [WASTELAND_TREE_KEYS, WASTELAND_TREE_FILES],
    [CAVE_ROCK_KEYS, CAVE_ROCK_FILES],
    [DESERT_ROCK_KEYS, DESERT_ROCK_FILES],
    [VOLCANIC_ROCK_KEYS, VOLCANIC_ROCK_FILES],
    [TRENCH_ROCK_KEYS, TRENCH_ROCK_FILES],
  ];
  for (const [keys, files] of imageSets) {
    keys.forEach((key, i) => {
      const file = files[i];
      if (file) scene.load.image(key, file);
    });
  }
}

/**
 * Everything a spectator needs before the pane can paint at all: the sprite
 * atlas and the shadow definitions `createGameScene` reads synchronously.
 * Nothing else belongs here — `create()` does not run until the boot queue
 * drains, so every extra megabyte is dead time staring at an empty pane.
 */
function queueFirstPaintAssets(scene: GameScene): void {
  scene.load.atlas(ATLAS_KEY, "/assets/sprites.png", "/assets/sprites.json");
  scene.load.json(SHADOW_DEFS_KEY, "/assets/shadows.json");
}

/**
 * Presentation art — graves, emotes, effect sheets, hazard pools, node decor.
 * All of it degrades gracefully behind `textures.exists` guards, and the two
 * frame/animation builders that consume it are idempotent, so it can arrive
 * after first paint and be wired up then.
 */
function queuePresentationAssets(scene: GameScene): void {
  scene.load.spritesheet(GRAVES_KEY, "/assets/environment/graves.png", {
    frameWidth: GRAVE_FRAME_SIZE,
    frameHeight: GRAVE_FRAME_SIZE,
  });
  scene.load.image(THOUGHT_BUBBLE_KEY, THOUGHT_BUBBLE_FILE);
  for (const art of Object.values(HAZARD_POOL_ART)) {
    scene.load.image(art.key, art.file);
  }
  for (const [emoteId, sheet] of Object.entries(EMOTE_SPRITESHEETS)) {
    scene.load.spritesheet(emoteTextureKey(emoteId), sheet.file, {
      frameWidth: sheet.frameWidth,
      frameHeight: sheet.frameHeight,
    });
  }
  for (const def of EFFECT_DEFS) {
    if (def.rowSlices) {
      scene.load.image(def.key, def.file);
    } else {
      scene.load.spritesheet(def.key, def.file, {
        frameWidth: def.frameSize,
        frameHeight: def.frameSize,
      });
    }
  }
  const decorKeysSeen = new Set<string>();
  for (const specs of Object.values(NODE_DECOR)) {
    for (const s of specs) {
      if (!decorKeysSeen.has(s.key)) {
        decorKeysSeen.add(s.key);
        scene.load.image(s.key, s.file);
      }
      if (s.openKey && s.openFile && !decorKeysSeen.has(s.openKey)) {
        decorKeysSeen.add(s.openKey);
        scene.load.image(s.openKey, s.openFile);
      }
    }
  }
  // Feature scatter props (jungle ambush bushes) load with the decor above
  // rather than per-biome: they dress authored NODE_FEATURES, which are not
  // gated on the biome-streaming path.
  for (const spec of FEATURE_SCATTER) {
    for (const variant of spec.variants) {
      if (decorKeysSeen.has(variant.key)) continue;
      decorKeysSeen.add(variant.key);
      scene.load.image(variant.key, variant.file);
    }
  }

}

export function preloadGameAssets(scene: GameScene): void {
  queueFirstPaintAssets(scene);

  if (scene.spectatorMode) {
    // Landing spectate: `create()` is gated on this queue draining, so the boot
    // pass carries ONLY first-paint essentials and everything else streams from
    // create() — see startDeferredSpectatorAssets. Previously "slim" still meant
    // every effect sheet, emote, hazard, decor and feature prop up front: ~26
    // files and tens of megabytes, which on a cold cache left the pane showing
    // nothing at all because create() never ran. The node paints its flat biome
    // fill first and is re-skinned when the ground texture lands.
    // Audio never loads for spectators: initAudio is skipped and the sound
    // manager is muted.
    return;
  }

  queuePresentationAssets(scene);
  scene.load.image(VOID_OVERLORD_TEXTURE_KEY, VOID_OVERLORD_FILE);
  scene.load.image(VOID_TOMB_TEXTURE_KEY, VOID_TOMB_FILE);
  queueTreeAssets(scene);
  queueBiomeAssets(scene, null);
  // Audio: only entries with a real file are registered (manifest files are
  // undefined until assets land, so the engine synthesizes fallbacks meanwhile).
  for (const id of Object.keys(SFX_MANIFEST) as SfxId[]) {
    sfxFiles(SFX_MANIFEST[id]).forEach((file, i) => {
      scene.load.audio(sfxKey(id, i), file);
    });
  }
  for (const [group, file] of Object.entries(MUSIC_MANIFEST)) {
    if (file) scene.load.audio(musicKey(group), file);
  }
}

/**
 * Stream everything the slim spectator boot skipped, now that the pane is
 * already live. Un-arrived art degrades gracefully behind the render layer's
 * textures.exists guards (a retarget to an unloaded biome shows the flat
 * biome fill), and the completion hook re-skins the current node so late
 * textures replace their fallbacks.
 */
/**
 * Wire up art that arrived after `create()` ran, and re-skin the current node so
 * late textures replace their fallbacks. All of it is idempotent and skips
 * textures that are still missing, so a partial batch is safe and a later batch
 * finishes the job.
 */
function adoptDeferredSpectatorAssets(scene: GameScene): void {
  initEffectFrames(scene);
  initEmoteAnimations(scene);
  initVoidOverlordSheet(scene);
  const nodeId = scene.state.ownNodeId || scene.lastDrawnNodeId;
  if (nodeId && !scene.transitioning) instantReskinNode(scene, nodeId);
}

/**
 * Stream everything the slim spectator boot skipped, in TWO passes.
 *
 * Pass one carries only what the node on screen right now needs to stop looking
 * unfinished: presentation art, trees, and the CURRENT biome's ground. Pass two
 * fetches the other ten biomes so a later retarget has them.
 *
 * The split exists because of the landing handoff. One combined pass means the
 * "spectator looks finished" gate is really "every biome in the game has
 * downloaded" — tens of megabytes — so a first-time visitor would sit on the
 * prerecorded loop forever and never see the live world. Splitting lets the
 * handoff happen as soon as THIS node is genuinely done, which is the question
 * the gate is actually asking. A retarget into a biome pass two has not reached
 * yet still degrades gracefully to the flat biome fill, exactly as before.
 */
function startDeferredSpectatorAssets(scene: GameScene): void {
  queuePresentationAssets(scene);
  scene.load.image(VOID_OVERLORD_TEXTURE_KEY, VOID_OVERLORD_FILE);
  scene.load.image(VOID_TOMB_TEXTURE_KEY, VOID_TOMB_FILE);
  queueTreeAssets(scene);
  const firstNodeId = scene.state.ownNodeId || scene.lastDrawnNodeId;
  const firstBiome = NODE_BIOMES[firstNodeId]?.biomeGroup;
  queueBiomeAssets(scene, firstBiome ? new Set([firstBiome]) : null);

  scene.load.once("complete", () => {
    adoptDeferredSpectatorAssets(scene);
    // Gate for the landing handoff: the node on screen now has its real ground
    // and its effect/emote art, so revealing it will not pop underneath anyone.
    scene.spectatorAssetsReady = true;

    // Pass two: the remaining biomes, for retargets.
    queueBiomeAssets(scene, null);
    scene.load.once("complete", () => adoptDeferredSpectatorAssets(scene));
    scene.load.start();
  });
  scene.load.start();
}

export function createGameScene(scene: GameScene): void {
  initProceduralGroundTextures(scene);
  setShadowDefs(scene.cache.json.get(SHADOW_DEFS_KEY));
  initEmoteAnimations(scene);
  initParticleTextures(scene);
  initEffectFrames(scene);
  // Spectators load the overlord texture in the deferred pass; its completion
  // hook runs this init instead.
  if (!scene.spectatorMode) initVoidOverlordSheet(scene);
  initMistPostFx(scene);
  if (scene.spectatorMode || scene.cinematic) {
    // The landing preview is intentionally silent. Muting Phaser itself is the
    // final backstop, while skipping initAudio also prevents music subscriptions
    // and synthesized fallback cues from ever starting for anonymous viewers.
    // Capture runs are silent for the same reason: the shipped clip has no audio.
    scene.sound.mute = true;
  } else {
    initAudio(scene);
  }

  if (scene.cinematic) {
    const beacon = initBeacon(scene.cinematic);
    scene.cinematicCamera = createCinematicCamera(scene.cinematic, beacon);
    scene.cinematicStaging = createCinematicStaging(scene.cinematic, beacon);
    suppressCinematicChrome();
    setPhase(beacon, "lobby", "scene created; waiting on a character");
  }

  const cam = scene.cameras.main;
  // Snap the camera scroll to whole pixels. A fractional scroll during motion
  // lands tilemap tile edges between screen pixels, which bleeds the Wang ground
  // tiles into visible seams — but only while moving. Rounding fixes it without
  // changing sprite filtering (unlike a global pixelArt flag).
  cam.roundPixels = true;
  // Mobile frames a fixed slice of world instead of a keyhole of screen px.
  applyCameraZoom(scene);
  scene.bgRect = scene.add
    .rectangle(0, 0, cam.width, cam.height, GAME_CONFIG.SCENE_BACKDROP_COLOR)
    .setOrigin(0, 0)
    .setDepth(-12);

  createGridBackground(scene);

  scene.nodeBoundaryFrame = scene.add.graphics().setDepth(-9.5);
  updateNodeBoundaryFrame(scene);

  scene.targetMarker = scene.add
    .circle(0, 0, 5, 0xffff44, 0.8)
    .setVisible(false);
  scene.exitMarkers = scene.add.graphics().setDepth(DEPTH.FX - 1);
  scene.debugGraphics = scene.add.graphics().setDepth(DEPTH.FX + 1000);
  scene.cameraTarget = scene.add.arc(0, 0, 1).setAlpha(0);
  scene.minimap = scene.add
    .graphics()
    .setScrollFactor(0)
    .setDepth(DEPTH.MINIMAP)
    .setVisible(!scene.spectatorMode);

  // A capture run is as inert as a spectator: no input reaches the world, so a
  // stray pointer or keypress during recording cannot move the anchor player.
  const inert = scene.spectatorMode || scene.cinematic !== null;
  const detachHud = inert ? () => {} : attachHudEvents(scene);
  const detachClick = inert ? () => {} : attachClickToMove(scene);
  const detachKb = inert ? () => {} : attachKeyboard(scene);
  const detachPad = inert ? () => {} : attachGamepad(scene);
  const stopMove = inert ? () => {} : startMovementTick(scene);
  const detachSocket = connectSocket(scene);

  function onVisibilityChange(): void {
    if (document.hidden) {
      abortMapSlide(scene);
      if (scene.socket.connected) {
        if (scene.spectatorMode) scene.socket.emit("spectate:setActive", false);
        else sendSetActive(scene.socket, false);
      }
      onDocumentHidden();
      return;
    }
    if (scene.socket.connected) {
      if (scene.spectatorMode) scene.socket.emit("spectate:setActive", true);
      else {
        sendSetActive(scene.socket, true);
        sendRequestSync(scene.socket);
      }
    }
    abortMapSlide(scene);
    beginTabResync(scene.state, scene);
  }
  document.addEventListener("visibilitychange", onVisibilityChange);
  const resumeSpectator = (): void => {
    if (scene.spectatorMode && scene.spectatorPaused && scene.socket.connected) {
      scene.socket.emit("spectate:resume");
    }
  };
  document.addEventListener("pointerdown", resumeSpectator);
  document.addEventListener("keydown", resumeSpectator);

  scene.events.once("shutdown", () => {
    document.removeEventListener("visibilitychange", onVisibilityChange);
    document.removeEventListener("pointerdown", resumeSpectator);
    document.removeEventListener("keydown", resumeSpectator);
    detachKb();
    detachPad();
    stopMove();
    detachHud();
    detachClick();
    detachSocket();
  });
  if (scene.spectatorMode) startDeferredSpectatorAssets(scene);

  const applyPeekBoundsOnResize = (): void => {
    const nodeId = scene.state.ownNodeId || scene.lastDrawnNodeId;
    if (!nodeId) return;
    applyPeekCameraBounds(scene, nodeId);
    syncSceneBackdrop(scene, nodeId);
  };
  scene.scale.on("resize", applyPeekBoundsOnResize);
  scene.events.once("shutdown", () => {
    scene.scale.off("resize", applyPeekBoundsOnResize);
  });
}

export function updateGameScene(scene: GameScene, delta: number): void {
  const dt = Math.min(delta, 100) / 1000;

  if (scene.transitioning) {
    tickMapSlide(scene, dt);
    // Authoritative node bounced mid-slide — finish the tween and snap visuals.
    if (scene.state.ownNodeId !== scene.mapTransition.toNodeId) {
      fastForwardMapSlide(scene);
      instantReskinNode(scene, scene.state.ownNodeId);
    }
  } else if (scene.state.ownNodeId !== scene.lastDrawnNodeId) {
    if (scene.spectatorMode || scene.cinematic) {
      // A capture teleports across the map; the Link's-Awakening slide is a
      // gameplay continuity flourish and has no place in a scripted shot.
      instantReskinNode(scene, scene.state.ownNodeId);
    } else {
    const dir = directionBetweenNodes(scene.lastDrawnNodeId, scene.state.ownNodeId);
    if (dir) {
      beginMapSlide(scene, dir, scene.state.ownNodeId);
    } else {
      instantReskinNode(scene, scene.state.ownNodeId);
    }
    }
  }

  // The own player tracks the server-authoritative position even during a map
  // slide; the slide is purely a camera pan, so client and server never diverge.
  stepInterpolation(scene, dt);
  drawShadows(scene.state);
  drawLabels(scene.state);
  drawThoughtBubbles(scene.state);
  drawHealthBars(scene.state);

  if (!isClientRenderPaused()) {
    drawTargetIndicator(scene.state, scene);
    drawCooldownBars(scene.state);
    drawCastBars(scene.state, scene);
    drawGroundZones(scene);
    drawCorpses(scene);
    drawStunOrbits(scene);
    drawSkillCallouts(scene.state);
    updateEffectOverlays(scene.state, scene, dt);
    updateMovementEffects(scene.state, scene);
    updateLaserBeam(scene.state, scene);
    updateHolyBeam(scene.state, scene);
    updateCannonCharge(scene.state, scene);
    updatePlayerAuras(scene.state, scene);
    updateIdentityAccents(scene.state, scene);
    updateVoidOverlordRespawn(scene.state, scene);
    updateMistPostFx(scene, isVoidFloodActive(scene), scene.time.now, dt);
    updateAltarGlow(scene, dt);
    updateAltarPrompt(scene);
    drawExitMarkers(scene);
    if (!scene.spectatorMode) drawMinimap(scene);
  }

  // Capture mode owns the camera outright: the authored path replaces the
  // follow logic below rather than fighting it for the same scroll every frame.
  if (scene.cinematic && scene.cinematicCamera && scene.cinematicStaging) {
    suppressCinematicOverlays(scene);
    const staging = scene.cinematicStaging;
    const cam = scene.cinematicCamera;
    tickCinematicStaging(scene, staging, cam.elapsedMs);
    tickCinematicCamera(scene, cam, delta, stagingSettled(staging, cam.elapsedMs));
    return;
  }

  // The camera follows the own player every frame — including during a map
  // slide. The slide is a continuity camera jump followed by the same smooth
  // lerp used for normal world movement, so the camera tracks the player across
  // the transition instead of running a separate time-based tween that freezes
  // at the boundary and then snaps onto the moved player.
  if (scene.spectatorMode) tickSpectatorReadiness(scene);

  const spectatorBase = scene.spectatorTargetId
    ? scene.state.interpolation.get(scene.spectatorTargetId)?.base
    : undefined;
  const base = scene.spectatorMode
    ? (spectatorBase
        ? { x: spectatorBase.x, y: spectatorBase.y }
        : { x: GAME_CONFIG.NODE_WIDTH / 2, y: GAME_CONFIG.NODE_HEIGHT / 2 })
    : getOwnBase(scene.state);
  if (base) {
    const scenePos = nodeToSceneCoords(base.x, base.y);
    const shouldHoldCamera =
      !scene.autoMode &&
      scene.flashCameraHold &&
      isPointComfortablyOnScreen(scene, scenePos.x, scenePos.y);
    if (!shouldHoldCamera) {
      scene.cameraTarget.setPosition(scenePos.x, scenePos.y);
      const cam = scene.cameras.main;
      const targetScroll = computeCameraScroll(scene, scenePos, base);
      cam.stopFollow();
      if (!scene.cameraScrollReady) {
        cam.setScroll(targetScroll.x, targetScroll.y);
        scene.cameraScrollReady = true;
      } else {
        const scrollDx = targetScroll.x - cam.scrollX;
        const scrollDy = targetScroll.y - cam.scrollY;
        const lagSq = scrollDx * scrollDx + scrollDy * scrollDy;
        // During auto-combat the player can outrun the default camera lerp and
        // appear frozen off-screen while still pathing on the server.
        const followT = scene.autoMode
          ? (lagSq > 140 * 140 ? 1 : 0.3)
          : CAMERA_LERP;
        cam.setScroll(
          lerp(cam.scrollX, targetScroll.x, followT),
          lerp(cam.scrollY, targetScroll.y, followT),
        );
      }
    }
  }

  const ownSprite = scene.state.ownId
    ? scene.state.sprite.get(scene.state.ownId)
    : undefined;
  if (ownSprite && scene.targetMarker.visible) {
    const dx = ownSprite.x - scene.targetMarker.x;
    const dy = ownSprite.y - scene.targetMarker.y;
    if (dx * dx + dy * dy < 16) scene.targetMarker.setVisible(false);
  }

  drawTacticalMode(scene);
}

function connectSocket(scene: GameScene): () => void {
  const socket = connectGameSocket();
  scene.socket = socket;
  bindLobbySocket(socket);
  const atomStore = getDefaultStore();

  const unwireSocket = wireSocketHandlers(socket, {
    onConnect: (socket) => {
      handleSocketConnected();
      scene.myId = socket.id ?? "";
      atomStore.set(statusAtom, "connected");
      // Re-assert tab focus so a reconnect while hidden doesn't resume streaming.
      if (scene.spectatorMode) {
        socket.emit("spectate:setActive", !document.hidden);
        // `?watch=<playerId>` pins the camera to one character instead of the
        // automatic pick. The bot harness dashboard links here so a card click
        // opens the live world already following that bot. Dev-only: the server
        // does not register the handler in production, and re-emitting on every
        // reconnect keeps the pin across a dropped socket.
        const watchId = watchTargetFromUrl();
        if (watchId) socket.emit("spectate:setTarget", watchId);
      } else {
        sendSetActive(socket, !document.hidden);
        const gameplaySettings = loadGameplaySettings();
        sendSetAutoTraverse(socket, gameplaySettings.autoTraverseEnabled);
        sendSetAutocombatConfig(socket, gameplaySettings.autocombat);
      }
    },
    onUnauthorized: handleSocketUnauthorized,
    onDisconnect: () => {
      atomStore.set(statusAtom, "disconnected");
      syncPlayerAtoms(null);
      scene.state.gameplaySettingsSynced = false;
      scene.myId = "";
      scene.state.ownId = null;
      scene.spectatorTargetId = null;
      scene.spectatorSnapshotNodeId = null;
      scene.cameraScrollReady = false;
      scene.cameras.main.stopFollow();
    },
    onCharacterList: handleCharacterList,
    onCharacterCreateResult: handleCreateResult,
    onCharacterDeleteResult: handleDeleteResult,
    onCharacterSelectResult: handleSelectResult,
    onStateSync: (snapshot) => {
      applyDelta(scene.state, snapshot, scene);
      handleInitialStateSync();
      if (scene.cinematicStaging) {
        onCinematicEnteredWorld(scene.cinematicStaging, socket);
      }
    },
    onDelta: (snapshot) => applyDelta(scene.state, snapshot, scene),
    onSpectateSnapshot: (snapshot) => {
      const nodeChanged = scene.state.ownNodeId !== snapshot.nodeId;
      scene.state.ownNodeId = snapshot.nodeId;
      if (nodeChanged) scene.cameraScrollReady = false;
      const hydrated = hydrateSpectatorSnapshot(
        snapshot,
        scene.spectatorSnapshotNodeId,
        scene.state.ids,
      );
      scene.spectatorSnapshotNodeId = snapshot.nodeId;
      applyDelta(scene.state, hydrated, scene);
    },
    onSpectateStatus: (status) => {
      scene.spectatorTargetId = status.targetId ?? null;
      scene.spectatorPaused = status.paused;
      handleSpectateStatus(status);
    },
    onSpectateError: handleSpectateError,
    onNodePreparing: ({ nodeId }) => {
      if (nodeId === scene.state.ownNodeId || nodeId === scene.lastDrawnNodeId) return;
      const dir = directionBetweenNodes(scene.state.ownNodeId, nodeId);
      if (dir) {
        // Adjacent thaw: slide is driven by the delta ownNodeId change in updateGameScene.
        return;
      }
      atomStore.set(nodeLoadingAtom, { active: true, nodeId });
    },
    onCraftResult: (result) => {
      window.dispatchEvent(
        new CustomEvent("hud:craftResult", { detail: result }),
      );
    },
    onRuneCraftResult: (result) => {
      window.dispatchEvent(
        new CustomEvent("hud:craftResult", { detail: result }),
      );
    },
    onAbilityCraftResult: (result) => {
      window.dispatchEvent(
        new CustomEvent("hud:craftResult", { detail: result }),
      );
    },
    onStanceCraftResult: (result) => {
      window.dispatchEvent(
        new CustomEvent("hud:craftResult", { detail: result }),
      );
    },
    onRiteCraftResult: (result) => {
      window.dispatchEvent(
        new CustomEvent("hud:craftResult", { detail: result }),
      );
    },
    onBuildLoadoutResult: (result) => {
      window.dispatchEvent(new CustomEvent("hud:loadoutResult", { detail: result }));
    },
    onUpgradeResult: (result) => {
      window.dispatchEvent(
        new CustomEvent("hud:upgradeResult", { detail: result }),
      );
    },
    onPlayerDied: (payload) => {
      triggerDeathOverlay(payload);
      playSfx("death");
      maybeNotifyDeath();
    },
    onWorldEvents: (events) => {
      applyWorldLogEvents(events, scene.myId);
    },
    onPlayerAscended: (tier) => {
      showAscensionOverlay(scene, tier);
    },
    onOverlordFelled: () => {
      showOverlordFelledOverlay(scene);
    },
    onBossFelled: (markers) => {
      setBossFelledMarkers(markers);
    },
    onRewardMultiplier: (multiplier) => {
      setRewardMultiplier(multiplier);
    },
    onHumanPlaytestStatus: (status) => {
      setHumanPlaytestStatus(status);
    },
    onUpdateAnnouncement: (payload) => {
      showReleaseAnnouncement(payload);
    },
    onSessionKicked: () => {
      const overlay = document.createElement("div");
      overlay.style.cssText = [
        "position:fixed",
        "inset:0",
        "z-index:99999",
        "background:rgba(0,0,0,0.85)",
        "display:flex",
        "flex-direction:column",
        "align-items:center",
        "justify-content:center",
        "color:#fff",
        "font-family:sans-serif",
        "text-align:center",
        "gap:12px",
      ].join(";");
      overlay.innerHTML = `
        <div style="font-size:1.4rem;font-weight:bold">Session replaced</div>
        <div style="font-size:1rem;opacity:0.75">Another tab or window opened this account.<br>Close this tab and use the other one.</div>
      `;
      document.body.appendChild(overlay);
    },
  });
  return () => {
    unwireSocket();
    unbindLobbySocket(socket);
    socket.disconnect();
  };
}
