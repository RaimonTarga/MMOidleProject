import { peekSceneBounds } from '@mmo-idle/shared';
import { cameraWorldViewSize, cameraZoomForViewport } from '../../render/cameraZoom';
import type { GameScene } from './GameScene';

/**
 * Re-apply the viewport-derived zoom. Called before anything reads the camera's
 * world-view size, since zoom is what converts screen px to world px.
 */
export function applyCameraZoom(scene: GameScene): void {
  const cam = scene.cameras.main;
  const zoom = cameraZoomForViewport(cam.width);
  if (cam.zoom !== zoom) cam.setZoom(zoom);
}

export function applyPeekCameraBounds(scene: GameScene, nodeId: string): void {
  applyCameraZoom(scene);
  const cam = scene.cameras.main;
  const view = cameraWorldViewSize(cam);
  const bounds = peekSceneBounds(nodeId, view.width, view.height);
  cam.setBounds(bounds.x, bounds.y, bounds.width, bounds.height);
}

export function syncSceneBackdrop(scene: GameScene, nodeId: string): void {
  const cam = scene.cameras.main;
  const view = cameraWorldViewSize(cam);
  const bounds = peekSceneBounds(nodeId, view.width, view.height);
  scene.bgRect.setPosition(bounds.x, bounds.y);
  scene.bgRect.setSize(bounds.width, bounds.height);
}
