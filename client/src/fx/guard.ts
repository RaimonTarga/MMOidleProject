import { getDefaultStore } from 'jotai';
import { nodeLoadingAtom, tabResyncAtom } from '../hud/atoms';
import type { RenderState } from '../render/state';
import type { GameScene } from '../scenes/GameScene';

export const TAB_RESYNC_MIN_HIDDEN_MS = 1000;
export const TAB_RESYNC_MIN_DISPLAY_MS = 400;

/**
 * Timestamp of the most recent `visibilitychange → hidden` event. `null` means
 * the tab has not been backgrounded since the last resync (or ever). This is
 * the ONLY signal we use to decide whether a resync is warranted — it cannot
 * be set by any code path other than `onDocumentHidden`, which is only wired
 * to the browser's Page Visibility API.
 */
let hiddenSinceAt: number | null = null;
let resyncDeltaSeen = false;

export function isClientRenderPaused(): boolean {
  const store = getDefaultStore();
  if (document.hidden) return true;
  if (store.get(nodeLoadingAtom).active) return true;
  return store.get(tabResyncAtom).active;
}

export function shouldRunClientFx(): boolean {
  return !isClientRenderPaused();
}

export function snapRenderStateOnTabVisible(state: RenderState, scene: GameScene): void {
  for (const id of state.ids) {
    const transform = state.transform.get(id);
    const interp = state.interpolation.get(id);
    const sprite = state.sprite.get(id);
    if (!transform || !interp || !sprite) continue;

    interp.base.x = transform.target.x;
    interp.base.y = transform.target.y;
    scene.tweens.killTweensOf(interp.lungeOffset);
    interp.lungeOffset.x = 0;
    interp.lungeOffset.y = 0;
    sprite.setPosition(interp.base.x, interp.base.y);
  }
}

/**
 * Called from the visibilitychange listener when `document.hidden === true`.
 * Records the time so a later return-to-visible can decide whether enough
 * background time elapsed to warrant a resync.
 */
export function onDocumentHidden(): void {
  hiddenSinceAt = Date.now();
}

/**
 * Trigger the "Syncing…" overlay + render pause. Strictly gated to a real
 * background → foreground transition:
 *   - `document.hidden` must currently be false (we're visible)
 *   - `hiddenSinceAt` must be non-null (we previously went hidden)
 *   - Background duration must meet `TAB_RESYNC_MIN_HIDDEN_MS`
 *   - Node travel loading must not be active
 *
 * Calling this from any other context (autocombat, focus changes, etc.) is a
 * no-op. After a successful trigger, `hiddenSinceAt` is cleared so the next
 * resync requires a fresh `visibilitychange → hidden` event.
 */
export function beginTabResync(state: RenderState, scene: GameScene): void {
  if (document.hidden) return;
  if (hiddenSinceAt == null) return;

  const store = getDefaultStore();
  if (store.get(nodeLoadingAtom).active) return;

  const hiddenMs = Date.now() - hiddenSinceAt;
  hiddenSinceAt = null;
  if (hiddenMs < TAB_RESYNC_MIN_HIDDEN_MS) return;

  resyncDeltaSeen = false;
  store.set(tabResyncAtom, { active: true, startedAt: Date.now() });
  snapRenderStateOnTabVisible(state, scene);
}

export function notifyDeltaAppliedDuringTabResync(): void {
  const store = getDefaultStore();
  const resync = store.get(tabResyncAtom);
  if (!resync.active || resync.startedAt == null) return;

  resyncDeltaSeen = true;
  const elapsed = Date.now() - resync.startedAt;
  const remaining = Math.max(0, TAB_RESYNC_MIN_DISPLAY_MS - elapsed);

  window.setTimeout(() => {
    const cur = store.get(tabResyncAtom);
    if (!cur.active || !resyncDeltaSeen) return;
    store.set(tabResyncAtom, { active: false, startedAt: null });
  }, remaining);
}
