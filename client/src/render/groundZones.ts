import type { GroundZoneGeometry, GroundZoneKind, GroundZoneView } from "@mmo-idle/shared";
import type { GameScene } from "../scenes/GameScene";
import { HAZARD_POOL_ART } from "../sprites";
import { burstFx } from "../fx/particles";
import { DEPTH } from "./depth";

/**
 * Runtime combat circles: Cave slam telegraphs and temporary toxic pools. Lifted
 * from `dungeonHazards.ts` with the same keyed reconciliation shape. A slam fill
 * grows toward the rim as its cast completes; a pool remains filled and fades
 * near expiry.
 *
 * `remainingMs` only refreshes at the 5 Hz broadcast, so the progress is advanced
 * locally each frame from the client clock and re-anchored whenever a fresh
 * packet lands. Without that the ring would visibly step four times and finish.
 */

const SLAM_FILL = 0xc25b2a;
const SLAM_LINE = 0xffb066;
const TOXIC_FILL = 0x63852c;
const TOXIC_LINE = 0xb8dc56;
const FAULT_FILL = 0x8a4d2a;
const FAULT_LINE = 0xffc06a;
const TRENCH_SWEEP_FILL = 0x245f86;
const TRENCH_SWEEP_LINE = 0x72d8e8;
const TRENCH_MINE_FILL = 0x5d3c86;
const TRENCH_MINE_LINE = 0xe0a8ff;
// ONE hue, three weights. The aiming and committed states are told apart by line
// weight and by the presence of the sweep — never by colour alone, which no
// colour-blind player could rely on and which reads as decoration rather than
// information.
const CHARGE_FILL = 0xa8481f;
const CHARGE_LINE = 0xffa04d;
const CHARGE_LOCKED_LINE = 0xffd9a0;

export interface GroundZoneSprite {
  graphic: Phaser.GameObjects.Graphics;
  /** Textured pool decal; telegraphs continue using `graphic` only. */
  image?: Phaser.GameObjects.Image;
  kind: GroundZoneKind;
  /** Client timestamp the current `remainingMs` was received at. */
  syncedAtMs: number;
  remainingMs: number;
  durationMs: number;
  radius: number;
  x: number;
  y: number;
  fx?: string;
  /** Authoritative shape — drawn verbatim, never re-derived from x/y/radius. */
  geometry: GroundZoneGeometry;
  /** Ms until a charge lane stops tracking; undefined for every other kind. */
  lockedInMs?: number;
  /** `charge-corridor` only: the monster this lane belongs to. */
  ownerId?: string;
  /** Owner position last frame, for detecting travel and spacing the dust. */
  lastOwnerPos?: { x: number; y: number };
  /** Distance the owner has travelled since the last dust puff. */
  dustAccum?: number;
  /** Set once the impact puff has fired, so it cannot repeat. */
  impacted?: boolean;
}

export function syncGroundZones(
  scene: GameScene,
  zones: GroundZoneView[] | undefined,
): void {
  const list = zones ?? [];
  const live = new Set(list.map((zone) => zone.id));

  for (const [id, sprite] of scene.groundZones) {
    if (live.has(id)) continue;
    sprite.graphic.destroy();
    sprite.image?.destroy();
    scene.groundZones.delete(id);
  }

  const now = performance.now();
  for (const zone of list) {
    let sprite = scene.groundZones.get(zone.id);
    if (!sprite) {
      sprite = {
        graphic: scene.add.graphics().setDepth(DEPTH.BG_DECOR + 0.3),
        image:
          zone.kind === "toxic-pool" &&
          scene.textures.exists(HAZARD_POOL_ART.poison.key)
            ? scene.add
                .image(zone.x, zone.y, HAZARD_POOL_ART.poison.key)
                .setDepth(DEPTH.BG_DECOR + 0.3)
                .setDisplaySize(zone.radius * 2.1, zone.radius * 2.1)
            : undefined,
        kind: zone.kind,
        syncedAtMs: now,
        remainingMs: zone.remainingMs,
        durationMs: zone.durationMs,
        radius: zone.radius,
        x: zone.x,
        y: zone.y,
        fx: zone.fx,
        geometry: zone.geometry,
        lockedInMs: zone.lockedInMs,
        ownerId: zone.ownerId,
        dustAccum: 0,
      };
      scene.groundZones.set(zone.id, sprite);
    }
    // Re-anchor to the authoritative remainder on every packet.
    sprite.syncedAtMs = now;
    sprite.kind = zone.kind;
    sprite.remainingMs = zone.remainingMs;
    sprite.durationMs = zone.durationMs;
    sprite.radius = zone.radius;
    sprite.x = zone.x;
    sprite.y = zone.y;
    sprite.fx = zone.fx;
    sprite.geometry = zone.geometry;
    sprite.lockedInMs = zone.lockedInMs;
    sprite.ownerId = zone.ownerId;
    sprite.image
      ?.setPosition(zone.x, zone.y)
      .setDisplaySize(zone.radius * 2.1, zone.radius * 2.1);
  }
}

