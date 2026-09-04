import type { GroundZoneGeometry, GroundZoneKind, GroundZoneView } from "@mmo-idle/shared";
import type { GameScene } from "../scenes/GameScene";
import { HAZARD_POOL_ART } from "../sprites";
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
const CHARGE_FILL = 0xa8481f;
const CHARGE_LINE = 0xffa04d;
/** Committed lanes go white-hot at the lock so the two states never look alike. */
const CHARGE_LOCKED_LINE = 0xfff0d0;

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
      continue;
    }
    drawZone(sprite, progress);
  }
}

/**
 * A committed charge lane: a capsule the player has to get OFF, not out of.
 *
 * Two visibly distinct states, because the encounter turns on the difference. While
 * aiming, the lane is dim with a dashed-feeling thin rim and it swings to follow
 * you. On lock it snaps to a hot solid rim and a full-length core bar starts filling
 * toward the far end — the cue that it has stopped tracking and moving sideways now
 * works. Colour alone never carries it: rim weight and the core bar do too.
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
  const angle = Math.atan2(dy, dx);
  const nx = (-dy / length) * halfWidth;
  const ny = (dx / length) * halfWidth;

  const line = locked ? CHARGE_LOCKED_LINE : CHARGE_LINE;

  // Footprint: the rectangle plus a rounded cap at each end, which together are
  // exactly the capsule the server tests containment against.
  graphic.fillStyle(CHARGE_FILL, locked ? 0.26 : 0.15);
  graphic.beginPath();
  graphic.moveTo(start.x + nx, start.y + ny);
  graphic.lineTo(end.x + nx, end.y + ny);
  graphic.lineTo(end.x - nx, end.y - ny);
  graphic.lineTo(start.x - nx, start.y - ny);
  graphic.closePath();
  graphic.fillPath();
  graphic.fillCircle(start.x, start.y, halfWidth);
  graphic.fillCircle(end.x, end.y, halfWidth);

  graphic.lineStyle(locked ? 4 : 2, line, locked ? 0.95 : 0.55);
  graphic.beginPath();
  graphic.moveTo(start.x + nx, start.y + ny);
  graphic.lineTo(end.x + nx, end.y + ny);
  graphic.strokePath();
  graphic.beginPath();
  graphic.moveTo(start.x - nx, start.y - ny);
  graphic.lineTo(end.x - nx, end.y - ny);
  graphic.strokePath();
  graphic.strokeCircle(end.x, end.y, halfWidth);

  // Core bar: the countdown, only once committed. It races the length of the lane
  // and reaches the far cap exactly on impact.
  if (locked) {
    const reach = length * progress;
    graphic.lineStyle(Math.max(3, halfWidth * 0.35), line, 0.6);
    graphic.beginPath();
    graphic.moveTo(start.x, start.y);
    graphic.lineTo(start.x + Math.cos(angle) * reach, start.y + Math.sin(angle) * reach);
    graphic.strokePath();
  }

  if (progress > 0.88) {
    graphic.lineStyle(3, 0xffffff, (progress - 0.88) / 0.12);
    graphic.strokeCircle(end.x, end.y, halfWidth);
  }
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
