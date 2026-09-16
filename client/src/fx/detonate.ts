import type { GameScene } from '../scenes/GameScene';
import { GAME_CONFIG, type DamageElement } from '@mmo-idle/shared';
import { elementShades } from './elementTint';
import { burstFx, EMPOWERED_DAMAGE_COLOR } from './particles';
import { DEPTH } from '../render/depth';

/**
 * Detonate — every affliction on the target going off at once.
 *
 * ── Why this is not an explosion ───────────────────────────────────────────
 * The mechanic is not "ordnance went off next to a monster", it is "the poison
 * / burn / frost / bleed / lightning / doom inside the target left all at once
 * and took its remaining damage with it". So the shape is a SUBLIMATION: the
 * afflictions are pulled in, released as light, and what is left rises off the
 * corpse as vapour. That reading has to hold for all six elements at once,
 * which rules out any literal per-element shape (flames, icicles, sparks) and
 * rules in "substance leaves a body and becomes air" — poison gas, smoke, ice
 * genuinely sublimating, blood mist, discharge, soul-smoke.
 *
 * ── Why the colour is now visible, when it always WAS element-tinted ───────
 * The element has been resolved server-side and sent on the event since the
 * ability shipped, but four things were eating it, and each is fixed here:
 *
 *  1. A white core owned the moment. The brightest, fastest layer was
 *     `0xffffff`, so the eye's impression of the burst was "white", whatever
 *     the tinted layers underneath were doing. There is now NO white fill
 *     anywhere — white survives only as thin line-work on the shock ring, where
 *     it reads as a crack rather than as the explosion's colour.
 *  2. One flat hue at 0.7 alpha on a normal blend averages toward whatever
 *     terrain is behind it. Every coloured layer now draws from
 *     {@link elementShades}, so three values of one hue hold the colour against
 *     any background.
 *  3. Nothing moved. Hue reads far better on a travelling object than on a
 *     static translucent wash, so the first beat is now motes CONVERGING — the
 *     colour is legible before the burst even happens.
 *  4. Everything fired at t=0 and was over in 420ms, so no phase was ever the
 *     colour's alone. The beats are now staged.
 *
 * ── The crit tell ─────────────────────────────────────────────────────────
 * Detonate always reads as a crit — it is the payoff of the whole affliction
 * pair, so the tell is unconditional rather than threshold-gated. It is carried
 * by three things, none of which is allowed to touch the element's colour: the
 * gold ring at `EMPOWERED_AOE_RADIUS` (drawn outside every element layer), the
 * gold '!' damage number the server flags `empowered`, and the shared
 * `empowered` sfx cue.
 *
 * Colour can only say one thing, and gold is what the player already reads as
 * "crit" everywhere else in the game — so on the NUMBER the element moves to
 * its glyph (`4820!☠`) rather than losing its cue, and on the FX the element
 * keeps the whole burst while gold keeps the frame. See
 * `resolveMonsterDamageStyle` for the number half of that split.
 */

/** Motes that converge on the target during the inhale. */
const MOTE_COUNT = 9;
/** Where those motes start, in px from the target. */
const MOTE_ORBIT_PX = 95;
/** Tapered shards thrown off by the release. */
const SHARD_COUNT = 10;

const INHALE_MS = 160;
const FLASH_MS = 200;
const SHARD_MS = 360;

/** Sprites sit above their origin; every beat shares this centre. */
const CENTER_OFFSET_Y = 8;

/** Numeric mirror of the shared crit colour, parsed once. */
const CRIT_GOLD = Number.parseInt(EMPOWERED_DAMAGE_COLOR.replace('#', ''), 16);

/**
 * Draw one tapered shard as a filled triangle.
 *
 * A 3px stroked line — what this FX used to throw — carries almost no hue at
 * 1:1 zoom over detailed terrain. A filled triangle covers enough pixels to
 * actually be the element's colour, and its taper still reads as "thrown
 * outward" rather than as a blob.
 */
