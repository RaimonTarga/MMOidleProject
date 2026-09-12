import Phaser from "phaser";
import type {
  PlayerView,
  MonsterView,
  MinionView,
  Vec2,
} from "@mmo-idle/shared";
import {
  ATLAS_KEY,
  tombTextureKey,
  GRAVE_DISPLAY_W,
  GRAVE_DISPLAY_H,
  getPlayerFrame,
  getMonsterFrame,
} from "../sprites";
import type { RenderState } from "./state";
import type { GameScene } from "../scenes/GameScene";
import { DEPTH } from "./depth";
import { nodeToScene, sceneDepthY } from "./sceneCoords";

type SpriteSnapshot = PlayerView | MonsterView | MinionView;

function getMonsterTypeIdFromSnapshot(snapshot: SpriteSnapshot): string {
  if ("monsterTypeId" in snapshot) return snapshot.monsterTypeId;
  return "";
}

/**
 * Whether the packed atlas actually carries a frame.
 *
 * Callers use this to decide between two presentations BEFORE building a sprite:
 * `tryMakeImage` falls back to a flat coloured rectangle for a missing frame,
 * which is a fine last resort for a body that should exist but a terrible one for
 * an optional variant that simply has not been drawn yet.
 */
export function atlasHasFrame(scene: Phaser.Scene, frame: string): boolean {
  if (!scene.textures.exists(ATLAS_KEY)) return false;
  return scene.textures.get(ATLAS_KEY).has(frame);
}

export function tryMakeImage(
  scene: Phaser.Scene,
  pos: Vec2,
  frame: string | null,
  displayW: number,
  displayH: number,
  textureKey: string = ATLAS_KEY,
): Phaser.GameObjects.Image | null {
  if (!frame) return null;
  if (!scene.textures.exists(textureKey)) return null;
  if (!scene.textures.get(textureKey).has(frame)) return null;
  return scene.add
    .image(pos.x, pos.y, textureKey, frame)
    .setDisplaySize(displayW, displayH);
}

/**
 * Grave/tomb image for a `graveFrame` index. Each tomb variant is its own texture
 * (one loose PNG per design) rather than a frame inside a sheet, so the whole
 * sprite is the image and there is no frame name to look up.
 */
export function tryMakeGraveImage(
  scene: Phaser.Scene,
  pos: Vec2,
  frameIndex: number,
): Phaser.GameObjects.Image | null {
  const key = tombTextureKey(frameIndex);
  if (!scene.textures.exists(key)) return null;
  return scene.add
    .image(pos.x, pos.y, key)
    .setDisplaySize(GRAVE_DISPLAY_W, GRAVE_DISPLAY_H);
}

export function ensureSprite(
  state: RenderState,
  id: string,
  snapshot: SpriteSnapshot,
  scene: GameScene,
  opts: {
    displayW: number;
    displayH: number;
    fallbackColor: number;
    isPlayer: boolean;
  },
): void {
  if (state.sprite.has(id)) return;

  const frame = opts.isPlayer
    ? getPlayerFrame(snapshot as PlayerView)
    : getMonsterFrame(getMonsterTypeIdFromSnapshot(snapshot));

  const scenePos = nodeToScene(snapshot.pos.x, snapshot.pos.y);

  const sprite =
    tryMakeImage(scene, scenePos, frame, opts.displayW, opts.displayH) ??
    scene.add.rectangle(
      scenePos.x,
      scenePos.y,
      opts.displayW,
      opts.displayH,
      opts.fallbackColor,
    );

  sprite.setDepth(DEPTH.SPRITE + sceneDepthY(snapshot.pos.y));
  state.sprite.set(id, sprite);

  const meta = state.spriteMeta.get(id);
  if (meta) {
    meta.currentFrame = frame;
    meta.textureKey = ATLAS_KEY;
  }
}

export function updateSpriteFrame(
  state: RenderState,
  id: string,
  snapshot: SpriteSnapshot,
  scene: GameScene,
  opts: {
    displayW: number;
    displayH: number;
    fallbackColor: number;
    isPlayer: boolean;
    /**
     * Draw this frame instead of the one the snapshot resolves to. For alternate
     * BODIES a monster wears for part of an encounter (the burrowed form), which
     * are a presentation state rather than a change of monster type. Callers are
     * expected to have confirmed the frame exists — see `atlasHasFrame`.
     */
    frameOverride?: string | null;
  },
): void {
  const playerView = opts.isPlayer ? (snapshot as PlayerView) : null;
  const newFrame = playerView?.isDead
    ? String(playerView.graveFrame ?? 0)
    : (opts.frameOverride ??
      (opts.isPlayer
        ? getPlayerFrame(snapshot as PlayerView)
        : getMonsterFrame(getMonsterTypeIdFromSnapshot(snapshot))));

  const textureKey = playerView?.isDead
    ? tombTextureKey(playerView.graveFrame ?? 0)
    : ATLAS_KEY;
  const displayW = playerView?.isDead ? GRAVE_DISPLAY_W : opts.displayW;
  const displayH = playerView?.isDead ? GRAVE_DISPLAY_H : opts.displayH;

  const meta = state.spriteMeta.get(id);
  const existing = state.sprite.get(id);
  if (!meta) return;
  if (existing) existing.setDisplaySize(displayW, displayH);

  const sameFrame =
    newFrame === meta.currentFrame && meta.textureKey === textureKey;
  if (sameFrame) return;

  const interp = state.interpolation.get(id);
  const base = interp?.base ?? snapshot.pos;
  const scenePos = nodeToScene(base.x, base.y);
  const prevDepth = existing?.depth ?? DEPTH.SPRITE + sceneDepthY(base.y);

  existing?.destroy();

  const sprite =
    (playerView?.isDead
      ? tryMakeGraveImage(scene, scenePos, playerView.graveFrame ?? 0)
      : tryMakeImage(scene, scenePos, newFrame, displayW, displayH, textureKey)) ??
    scene.add.rectangle(scenePos.x, scenePos.y, displayW, displayH, opts.fallbackColor);

  sprite.setDepth(prevDepth);
  state.sprite.set(id, sprite);
  meta.currentFrame = newFrame;
  meta.textureKey = textureKey;
}

