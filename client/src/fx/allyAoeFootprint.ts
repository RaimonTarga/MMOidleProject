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
 * `player-cast-start.aoeRadius` is the number the server damages with, resolved
 * from the caster's rank. Nothing here may invent, round or scale it: this is a
 * promise about what is about to be hit, and the only honest way to keep it is
 * to draw the authoritative value verbatim.
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

export interface AllyAoeFootprintState {
  /** Entity the footprint is centred on; the map itself is keyed by the caster. */
  targetId: string;
  startedAt: number;
  castMs: number;
  /** Authoritative damage radius, in world units. Drawn verbatim. */
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

    // 2. RIM. Dashed, at the exact damage radius — anything inside this line is
    // inside the blow.
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
