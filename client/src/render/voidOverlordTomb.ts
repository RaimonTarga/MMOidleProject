import type { VoidOverlordRespawnState } from "@mmo-idle/shared";
import type { GameScene } from "../scenes/GameScene";
import {
  VOID_TOMB_DISPLAY_H,
  VOID_TOMB_DISPLAY_W,
  VOID_TOMB_TEXTURE_KEY,
} from "../sprites";
import { DEPTH } from "./depth";
import { nodeToScene, sceneDepthY } from "./sceneCoords";
import { setVoidThroneHazardLifted } from "../scenes/game/voidThrone";
import type { RenderState } from "./state";

const TIMER_OFFSET_Y = 170;

function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function createTombSprite(
  scene: GameScene,
  payload: VoidOverlordRespawnState,
): Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle {
  const scenePos = nodeToScene(payload.pos.x, payload.pos.y);
  if (scene.textures.exists(VOID_TOMB_TEXTURE_KEY)) {
    return scene.add
      .image(scenePos.x, scenePos.y, VOID_TOMB_TEXTURE_KEY)
      .setDisplaySize(VOID_TOMB_DISPLAY_W, VOID_TOMB_DISPLAY_H);
  }

  return scene.add.rectangle(
    scenePos.x,
    scenePos.y,
    VOID_TOMB_DISPLAY_W,
    VOID_TOMB_DISPLAY_H,
    0x332244,
    0.85,
  );
}

function destroyVoidOverlordRespawn(state: RenderState): void {
  state.voidOverlordRespawn?.sprite.destroy();
  state.voidOverlordRespawn?.label.destroy();
  state.voidOverlordRespawn = null;
}

export function syncVoidOverlordRespawn(
  state: RenderState,
  payload: VoidOverlordRespawnState | undefined,
  scene: GameScene,
): void {
  if (!payload) {
    destroyVoidOverlordRespawn(state);
    return;
  }

  setVoidThroneHazardLifted(scene, true);

  const existing = state.voidOverlordRespawn;
  const deadlineMs = scene.time.now + payload.remainingMs;

  if (existing) {
    existing.payload = payload;
    existing.deadlineMs = deadlineMs;
    const scenePos = nodeToScene(payload.pos.x, payload.pos.y);
    existing.sprite.setPosition(scenePos.x, scenePos.y);
    existing.sprite.setDepth(DEPTH.SPRITE + sceneDepthY(payload.pos.y));
    existing.label.setPosition(scenePos.x, scenePos.y - TIMER_OFFSET_Y);
    existing.label.setDepth(DEPTH.UI + sceneDepthY(payload.pos.y));
    return;
  }

  const sprite = createTombSprite(scene, payload);
  sprite.setDepth(DEPTH.SPRITE + sceneDepthY(payload.pos.y));

  const scenePos = nodeToScene(payload.pos.x, payload.pos.y);
  const label = scene.add
    .text(scenePos.x, scenePos.y - TIMER_OFFSET_Y, "", {
      color: "#f4dcff",
      fontFamily: "monospace",
      fontSize: "18px",
      fontStyle: "bold",
      stroke: "#16051f",
      strokeThickness: 4,
    })
    .setOrigin(0.5)
    .setDepth(DEPTH.UI + sceneDepthY(payload.pos.y));

  state.voidOverlordRespawn = {
    payload,
    deadlineMs,
    sprite,
    label,
    lastText: "",
  };
  updateVoidOverlordRespawn(state, scene);
}

export function updateVoidOverlordRespawn(
  state: RenderState,
  scene: GameScene,
): void {
  const marker = state.voidOverlordRespawn;
  if (!marker) return;

  const remainingMs = Math.max(0, marker.deadlineMs - scene.time.now);
  const text = `Respawns in ${formatRemaining(remainingMs)}`;
  if (text === marker.lastText) return;

  marker.label.setText(text);
  marker.lastText = text;
}
