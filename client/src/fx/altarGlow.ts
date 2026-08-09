import Phaser from "phaser";
import { RUNE_ALTAR_FEATURE_ID } from "@mmo-idle/shared";
import type { GameScene } from "../scenes/game/GameScene";
import { isAtDungeonAltar } from "../scenes/game/dungeonAltar";
import { ALTAR_GLOW_RGB, isAtRuneAltar } from "../scenes/game/runeAltar";

const GLOW_OUTER_MAX = 4;
const GLOW_INNER = 0;
// Full strength fade-in / fade-out time in seconds.
const FADE_SECONDS = 0.5;

const GLOW_DATA_KEY = "altarGlowFx";
const DUNGEON_ALTAR_FEATURE_ID = "dungeon_altar";

function findAltarImage(
  scene: GameScene,
): Phaser.GameObjects.Image | undefined {
  return scene.nodeDecor.find(
    (img) => {
      const featureId = img.getData("featureId");
      return (
        featureId === RUNE_ALTAR_FEATURE_ID ||
        featureId === DUNGEON_ALTAR_FEATURE_ID
      );
    },
  );
}

function isAtCurrentAltar(
  scene: GameScene,
  img: Phaser.GameObjects.Image,
): boolean {
  return img.getData("featureId") === DUNGEON_ALTAR_FEATURE_ID
    ? isAtDungeonAltar(scene)
    : isAtRuneAltar(scene);
}

function approach(current: number, target: number, step: number): number {
  if (current < target) return Math.min(target, current + step);
  if (current > target) return Math.max(target, current - step);
  return current;
}

function packRgb(rgb: [number, number, number]): number {
  return (
    (Math.round(rgb[0]) << 16) |
    (Math.round(rgb[1]) << 8) |
    Math.round(rgb[2])
  );
}

/**
 * Client-local post-processing: glow the current sanctuary or dungeon altar
 * while the local player stands inside its interaction area. Uses Phaser's
 * per-object preFX glow (WebGL only — no-op under Canvas) and eases the strength
 * so stepping on/off stays smooth.
 */
export function updateAltarGlow(scene: GameScene, dt: number): void {
  const img = findAltarImage(scene);
  // preFX is WebGL-only; bail cleanly when absent (Canvas renderer or no altar).
  if (!img || !img.preFX) {
    scene.altarGlowStrength = 0;
    return;
  }

  const active = isAtCurrentAltar(scene, img);

  // Ramp overall strength toward on/off.
  scene.altarGlowStrength = approach(
    scene.altarGlowStrength,
    active ? 1 : 0,
    dt / FADE_SECONDS,
  );

  let glow = img.getData(GLOW_DATA_KEY) as Phaser.FX.Glow | undefined;

  // Fully faded out: drop the FX so the altar renders without the glow pipeline.
  if (scene.altarGlowStrength <= 0) {
    if (glow) {
      img.preFX.remove(glow);
      img.setData(GLOW_DATA_KEY, undefined);
    }
    return;
  }

  if (!glow) {
    glow = img.preFX.addGlow(packRgb(ALTAR_GLOW_RGB), 0, GLOW_INNER);
    img.setData(GLOW_DATA_KEY, glow);
  }
  glow.color = packRgb(ALTAR_GLOW_RGB);
  glow.outerStrength = scene.altarGlowStrength * GLOW_OUTER_MAX;
}
