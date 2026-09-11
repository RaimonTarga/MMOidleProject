import { tombstoneEpitaph, type TombstoneView } from "@mmo-idle/shared";
import type { GameScene } from "../scenes/GameScene";
import { GRAVE_DISPLAY_H, GRAVE_DISPLAY_W, tombTextureKey } from "../sprites";
import { nodeToScene, sceneDepthY } from "./sceneCoords";
import { DEPTH } from "./depth";

/**
 * TOMBSTONES — where somebody died, still standing fifteen minutes later.
 *
 * The server owns the record and its lifetime; this file only draws it. A tomb is
 * the SAME art the dead player's grave used (`graveFrame`), placed at the same
 * spot, so the moment the owner respawns the tomb takes over without a visible pop.
 *
 * The epitaph is proximity-gated rather than always-on: a busy node with several
 * tombs in it would otherwise be a wall of floating text. It is pure presentation —
 * the name and the killer already rode the delta, so walking up to a tomb costs no
 * network round-trip.
 */

/**
 * Own-player distance (node units) at which a tomb's epitaph fades in. Deliberately
 * in the same band as monster `pullRange` (175-300), so "near enough to read it" is
 * the same distance as "near enough for something to notice you" — about two
 * seconds of walking at PLAYER_SPEED on a 4800-unit node.
 */
const EPITAPH_RANGE = 260;
/** Hysteresis band, so standing exactly on the edge does not strobe the label. */
const EPITAPH_RANGE_OUT = 320;
/** Epitaph fade in/out, milliseconds. */
const EPITAPH_FADE_MS = 180;
/** Below this remaining lifetime the tomb fades out rather than popping. */
const FADE_MS = 8_000;
/** Epitaph sits above the tomb's crown. */
const EPITAPH_OFFSET_Y = GRAVE_DISPLAY_H * 0.55 + 14;

/** Fallback slab for a tomb whose art has not loaded (or been drawn) yet. */
const FALLBACK_TINT = 0x6b6b72;

export interface TombstoneSprite {
  image?: Phaser.GameObjects.Image;
  shape?: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  /** Node-space position, kept for the proximity test against the own player. */
  nodeX: number;
  nodeY: number;
  x: number;
  y: number;
  remainingMs: number;
  syncedAtMs: number;
  /** Latched by the hysteresis band; drives which way the label is fading. */
  epitaphShown: boolean;
}

function createTombVisual(
  scene: GameScene,
  scenePos: { x: number; y: number },
  tomb: TombstoneView,
): Pick<TombstoneSprite, "image" | "shape"> {
  const key = tombTextureKey(tomb.graveFrame);
  if (scene.textures.exists(key)) {
    return {
      image: scene.add
        .image(scenePos.x, scenePos.y, key)
        .setDisplaySize(GRAVE_DISPLAY_W, GRAVE_DISPLAY_H),
    };
  }
  return {
    shape: scene.add.rectangle(
      scenePos.x,
      scenePos.y,
      GRAVE_DISPLAY_W * 0.7,
      GRAVE_DISPLAY_H * 0.8,
      FALLBACK_TINT,
      0.85,
    ),
  };
}

function destroyTomb(sprite: TombstoneSprite): void {
  sprite.image?.destroy();
  sprite.shape?.destroy();
  sprite.label.destroy();
}

export function syncTombstones(
  scene: GameScene,
  tombstones: TombstoneView[] | undefined,
): void {
  const list = tombstones ?? [];
  const live = new Set(list.map((tomb) => tomb.id));

  for (const [id, sprite] of scene.tombstones) {
    if (live.has(id)) continue;
    destroyTomb(sprite);
    scene.tombstones.delete(id);
  }

  const now = performance.now();
  for (const tomb of list) {
    let sprite = scene.tombstones.get(tomb.id);
    if (!sprite) {
      const scenePos = nodeToScene(tomb.x, tomb.y);
      const label = scene.add
        .text(scenePos.x, scenePos.y - EPITAPH_OFFSET_Y, tombstoneEpitaph(tomb), {
          color: "#d8d2c4",
          fontSize: "10px",
          fontFamily: "monospace",
          stroke: "#000000",
          strokeThickness: 3,
          align: "center",
        })
        .setOrigin(0.5, 1)
        .setAlpha(0)
        .setDepth(DEPTH.UI + sceneDepthY(tomb.y));

      sprite = {
        ...createTombVisual(scene, scenePos, tomb),
        label,
        nodeX: tomb.x,
        nodeY: tomb.y,
        x: scenePos.x,
        y: scenePos.y,
        remainingMs: tomb.remainingMs,
        syncedAtMs: now,
        epitaphShown: false,
      };
      // Same band as a standing sprite, y-sorted: a tomb is a thing in the world,
      // not decor on the floor, so a player walking below it must draw in front.
      const depth = DEPTH.SPRITE + sceneDepthY(tomb.y);
      sprite.image?.setDepth(depth);
      sprite.shape?.setDepth(depth);
      scene.tombstones.set(tomb.id, sprite);
    }

    // Re-anchor to the authoritative remainder on every packet, exactly as the
    // corpses do — the client tweens between 5 Hz broadcasts.
    sprite.syncedAtMs = now;
    sprite.remainingMs = tomb.remainingMs;
    sprite.label.setText(tombstoneEpitaph(tomb));
  }
}

/**
 * Per-frame redraw: the crumble fade and the epitaph's proximity fade both animate
 * between the 5 Hz packets, so neither can look like it is stepping.
 */
export function drawTombstones(scene: GameScene): void {
  if (scene.tombstones.size === 0) return;
  const now = performance.now();

  const ownId = scene.state.ownId;
  const ownInterp = ownId ? scene.state.interpolation.get(ownId) : undefined;
  const own = ownInterp?.base ?? null;

  for (const sprite of scene.tombstones.values()) {
    const remaining = Math.max(0, sprite.remainingMs - (now - sprite.syncedAtMs));
    // Fade only at the very end: a tomb that dims for the whole fifteen minutes
    // reads as a rendering bug rather than as something crumbling.
    const fade = Math.min(1, remaining / FADE_MS);
    sprite.image?.setAlpha(fade);
    sprite.shape?.setAlpha(fade * 0.85);

    let near = false;
    if (own) {
      const dx = own.x - sprite.nodeX;
      const dy = own.y - sprite.nodeY;
      const distSq = dx * dx + dy * dy;
      // Hysteresis: enter at EPITAPH_RANGE, leave only past EPITAPH_RANGE_OUT.
      const threshold = sprite.epitaphShown ? EPITAPH_RANGE_OUT : EPITAPH_RANGE;
      near = distSq <= threshold * threshold;
    }
    sprite.epitaphShown = near;

    const targetAlpha = near ? fade : 0;
    const step = 1 / EPITAPH_FADE_MS;
    const current = sprite.label.alpha;
    // Frame-rate independent approach, capped so a long frame cannot overshoot.
    const delta = Math.min(1, (scene.game.loop.delta || 16) * step);
    sprite.label.setAlpha(current + (targetAlpha - current) * delta);
    sprite.label.setVisible(sprite.label.alpha > 0.01);
  }
}
