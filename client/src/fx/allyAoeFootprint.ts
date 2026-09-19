import type { GameScene } from '../scenes/GameScene';
import type { RenderState } from '../render/state';
import { DEPTH } from '../render/depth';
import { nodeToSceneX, nodeToSceneY } from '../render/sceneCoords';

/**
 * The ground footprint of a FRIENDLY area cast, drawn for the whole wind-up.
 *
 * ── Why this exists ────────────────────────────────────────────────────────
 * Slam commits 1.6 s to hitting everything in a circle, and until now nothing
 * told the player where that circle was. The impact FX draws it — after the
 * decision is already made. An AoE whose area you only learn about once it has
 * resolved is an AoE you cannot position for, which is the entire skill of it.
 *
 * The same is true of Contagion, which spends 1 s deciding which enemies around
 * the afflicted target inherit its afflictions. Nothing here knows either ability
 * by name: it draws whatever area a `player-cast-start` declares, so a friendly
 * cast that grows a footprint later joins by shipping `aoeRadius` and nothing
 * else.
 *
 * ── Why it is drawn like an enemy telegraph, but not AS one ────────────────
 * It borrows the ground-zone grammar (`render/groundZones.ts`): a low-alpha
 * footprint that answers "where" on the first frame, a rim at the true radius,
 * and a countdown that reaches that rim on impact. Reusing the vocabulary means
 * a player already reads it fluently.
 *
 * Everything else is deliberately pulled DOWN from the enemy version, because
 * this is information, not a threat:
 * - GREEN, never the hazard oranges/reds. Colour is the primary "this is mine".
 * - A DASHED rim at 2px, against the enemy telegraph's solid 4px. Broken lines
 *   read as a guide; an unbroken hot rim reads as "get out".
 * - The countdown is a thin travelling RING, not a filling disc. A disc closing
 *   in on you is the danger read, and it would also obscure the monsters the
 *   player is trying to count inside the circle — which is the one thing this
 *   indicator exists to let them do.
 *
 * ── Why it tracks rather than being placed ─────────────────────────────────
 * The server resolves the payload at the TARGET's position at the moment the
 * cast completes (`resolveCastPayload`), not where the target stood when it
 * started — and 1.6 s is long enough to walk out of any snapshot. So this
 * follows the live target every frame, exactly like Detonate's wind-up
 * ({@link drawDetonateWindups}): state keyed by CASTER (one cast in flight per
 * player, and `player-cast-end` reports the caster for both outcomes), redrawn
 * against the target each frame, self-expiring if the end event never lands.
 *
 * ── Why the radius comes over the wire ─────────────────────────────────────
 * `player-cast-start.aoeRadius` is the number the server resolves the area with
 * — damages with for Slam, selects spread victims with for Contagion — taken
 * from the caster's rank. Nothing here may invent, round or scale it: this is a
 * promise about what is about to be caught, and the only honest way to keep it
 * is to draw the authoritative value verbatim.
 *
 * Colour is deliberately NOT varied by what the cast carries. Contagion can be
 * spreading a burn, a poison and a frost at once, so there is no one honest
 * element colour for it; mixed-element presentation is a separate problem, and
 * until it is solved a single friendly green is the truthful answer.
 *
 * Nothing here is authoritative. It draws; the server decides.
 */

/** Friendly green. Matches the Second Wind callout — the established ally hue. */
const FOOTPRINT_FILL = 0x3f8f45;
const FOOTPRINT_LINE = 0x9cff8a;
/** Dash count around the rim. Enough to read as a circle, sparse enough to read as a guide. */
const RIM_DASHES = 26;
/** Fraction of each dash slot that is actually drawn. */
const RIM_DASH_DUTY = 0.55;
/** Keep drawing this long past the expected end, in case the end event is late. */
const EXPIRY_GRACE_MS = 400;

/** Total life of a LANDED-area pulse: grow, then gone. */
const PULSE_MS = 240;
/** The pulse reaches the true radius in this long — a snap, not a wind-up. */
const PULSE_GROW_MS = 110;
/** Where the pulse starts, as a fraction of the true radius. */
const PULSE_START_SCALE = 0.55;
/**
 * Two pulses closer together than this, from one player, are the same beat: a
 * blunderbuss volley resolves its whole clip in a single tick, and ten identical
 * circles stacked in one frame is a bright blob, not a reading of the area.
 */
const PULSE_COALESCE_MS = PULSE_MS;
/** ...but only when they land on the same spot. A different target is news. */
const PULSE_COALESCE_PX = 8;

export interface AllyAoeFootprintState {
  /** Entity the footprint is centred on; the map itself is keyed by the caster. */
  targetId: string;
  startedAt: number;
  castMs: number;
  /** Authoritative area radius, in world units. Drawn verbatim. */
  radius: number;
  graphics: Phaser.GameObjects.Graphics;
}

/** Begin `casterId`'s footprint on `targetId`. Replaces that caster's previous one. */
export function startAllyAoeFootprint(
  state: RenderState,
  scene: GameScene,
  casterId: string,
  targetId: string,
  castMs: number,
  radius: number,
): void {
  endAllyAoeFootprint(state, casterId);
  state.allyAoeFootprint.set(casterId, {
    targetId,
    startedAt: Date.now(),
    castMs,
    radius,
    // Ground band, same as the enemy telegraphs: a footprint belongs UNDER the
    // bodies standing in it, or it hides the thing it is measuring.
    graphics: scene.add.graphics().setDepth(DEPTH.BG_DECOR + 0.35),
  });
}

