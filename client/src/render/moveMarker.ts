import type Phaser from 'phaser';
import type { GameScene } from '../scenes/GameScene';
import { DEPTH } from './depth';

/**
 * The click-to-move destination marker.
 *
 * Two parts, drawn into one Graphics object that is re-stroked every frame:
 *
 *  - a one-shot PING — a ring that snaps in at the point and expands outward as
 *    it fades, so a click reads as an order landing somewhere; and
 *  - a standing PIP — a floating diamond over a scuffed ground ring that breathes
 *    until the player arrives, so the destination stays findable on a long walk.
 *
 * Everything is derived from wall-clock time (the `drawTargetIndicator` idiom),
 * never from tweens: a tween queued while the tab is hidden would stack up and
 * fire in a burst on return, and this marker outlives whole node transitions.
 *
 * It paints in the ground band (`BG_DECOR`), below every shadow and sprite, so
 * the player walks over their own destination instead of behind it.
 */

export type MoveMarkerKind = 'move' | 'summon';

interface Palette {
  /** Body of the mark. */
  main: number;
  /** Highlight on the pip's leading facets. */
  bright: number;
}

const PALETTE: Record<MoveMarkerKind, Palette> = {
  // Warm gold — deliberately not the red of `targetIndicator` (that ring means
  // "I am attacking this"), and it sits on the ground rather than on a mob, so
  // it does not read against the yellow elite outline either.
  move: { main: 0xffc23a, bright: 0xfff0bd },
  // Arcane violet for a summoner's "go there" order, so a command and a move
  // issued a second apart are never confused for one another.
  summon: { main: 0x9b6cff, bright: 0xdccdff },
};

/** Ground-plane squash. Matches the shadow ellipses closely enough to sit flat. */
const FLATTEN = 0.46;
/** Resting radius of the ground ring. */
const BASE_R = 26;
/** How far the ping ring travels before it is gone. */
const PING_R_END = 74;
const PING_MS = 380;
/** The pip drops into place over this window, overshooting slightly. */
const SNAP_MS = 240;
const PULSE_MS = 1400;
/** Pip hover height above the ground point, before the bob. */
const PIP_LIFT = 20;
/**
 * A summon order is an acknowledgement, not a destination — the player is not
 * walking to it, so nothing would ever retire it. It expires on its own, fading
 * over the last {@link SUMMON_FADE_MS}.
 */
const SUMMON_LIFE_MS = 2600;
const SUMMON_FADE_MS = 500;

function easeOutCubic(t: number): number {
  const inv = 1 - t;
  return 1 - inv * inv * inv;
}

export class MoveMarker {
  /** Scene-space destination. Only meaningful while {@link visible}. */
  x = 0;
  y = 0;
  visible = false;

  private kind: MoveMarkerKind = 'move';
  private shownAt = 0;
  private readonly g: Phaser.GameObjects.Graphics;

  constructor(scene: GameScene) {
    this.g = scene.add
      .graphics()
      // +0.4 clears the runtime ground zones at BG_DECOR + 0.3: a hazard pool is
      // information the player must not lose under their own waypoint.
      .setDepth(DEPTH.BG_DECOR + 0.4)
      .setVisible(false);
  }

  /** Plant the marker at a scene-space point and replay the ping. */
  show(x: number, y: number, kind: MoveMarkerKind = 'move'): void {
    this.x = x;
    this.y = y;
    this.kind = kind;
    this.shownAt = Date.now();
    this.visible = true;
    this.g.setVisible(true);
  }

  /** Pull the marker. Idempotent — every cancel path may call it blind. */
  hide(): void {
    if (!this.visible) return;
    this.visible = false;
    this.g.clear();
    this.g.setAlpha(1);
    this.g.setVisible(false);
  }

