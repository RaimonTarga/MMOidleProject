import type Phaser from "phaser";
import type { PlayerView } from "@mmo-idle/shared";
import type { RenderState } from "./state";
import type { GameScene } from "../scenes/GameScene";
import { DEPTH } from "./depth";
import {
  ATLAS_KEY,
  BIOME_TEXTURES,
  getMonsterFrame,
  getPlayerFrame,
  THOUGHT_BUBBLE_KEY,
} from "../sprites";

// Displayed bubble size. The native art is 1448×1086 (≈4:3); keep that aspect.
const BUBBLE_W = 88;
const BUBBLE_H = Math.round(BUBBLE_W * (1086 / 1448)); // ≈ 66

// Interior content region measured from thought_mask.png (the black silhouette):
// center fraction and width/height fraction of the full frame. The icon is
// placed at the interior center and force-scaled to fit this box.
const MASK_CENTER_X = 0.498;
const MASK_CENTER_Y = 0.48;
const MASK_W_FRAC = 0.709;
const MASK_H_FRAC = 0.501;

const ICON_OFFSET_X = (MASK_CENTER_X - 0.5) * BUBBLE_W;
const ICON_OFFSET_Y = (MASK_CENTER_Y - 0.5) * BUBBLE_H;
// The interior box every icon must fit inside (the "bubble mask").
const INTERIOR_W = BUBBLE_W * MASK_W_FRAC;
const INTERIOR_H = BUBBLE_H * MASK_H_FRAC;

/** Vertical gap between the bubble's bottom (tail) and the name label. */
const BUBBLE_GAP = 4;
const MAX_FOLLOW_DEPTH = 3;

type ThoughtBubble = NonNullable<
  ReturnType<RenderState["thoughtBubble"]["get"]>
>;

type ContentSpec =
  | { type: "image"; textureKey: string; frame?: string }
  | { type: "text"; text: string; color: string };

function signatureFor(spec: ContentSpec): string {
  return spec.type === "image"
    ? `i:${spec.textureKey}:${spec.frame ?? ""}`
    : `t:${spec.text}:${spec.color}`;
}

/**
 * Resolve what (if anything) belongs in a player's thought bubble. Followers
 * mirror their leader's resolved content (recursively, with a depth guard).
 */
function resolveContent(
  state: RenderState,
  player: PlayerView,
  depth = 0,
): ContentSpec | null {
  // Trust the server's intent: it is present exactly when the player is
  // performing an auto action (auto-combat targeting/follow/flee, or
  // server-driven map navigation even with auto-combat off).
  const intent = player.autoIntent;
  if (player.isDead || !intent) return null;

  switch (intent.kind) {
    case "idle":
      return null;
    case "flee":
      return { type: "text", text: "!", color: "#ff5555" };
    case "attack": {
      const frame = intent.targetMonsterTypeId
        ? getMonsterFrame(intent.targetMonsterTypeId)
        : null;
      return frame ? { type: "image", textureKey: ATLAS_KEY, frame } : null;
    }
    case "travel": {
      const key = intent.destBiomeGroup
        ? BIOME_TEXTURES[intent.destBiomeGroup]
        : undefined;
      return key ? { type: "image", textureKey: key } : null;
    }
    case "follow": {
      if (depth >= MAX_FOLLOW_DEPTH || !intent.leaderId) return null;
      if (state.kind.get(intent.leaderId) !== "player") return null;
      const leader = state.view.get(intent.leaderId) as PlayerView | undefined;
      if (!leader) return null;
      const inherited = resolveContent(state, leader, depth + 1);
      if (inherited) return inherited;
      // Leader idle/unresolvable: show their class sprite to telegraph "following them".
      const pf = getPlayerFrame(leader);
      return pf ? { type: "image", textureKey: ATLAS_KEY, frame: pf } : null;
    }
    default:
      return null;
  }
}

/**
 * Build the icon for a content spec, force-scaled (contain-fit) to the interior
 * box so it is always fully inside the bubble regardless of its source size.
 * Returned at local origin (0,0) for parenting into the bubble container.
 */
function buildIcon(
  scene: GameScene,
  spec: ContentSpec,
): Phaser.GameObjects.Image | Phaser.GameObjects.Text | null {
  if (spec.type === "text") {
    const text = scene.add
      .text(0, 0, spec.text, {
        color: spec.color,
        fontSize: `${Math.round(INTERIOR_H)}px`,
        fontFamily: "monospace",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5, 0.5);
    fitToInterior(text);
    return text;
  }
  if (!scene.textures.exists(spec.textureKey)) return null;
  if (spec.frame && !scene.textures.get(spec.textureKey).has(spec.frame)) {
    return null;
  }
  const img = spec.frame
    ? scene.add.image(0, 0, spec.textureKey, spec.frame)
    : scene.add.image(0, 0, spec.textureKey);
  fitToInterior(img);
  return img;
}

/**
 * Force the object to fit inside the interior box, preserving aspect ratio and
 * never upscaling past the box. `width`/`height` are the object's native
 * (unscaled) dimensions, so this works for any source icon size.
 */
function fitToInterior(
  obj: Phaser.GameObjects.Image | Phaser.GameObjects.Text,
): void {
  const w = obj.width || 1;
  const h = obj.height || 1;
  const scale = Math.min(INTERIOR_W / w, INTERIOR_H / h);
  obj.setScale(scale);
}

function createBubble(scene: GameScene): ThoughtBubble {
  const bg = scene.add
    .image(0, 0, THOUGHT_BUBBLE_KEY)
    .setDisplaySize(BUBBLE_W, BUBBLE_H);
  // bg + icon live in one container so they move as a single unit each frame —
  // no sub-pixel drift between the bubble and its icon while the player moves.
  const container = scene.add.container(0, 0, [bg]).setVisible(false);
  return { container, icon: null, signature: null, visible: false };
}

export function upsertThoughtBubble(
  state: RenderState,
  player: PlayerView,
  scene: GameScene,
): void {
  const spec = resolveContent(state, player);
  let bubble = state.thoughtBubble.get(player.id);

  if (!spec) {
    if (bubble && bubble.visible) {
      bubble.visible = false;
      bubble.container.setVisible(false);
    }
    return;
  }

  if (!bubble) {
    bubble = createBubble(scene);
    state.thoughtBubble.set(player.id, bubble);
  }

  bubble.visible = true;
  bubble.container.setVisible(true);

  const sig = signatureFor(spec);
  if (bubble.signature !== sig) {
    bubble.icon?.destroy();
    const icon = buildIcon(scene, spec);
    if (icon) {
      icon.setPosition(ICON_OFFSET_X, ICON_OFFSET_Y);
      bubble.container.add(icon);
    }
    bubble.icon = icon;
    bubble.signature = sig;
  }
}

export function drawThoughtBubbles(state: RenderState): void {
  for (const [id, bubble] of state.thoughtBubble) {
    if (!bubble.visible) continue;
    const sprite = state.sprite.get(id);
    const meta = state.spriteMeta.get(id);
    if (!sprite || !meta) continue;

    const barY = sprite.y - meta.barOffsetY;
    const cx = sprite.x;
    const cy = barY - 12 - BUBBLE_GAP - BUBBLE_H / 2;
    bubble.container.setPosition(cx, cy).setDepth(DEPTH.UI + sprite.y + 2);
  }
}

export function destroyThoughtBubble(state: RenderState, id: string): void {
  const bubble = state.thoughtBubble.get(id);
  if (!bubble) return;
  bubble.container.destroy(true);
  state.thoughtBubble.delete(id);
}