export function applySpriteTint(
  sprite:
    | Phaser.GameObjects.Image
    | Phaser.GameObjects.Sprite
    | Phaser.GameObjects.Rectangle,
  color: number,
): void {
  if (sprite instanceof Phaser.GameObjects.Rectangle) {
    sprite.setFillStyle(color, 1);
    return;
  }
  sprite.setTint(color);
}

export function resetSpriteTint(
  sprite:
    | Phaser.GameObjects.Image
    | Phaser.GameObjects.Sprite
    | Phaser.GameObjects.Rectangle,
  fallbackColor: number,
): void {
  if (sprite instanceof Phaser.GameObjects.Rectangle) {
    sprite.setFillStyle(fallbackColor, 1);
    return;
  }
  sprite.clearTint();
}

const OUTLINE_DATA_KEY = "spriteOutlineFx";
// Elite / dungeon guardian threat marker. A tight glow distance and a modest
// outer strength read as a crisp rim rather than a bloomed halo — tune these
// two to dial the intensity.
const THREAT_OUTLINE_OUTER_STRENGTH = 1;
const THREAT_OUTLINE_DISTANCE = 3;
const THREAT_OUTLINE_QUALITY = 0.1;

// Player tier rim: the same glow mechanism as the threat outline above, dialed
// far below it so a player's tier always reads quieter than an elite/guardian
// callout (see render/players.ts for where this gets applied). Tune these two
// to dial the intensity independently of the threat outline.
export const TIER_OUTLINE_OUTER_STRENGTH = 0.3;
export const TIER_OUTLINE_DISTANCE = 1.5;

/**
 * Draw a colored outline/glow around a sprite, leaving its own colors intact —
 * used to mark dangerous mobs (elites, dungeon guardians) and, at a much lower
 * strength/distance (pass `opts`), a player's tier. Uses Phaser's per-object
 * preFX glow (WebGL only); falls back to a stroke for the rectangle
 * placeholder. Idempotent: safe to call every frame.
 */
export function applySpriteOutline(
  sprite:
    | Phaser.GameObjects.Image
    | Phaser.GameObjects.Sprite
    | Phaser.GameObjects.Rectangle,
  color: number,
  opts?: { outerStrength?: number; distance?: number; quality?: number },
): void {
  const outerStrength = opts?.outerStrength ?? THREAT_OUTLINE_OUTER_STRENGTH;
  const distance = opts?.distance ?? THREAT_OUTLINE_DISTANCE;
  const quality = opts?.quality ?? THREAT_OUTLINE_QUALITY;

  if (sprite instanceof Phaser.GameObjects.Rectangle) {
    sprite.setStrokeStyle(3, color, Math.min(1, outerStrength));
    return;
  }
  // preFX is WebGL-only; bail cleanly under the Canvas renderer.
  if (!sprite.preFX) return;
  let glow = sprite.getData(OUTLINE_DATA_KEY) as Phaser.FX.Glow | undefined;
  if (!glow) {
    glow = sprite.preFX.addGlow(color, outerStrength, 0, false, quality, distance);
    sprite.setData(OUTLINE_DATA_KEY, glow);
  }
  // `distance`/`quality` are baked into the shader at creation time (not
  // mutable properties on Glow), so only color/outerStrength can be re-synced
  // on an already-created glow.
  glow.color = color;
  glow.outerStrength = outerStrength;
}

export function clearSpriteOutline(
  sprite:
    | Phaser.GameObjects.Image
    | Phaser.GameObjects.Sprite
    | Phaser.GameObjects.Rectangle,
): void {
  if (sprite instanceof Phaser.GameObjects.Rectangle) {
    sprite.setStrokeStyle();
    return;
  }
  const glow = sprite.getData(OUTLINE_DATA_KEY) as Phaser.FX.Glow | undefined;
  if (glow && sprite.preFX) {
    sprite.preFX.remove(glow);
    sprite.setData(OUTLINE_DATA_KEY, undefined);
  }
}

export function destroySprite(state: RenderState, id: string): void {
  state.sprite.get(id)?.destroy();
  state.sprite.delete(id);
}
