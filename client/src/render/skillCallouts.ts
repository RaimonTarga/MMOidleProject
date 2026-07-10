import type { RenderState } from './state';
import type { GameScene } from '../scenes/GameScene';
import { DEPTH } from './depth';

/**
 * Player skill-name callouts — the flashy "SKILL!" text above a player when an
 * ability fires or arms. Mirrors the monster cast-bar label (castBars.ts) but is
 * time-limited: a callout pops in, tracks the player's sprite while it lingers,
 * then drifts up and fades. One callout per entity — a newer one replaces it.
 */

/** How long the text holds at full strength before fading. */
const CALLOUT_HOLD_MS = 1400;
/** Fade-out (and upward drift) time after the hold. */
const CALLOUT_FADE_MS = 450;
/** Upward drift during the fade, in px. */
const CALLOUT_DRIFT_PX = 14;

export function spawnSkillCallout(
  state: RenderState,
  scene: GameScene,
  id: string,
  text: string,
  color: string,
): void {
  destroySkillCallout(state, id);

  const label = scene.add
    .text(0, 0, text, {
      fontFamily: 'monospace',
      fontSize: '13px',
      fontStyle: 'bold',
      color,
      stroke: '#000000',
      strokeThickness: 4,
    })
    .setOrigin(0.5, 1)
    .setDepth(DEPTH.UI);

  // Pop-in: the label snaps up from the player with a small overshoot.
  label.setScale(0.4).setAlpha(0);
  scene.tweens.add({
    targets: label,
    scale: 1,
    alpha: 1,
    duration: 130,
    ease: 'Back.easeOut',
  });

  state.skillCallout.set(id, {
    label,
    expiresAt: Date.now() + CALLOUT_HOLD_MS + CALLOUT_FADE_MS,
    driftY: 0,
  });
}

/** Track sprites + run the hold→fade lifecycle each frame. */
export function drawSkillCallouts(state: RenderState): void {
  if (state.skillCallout.size === 0) return;
  const now = Date.now();

  for (const [id, callout] of state.skillCallout) {
    const remaining = callout.expiresAt - now;
    if (remaining <= 0) {
      destroySkillCallout(state, id);
      continue;
    }
    const sprite = state.sprite.get(id);
    if (!sprite) {
      callout.label.setVisible(false);
      continue;
    }
    callout.label.setVisible(true);

    if (remaining <= CALLOUT_FADE_MS) {
      const t = 1 - remaining / CALLOUT_FADE_MS;
      callout.label.setAlpha(1 - t);
      callout.driftY = t * CALLOUT_DRIFT_PX;
    }

    const meta = state.spriteMeta.get(id);
    const labelY = sprite.y - (meta?.barOffsetY ?? 40) - 14 - callout.driftY;
    callout.label.setDepth(DEPTH.UI + sprite.y + 1);
    callout.label.setPosition(sprite.x, labelY);
  }
}

export function destroySkillCallout(state: RenderState, id: string): void {
  const callout = state.skillCallout.get(id);
  if (!callout) return;
  callout.label.destroy();
  state.skillCallout.delete(id);
}
