import type Phaser from 'phaser';
import type { CombatEvent } from '@mmo-idle/shared';
import type { GameScene } from '../scenes/GameScene';
import type { RenderState } from '../render/state';
import { DEPTH } from '../render/depth';
import { hudBus } from '../hudBus';
import { cardWordFor } from '../hud/rhythmReadoutModel';

/**
 * The floating word — design §24.6, course-correction W2-B.
 *
 * When a card pays out, its NAME rises over the player who fired it ("Flurry!",
 * "Opening Lunge!") in the card's lane colour with a soft glow, and fades. A
 * word, not a bigger damage number: the payload's own effect on the body is
 * W2-C's (`render/combatFx.ts`, keyed by the event's `fx`), this is only the
 * name of the card that did it, so a player learns which card is talking.
 *
 * Node-wide like every payoff signature — an ally's word reads as their build —
 * and one word per player at a time: a newer one replaces the old rather than
 * stacking a column of names. The own player's firing also pulses that card's
 * ring on the rhythm readout (`hudBus.notifyCardFired`).
 *
 * The caller has already checked `shouldRunClientFx()`, so nothing here is ever
 * started in a hidden tab, where a queued tween would play out on return.
 */

/** How far the word rises, and over how long (the mockup's ~28 px over ~0.9 s). */
const WORD_RISE_PX = 28;
const WORD_MS = 900;
/** Fully opaque for this share of its life, then fades out. */
const WORD_HOLD_SHARE = 0.5;
/** Where the word starts, above the head-bar anchor the skill callouts use. */
const WORD_LIFT_PX = 22;

const words = new Map<string, Phaser.GameObjects.Text>();

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
}

/** Above the player's head bar — tracks the live sprite while the word lives. */
function anchorOf(state: RenderState, playerId: string): { x: number; y: number } | null {
  const sprite = state.sprite.get(playerId);
  if (!sprite) return null;
  const meta = state.spriteMeta.get(playerId);
  return { x: sprite.x, y: sprite.y - (meta?.barOffsetY ?? 40) - WORD_LIFT_PX };
}

export function playCardWord(
  state: RenderState,
  scene: GameScene,
  ev: Extract<CombatEvent, { kind: 'card-fx' }>,
): void {
  if (ev.cardId && ev.playerId === scene.myId) hudBus.notifyCardFired(ev.cardId);

  const word = cardWordFor(ev.cardId);
  if (!word) return;
  const start = anchorOf(state, ev.playerId);
  if (!start) return;

  const previous = words.get(ev.playerId);
  if (previous?.active) previous.destroy();

  const text = scene.add
    .text(start.x, start.y, word.text, {
      fontFamily: "'Cinzel', 'Palatino Linotype', Georgia, serif",
      fontSize: '16px',
      fontStyle: 'bold',
      color: word.color,
      stroke: '#000000',
      strokeThickness: 3,
    })
    .setOrigin(0.5, 1)
    .setDepth(DEPTH.FX)
    // A soft glow on the letters only: a shadowed stroke reads as a box.
    .setShadow(0, 0, word.color, 6, false, true);
  words.set(ev.playerId, text);

  // Reduced motion: the word holds in place and fades; it never travels.
  const rise = prefersReducedMotion() ? 0 : WORD_RISE_PX;
  scene.tweens.addCounter({
    from: 0,
    to: 1,
    duration: WORD_MS,
    onUpdate: (tween) => {
      if (!text.active) return;
      const t = tween.getValue() ?? 1;
      const at = anchorOf(state, ev.playerId) ?? start;
      const eased = 1 - (1 - t) * (1 - t);
      text.setPosition(at.x, at.y - rise * eased);
      text.setAlpha(t < WORD_HOLD_SHARE ? 1 : 1 - (t - WORD_HOLD_SHARE) / (1 - WORD_HOLD_SHARE));
    },
    onComplete: () => {
      if (words.get(ev.playerId) === text) words.delete(ev.playerId);
      if (text.active) text.destroy();
    },
  });
}
