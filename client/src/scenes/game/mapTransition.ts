import { GAME_CONFIG, type NodeDirection } from "@mmo-idle/shared";
import { getDefaultStore } from "jotai";
import { autoPathAtom, nodeLoadingAtom } from "../../hud/atoms";
import {
  cancelActiveMove,
  hasKeyboardMoveIntent,
} from "../../input/movement";
import {
  clearPendingStop,
  setManualActive,
} from "../../input/moveOwnership";
import { clearOwnMovePath } from "../../input/pathPrediction";
import { loadGameplaySettings } from "../../settings/gameplaySettings";
import {
  directionOffset,
  rebuildNeighborLayer,
} from "../../render/neighborScenes";
import type { GameScene } from "./GameScene";
import { applyPeekCameraBounds, syncSceneBackdrop } from "./peekCamera";
import { createIncomingTransitionFog, paintActiveNode } from "./overlays";

export interface MapTransition {
  active: boolean;
  toNodeId: string;
  dir: NodeDirection;
  elapsedMs: number;
  /** Resting scroll the camera snaps to if the slide is fast-forwarded. */
  endScroll: { x: number; y: number };
  /** Destination fog — full at slide start, fades out. */
  incomingFog: Phaser.GameObjects.Rectangle | null;
  /** Exiting neighbor fog — transparent at slide start, fades in. */
  outgoingShade: Phaser.GameObjects.Rectangle | null;
}

function oppositeDirection(dir: NodeDirection): NodeDirection {
  switch (dir) {
    case "north":
      return "south";
    case "south":
      return "north";
    case "east":
      return "west";
    case "west":
      return "east";
  }
}

function transitionFogProgress(elapsedMs: number): number {
  return Math.min(1, elapsedMs / GAME_CONFIG.MAP_SLIDE_MS);
}

function applyTransitionFogAlphas(scene: GameScene, progress: number): void {
  const t = scene.mapTransition;
  const fogAlpha = GAME_CONFIG.NEIGHBOR_FOG_ALPHA;
  t.incomingFog?.setAlpha(fogAlpha * (1 - progress));
  t.outgoingShade?.setAlpha(fogAlpha * progress);
}

function destroyTransitionFog(scene: GameScene): void {
  const t = scene.mapTransition;
  t.incomingFog?.destroy();
  t.incomingFog = null;
  t.outgoingShade = null;
}

function applySceneBounds(scene: GameScene): void {
  const nodeId = scene.lastDrawnNodeId || scene.state.ownNodeId;
  if (!nodeId) return;
  applyPeekCameraBounds(scene, nodeId);
  syncSceneBackdrop(scene, nodeId);
}

export function createMapTransition(): MapTransition {
  return {
    active: false,
    toNodeId: "",
    dir: "east",
    elapsedMs: 0,
    endScroll: { x: 0, y: 0 },
    incomingFog: null,
    outgoingShade: null,
  };
}

export function beginMapSlide(
  scene: GameScene,
  dir: NodeDirection,
  toNodeId: string,
): void {
  const t = scene.mapTransition;
  if (t.active && t.toNodeId === toNodeId) return;
  if (t.active) fastForwardMapSlide(scene);

  const fromNodeId = scene.lastDrawnNodeId || scene.state.ownNodeId;
  if (!fromNodeId || fromNodeId === toNodeId) return;
  if (toNodeId === scene.lastDrawnNodeId) return;

  const cam = scene.cameras.main;
  const preScroll = { x: cam.scrollX, y: cam.scrollY };

  // The leaving node is rendered on the neighbor-preview layer in the reverse
  // direction from the destination. Fog alpha is animated across the slide:
  // destination fades out, exiting node fades in.
  paintActiveNode(scene, toNodeId);
  rebuildNeighborLayer(scene, toNodeId);
  scene.lastDrawnNodeId = toNodeId;
  syncSceneBackdrop(scene, toNodeId);

  t.incomingFog = createIncomingTransitionFog(scene);
  const exitingGroup = scene.neighborLayer.get(oppositeDirection(dir));
  t.outgoingShade = exitingGroup?.shade ?? null;
  exitingGroup?.shade?.setAlpha(0);
  applyTransitionFogAlphas(scene, 0);

  const prev = directionOffset(dir);
  const contentDelta = { x: -prev.x, y: -prev.y };
  // Bound the camera to the destination node's peek bounds during the slide.
  // The continuity start scroll (and resting scroll) include the reverse-side
  // peek/neighbor region; bounding to the bare node footprint clamps the camera
  // and snaps the peek out of frame while desyncing the own-player screen pos.
  applyPeekCameraBounds(scene, toNodeId);
  cam.setScroll(preScroll.x + contentDelta.x, preScroll.y + contentDelta.y);
  // Keep the camera in lerp-follow mode through the slide so the continuity jump
  // above eases toward the player instead of being snapped on the next frame.
  scene.cameraScrollReady = true;

  t.active = true;
  t.toNodeId = toNodeId;
  t.dir = dir;
  t.elapsedMs = 0;
  t.endScroll = preScroll;
  scene.transitioning = true;
  clearOwnMovePath(scene.state);
  getDefaultStore().set(nodeLoadingAtom, { active: false, nodeId: null });
}

export function tickMapSlide(scene: GameScene, dt: number): void {
  const t = scene.mapTransition;
  if (!t.active) return;

  // The camera is driven by the per-frame player follow in `updateGameScene`;
  // this tick only advances the slide clock and ends the slide once the reveal
  // has had time to complete.
  t.elapsedMs += dt * 1000;
  applyTransitionFogAlphas(scene, transitionFogProgress(t.elapsedMs));
  if (t.elapsedMs >= GAME_CONFIG.MAP_SLIDE_MS) finishMapSlide(scene);
}

/** True while the server owns movement (map auto-path or auto-traverse). */
export function isServerOwnedNavigation(
  scene: GameScene,
  navPath?: string[] | null,
): boolean {
  const path = navPath ?? getDefaultStore().get(autoPathAtom);
  if (path && path.length > 0) return true;
  if (!scene.autoMode) return false;
  return loadGameplaySettings().autoTraverseEnabled;
}

/** Release stale client heading unless auto pathing or keyboard is still active. */
function resolvePostTransitionMovement(scene: GameScene): void {
  if (hasKeyboardMoveIntent()) {
    setManualActive(true);
    return;
  }
  if (isServerOwnedNavigation(scene)) {
    setManualActive(false);
    clearPendingStop();
    return;
  }
  setManualActive(false);
  clearPendingStop();
  cancelActiveMove(scene);
}

export function finishMapSlide(scene: GameScene): void {
  const t = scene.mapTransition;
  if (!t.active) return;

  applyTransitionFogAlphas(scene, 1);
  destroyTransitionFog(scene);
  applySceneBounds(scene);
  t.active = false;
  scene.transitioning = false;
  resolvePostTransitionMovement(scene);
}

export function fastForwardMapSlide(scene: GameScene): void {
  const t = scene.mapTransition;
  if (!t.active) return;
  scene.cameras.main.setScroll(t.endScroll.x, t.endScroll.y);
  finishMapSlide(scene);
}

/** Snap or cancel an in-progress slide (tab hide / resync). */
export function abortMapSlide(scene: GameScene): void {
  if (!scene.transitioning) return;
  fastForwardMapSlide(scene);
}
