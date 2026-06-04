import { setAutoPath } from "../hud/atoms";
import { sendSetAuto } from "../net/intents";
import { clearPendingStop } from "./moveOwnership";
import type { GameScene } from "../scenes/GameScene";

export function setAutoMode(scene: GameScene, enabled: boolean): void {
  scene.autoMode = enabled;
  sendSetAuto(scene.socket, enabled);
  if (enabled) {
    scene.targetMarker.setVisible(false);
    // Auto-combat is server-driven: drop any post-keyboard stop latch so the
    // server can steer immediately instead of waiting out the grace window.
    clearPendingStop();
  }
  // `autoAtom` (the AUTO button state) is driven authoritatively by `player.auto`
  // from server deltas — see syncPlayerAtoms — so we do not set it optimistically
  // here. That keeps a single writer and prevents the button flickering against
  // an in-flight delta.
}

/** Clear the client-side navigation route display. Movement itself is server-owned. */
export function cancelAutoPath(): void {
  setAutoPath(null);
}
