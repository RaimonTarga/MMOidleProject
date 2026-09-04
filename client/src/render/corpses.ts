import type { CorpseView } from "@mmo-idle/shared";
import type { GameScene } from "../scenes/GameScene";
import { ATLAS_KEY, getMonsterFrame } from "../sprites";
import { tryMakeImage } from "./sprites";
import { nodeToScene, sceneDepthY } from "./sceneCoords";
import { DEPTH } from "./depth";

/**
 * CORPSES — the dead, drawn from the sprite of whatever died there.
 *
 * PROCEDURAL BY DESIGN, not by budget. A corpse has to be identifiable as the
 * specific monster it came from, because the Wasteland boss raises those bodies
 * back as those monsters — "which of these is about to get up" is a real question
 * the player has to answer. Bespoke corpse art would mean one asset per monster
 * type (~90 of them, plus a permanent tax on every monster added later), and a
 * single generic corpse sprite would throw that identity away entirely.
 *
 * Reusing the monster's own frame, laid flat and drained of colour, keeps the
 * identity for free and stays correct for monsters that do not exist yet.
 *
 * The RESERVED state is the other half. While a raiser is casting, the bodies it
 * has claimed are marked and tethered to it, so the answer is on the floor before
 * the cast lands rather than after. Both cues are drawn here rather than baked into
 * an asset so they can pulse with the cast.
 */

const CORPSE_TINT = 0x5a5a66;
const RESERVED_TINT = 0x9a7fbf;
const RESERVED_RING = 0xc9a6ff;
const TETHER = 0xb489ff;

/** Corpses lie flat and read as debris, so they are drawn small and squashed. */
const CORPSE_W = 46;
const CORPSE_H = 30;

/** Below this remaining lifetime the corpse fades out rather than popping. */
const FADE_MS = 2_500;

export interface CorpseSprite {
  image?: Phaser.GameObjects.Image;
  /** Fallback lozenge when the monster has no sprite in the atlas. */
  shape?: Phaser.GameObjects.Ellipse;
  /** Reservation glow and tether. Cleared and redrawn each frame while claimed. */
  marker: Phaser.GameObjects.Graphics;
  x: number;
  y: number;
  remainingMs: number;
  syncedAtMs: number;
  reservedBy?: string;
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
      const frame = getMonsterFrame(corpse.monsterTypeId);
      const image = tryMakeImage(scene, scenePos, frame, CORPSE_W, CORPSE_H, ATLAS_KEY);
      if (image) {
        // Laid flat and drained: the silhouette still names the monster, but nothing
        // about it reads as alive.
        image.setTint(CORPSE_TINT).setAngle(90).setAlpha(0.85);
      }
      sprite = {
        image: image ?? undefined,
        shape: image
          ? undefined
          : scene.add.ellipse(scenePos.x, scenePos.y, CORPSE_W, CORPSE_H, CORPSE_TINT, 0.7),
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
    sprite.image?.setAlpha(alpha).setTint(reserved ? RESERVED_TINT : CORPSE_TINT);
    sprite.shape?.setAlpha(alpha * 0.8).setFillStyle(reserved ? RESERVED_TINT : CORPSE_TINT);

    sprite.marker.clear();
    if (!reserved) continue;

    // CLAIMED. A pulsing ring says "this one is getting up", and the tether says
    // which raiser is doing it — the two questions the player needs answered while
    // the cast is still running.
    const pulse = 0.55 + Math.sin(now / 220) * 0.25;
    sprite.marker.fillStyle(RESERVED_RING, 0.18 * pulse * fade);
    sprite.marker.fillEllipse(sprite.x, sprite.y, CORPSE_W * 1.9, CORPSE_H * 1.9);
    sprite.marker.lineStyle(2, RESERVED_RING, 0.9 * pulse * fade);
    sprite.marker.strokeEllipse(sprite.x, sprite.y, CORPSE_W * 1.9, CORPSE_H * 1.9);

    const raiser = scene.state.sprite.get(sprite.reservedBy!);
    if (!raiser) continue;
    sprite.marker.lineStyle(2, TETHER, 0.5 * pulse * fade);
    sprite.marker.beginPath();
    sprite.marker.moveTo(raiser.x, raiser.y);
    sprite.marker.lineTo(sprite.x, sprite.y);
    sprite.marker.strokePath();
  }
}
