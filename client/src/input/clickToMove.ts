import type { PlayerView, Vec2 } from '@mmo-idle/shared';
import { isDeathOverlayActive } from '../hud/atoms';
import { sendCommandSummons } from '../net/intents';
import type { GameScene } from '../scenes/GameScene';
import { cancelAutoPath, setAutoMode } from './autoPath';
import { isHoldStill, sendClampedMove } from './movement';
import { clearPendingStop } from './moveOwnership';
import { nodeToScene, sceneToNode } from '../render/sceneCoords';

function isSummoner(player: PlayerView | undefined): boolean {
  return player?.combatArchetype === 'summoner' && (player.summonsMinions ?? 0) > 0;
}

function showTargetMarker(scene: GameScene, nodeDest: Vec2): void {
  const scenePos = nodeToScene(nodeDest.x, nodeDest.y);
  scene.targetMarker.setPosition(scenePos.x, scenePos.y).setVisible(true);
}

export function attachClickToMove(scene: GameScene): void {
  scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
    if (!scene.myId || isDeathOverlayActive() || scene.transitioning) return;

    const nodeDest = sceneToNode(pointer.worldX, pointer.worldY);
    const dest: Vec2 = { x: Math.round(nodeDest.x), y: Math.round(nodeDest.y) };
    const player = scene.state.ownId
      ? scene.state.view.get(scene.state.ownId) as PlayerView | undefined
      : undefined;

    if (isHoldStill()) {
      if (scene.autoMode) setAutoMode(scene, false);
      cancelAutoPath();
      showTargetMarker(scene, dest);
      if (isSummoner(player)) {
        sendCommandSummons(scene.socket, dest);
      }
      return;
    }

    if (scene.autoMode) setAutoMode(scene, false);
    cancelAutoPath();
    scene.flashCameraHold = false;
    scene.flashCameraHoldTargetId = null;
    // Click-to-move is server-authoritative: drop any post-keyboard stop latch
    // so the authoritative target is honored immediately.
    clearPendingStop();

    const transform = scene.state.ownId ? scene.state.transform.get(scene.state.ownId) : undefined;
    const clamped = sendClampedMove(scene, dest, { pathfind: true });
    if (transform) {
      transform.target = clamped;
    }

    showTargetMarker(scene, clamped);
  });
}
