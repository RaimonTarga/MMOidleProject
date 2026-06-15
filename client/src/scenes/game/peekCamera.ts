import { peekSceneBounds } from '@mmo-idle/shared';
import type { GameScene } from './GameScene';

export function applyPeekCameraBounds(scene: GameScene, nodeId: string): void {
  const cam = scene.cameras.main;
  const bounds = peekSceneBounds(nodeId, cam.width, cam.height);
  cam.setBounds(bounds.x, bounds.y, bounds.width, bounds.height);
}

export function syncSceneBackdrop(scene: GameScene, nodeId: string): void {
  const cam = scene.cameras.main;
  const bounds = peekSceneBounds(nodeId, cam.width, cam.height);
  scene.bgRect.setPosition(bounds.x, bounds.y);
  scene.bgRect.setSize(bounds.width, bounds.height);
}
