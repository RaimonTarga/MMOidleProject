import Phaser from "phaser";
import { getDefaultStore } from "jotai";
import { dungeonGauntletAtom } from "../hud/atoms";
import { THOUGHT_BUBBLE_KEY } from "../sprites";
import { DEPTH } from "./depth";
import {
  canActivateDungeonAltar,
  DUNGEON_ALTAR_LABEL,
} from "../scenes/game/dungeonAltar";
import { ALTAR_LABEL, isAtRuneAltar } from "../scenes/game/runeAltar";
import type { GameScene } from "../scenes/game/GameScene";

// Larger than the entity thought bubble so a label + key fits. Native art is
// 1448×1086 (≈4:3); keep that aspect so the tail/outline stay correct.
const BUBBLE_W = 196;
const BUBBLE_H = Math.round(BUBBLE_W * (1086 / 1448));

// Interior content box, measured from thought_mask.png (matches thoughtBubbles).
const MASK_CENTER_X = 0.498;
const MASK_CENTER_Y = 0.48;
const MASK_W_FRAC = 0.709;
const MASK_H_FRAC = 0.501;
const INTERIOR_W = BUBBLE_W * MASK_W_FRAC;
const INTERIOR_H = BUBBLE_H * MASK_H_FRAC;
const CONTENT_OFFSET_X = (MASK_CENTER_X - 0.5) * BUBBLE_W;
const CONTENT_OFFSET_Y = (MASK_CENTER_Y - 0.5) * BUBBLE_H;

// Enter-key chip geometry.
const KEY_W = 34;
const KEY_H = 26;
const KEY_RADIUS = 6;
const LABEL_KEY_GAP = 10;

/** Gap between the bubble's bottom tail and the player's name-bar line. */
const BUBBLE_GAP = 24;

export interface AltarPromptHandle {
  container: Phaser.GameObjects.Container;
  label: string;
}

/** A rounded "⏎" key chip, centered at local (0,0). */
function buildEnterKey(scene: GameScene): Phaser.GameObjects.Container {
  const bg = scene.add.graphics();
  bg.fillStyle(0x2a2a40, 1);
  bg.fillRoundedRect(-KEY_W / 2, -KEY_H / 2, KEY_W, KEY_H, KEY_RADIUS);
  bg.lineStyle(2, 0xffffff, 0.9);
  bg.strokeRoundedRect(-KEY_W / 2, -KEY_H / 2, KEY_W, KEY_H, KEY_RADIUS);

  const glyph = scene.add
    .text(0, 0, "\u23CE", {
      color: "#ffffff",
      fontSize: "20px",
      fontFamily: "monospace",
      fontStyle: "bold",
    })
    .setOrigin(0.5);

  return scene.add.container(0, 0, [bg, glyph]);
}

/** Build the "<label> [⏎]" row, contain-fit to the bubble interior. */
function buildContent(
  scene: GameScene,
  labelText: string,
): Phaser.GameObjects.Container {
  const label = scene.add
    .text(0, 0, labelText, {
      color: "#ffffff",
      fontSize: "26px",
      fontFamily: "monospace",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 4,
    })
    .setOrigin(0, 0.5);

  const key = buildEnterKey(scene);

  const total = label.width + LABEL_KEY_GAP + KEY_W;
  label.x = -total / 2;
  key.x = -total / 2 + label.width + LABEL_KEY_GAP + KEY_W / 2;

  const row = scene.add.container(0, 0, [label, key]);
  const rowH = Math.max(label.height, KEY_H);
  const fit = Math.min(INTERIOR_W / total, INTERIOR_H / rowH, 1);
  row.setScale(fit);
  return row;
}

function createPrompt(scene: GameScene, label: string): AltarPromptHandle {
  const bg = scene.add
    .image(0, 0, THOUGHT_BUBBLE_KEY)
    .setDisplaySize(BUBBLE_W, BUBBLE_H);
  const content = buildContent(scene, label).setPosition(
    CONTENT_OFFSET_X,
    CONTENT_OFFSET_Y,
  );
  const container = scene.add.container(0, 0, [bg, content]);
  return { container, label };
}

function activeAltarLabel(scene: GameScene): string | null {
  if (isAtRuneAltar(scene)) return ALTAR_LABEL;

  const gauntlet = getDefaultStore().get(dungeonGauntletAtom);
  return canActivateDungeonAltar(scene, gauntlet)
    ? DUNGEON_ALTAR_LABEL
    : null;
}

/**
 * Client-local interaction prompt: a thought bubble above the local player's
 * head showing the currently available altar action + an Enter key.
 */
export function updateAltarPrompt(scene: GameScene): void {
  const label = activeAltarLabel(scene);
  const ownId = scene.state.ownId;
  const sprite = ownId ? scene.state.sprite.get(ownId) : undefined;

  if (!label || !sprite) {
    if (scene.altarPrompt) scene.altarPrompt.container.setVisible(false);
    return;
  }

  let prompt = scene.altarPrompt;
  if (!prompt || prompt.label !== label) {
    prompt?.container.destroy();
    prompt = createPrompt(scene, label);
    scene.altarPrompt = prompt;
  }

  const meta = ownId ? scene.state.spriteMeta.get(ownId) : undefined;
  const barY = sprite.y - (meta?.barOffsetY ?? 0);
  prompt.container
    .setVisible(true)
    .setPosition(sprite.x, barY - BUBBLE_GAP - BUBBLE_H / 2)
    .setDepth(DEPTH.UI + sprite.y + 3);
}