/** Per-frame redraw so the wind-up animates between the 5 Hz packets. */
export function drawGroundZones(scene: GameScene): void {
  if (scene.groundZones.size === 0) return;
  const now = performance.now();
  for (const sprite of scene.groundZones.values()) {
    const elapsed = now - sprite.syncedAtMs;
    const remaining = Math.max(0, sprite.remainingMs - elapsed);
    const progress = Math.min(1, Math.max(0, 1 - remaining / sprite.durationMs));
    if (sprite.kind === "charge-corridor" && sprite.geometry.kind === "corridor") {
      // Advance the lock locally between the 5 Hz packets, same trick the fill uses.
      const locked = Math.max(0, (sprite.lockedInMs ?? 0) - elapsed) <= 0;
      drawChargeLane(sprite, sprite.geometry, progress, locked);
      animateChargeOwner(scene, sprite, locked);
      // The lane is retired the moment the travel ends, so its last frame is where
      // the body actually stopped — which is exactly when the impact should land.
      if (progress >= 1) chargeImpact(scene, sprite);
      continue;
    }
    drawZone(sprite, progress);
  }
}

/**
 * A committed charge lane: a capsule the player has to get OFF, not out of.
 *
 * DELIBERATELY MINIMAL — three elements, never more:
 *
 *   1. a low-alpha footprint, so "where" is answered the instant it appears;
 *   2. two rails, thin while the lane still tracks you and crisp once it commits;
 *   3. a single sweep line that runs the lane, and ONLY after the lock.
 *
 * The sweep is the whole timing cue. One travelling line says direction and time
 * together, which a growing bar from the origin does not: it literally shows the
 * thing coming. It appears only in the committed state, so its arrival IS the
 * "it has stopped tracking you" signal — no second cue needed, and nothing to read
 * while the lane is still swinging.
 *
 * What was removed to get here: a stroked end-cap circle, a separate white impact
 * flash, and a filled core bar. Each was legible on its own and together they made
 * four things pulsing at different rates over the same 78px of ground.
 */
function drawChargeLane(
  sprite: GroundZoneSprite,
  geometry: Extract<GroundZoneGeometry, { kind: "corridor" }>,
  progress: number,
  locked: boolean,
): void {
  const { graphic } = sprite;
  const { start, end, halfWidth } = geometry;
  graphic.clear();

  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy);
  if (length < 1) return;
  const ux = dx / length;
  const uy = dy / length;
  // Rail offset: perpendicular, at the real half-width, so the outline is the
  // hitbox rather than an approximation of it.
  const nx = -uy * halfWidth;
  const ny = ux * halfWidth;

  // 1. FOOTPRINT. The capsule the server tests against — rectangle plus the two
  // rounded caps, which is exactly the shape `geometryContains` uses.
  graphic.fillStyle(CHARGE_FILL, locked ? 0.2 : 0.1);
  graphic.beginPath();
  graphic.moveTo(start.x + nx, start.y + ny);
  graphic.lineTo(end.x + nx, end.y + ny);
  graphic.lineTo(end.x - nx, end.y - ny);
  graphic.lineTo(start.x - nx, start.y - ny);
  graphic.closePath();
  graphic.fillPath();
  graphic.fillCircle(start.x, start.y, halfWidth);
  graphic.fillCircle(end.x, end.y, halfWidth);

  // 2. RAILS. Thin and dim while aiming; crisp once committed.
  graphic.lineStyle(locked ? 2.5 : 1.5, locked ? CHARGE_LOCKED_LINE : CHARGE_LINE, locked ? 0.95 : 0.45);
  graphic.beginPath();
  graphic.moveTo(start.x + nx, start.y + ny);
  graphic.lineTo(end.x + nx, end.y + ny);
  graphic.strokePath();
  graphic.beginPath();
  graphic.moveTo(start.x - nx, start.y - ny);
  graphic.lineTo(end.x - nx, end.y - ny);
  graphic.strokePath();

  // 3. SWEEP. Committed only. One line running the lane, reaching the far end
  // exactly on impact.
  if (!locked) return;
  const reach = length * progress;
  const sx = start.x + ux * reach;
  const sy = start.y + uy * reach;
  graphic.lineStyle(3, CHARGE_LOCKED_LINE, 0.9);
  graphic.beginPath();
  graphic.moveTo(sx + nx, sy + ny);
  graphic.lineTo(sx - nx, sy - ny);
  graphic.strokePath();
}

/** Dust kicked up per this many px of travel. Spaced, not continuous. */
const CHARGE_DUST_INTERVAL_PX = 55;
const CHARGE_DUST_COLOR = 0xc9b79a;

/**
 * The charge, as motion rather than a light show.
 *
 * A heavy thing running at 470 px/s should disturb the ground it crosses and land
 * hard when it stops — that is the whole animation. Dust is emitted PER DISTANCE
 * TRAVELLED rather than per frame, so it stays even at any framerate and stops on
 * its own the instant the boss does, without the client needing to be told the
 * charge ended.
 *
 * Everything here is cosmetic and runs through the pooled emitter, so it is dropped
 * wholesale under load by `shouldRunClientFx`.
 */
