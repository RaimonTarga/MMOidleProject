import type { PlayerView } from '@mmo-idle/shared';
import type { GameScene } from '../scenes/GameScene';
import type { RenderState } from '../render/state';
import { DEPTH } from '../render/depth';

/**
 * Frame-charge weapon glow — progression rework Phase 3, design §8/§10:
 * "**Empowered** = weapon glow building with charge, crash with shake." A
 * Heavy/Balanced frame banks charge on every regular hit and spends the whole
 * bank on its mechanic (`shared/src/protocol/combatEvents.ts`, `frame-charge`);
 * this draws that bank as a glow on the player that grows with `stacks / max`
 * and lets go visibly when the bank is spent.
 *
 * ── Driven from the LATEST value, not per event ─────────────────────────────
 * The Artillerist ramp pushes one `frame-charge` event per shot (plan Phase 3
 * progress note), so animating each event individually would queue or stutter
 * under rapid fire. `recordFrameCharge` only overwrites a small data record —
 * never a Phaser object, never a tween — and the per-frame
 * `updateFrameChargeGlows` reads whatever is latest and eases the rendered
 * glow toward it, the same shape `render/players.ts`'s `ambientStackFlash`
 * and `fx/aura.ts`'s `updatePlayerAuras` already use for continuous,
 * event-sourced visuals. A burst of events inside one frame collapses to the
 * one chase already running toward the newest target.
 *
 * ── The spend is the payoff, not a fade ─────────────────────────────────────
 * `stacks: 0` means the mechanic just fired. The glow snaps out immediately
 * (not an eased fade like an ordinary step down would read) and a short
 * release burst stands in for the crash — "glow building ... crash with
 * shake" from design §8, built from the same graphics+tween primitives the
 * rest of `combatFx.ts` uses, no new art.
 *
 * ── Works for any root, any remote player ───────────────────────────────────
 * Keyed by `playerId` off the node-wide event, same as every other combat FX
 * handler; never assumes which of the six roots emitted it; reads `max` off
 * the wire rather than deriving a cap from a frame id (the event's own
 * contract — see the comment on `frame-charge` in combatEvents.ts).
 */

/** The Empowered lane's established colour — the frame-charge bank IS that
 *  lane's container. Kept as its value when the lane table went with the lineage
 *  trees (class-first rework D1). */
const GLOW_COLOR = 0xffb347;
const GLOW_CORE = 0xfff4cf;

/** Fraction-per-second the rendered glow chases the latest known target. Not a
 *  fixed-duration tween: a later event just moves the target, so a burst of
 *  same-frame events never queues more than this one running chase. */
const CHASE_RATE_PER_S = 9;
const RELEASE_FLASH_MS = 320;
const BASE_RADIUS_PX = 9;
const MAX_RADIUS_PX = 28;
/** Weapon/chest height above the sprite's feet-anchored origin. */
const GLOW_OFFSET_Y = -16;

export interface FrameChargeGlowState {
  stacks: number;
  max: number;
  /** Eased 0..1 render fraction, chasing `stacks / max` every frame. */
  displayT: number;
  /** Armed the instant `stacks` lands on 0 after having been charged; consumed
   *  (played or deliberately dropped) by the very next draw pass. */
  releasePending: boolean;
  graphics: Phaser.GameObjects.Graphics | null;
}

function targetFraction(entry: { stacks: number; max: number }): number {
  if (!(entry.max > 0)) return 0;
  return Math.max(0, Math.min(1, entry.stacks / entry.max));
}

/**
 * Record the latest bank value for `playerId`. Pure bookkeeping — no Phaser
 * object, no tween — so it is safe to call on every `frame-charge` event
 * regardless of tab visibility or whether the player currently has a sprite;
 * `updateFrameChargeGlows` resolves the rest once a frame actually runs.
 *
 * `allowBurst` gates only whether a spend (`stacks` landing on 0 after being
 * charged) arms the one-shot release flash — never the bookkeeping itself.
 * Passing `false` while the tab is hidden drops that burst instead of queuing
 * it for when the tab returns (background-tab rule: no queued tweens while
 * hidden); the glow itself still snaps to "empty" the moment the tab is next
 * drawn, because `stacks`/`max` are already current.
 */
export function recordFrameCharge(
  state: RenderState,
  playerId: string,
  stacks: number,
  max: number,
  allowBurst: boolean,
): void {
  const prev = state.frameChargeGlow.get(playerId);
  const wasCharged = (prev?.stacks ?? 0) > 0;
  const isSpend = stacks <= 0 && wasCharged;
  state.frameChargeGlow.set(playerId, {
    stacks: Math.max(0, stacks),
    max: Math.max(0, max),
    displayT: prev?.displayT ?? 0,
    releasePending: isSpend ? allowBurst : (prev?.releasePending ?? false),
    graphics: prev?.graphics ?? null,
  });
}

