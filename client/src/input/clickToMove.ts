import type { PlayerView, Vec2 } from '@mmo-idle/shared';
import { isDeathOverlayActive, setAutoPath } from '../hud/atoms';
import { GAME_CONFIG } from '@mmo-idle/shared';
import { sendCommandSummons, sendMoveToNeighbor } from '../net/intents';
import type { GameScene } from '../scenes/GameScene';
import { cancelAutoPath, setAutoMode } from './autoPath';
import { hasKeyboardMoveIntent, isHoldStill, sendClampedMove } from './movement';
import { clearPendingStop } from './moveOwnership';
import { nodeToScene, sceneToNode } from '../render/sceneCoords';
import type { MoveMarkerKind } from '../render/moveMarker';
import { neighborDestination } from './neighborDestination';
import { clearOwnMovePath } from './pathPrediction';
import { setManualActive } from './moveOwnership';

function isSummoner(player: PlayerView | undefined): boolean {
  return player?.combatArchetype === 'summoner' && (player.summonsMinions ?? 0) > 0;
}

function showTargetMarker(
  scene: GameScene,
  nodeDest: Vec2,
  kind: MoveMarkerKind = 'move',
): void {
  const scenePos = nodeToScene(nodeDest.x, nodeDest.y);
  scene.targetMarker.show(scenePos.x, scenePos.y, kind);
}

export function attachClickToMove(scene: GameScene): () => void {
  const onPointerDown = (pointer: Phaser.Input.Pointer): void => {
    if (!scene.myId || isDeathOverlayActive() || scene.lastDrawnNodeId !== scene.state.ownNodeId) return;

    const nodeDest = sceneToNode(pointer.worldX, pointer.worldY);
    const dest: Vec2 = { x: Math.round(nodeDest.x), y: Math.round(nodeDest.y) };
    const outside = dest.x < 0 || dest.y < 0 || dest.x > GAME_CONFIG.NODE_WIDTH || dest.y > GAME_CONFIG.NODE_HEIGHT;
    const neighbor = outside ? neighborDestination(scene.state.ownNodeId, dest) : null;
    if (outside && (!neighbor || isHoldStill())) return;
    const player = scene.state.ownId
      ? scene.state.view.get(scene.state.ownId) as PlayerView | undefined
      : undefined;

    if (isHoldStill()) {
      if (scene.autoMode) setAutoMode(scene, false);
      cancelAutoPath();
      // Hold-still turns the click into a summon order rather than a move, so
      // the mark wears the summon palette — the player is not going there.
      showTargetMarker(scene, dest, isSummoner(player) ? 'summon' : 'move');
      if (isSummoner(player)) {
        sendCommandSummons(scene.socket, dest);
      }
      return;
    }

    // Held directional controls own movement until released.
    if (hasKeyboardMoveIntent()) return;
    if (scene.autoMode) setAutoMode(scene, false);
    cancelAutoPath();
    scene.flashCameraHold = false;
    scene.flashCameraHoldTargetId = null;
    // Click-to-move is server-authoritative: drop any post-keyboard stop latch
    // so the authoritative target is honored immediately.
    clearPendingStop();
    setManualActive(false);

    if (neighbor) {
      clearOwnMovePath(scene.state);
      scene.targetMarker.showDestination(scene.state.ownNodeId, neighbor);
      const markerOrder = scene.targetMarker.destination;
      setAutoPath([neighbor.nodeId]);
      sendMoveToNeighbor(scene.socket, neighbor.nodeId, neighbor.pos, result => {
        // A newer click, keyboard input, or cancellation owns the marker now.
        if (scene.targetMarker.destination !== markerOrder) return;
        if (!result.accepted) {
          scene.targetMarker.hide();
          cancelAutoPath();
          return;
        }
        neighbor.pos = result.goal;
        scene.targetMarker.rebaseDestination(scene.lastDrawnNodeId);
      });
      return;
    }

    const transform = scene.state.ownId ? scene.state.transform.get(scene.state.ownId) : undefined;
    const clamped = sendClampedMove(scene, dest, { pathfind: true });
    if (transform) {
      transform.target = clamped;
    }

    showTargetMarker(scene, scene.state.ownPathGoal ?? clamped);
  };
  scene.input.on('pointerdown', onPointerDown);
  return () => scene.input.off('pointerdown', onPointerDown);
}