function drawShard(
  g: Phaser.GameObjects.Graphics,
  angle: number,
  length: number,
  halfWidth: number,
  color: number,
  alpha: number,
): void {
  const tipX = Math.cos(angle) * length;
  const tipY = Math.sin(angle) * length;
  // Perpendicular, for the base's width.
  const px = -Math.sin(angle) * halfWidth;
  const py = Math.cos(angle) * halfWidth;
  g.fillStyle(color, alpha);
  g.beginPath();
  g.moveTo(tipX, tipY);
  g.lineTo(px, py);
  g.lineTo(-px, -py);
  g.closePath();
  g.fillPath();
}

export function fxDetonate(
  scene: GameScene,
  x: number,
  y: number,
  element: DamageElement,
): void {
  const { deep, mid, bright } = elementShades(element);
  const cy = y - CENTER_OFFSET_Y;

  // ── Beat 1: INHALE ───────────────────────────────────────────────────────
  // The afflictions are gathered before they are spent. This is the beat that
  // makes the element legible: motes travelling across static terrain hold
  // their colour in a way a translucent wash never does.
  for (let i = 0; i < MOTE_COUNT; i++) {
    const angle = (Math.PI * 2 * i) / MOTE_COUNT + Math.random() * 0.4;
    const distance = MOTE_ORBIT_PX * (0.75 + Math.random() * 0.45);
    const mote = scene.add.graphics().setDepth(DEPTH.FX);
    // A head plus a tail pointing back the way it came, so the mote reads as
    // moving even in a single frame.
    mote.fillStyle(bright, 0.95);
    mote.fillCircle(0, 0, 3.5);
    mote.lineStyle(2, mid, 0.55);
    mote.beginPath();
    mote.moveTo(0, 0);
    mote.lineTo(Math.cos(angle) * 13, Math.sin(angle) * 13);
    mote.strokePath();
    mote.setPosition(x + Math.cos(angle) * distance, cy + Math.sin(angle) * distance);

    scene.tweens.add({
      targets: mote,
      x,
      y: cy,
      duration: INHALE_MS,
      // Accelerating inward: the pull tightens rather than drifting closed.
      ease: 'Quad.easeIn',
      delay: Math.random() * 40,
      onComplete: () => mote.destroy(),
    });
  }

  // A contracting ring under the motes, so the gather reads as one event rather
  // than as nine unrelated specks.
  const gather = scene.add.graphics().setDepth(DEPTH.FX);
  const gatherState = { radius: MOTE_ORBIT_PX, alpha: 0.5 };
  scene.tweens.add({
    targets: gatherState,
    radius: 14,
    alpha: 0.9,
    duration: INHALE_MS,
    ease: 'Quad.easeIn',
    onUpdate: () => {
      gather.clear();
      gather.lineStyle(2, mid, gatherState.alpha);
      gather.strokeCircle(x, cy, gatherState.radius);
    },
    onComplete: () => gather.destroy(),
  });

  // ── Beat 2: RELEASE ──────────────────────────────────────────────────────
  // The flash is the element's own colour, NOT white. This is the single
  // biggest change: the old white core is what made every detonation, of every
  // element, look the same.
  scene.time.delayedCall(INHALE_MS, () => {
    const body = scene.add.graphics().setDepth(DEPTH.FX);
    const bodyState = { scale: 0.35, alpha: 1 };
    scene.tweens.add({
      targets: bodyState,
      scale: 3.4,
      alpha: 0,
      duration: FLASH_MS,
      ease: 'Cubic.easeOut',
      onUpdate: () => {
        const r = 20 * bodyState.scale;
        body.clear();
        // Three concentric values of one hue. The bright kernel is small and
        // brief; the deep underlay is wide and carries the silhouette.
        body.fillStyle(deep, bodyState.alpha * 0.45);
        body.fillCircle(x, cy, r);
        body.fillStyle(mid, bodyState.alpha * 0.7);
        body.fillCircle(x, cy, r * 0.62);
        body.fillStyle(bright, bodyState.alpha * 0.95);
        body.fillCircle(x, cy, r * 0.28);
      },
      onComplete: () => body.destroy(),
    });

    // The one permitted white: a thin shock rim. As LINE-work it reads as "the
    // container cracked" without ever becoming the colour of the explosion.
    const shock = scene.add.graphics().setDepth(DEPTH.FX);
    const shockState = { radius: 10, alpha: 0.85 };
    scene.tweens.add({
      targets: shockState,
      radius: 72,
      alpha: 0,
      duration: 300,
      ease: 'Cubic.easeOut',
      onUpdate: () => {
        shock.clear();
        shock.lineStyle(2, 0xffffff, shockState.alpha * 0.55);
        shock.strokeCircle(x, cy, shockState.radius);
        shock.lineStyle(3.5, bright, shockState.alpha);
        shock.strokeCircle(x, cy, shockState.radius * 0.88);
      },
      onComplete: () => shock.destroy(),
    });

    // ── Beat 3: SHATTER ────────────────────────────────────────────────────
    // The afflictions themselves, thrown off. Tapered triangles rather than
    // hairlines, because hue needs pixels.
    for (let i = 0; i < SHARD_COUNT; i++) {
      const angle = (Math.PI * 2 * i) / SHARD_COUNT + Math.random() * 0.3;
      // Kept inside GAME_CONFIG.EMPOWERED_AOE_RADIUS so the gold crit ring
      // always expands past the element layers rather than through them.
      const reach = 44 + Math.random() * 24;
      const shard = scene.add.graphics({ x, y: cy }).setDepth(DEPTH.FX);
      const shardState = { t: 0 };
      scene.tweens.add({
        targets: shardState,
        t: 1,
        duration: SHARD_MS + Math.random() * 120,
        ease: 'Quad.easeOut',
        onUpdate: () => {
          const t = shardState.t;
          shard.clear();
          // Grows outward from the centre and thins as it goes, so it looks
          // like something leaving rather than something sliding.
          drawShard(shard, angle, reach * t, 5.5 * (1 - t * 0.7), mid, 0.9 * (1 - t));
          drawShard(shard, angle, reach * t * 0.7, 2.5 * (1 - t * 0.7), bright, 0.95 * (1 - t));
        },
        onComplete: () => shard.destroy(),
      });
    }

    // ── Beat 4: SUBLIME ────────────────────────────────────────────────────
    // What the burst leaves behind, rising and evaporating. The short "A"
    // finish: it is what makes the whole thing land on sublimation rather than
    // on detonation, and it costs one particle burst.
    burstFx(scene, 'ptx-dot', x, cy, 14, 900, {
      tint: mid,
      speed: { min: 12, max: 58 },
      angle: { min: 200, max: 340 },
      scale: { start: 1.25, end: 0 },
      alpha: { start: 0.8, end: 0 },
      gravityY: -95,
    });
    burstFx(scene, 'ptx-dot', x, cy, 9, 1100, {
      tint: deep,
      speed: { min: 6, max: 34 },
      angle: { min: 210, max: 330 },
      scale: { start: 1.7, end: 0 },
      alpha: { start: 0.5, end: 0 },
      gravityY: -55,
    });

    // ── The crit tell ──────────────────────────────────────────────────────
    // Gold, and deliberately the OUTERMOST thing drawn: every element layer
    // above stops short of this radius, so the ring frames the burst instead of
    // travelling through it and mudding the hue. The radius is the same
    // `EMPOWERED_AOE_RADIUS` the empowered ring uses everywhere else, so this
    // reads as the game's existing crit vocabulary rather than as a
    // Detonate-only invention.
    const crit = scene.add.graphics().setDepth(DEPTH.FX);
    const critState = { radius: 18, alpha: 0.9 };
    scene.tweens.add({
      targets: critState,
      radius: GAME_CONFIG.EMPOWERED_AOE_RADIUS,
      alpha: 0,
      duration: 420,
      // A beat behind the flash, so it reads as the burst's frame rather than
      // as another layer of it.
      delay: 40,
      ease: 'Power2',
      onUpdate: () => {
        crit.clear();
        crit.lineStyle(2.5, CRIT_GOLD, critState.alpha);
        crit.strokeCircle(x, cy, critState.radius);
      },
      onComplete: () => crit.destroy(),
    });
  });
}
