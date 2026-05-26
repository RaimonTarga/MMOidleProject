import type { Vec2 } from '@mmo-idle/shared';
import { sendMove } from '../net/intents';
import type { GameScene } from '../scenes/GameScene';
import { cancelAutoPath, setAutoMode } from './autoPath';

export function attachClickToMove(scene: GameScene): void {
  scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
    if (!scene.myId) return;

    const dest: Vec2 = { x: Math.round(pointer.worldX), y: Math.round(pointer.worldY) };

    if (scene.autoMode) setAutoMode(scene, false);
    if (scene.autoPath.length > 0) cancelAutoPath(scene);

    sendMove(scene.socket, dest);

    const transform = scene.state.ownId ? scene.state.transform.get(scene.state.ownId) : undefined;
    if (transform) {
      transform.target = dest;
    }

    scene.targetMarker.setPosition(dest.x, dest.y).setVisible(true);
  });
}
