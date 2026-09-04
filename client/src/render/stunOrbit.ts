import type { GameScene } from "../scenes/GameScene";
import { DEPTH } from "./depth";

/**
 * STUN TELL — orbiting motes above the head.
 *
 * The genre's standard shorthand for "this thing cannot act right now", and worth
 * having as its own layer rather than another status tile: the target frame only
 * shows what you have selected, while this has to be readable on any body in the
 * room at a glance — including the boss you just knocked out of its charge, which is
 * the whole point of the window.
 *
 * Deliberately drawn rather than authored as art. Three motes on a tilted ellipse,
 * each a phase apart, dimming as they pass behind the head — that reads as orbit
 * from any angle, needs no atlas slot, and tints per entity kind without a second
 * asset. Depth sits above sprites but below the HUD so it never fights the cast bar.
 */

/** Cool blue for monsters — the "spent / helpless" read. */
const MONSTER_TINT = 0x7fc8ff;
/** Warmer for the player, so your own incapacitation is never mistaken for theirs. */
const PLAYER_TINT = 0xffd76a;

const MOTE_COUNT = 3;
const ORBIT_RX = 17;
const ORBIT_RY = 6;
const MOTE_RADIUS = 3;
/** Height above the sprite's own top edge. */
const ORBIT_LIFT = 12;
/** One full revolution, ms. Slow enough to read, fast enough to feel active. */
const ORBIT_PERIOD_MS = 1_400;

export interface StunOrbitSprite {
  graphic: Phaser.GameObjects.Graphics;
  tint: number;
}

/**
 * Reconcile one orbit per hard-controlled entity.
 *
 * `ids` is rebuilt every frame from live view state rather than driven by events:
 * an entity that dies, leaves the node, or simply stops being stunned must lose its
 * orbit immediately, and a missed "it ended" event would otherwise leave a mote ring
 * spinning over an empty patch of ground.
 */
export function syncStunOrbits(
  scene: GameScene,
  entries: ReadonlyMap<string, { player: boolean }>,
): void {
  for (const [id, orbit] of scene.stunOrbits) {
    if (entries.has(id)) continue;
    orbit.graphic.destroy();
    scene.stunOrbits.delete(id);
  }

  for (const [id, { player }] of entries) {
    if (scene.stunOrbits.has(id)) continue;
    scene.stunOrbits.set(id, {
      graphic: scene.add.graphics(),
      tint: player ? PLAYER_TINT : MONSTER_TINT,
    });
  }
}

/** Advance and redraw every orbit. Position tracks the live sprite each frame. */
export function drawStunOrbits(scene: GameScene): void {
  if (scene.stunOrbits.size === 0) return;
  const now = performance.now();
  const phase = ((now % ORBIT_PERIOD_MS) / ORBIT_PERIOD_MS) * Math.PI * 2;

  for (const [id, orbit] of scene.stunOrbits) {
    const sprite = scene.state.sprite.get(id);
    const graphic = orbit.graphic;
    graphic.clear();
    // Keep the state but draw nothing while the body is off-screen or unrendered —
    // the entity may still be stunned, it is simply not visible.
    if (!sprite) continue;

    const meta = scene.state.spriteMeta.get(id);
    const cx = sprite.x;
    const cy = sprite.y - (meta?.barOffsetY ?? 40) - ORBIT_LIFT;
    graphic.setDepth(DEPTH.UI + sprite.y);

    for (let i = 0; i < MOTE_COUNT; i++) {
      const angle = phase + (i / MOTE_COUNT) * Math.PI * 2;
      const x = cx + Math.cos(angle) * ORBIT_RX;
      const y = cy + Math.sin(angle) * ORBIT_RY;
      // Motes on the far side of the arc read as behind the head: dimmer and
      // slightly smaller. That depth cue is what makes three dots read as an orbit
      // rather than as three blinking dots.
      const behind = Math.sin(angle) < 0;
      const alpha = behind ? 0.35 : 0.95;
      const radius = behind ? MOTE_RADIUS * 0.7 : MOTE_RADIUS;
      graphic.fillStyle(orbit.tint, alpha);
      graphic.fillCircle(x, y, radius);
    }
  }
}
