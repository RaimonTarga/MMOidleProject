import { EFFECT_DEFS, EMOTE_SPRITESHEETS, GAME_CONFIG } from "@mmo-idle/shared";
import { DEPTH } from "../../render/depth";
import { getDefaultStore } from "jotai";
import {
  statusAtom,
  nodeTelemetryAtom,
  syncPlayerAtoms,
  nodeLoadingAtom,
  triggerDeathOverlay,
  setBossFelledMarkers,
} from "../../hud/atoms";
import { applyWorldLogEvents } from "../../worldLog/formatWorldLog";
import { loadGameplaySettings } from "../../settings/gameplaySettings";
import {
  sendRequestSync,
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
import { initMistPostFx, updateMistPostFx } from "../../fx/mistPostFx";
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
  updateBiomeBackground,
  updateNodeDecor,
} from "./overlays";
import { showAscensionOverlay, showOverlordFelledOverlay } from "./screenOverlays";
import type { GameScene } from "./GameScene";

const CAMERA_HOLD_MARGIN = 80;
const SHADOW_DEFS_KEY = "shadowDefs";

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

  scene.cameras.main.setBounds(
    0,
    0,
    GAME_CONFIG.NODE_WIDTH,
    GAME_CONFIG.NODE_HEIGHT,
  );

  scene.bgRect = scene.add
    .rectangle(
      GAME_CONFIG.NODE_WIDTH / 2,
      GAME_CONFIG.NODE_HEIGHT / 2,
      GAME_CONFIG.NODE_WIDTH,
      GAME_CONFIG.NODE_HEIGHT,
      0x101a10,
    )
    .setDepth(-12);

  createGridBackground(scene);

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
      onDocumentHidden();
      return;
    }
    if (scene.socket.connected) {
      sendRequestSync(scene.socket);
    }
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
}

export function updateGameScene(scene: GameScene, delta: number): void {
  const dt = Math.min(delta, 100) / 1000;

  stepInterpolation(scene.state, dt);
  drawShadows(scene.state);
  drawLabels(scene.state);
  drawThoughtBubbles(scene.state);
  drawHealthBars(scene.state);

  if (!isClientRenderPaused()) {
    drawCooldownBars(scene.state);
    updateEffectOverlays(scene.state, scene, dt);
    updateMovementEffects(scene.state, scene);
    updateLaserBeam(scene.state, scene);
    updateVoidOverlordRespawn(scene.state, scene);
    updateMistPostFx(scene, isVoidFloodActive(scene), scene.time.now, dt);
    drawMinimap(scene);
  }

  if (scene.state.ownNodeId !== scene.lastDrawnNodeId) {
    drawExitMarkers(scene);
    updateBiomeBackground(scene);
    updateNodeDecor(scene);
    scene.lastDrawnNodeId = scene.state.ownNodeId;
  }

  const base = getOwnBase(scene.state);
  if (base) {
    const shouldHoldCamera =
      scene.flashCameraHold &&
      isPointComfortablyOnScreen(scene, base.x, base.y);
    if (!shouldHoldCamera) {
      scene.cameraTarget.setPosition(base.x, base.y);
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
      const gameplaySettings = loadGameplaySettings();
      sendSetAutoTraverse(socket, gameplaySettings.autoTraverseEnabled);
      sendSetAutocombatConfig(socket, gameplaySettings.autocombat);
      if (scene.state.ownId)
        scene.cameras.main.startFollow(scene.cameraTarget, true, 0.1, 0.1);
    },
    onDisconnect: () => {
      atomStore.set(statusAtom, "disconnected");
      atomStore.set(nodeTelemetryAtom, null);
      syncPlayerAtoms(null);
      scene.state.gameplaySettingsSynced = false;
      scene.myId = "";
      scene.state.ownId = null;
    },
    onDelta: (snapshot) => applyDelta(scene.state, snapshot, scene),
    onNodePreparing: ({ nodeId }) => {
      atomStore.set(nodeLoadingAtom, { active: true, nodeId });
    },
    onCraftResult: (result) => {
      window.dispatchEvent(
        new CustomEvent("hud:craftResult", { detail: result }),
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
    onTelemetry: (snapshot) => {
      atomStore.set(nodeTelemetryAtom, snapshot);
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
