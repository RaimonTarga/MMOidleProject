import { setAutoPath } from '../hud/atoms';
import type { GameScene } from '../scenes/GameScene';
import { clearOwnMovePath } from './pathPrediction';
import { clearPendingStop, setManualActive } from './moveOwnership';

/**
 * Drop every piece of client-side movement intent in one call.
 *
 * These four live in different modules for good reasons (`moveOwnership` is a
 * dependency-free leaf; the route overlay is a Jotai atom; the predicted path is
 * render state), which made it easy for a cancel path to remember three of them
 * and forget the fourth. Death was that path: the marker, the map route and the
 * heading latches all survived the respawn and made a freshly-spawned character
 * look like it was still carrying out the order that killed it.
 *
 * Server-side movement is cancelled independently by `killPlayer`; this is only
 * the presentation and prediction half.
 */
export function clearMovementIntent(scene: GameScene): void {
  scene.targetMarker.hide();
  setAutoPath(null);
  clearOwnMovePath(scene.state);
  // Release the predicted-heading latches, or the reconcile keeps refusing the
  // authoritative respawn position for up to a grace window.
  setManualActive(false);
  clearPendingStop();
  scene.flashCameraHold = false;
  scene.flashCameraHoldTargetId = null;
}