/** Stop and clean up a caster's footprint (cast fired, interrupted, or caster gone). */
export function endAllyAoeFootprint(state: RenderState, casterId: string): void {
  const footprint = state.allyAoeFootprint.get(casterId);
  if (!footprint) return;
  footprint.graphics.destroy();
  state.allyAoeFootprint.delete(casterId);
}

/** Redraw each footprint against its target's current position. */
export function drawAllyAoeFootprints(state: RenderState): void {
  if (state.allyAoeFootprint.size === 0) return;
  const now = Date.now();

  for (const [casterId, footprint] of state.allyAoeFootprint) {
    // Self-expire if the cast-end event never landed, so a dropped event — or a
    // caster who died mid-wind-up, which stops the server's cast loop without
    // an abort — cannot leave a circle on the ground forever.
    if (now - footprint.startedAt > footprint.castMs + EXPIRY_GRACE_MS) {
      endAllyAoeFootprint(state, casterId);
      continue;
    }

    const g = footprint.graphics;
    // The ENTITY position, not the sprite's: sprites are lifted by
    // `visualOffsetY` so their feet land right, and a ground circle offset by a
    // sprite's art would be a lie about the circle the server tests.
    const interp = state.interpolation.get(footprint.targetId);
    if (!interp) {
      // Target not currently rendered. Keep the state — the cast is still
      // running server-side — but draw nothing.
      g.clear();
      continue;
    }

    const x = nodeToSceneX(interp.base.x);
    const y = nodeToSceneY(interp.base.y);
    const t = Math.min(1, (now - footprint.startedAt) / Math.max(1, footprint.castMs));

    g.clear();

    // 1. FOOTPRINT. The area itself, answered on the first frame.
    g.fillStyle(FOOTPRINT_FILL, 0.1);
    g.fillCircle(x, y, footprint.radius);

    // 2. RIM. Dashed, at the exact authoritative radius — anything inside this
    // line is inside the blow (or, for a spread, inside the contagion).
    g.lineStyle(2, FOOTPRINT_LINE, 0.55);
    for (let i = 0; i < RIM_DASHES; i++) {
      const from = (Math.PI * 2 * i) / RIM_DASHES;
      g.beginPath();
      g.arc(x, y, footprint.radius, from, from + ((Math.PI * 2) / RIM_DASHES) * RIM_DASH_DUTY);
      g.strokePath();
    }

    // 3. COUNTDOWN. One thin ring travelling out to the rim, arriving exactly on
    // impact. Timing without the "something is filling up under me" alarm.
    g.lineStyle(1.5, FOOTPRINT_LINE, 0.3 + 0.35 * t);
    g.strokeCircle(x, y, footprint.radius * t);
  }
}

/**
 * The area a player's payload JUST covered, shown for a moment after the fact.
 *
 * ── Why this is not the wind-up indicator ──────────────────────────────────
 * Sweep is an ARMED attack, not a cast. There is no wind-up to stand in, no
 * moment where drawing the circle early would let anyone reposition — by the
 * time the rider resolves, the swing has landed and the splash is already
 * applied. So this deliberately does NOT reuse the tracking footprint above:
 * a circle that appears before the blow reads as "danger incoming", which is
 * the enemy-telegraph grammar and a lie about who is in control here.
 *
 * What it answers instead is the question Sweep left unanswered — "did that
 * catch the pack, or just the one I hit?" — and it answers it about the past
 * tense, which is why it snaps out to the rim and is gone inside a quarter
 * second. The slash FX still plays over it; this is a readability layer under
 * the bodies, not a replacement for the ability's own animation.
 *
 * Same friendly green, same dashless ground band as the cast footprint, so the
 * two read as one vocabulary: green circle = an ally's area.
 *
 * `radius` is the server's resolved value, drawn verbatim. Nothing here scales,
 * rounds or pads it — the whole point is that the ring is where the splash
 * actually stopped.
 */
export function fxAllyAoeFootprint(
  state: RenderState,
  scene: GameScene,
  casterId: string,
  x: number,
  y: number,
  radius: number,
): void {
  if (!(radius > 0)) return;

  // Coalesce a same-tick burst (see PULSE_COALESCE_MS). Keyed by caster and
  // position so two shots that really did hit different places still both draw.
  const now = Date.now();
  const last = state.allyAoeFootprintPulse.get(casterId);
  if (
    last
    && now - last.at < PULSE_COALESCE_MS
    && Math.abs(last.x - x) <= PULSE_COALESCE_PX
    && Math.abs(last.y - y) <= PULSE_COALESCE_PX
  ) {
    return;
  }
  state.allyAoeFootprintPulse.set(casterId, { at: now, x, y });

  // Ground band, under the bodies standing in it — the same place the cast
  // footprint draws, for the same reason: a circle over the monsters hides the
  // very thing it exists to let the player count.
  const g = scene.add.graphics({ x, y }).setDepth(DEPTH.BG_DECOR + 0.35);
  g.fillStyle(FOOTPRINT_FILL, 0.12);
  g.fillCircle(0, 0, radius);
  g.lineStyle(2, FOOTPRINT_LINE, 0.5);
  g.strokeCircle(0, 0, radius);
  g.setScale(PULSE_START_SCALE);

  // Grow and fade run as separate tweens on purpose: the circle must REACH the
  // true radius well before it disappears, or the last thing the eye sees is a
  // ring smaller than the area that was actually hit.
  scene.tweens.add({
    targets: g,
    scaleX: 1,
    scaleY: 1,
    duration: PULSE_GROW_MS,
    ease: 'Cubic.easeOut',
  });
  scene.tweens.add({
    targets: g,
    alpha: 0,
    duration: PULSE_MS,
    ease: 'Quad.easeIn',
    onComplete: () => g.destroy(),
  });
}
