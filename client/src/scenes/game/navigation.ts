import { GAME_CONFIG, type Vec2 } from '@mmo-idle/shared';
import { hudBus } from '../../hudBus';
import { sendMove, sendSetAuto } from '../../net/intents';
import { getOwnView } from '../../render/state';
import type { GameScene } from './GameScene';

export function setAutoMode(scene: GameScene, enabled: boolean): void {
  scene.autoMode = enabled;
  sendSetAuto(scene.socket, enabled);
  if (enabled) scene.targetMarker.setVisible(false);

  const own = getOwnView(scene.state);
  if (own) {
    hudBus.emit({ player: { ...own, auto: enabled } });
  }
}

export function sendAutoPathMove(scene: GameScene, fromNodeId: string): void {
  if (scene.autoPath.length === 0 || !scene.myId) return;
  const [, curRStr, curCStr] = fromNodeId.split('-');
  const [, nxtRStr, nxtCStr] = scene.autoPath[0].split('-');
  const dr = parseInt(nxtRStr, 10) - parseInt(curRStr, 10);
  const dc = parseInt(nxtCStr, 10) - parseInt(curCStr, 10);

  const w = GAME_CONFIG.NODE_WIDTH;
  const h = GAME_CONFIG.NODE_HEIGHT;
  let dest: Vec2;
  if (dr === -1) dest = { x: w / 2, y: 5 };
  else if (dr === 1) dest = { x: w / 2, y: h - 5 };
  else if (dc === -1) dest = { x: 5, y: h / 2 };
  else if (dc === 1) dest = { x: w - 5, y: h / 2 };
  else {
    cancelAutoPath(scene);
    return;
  }

  dest = { x: Math.round(dest.x), y: Math.round(dest.y) };
  sendMove(scene.socket, dest);
  const transform = scene.state.ownId ? scene.state.transform.get(scene.state.ownId) : undefined;
  if (transform) {
    transform.target = dest;
  }
}

export function cancelAutoPath(scene: GameScene): void {
  scene.autoPath = [];
  hudBus.emit({ autoPath: null });
}
