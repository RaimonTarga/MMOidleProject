import type { RenderState } from './state';
import type { GameScene } from '../scenes/GameScene';
import { DEPTH } from './depth';

/** Safety: clear a cast this long after it should have completed, in case the
 *  matching cast-end event was dropped (the monster despawning also clears it). */
const CAST_EXPIRY_GRACE_MS = 2000;

/**
 * Monster charged-attack wind-up telegraph. The BAR reuses the normal attack
 * cooldown bar (tinted red — see cooldownBars.ts); this module owns the floating
 * skill-name label above the monster + the cast-state lifecycle.
 */

/** Begin a charged-attack telegraph over a monster. */
export function startCastBar(
  state: RenderState,
  id: string,
  castMs: number,
  label: string,
): void {
  state.castState.set(id, { startedAt: Date.now(), castMs, label });
}

/** Clear a monster's cast telegraph (cast fired, interrupted, or monster gone). */
export function endCastBar(state: RenderState, id: string): void {
  state.castState.delete(id);
  state.castLabel.get(id)?.destroy();
  state.castLabel.delete(id);
}

/** Lifecycle cleanup when the entity is removed (mirrors destroyCdBar). */
export function destroyCastBar(state: RenderState, id: string): void {
  endCastBar(state, id);
}

/** Draw/refresh the skill-name labels each frame, tracking the monster sprite. */
export function drawCastBars(state: RenderState, scene: GameScene): void {
  if (state.castState.size === 0) return;
  const now = Date.now();

  for (const [id, cast] of state.castState) {
    // Drop a stale cast if its end event never arrived.
    if (now - cast.startedAt > cast.castMs + CAST_EXPIRY_GRACE_MS) {
      endCastBar(state, id);
      continue;
    }
    const sprite = state.sprite.get(id);
    if (!sprite) continue; // monster not currently rendered; keep state, await sprite

    const meta = state.spriteMeta.get(id);
    const labelY = sprite.y - (meta?.barOffsetY ?? 40) - 12;

    let label = state.castLabel.get(id);
    if (!label) {
      label = scene.add
        .text(0, 0, cast.label, {
          fontFamily: 'monospace',
          fontSize: '11px',
          color: '#ffb6a0',
          stroke: '#000000',
          strokeThickness: 3,
        })
        .setOrigin(0.5, 1);
      state.castLabel.set(id, label);
    }
    label.setDepth(DEPTH.UI + sprite.y + 1);
    label.setPosition(sprite.x, labelY);
  }
}