function animateChargeOwner(scene: GameScene, sprite: GroundZoneSprite, locked: boolean): void {
  if (!sprite.ownerId) return;
  const owner = scene.state.sprite.get(sprite.ownerId);
  if (!owner) return;

  const previous = sprite.lastOwnerPos;
  sprite.lastOwnerPos = { x: owner.x, y: owner.y };
  if (!previous || !locked) return;

  const moved = Math.hypot(owner.x - previous.x, owner.y - previous.y);
  // A charging boss covers ~8px per frame at 60fps. Anything below a pixel is the
  // interpolator settling, not travel, and must not trail dust behind a stopped body.
  if (moved < 1) return;

  sprite.dustAccum = (sprite.dustAccum ?? 0) + moved;
  while (sprite.dustAccum >= CHARGE_DUST_INTERVAL_PX) {
    sprite.dustAccum -= CHARGE_DUST_INTERVAL_PX;
    // Behind and beneath: dust belongs where the feet were, not where the head is.
    burstFx(scene, "ptx-dot", previous.x, previous.y + 10, 3, 420, {
      speed: { min: 12, max: 34 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.5, end: 0 },
      tint: CHARGE_DUST_COLOR,
      angle: { min: 0, max: 360 },
    });
  }
}

/** One heavier puff where the charge stops. Fires once per lane. */
function chargeImpact(scene: GameScene, sprite: GroundZoneSprite): void {
  if (sprite.impacted || !sprite.ownerId) return;
  const owner = scene.state.sprite.get(sprite.ownerId);
  if (!owner) return;
  sprite.impacted = true;
  burstFx(scene, "ptx-dot", owner.x, owner.y + 10, 10, 520, {
    speed: { min: 30, max: 90 },
    scale: { start: 0.75, end: 0 },
    alpha: { start: 0.6, end: 0 },
    tint: CHARGE_DUST_COLOR,
    angle: { min: 0, max: 360 },
  });
}

function drawZone(sprite: GroundZoneSprite, progress: number): void {
  const { graphic, x, y, radius } = sprite;
  graphic.clear();

  if (sprite.kind === 'fault-line-telegraph') {
    // Each view is one linked segment in a radial crack. The dark footprint is
    // visible immediately; the hot core fills toward impact across the chain.
    graphic.fillStyle(FAULT_FILL, 0.25);
    graphic.fillCircle(x, y, radius);
    graphic.lineStyle(2, FAULT_LINE, 0.9);
    graphic.strokeCircle(x, y, radius);
    graphic.fillStyle(FAULT_LINE, 0.48);
    graphic.fillCircle(x, y, radius * progress);
    if (progress > 0.86) {
      graphic.lineStyle(2, 0xffffff, (progress - 0.86) / 0.14);
      graphic.strokeCircle(x, y, radius);
    }
    return;
  }

  if (sprite.kind === 'toxic-pool') {
    const remainingAlpha = Math.min(1, Math.max(0, (1 - progress) * 4));
    if (sprite.image) {
      const pulse = 0.94 + Math.sin(performance.now() / 260) * 0.06;
      sprite.image.setAlpha(remainingAlpha * pulse);
      return;
    }

    // Texture loading failure fallback: keep the hazard readable.
    graphic.fillStyle(TOXIC_FILL, 0.3 * remainingAlpha);
    graphic.fillCircle(x, y, radius);
    graphic.lineStyle(3, TOXIC_LINE, 0.8 * remainingAlpha);
    graphic.strokeCircle(x, y, radius);
    graphic.lineStyle(2, TOXIC_LINE, 0.25 * remainingAlpha);
    graphic.strokeCircle(x, y, radius * 0.68);
    return;
  }

  const trenchSweep = sprite.fx === 'trench-tail-sweep' || sprite.fx === 'trench-body-sweep';
  const trenchMine = sprite.fx === 'trench-silt-mine';
  const fill = trenchSweep ? TRENCH_SWEEP_FILL : trenchMine ? TRENCH_MINE_FILL : SLAM_FILL;
  const line = trenchSweep ? TRENCH_SWEEP_LINE : trenchMine ? TRENCH_MINE_LINE : SLAM_LINE;

  // Outer rim: the committed footprint. Solid from the first frame so the player
  // can read where NOT to stand before the fill tells them how long they have.
  graphic.fillStyle(fill, 0.18);
  graphic.fillCircle(x, y, radius);
  graphic.lineStyle(4, line, 0.9);
  graphic.strokeCircle(x, y, radius);

  // Inner fill: the countdown. Reaches the rim exactly on impact.
  graphic.fillStyle(fill, 0.4);
  graphic.fillCircle(x, y, radius * progress);

  // Impact flash — the last sliver of the wind-up.
  if (progress > 0.88) {
    graphic.lineStyle(3, 0xffffff, (progress - 0.88) / 0.12);
    graphic.strokeCircle(x, y, radius);
  }
}
