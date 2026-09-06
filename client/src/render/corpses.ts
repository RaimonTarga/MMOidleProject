import type { CorpseView } from "@mmo-idle/shared";
import type { GameScene } from "../scenes/GameScene";
import { resolveCorpseRemains } from "./corpseRemains";
import { nodeToScene, sceneDepthY } from "./sceneCoords";
import { DEPTH } from "./depth";

/**
 * CORPSES — the dead, drawn from a small set of reusable remains sprites.
 *
 * Each supported monster type maps (via corpseRemains.ts) to a corpse FAMILY
 * and SIZE class; the family owns the art, the monster only points at one.
 * This first pass covers the five active Wasteland/Graveyard monsters —
 * everything else is unmapped and draws the plain fallback lozenge below.
 *
 * The RESERVED state is drawn here as a pulsing ring + tether to the raiser,
 * never baked into the remains art, so it can pulse with the cast and the
 * remains sprite never needs recoloring.
 */

const RESERVED_RING = 0xc9a6ff;
const TETHER = 0xb489ff;

/** Fallback lozenge for monsters without a configured remains presentation. */
const FALLBACK_TINT = 0x5a5a66;
const RESERVED_FALLBACK_TINT = 0x9a7fbf;
const FALLBACK_W = 46;
const FALLBACK_H = 30;

/** Below this remaining lifetime the corpse fades out rather than popping. */
const FADE_MS = 2_500;

export interface CorpseSprite {
  /** Remains sprite for a monster type with a configured presentation. */
  image?: Phaser.GameObjects.Image;
  /** Fallback lozenge when the monster has no configured presentation. */
  shape?: Phaser.GameObjects.Ellipse;
  /** Reservation glow and tether. Cleared and redrawn each frame while claimed. */
  marker: Phaser.GameObjects.Graphics;
  x: number;
  y: number;
  remainingMs: number;
  syncedAtMs: number;
  reservedBy?: string;
}

function createCorpseVisual(
  scene: GameScene,
  scenePos: { x: number; y: number },
  corpse: CorpseView,
): Pick<CorpseSprite, "image" | "shape"> {
  const remains = resolveCorpseRemains(corpse.monsterTypeId, corpse.id);
  if (remains && scene.textures.exists(remains.key)) {
    const image = scene.add
      .image(scenePos.x, scenePos.y, remains.key)
      .setDisplaySize(remains.sizePx, remains.sizePx);
    return { image };
  }

  return {
    shape: scene.add.ellipse(scenePos.x, scenePos.y, FALLBACK_W, FALLBACK_H, FALLBACK_TINT, 0.7),
  };
}

export function syncCorpses(scene: GameScene, corpses: CorpseView[] | undefined): void {
  const list = corpses ?? [];
  const live = new Set(list.map((corpse) => corpse.id));

  for (const [id, sprite] of scene.corpses) {
    if (live.has(id)) continue;
    sprite.image?.destroy();
    sprite.shape?.destroy();
    sprite.marker.destroy();
    scene.corpses.delete(id);
  }

  const now = performance.now();
  for (const corpse of list) {
    let sprite = scene.corpses.get(corpse.id);
    if (!sprite) {
      const scenePos = nodeToScene(corpse.x, corpse.y);
      sprite = {
        ...createCorpseVisual(scene, scenePos, corpse),
        marker: scene.add.graphics(),
        x: scenePos.x,
        y: scenePos.y,
        remainingMs: corpse.remainingMs,
        syncedAtMs: now,
        reservedBy: corpse.reservedBy,
      };
      // Below sprites but above ground decor: a body on the floor must never
      // occlude the living things standing on it.
      const depth = DEPTH.SHADOW + sceneDepthY(corpse.y);
      sprite.image?.setDepth(depth);
      sprite.shape?.setDepth(depth);
      sprite.marker.setDepth(depth + 1);
      scene.corpses.set(corpse.id, sprite);
    }

    // Re-anchor to the authoritative remainder on every packet, exactly as the
    // ground-zone fills do — the client tweens between 5 Hz broadcasts.
    sprite.syncedAtMs = now;
    sprite.remainingMs = corpse.remainingMs;
    sprite.reservedBy = corpse.reservedBy;
  }
}

/**
 * Per-frame redraw: the decay fade and the reservation pulse both animate between
 * the 5 Hz packets, so neither can look like it is stepping.
 */
export function drawCorpses(scene: GameScene): void {
  if (scene.corpses.size === 0) return;
  const now = performance.now();

  for (const sprite of scene.corpses.values()) {
    const remaining = Math.max(0, sprite.remainingMs - (now - sprite.syncedAtMs));
    // Fade only at the very end: a corpse that dims the whole time reads as a
    // rendering bug rather than as something decaying.
    const fade = Math.min(1, remaining / FADE_MS);

    const reserved = sprite.reservedBy !== undefined;
    const alpha = (reserved ? 1 : 0.85) * fade;
    // The remains sprite keeps its authored colors even while reserved — the
    // ring + tether below are the reservation tell. The fallback lozenge has
    // no real art to protect, so it keeps the old tint swap.
    sprite.image?.setAlpha(alpha);
    sprite.shape
      ?.setAlpha(alpha * 0.8)
      .setFillStyle(reserved ? RESERVED_FALLBACK_TINT : FALLBACK_TINT);

    sprite.marker.clear();
    if (!reserved) continue;

    // CLAIMED. A pulsing ring says "this one is getting up", and the tether says
    // which raiser is doing it — the two questions the player needs answered while
    // the cast is still running.
    const pulse = 0.55 + Math.sin(now / 220) * 0.25;
    sprite.marker.fillStyle(RESERVED_RING, 0.18 * pulse * fade);
    sprite.marker.fillEllipse(sprite.x, sprite.y, FALLBACK_W * 1.9, FALLBACK_H * 1.9);
    sprite.marker.lineStyle(2, RESERVED_RING, 0.9 * pulse * fade);
    sprite.marker.strokeEllipse(sprite.x, sprite.y, FALLBACK_W * 1.9, FALLBACK_H * 1.9);

    const raiser = scene.state.sprite.get(sprite.reservedBy!);
    if (!raiser) continue;
    sprite.marker.lineStyle(2, TETHER, 0.5 * pulse * fade);
    sprite.marker.beginPath();
    sprite.marker.moveTo(raiser.x, raiser.y);
    sprite.marker.lineTo(sprite.x, sprite.y);
    sprite.marker.strokePath();
  }
}
