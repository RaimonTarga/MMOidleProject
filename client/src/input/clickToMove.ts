import type { PlayerView, Vec2 } from '@mmo-idle/shared';
import { isDeathOverlayActive } from '../hud/atoms';
import { sendCommandSummons, sendMove } from '../net/intents';
import type { GameScene } from '../scenes/GameScene';
import { cancelAutoPath, setAutoMode } from './autoPath';
import { isHoldStill } from './movement';

function isSummoner(player: PlayerView | undefined): boolean {
  return player?.combatArchetype === 'summoner' && (player.summonsMinions ?? 0) > 0;
}

function showTargetMarker(scene: GameScene, dest: Vec2): void {
  scene.targetMarker.setPosition(dest.x, dest.y).setVisible(true);
}

export function attachClickToMove(scene: GameScene): void {
  scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
    if (!scene.myId || isDeathOverlayActive()) return;

    const dest: Vec2 = { x: Math.round(pointer.worldX), y: Math.round(pointer.worldY) };
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

    sendMove(scene.socket, dest);

    const transform = scene.state.ownId ? scene.state.transform.get(scene.state.ownId) : undefined;
    if (transform) {
      transform.target = dest;
    }

    showTargetMarker(scene, dest);
  });
}
