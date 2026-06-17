import {
  EFFECT_DEFS,
  EMOTE_SPRITESHEETS,
  GAME_CONFIG,
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
} from "../../hud/atoms";
import { applyWorldLogEvents } from "../../worldLog/formatWorldLog";
import { loadGameplaySettings } from "../../settings/gameplaySettings";
import {
  sendRequestSync,
  sendSetActive,
  sendSetAutocombatConfig,
  sendSetAutoTraverse,
} from "../../net/intents";
import { accountId, displayName } from "../../clientAuth";
import { connectGameSocket, wireSocketHandlers } from "../../net/socket";
import { applyDelta } from "../../net/deltaApplier";
import {
  ATLAS_KEY,
  BIOME_TEXTURES,
  GRAVES_KEY,
  GRAVE_FRAME_SIZE,
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
import { setShadowDefs } from "../../render/shadowDefs";
import { drawLabels } from "../../render/labels";
import { drawThoughtBubbles } from "../../render/thoughtBubbles";
import { drawHealthBars } from "../../render/healthBars";
import { drawCooldownBars } from "../../render/cooldownBars";
import { updateEffectOverlays } from "../../render/effectOverlays";
import { updateMovementEffects } from "../../render/movementEffects";
import {
  beginTabResync,
  isClientRenderPaused,
  onDocumentHidden,
} from "../../fx/guard";
import { maybeNotifyDeath } from "../../notifications/deathNotification";
import { initParticleTextures, initEffectFrames } from "../../fx/particles";
import { updateLaserBeam } from "../../fx/laser";
import { updateHolyBeam } from "../../fx/holyBeam";
import { updateCannonCharge } from "../../fx/cannonFx";
import { updatePlayerAuras } from "../../fx/aura";
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
import { applyPeekCameraBounds, syncSceneBackdrop } from "./peekCamera";
import { showAscensionOverlay, showOverlordFelledOverlay } from "./screenOverlays";
import type { GameScene } from "./GameScene";
import { rebuildNeighborLayer } from "../../render/neighborScenes";
import {
  abortMapSlide,
  beginMapSlide,
  fastForwardMapSlide,
  tickMapSlide,
} from "./mapTransition";

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
  const bounds = peekSceneBounds(nodeId, cam.width, cam.height);
  const vw = cam.width;
  const vh = cam.height;
  const maxX = Math.max(bounds.x, bounds.x + bounds.width - vw);
  const maxY = Math.max(bounds.y, bounds.y + bounds.height - vh);
  let x = clamp(scenePos.x - vw / 2, bounds.x, maxX);
  let y = clamp(scenePos.y - vh / 2, bounds.y, maxY);

  const W = GAME_CONFIG.NODE_WIDTH;
  const H = GAME_CONFIG.NODE_HEIGHT;
  if (nodePos.x <= CAMERA_EDGE_PIN_DIST) {
    x = bounds.x;
  } else if (nodePos.x >= W - CAMERA_EDGE_PIN_DIST) {
    x = maxX;
  }
  if (nodePos.y <= CAMERA_EDGE_PIN_DIST) {
    y = bounds.y;
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

export function preloadGameAssets(scene: GameScene): void {
  scene.load.atlas(ATLAS_KEY, "/assets/sprites.png", "/assets/sprites.json");
  scene.load.spritesheet(GRAVES_KEY, "/assets/environment/graves.png", {
    frameWidth: GRAVE_FRAME_SIZE,
    frameHeight: GRAVE_FRAME_SIZE,
  });
  scene.load.json(SHADOW_DEFS_KEY, "/assets/shadows.json");
  scene.load.image(VOID_OVERLORD_TEXTURE_KEY, VOID_OVERLORD_FILE);
  scene.load.image(VOID_TOMB_TEXTURE_KEY, VOID_TOMB_FILE);
  scene.load.image(THOUGHT_BUBBLE_KEY, THOUGHT_BUBBLE_FILE);
  scene.load.spritesheet(TREES_KEY, TREES_FILE, {
    frameWidth: TREE_CELL_PX,
    frameHeight: TREE_CELL_PX,
  });
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
  for (const key of Object.values(BIOME_TEXTURES)) {
    scene.load.image(key, `/assets/${key}.png`);
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
}

export function createGameScene(scene: GameScene): void {
  setShadowDefs(scene.cache.json.get(SHADOW_DEFS_KEY));
  initEmoteAnimations(scene);
  initParticleTextures(scene);
  initEffectFrames(scene);
  initVoidOverlordSheet(scene);
  initMistPostFx(scene);

  const cam = scene.cameras.main;
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
    .setDepth(DEPTH.MINIMAP);

  attachHudEvents(scene);
  attachClickToMove(scene);
  const detachKb = attachKeyboard(scene);
  const detachPad = attachGamepad(scene);
  const stopMove = startMovementTick(scene);

  function onVisibilityChange(): void {
    if (document.hidden) {
      abortMapSlide(scene);
      if (scene.socket.connected) sendSetActive(scene.socket, false);
      onDocumentHidden();
      return;
    }
    if (scene.socket.connected) {
      sendSetActive(scene.socket, true);
      sendRequestSync(scene.socket);
    }
    abortMapSlide(scene);
    beginTabResync(scene.state, scene);
  }
  document.addEventListener("visibilitychange", onVisibilityChange);

  scene.events.once("shutdown", () => {
    document.removeEventListener("visibilitychange", onVisibilityChange);
    detachKb();
    detachPad();
    stopMove();
  });
  connectSocket(scene);

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
    const dir = directionBetweenNodes(scene.lastDrawnNodeId, scene.state.ownNodeId);
    if (dir) {
      beginMapSlide(scene, dir, scene.state.ownNodeId);
    } else {
      instantReskinNode(scene, scene.state.ownNodeId);
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
    drawCooldownBars(scene.state);
    updateEffectOverlays(scene.state, scene, dt);
    updateMovementEffects(scene.state, scene);
    updateLaserBeam(scene.state, scene);
    updateHolyBeam(scene.state, scene);
    updateCannonCharge(scene.state, scene);
    updatePlayerAuras(scene.state, scene);
    updateVoidOverlordRespawn(scene.state, scene);
    updateMistPostFx(scene, isVoidFloodActive(scene), scene.time.now, dt);
    updateAltarGlow(scene, dt);
    updateAltarPrompt(scene);
    drawExitMarkers(scene);
    drawMinimap(scene);
  }

  // The camera follows the own player every frame — including during a map
  // slide. The slide is a continuity camera jump followed by the same smooth
  // lerp used for normal world movement, so the camera tracks the player across
  // the transition instead of running a separate time-based tween that freezes
  // at the boundary and then snaps onto the moved player.
  const base = getOwnBase(scene.state);
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

function connectSocket(scene: GameScene): void {
  scene.socket = connectGameSocket({ accountId, displayName });
  const atomStore = getDefaultStore();

  wireSocketHandlers(scene.socket, {
    onConnect: (socket) => {
      scene.myId = socket.id ?? "";
      atomStore.set(statusAtom, "connected");
      // Re-assert tab focus so a reconnect while hidden doesn't resume streaming.
      sendSetActive(socket, !document.hidden);
      const gameplaySettings = loadGameplaySettings();
      sendSetAutoTraverse(socket, gameplaySettings.autoTraverseEnabled);
      sendSetAutocombatConfig(socket, gameplaySettings.autocombat);
    },
    onDisconnect: () => {
      atomStore.set(statusAtom, "disconnected");
      syncPlayerAtoms(null);
      scene.state.gameplaySettingsSynced = false;
      scene.myId = "";
      scene.state.ownId = null;
      scene.cameraScrollReady = false;
      scene.cameras.main.stopFollow();
    },
    onDelta: (snapshot) => applyDelta(scene.state, snapshot, scene),
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
        new CustomEvent("hud:runeCraftResult", { detail: result }),
      );
    },
    onUpgradeResult: (result) => {
      window.dispatchEvent(
        new CustomEvent("hud:upgradeResult", { detail: result }),
      );
    },
    onPlayerDied: (payload) => {
      triggerDeathOverlay(payload);
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
}
