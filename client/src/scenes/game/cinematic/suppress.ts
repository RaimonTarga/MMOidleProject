/**
 * Strip the frame down to world + monsters for capture.
 *
 * Hiding rather than not-creating: labels, bars and thought bubbles are created
 * by the delta applier as entities arrive, so a one-shot teardown would be
 * defeated by the next snapshot. This runs every frame, is idempotent, and is
 * immune to whatever creates an overlay next.
 */

import type { GameScene } from '../GameScene';

/**
 * Reuse the spectator CSS rule (`html[data-spectator]`) that already hides both
 * sidebars and every overlay div in `#game-wrapper`, plus hide the auth gate
 * itself — a capture is not a landing page and wants no login panel in frame.
 */
export function suppressCinematicChrome(): void {
  document.documentElement.dataset.spectator = 'true';
  document.documentElement.dataset.cinematic = 'true';
  const gate = document.getElementById('auth-gate');
  if (gate) gate.style.display = 'none';
}

/** One frame of overlay suppression. Cheap: these maps hold a handful of entries. */
export function suppressCinematicOverlays(scene: GameScene): void {
  const state = scene.state;

  for (const label of state.label.values()) label.setVisible(false);
  for (const bar of state.hpBar.values()) bar.setVisible(false);
  for (const bar of state.cdBar.values()) bar.setVisible(false);
  for (const label of state.castLabel.values()) label.setVisible(false);
  for (const callout of state.skillCallout.values()) callout.label.setVisible(false);
  for (const bubble of state.thoughtBubble.values()) bubble.container.setVisible(false);

  // The anchor player holds the node thawed but must not be in frame. Its shadow
  // would otherwise sit on the ground with nothing casting it.
  if (state.ownId) {
    state.sprite.get(state.ownId)?.setVisible(false);
    state.shadow.get(state.ownId)?.setVisible(false);
    for (const overlay of state.effectOverlays.get(state.ownId)?.values() ?? []) {
      overlay.setVisible(false);
    }
    state.auras.get(state.ownId)?.setVisible(false);
    state.identityAccents.get(state.ownId)?.setVisible(false);
  }

  scene.targetMarker.setVisible(false);
  scene.minimap.setVisible(false);
  scene.exitMarkers.setVisible(false);
  scene.nodeBoundaryFrame.setVisible(false);
  scene.debugGraphics.setVisible(false);
  state.targetIndicator.graphics?.setVisible(false);
  state.cannonCharge.graphics?.setVisible(false);
}