function drawGlow(
  g: Phaser.GameObjects.Graphics,
  sprite: { x: number; y: number; depth: number },
  t: number,
): void {
  // Sits just in front of the (y-sorted) sprite, same band — this is meant to
  // read as light coming off the weapon in the character's own hand, not a
  // separate ground/aura layer, so it rides `sprite.depth` rather than a flat
  // DEPTH constant.
  g.setDepth(sprite.depth + 0.4);
  const x = sprite.x;
  const y = sprite.y + GLOW_OFFSET_Y;
  const radius = BASE_RADIUS_PX + (MAX_RADIUS_PX - BASE_RADIUS_PX) * t;
  // A tightening flicker as the bank nears the cap — "about to pop", not a
  // steady pulse the whole way up.
  const flicker = 0.85 + Math.sin(performance.now() / (160 - 80 * t)) * 0.15 * t;
  g.clear();
  g.fillStyle(GLOW_COLOR, 0.12 * t * flicker);
  g.fillCircle(x, y, radius * 1.6);
  g.fillStyle(GLOW_COLOR, 0.28 * t * flicker);
  g.fillCircle(x, y, radius);
  g.fillStyle(GLOW_CORE, 0.5 * t * flicker);
  g.fillCircle(x, y, radius * 0.4);
  g.lineStyle(1.5, GLOW_CORE, Math.min(0.9, 0.6 * t));
  g.strokeCircle(x, y, radius);
}

/** The crash: a bright snap-flash plus a few radiating cracks, gone inside a
 *  third of a second. Built from the same graphics+tween primitives every
 *  other `combatFx.ts` handler uses — no new art asset. */
function spawnReleaseBurst(scene: GameScene, x: number, y: number): void {
  // Fixed FX band, like every other one-shot combat FX in `combatFx.ts`.
  const flash = scene.add.graphics({ x, y }).setDepth(DEPTH.FX);
  flash.fillStyle(GLOW_CORE, 0.95);
  flash.fillCircle(0, 0, 10);
  flash.lineStyle(2.5, GLOW_COLOR, 0.9);
  flash.strokeCircle(0, 0, 10);
  scene.tweens.add({
    targets: flash,
    scaleX: 3.4,
    scaleY: 3.4,
    alpha: 0,
    duration: RELEASE_FLASH_MS,
    ease: 'Cubic.easeOut',
    onComplete: () => flash.destroy(),
  });

  const ticks = 5;
  for (let i = 0; i < ticks; i++) {
    const angle = (Math.PI * 2 * i) / ticks + Math.random() * 0.4;
    const tick = scene.add.graphics({ x, y }).setDepth(DEPTH.FX);
    tick.lineStyle(2, GLOW_COLOR, 0.85);
    tick.beginPath();
    tick.moveTo(0, 0);
    tick.lineTo(Math.cos(angle) * 6, Math.sin(angle) * 6);
    tick.strokePath();
    scene.tweens.add({
      targets: tick,
      x: x + Math.cos(angle) * 26,
      y: y + Math.sin(angle) * 26,
      alpha: 0,
      duration: RELEASE_FLASH_MS * 0.85,
      ease: 'Cubic.easeOut',
      onComplete: () => tick.destroy(),
    });
  }
}

/**
 * Redraw every player's frame-charge glow against its latest recorded value.
 * Call once per rendered frame, only while the tab is actually visible (the
 * scene's own `!isClientRenderPaused()` gate — see `scenes/game/sceneSetup.ts`
 * next to `updatePlayerAuras`/`updateAmbientStackFlashes`): that gate is what
 * keeps this from ever creating a graphics object or queuing a tween while the
 * tab is hidden, with no extra visibility check needed here.
 */
export function updateFrameChargeGlows(state: RenderState, scene: GameScene, dt: number): void {
  if (state.frameChargeGlow.size === 0) return;

  for (const [id, entry] of state.frameChargeGlow) {
    const player = state.view.get(id) as PlayerView | undefined;
    const sprite = state.sprite.get(id);
    if (!player || !sprite || state.kind.get(id) !== 'player' || player.isDead) {
      if (entry.graphics) entry.graphics.destroy();
      state.frameChargeGlow.delete(id);
      continue;
    }

    const target = targetFraction(entry);
    let burstNow = false;
    if (entry.releasePending) {
      entry.releasePending = false;
      // The spend is the payoff the player is watching for: snap out rather
      // than ease to 0, which would read as the charge quietly draining away.
      entry.displayT = 0;
      burstNow = true;
    } else {
      const chase = Math.min(1, CHASE_RATE_PER_S * Math.max(0, dt));
      entry.displayT += (target - entry.displayT) * chase;
      if (Math.abs(target - entry.displayT) < 0.002) entry.displayT = target;
    }

    if (entry.displayT <= 0.001 && !burstNow) {
      if (entry.graphics) {
        entry.graphics.destroy();
        entry.graphics = null;
      }
    } else {
      if (!entry.graphics) entry.graphics = scene.add.graphics();
      drawGlow(entry.graphics, sprite, entry.displayT);
    }

    if (burstNow) spawnReleaseBurst(scene, sprite.x, sprite.y + GLOW_OFFSET_Y);
  }
}