  /** One frame. Cheap: a handful of strokes into a single Graphics. */
  draw(now: number): void {
    if (!this.visible) return;

    const g = this.g;
    const { main, bright } = PALETTE[this.kind];
    const age = now - this.shownAt;
    const pulse = (Math.sin((now / PULSE_MS) * Math.PI * 2) + 1) / 2;

    let life = 1;
    if (this.kind === 'summon') {
      if (age >= SUMMON_LIFE_MS) {
        this.hide();
        return;
      }
      const fading = age - (SUMMON_LIFE_MS - SUMMON_FADE_MS);
      if (fading > 0) life = 1 - fading / SUMMON_FADE_MS;
    }

    g.clear();
    g.setAlpha(life);

    // --- Standing mark: scuffed ground ring + corner ticks ---------------
    // The snap makes the ring arrive a touch wide and settle, so a click has
    // weight even when the camera is already sitting on the destination.
    const snap = age < SNAP_MS ? easeOutCubic(age / SNAP_MS) : 1;
    const settle = 1 + 0.55 * (1 - snap);
    const r = BASE_R * settle * (1 + 0.04 * pulse);
    const ry = r * FLATTEN;

    g.fillStyle(main, 0.07 + 0.05 * pulse);
    g.fillEllipse(this.x, this.y, r * 2, ry * 2);
    g.lineStyle(2, main, 0.34 + 0.22 * pulse);
    g.strokeEllipse(this.x, this.y, r * 2, ry * 2);

    // Four diagonal ticks read as a bracket around the point without crowding
    // the pip, which occupies the vertical.
    g.lineStyle(2, main, 0.5 + 0.25 * pulse);
    for (const angle of [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4]) {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      g.beginPath();
      g.moveTo(this.x + cos * r * 0.82, this.y + sin * ry * 0.82);
      g.lineTo(this.x + cos * r * 1.24, this.y + sin * ry * 1.24);
      g.strokePath();
    }

    // --- Standing mark: floating pip ------------------------------------
    const bob = Math.sin((now / PULSE_MS) * Math.PI * 2) * 3;
    const lift = PIP_LIFT * snap + 26 * (1 - snap); // drops in from above
    const cy = this.y - lift - bob;
    const hw = 7;
    const hh = 11;

    // Tether to the ground so the pip never floats free of its own waypoint.
    g.lineStyle(1, main, 0.22 + 0.1 * pulse);
    g.beginPath();
    g.moveTo(this.x, cy + hh);
    g.lineTo(this.x, this.y);
    g.strokePath();

    g.fillStyle(main, 0.85);
    g.beginPath();
    g.moveTo(this.x, cy - hh);
    g.lineTo(this.x + hw, cy);
    g.lineTo(this.x, cy + hh);
    g.lineTo(this.x - hw, cy);
    g.closePath();
    g.fillPath();

    // Upper-left facet catches the light; the whole pip reads as a solid object
    // rather than a flat lozenge.
    g.fillStyle(bright, 0.75);
    g.beginPath();
    g.moveTo(this.x, cy - hh);
    g.lineTo(this.x, cy);
    g.lineTo(this.x - hw, cy);
    g.closePath();
    g.fillPath();

    g.lineStyle(1.5, bright, 0.6 + 0.3 * pulse);
    g.beginPath();
    g.moveTo(this.x, cy - hh);
    g.lineTo(this.x + hw, cy);
    g.lineTo(this.x, cy + hh);
    g.lineTo(this.x - hw, cy);
    g.closePath();
    g.strokePath();

    // --- One-shot ping ---------------------------------------------------
    if (age < PING_MS) {
      const t = age / PING_MS;
      const e = easeOutCubic(t);
      const pr = BASE_R + (PING_R_END - BASE_R) * e;
      const fade = (1 - t) * (1 - t);
      g.lineStyle(1 + 4 * (1 - t), bright, 0.8 * fade);
      g.strokeEllipse(this.x, this.y, pr * 2, pr * FLATTEN * 2);
    }
  }

  destroy(): void {
    this.g.destroy();
  }
}

export function createMoveMarker(scene: GameScene): MoveMarker {
  return new MoveMarker(scene);
}
