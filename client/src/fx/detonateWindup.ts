import type { GameScene } from '../scenes/GameScene';
import type { DamageElement } from '@mmo-idle/shared';
import type { RenderState } from '../render/state';
import { elementShades } from './elementTint';
import { DEPTH } from '../render/depth';

/**
 * Detonate's wind-up — the afflictions being drawn taut before they are spent.
 *
 * ── Why this exists ────────────────────────────────────────────────────────
 * Detonate is a two-second cast and, until now, those two seconds had no visual
 * at all beyond the generic cast bar over the CASTER. That is the wrong place
 * twice over: the bar says "a player is doing something", when what the player
 * needs to read is "that monster is about to lose everything on it". So the
 * wind-up is drawn on the TARGET, in the colour of what is about to come off
 * it, and it tightens as the cast runs so its progress is legible without
 * looking away at the bar.
 *
 * ── Why it tracks rather than being placed ─────────────────────────────────
 * Two seconds is long enough for the target to walk out of any position
 * snapshot, so this cannot be a one-shot FX pinned to a point. It follows the
 * same pattern the cast bar itself uses ({@link drawCastBars}): state keyed by
 * entity id, redrawn each frame against the live sprite, expiring on its own if
 * the end event never arrives. Nothing here is authoritative — the cast can be
 * interrupted and the server decides that; this just stops drawing.
 *
 * ── Why it is keyed by the CASTER and drawn on the TARGET ──────────────────
 * `player-cast-end` reports who finished casting, not what they were casting
 * at, and it is the only event that fires for BOTH outcomes (resolved and
 * interrupted) — so it is the only reliable place to stop. Keying by caster
 * makes that a direct lookup, and it is correct besides: a player has at most
 * one cast in flight, while one monster may be targeted by several. The target
 * rides along in the state purely as the position to draw at.
 *
 * ── Why the colour can differ from the burst ───────────────────────────────
 * The element is resolved at cast START from the afflictions present then. A
 * DoT can expire or a new one land during the wind-up, so the release
 * occasionally opens in a different hue than it closed in. That is accepted
 * deliberately: a wind-up that is usually the right colour reads far better
 * than a grey one that is never wrong. When the server sends no element (an
 * ability with no colour to give), the wind-up is skipped rather than guessed.
 */

/** Orbiting shards that close in on the target as the cast runs. */
const SHARD_COUNT = 5;
/** How far out the shards start, and how close they get, in px. */
const START_RADIUS = 62;
const END_RADIUS = 20;
/** Full revolutions over the whole wind-up. */
const SPIN_TURNS = 1.15;
/** Sprites sit above their origin — match the release FX's centre. */
const CENTER_OFFSET_Y = 8;
/** Keep drawing this long past the expected end, in case the end event is late. */
const EXPIRY_GRACE_MS = 400;

export interface DetonateWindupState {
  /** Monster the wind-up is drawn on; the map itself is keyed by the caster. */
  targetId: string;
  startedAt: number;
  castMs: number;
  element: DamageElement;
  graphics: Phaser.GameObjects.Graphics;
}

/** Begin a wind-up by `casterId` on `targetId`. Replaces that caster's previous one. */
export function startDetonateWindup(
  state: RenderState,
  scene: GameScene,
  casterId: string,
  targetId: string,
  castMs: number,
  element: DamageElement,
): void {
  endDetonateWindup(state, casterId);
  state.detonateWindup.set(casterId, {
    targetId,
    startedAt: Date.now(),
    castMs,
    element,
    graphics: scene.add.graphics().setDepth(DEPTH.FX),
  });
}

/** Stop and clean up a caster's wind-up (cast fired, interrupted, or caster gone). */
export function endDetonateWindup(state: RenderState, casterId: string): void {
  const windup = state.detonateWindup.get(casterId);
  if (!windup) return;
  windup.graphics.destroy();
  state.detonateWindup.delete(casterId);
}

/** Redraw each wind-up against its target's current sprite position. */
export function drawDetonateWindups(state: RenderState): void {
  if (state.detonateWindup.size === 0) return;
  const now = Date.now();

  for (const [casterId, windup] of state.detonateWindup) {
    // Self-expire if the cast-end event never landed, so a dropped event cannot
    // leave a ring spinning on a monster forever.
    if (now - windup.startedAt > windup.castMs + EXPIRY_GRACE_MS) {
      endDetonateWindup(state, casterId);
      continue;
    }
    const sprite = state.sprite.get(windup.targetId);
    const g = windup.graphics;
    if (!sprite) {
      // Target not currently rendered (out of view, mid-respawn). Keep the state
      // — the cast is still running server-side — but draw nothing.
      g.clear();
      continue;
    }

    const t = Math.min(1, (now - windup.startedAt) / Math.max(1, windup.castMs));
    const { deep, mid, bright } = elementShades(windup.element);
    const x = sprite.x;
    const y = sprite.y - CENTER_OFFSET_Y;

    // Everything tightens and brightens together, so the single read is
    // "something is being wound up on that monster".
    const radius = START_RADIUS + (END_RADIUS - START_RADIUS) * t;
    const intensity = 0.25 + 0.65 * t;
    const spin = t * Math.PI * 2 * SPIN_TURNS;

    g.clear();

    // A soft pooling glow under the target: the afflictions gathering in it.
    g.fillStyle(deep, 0.1 + 0.22 * t);
    g.fillCircle(x, y, END_RADIUS * (0.7 + 0.5 * t));

    // The closing ring. Dashed rather than solid — an unbroken circle reads as a
    // finished, targeted AoE telegraph, which this is not.
    const dashes = 12;
    g.lineStyle(2, mid, intensity);
    for (let i = 0; i < dashes; i++) {
      const from = spin + (Math.PI * 2 * i) / dashes;
      const to = from + (Math.PI * 2) / dashes / 1.9;
      g.beginPath();
      g.arc(x, y, radius, from, to);
      g.strokePath();
    }

    // Shards spiralling inward, each a short radial tick. They are what actually
    // sells "being pulled in" — the ring alone just looks like a countdown.
    g.lineStyle(2.5, bright, intensity);
    for (let i = 0; i < SHARD_COUNT; i++) {
      const angle = -spin * 1.6 + (Math.PI * 2 * i) / SHARD_COUNT;
      const outer = radius * 1.18;
      const inner = radius * 0.86;
      g.beginPath();
      g.moveTo(x + Math.cos(angle) * outer, y + Math.sin(angle) * outer);
      g.lineTo(x + Math.cos(angle) * inner, y + Math.sin(angle) * inner);
      g.strokePath();
    }
  }
}
