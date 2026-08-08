import type { GroundZoneView } from "@mmo-idle/shared";
import type { GameScene } from "../scenes/GameScene";
import { DEPTH } from "./depth";

/**
 * Telegraphed combat circles (the Cave slam). Lifted from `dungeonHazards.ts` —
 * same "reconcile a keyed map of Graphics against a server list" shape — but the
 * fill here is a WIND-UP: it grows toward the rim as the cast completes, so the
 * ring reads as a countdown rather than a standing pool.
 *
 * `remainingMs` only refreshes at the 5 Hz broadcast, so the progress is advanced
 * locally each frame from the client clock and re-anchored whenever a fresh
 * packet lands. Without that the ring would visibly step four times and finish.
 */

const SLAM_FILL = 0xc25b2a;
const SLAM_LINE = 0xffb066;

export interface GroundZoneSprite {
  graphic: Phaser.GameObjects.Graphics;
  /** Client timestamp the current `remainingMs` was received at. */
  syncedAtMs: number;
  remainingMs: number;
  durationMs: number;
  radius: number;
  x: number;
  y: number;
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
    scene.groundZones.delete(id);
  }

  const now = performance.now();
  for (const zone of list) {
    let sprite = scene.groundZones.get(zone.id);
    if (!sprite) {
      sprite = {
        graphic: scene.add.graphics().setDepth(DEPTH.BG_DECOR + 0.3),
        syncedAtMs: now,
        remainingMs: zone.remainingMs,
        durationMs: zone.durationMs,
        radius: zone.radius,
        x: zone.x,
        y: zone.y,
      };
      scene.groundZones.set(zone.id, sprite);
    }
    // Re-anchor to the authoritative remainder on every packet.
    sprite.syncedAtMs = now;
    sprite.remainingMs = zone.remainingMs;
    sprite.durationMs = zone.durationMs;
    sprite.radius = zone.radius;
    sprite.x = zone.x;
    sprite.y = zone.y;
  }
}

/** Per-frame redraw so the wind-up animates between the 5 Hz packets. */
export function drawGroundZones(scene: GameScene): void {
  if (scene.groundZones.size === 0) return;
  const now = performance.now();
  for (const sprite of scene.groundZones.values()) {
    const remaining = Math.max(0, sprite.remainingMs - (now - sprite.syncedAtMs));
    const progress = Math.min(1, Math.max(0, 1 - remaining / sprite.durationMs));
    drawZone(sprite, progress);
  }
}

function drawZone(sprite: GroundZoneSprite, progress: number): void {
  const { graphic, x, y, radius } = sprite;
  graphic.clear();

  // Outer rim: the committed footprint. Solid from the first frame so the player
  // can read where NOT to stand before the fill tells them how long they have.
  graphic.fillStyle(SLAM_FILL, 0.18);
  graphic.fillCircle(x, y, radius);
  graphic.lineStyle(4, SLAM_LINE, 0.9);
  graphic.strokeCircle(x, y, radius);

  // Inner fill: the countdown. Reaches the rim exactly on impact.
  graphic.fillStyle(SLAM_FILL, 0.4);
  graphic.fillCircle(x, y, radius * progress);

  // Impact flash — the last sliver of the wind-up.
  if (progress > 0.88) {
    graphic.lineStyle(3, 0xffffff, (progress - 0.88) / 0.12);
    graphic.strokeCircle(x, y, radius);
  }
}
