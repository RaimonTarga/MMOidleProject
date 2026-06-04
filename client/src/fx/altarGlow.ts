import Phaser from "phaser";
import { RUNE_ALTAR_FEATURE_ID } from "@mmo-idle/shared";
import { ALTAR_ARC_CONFIG, getAltarArc } from "../scenes/game/runeAltar";
import type { GameScene } from "../scenes/game/GameScene";

const GLOW_OUTER_MAX = 4;
const GLOW_INNER = 0;
// Full strength fade-in / fade-out time in seconds.
const FADE_SECONDS = 0.5;
// How fast the glow color crossfades when moving between arcs.
const COLOR_FADE_SECONDS = 0.35;

const GLOW_DATA_KEY = "altarGlowFx";

function findAltarImage(
  scene: GameScene,
): Phaser.GameObjects.Image | undefined {
  return scene.nodeDecor.find(
    (img) => img.getData("featureId") === RUNE_ALTAR_FEATURE_ID,
  );
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
 * Client-local post-processing: glow the rune altar while the local player
 * stands on it, tinted to the arc (pillar) they're standing in. Uses Phaser's
 * per-object preFX glow (WebGL only — no-op under Canvas) and eases both
 * strength and color so stepping on/off and crossing arcs stay smooth.
 */
export function updateAltarGlow(scene: GameScene, dt: number): void {
  const img = findAltarImage(scene);
  // preFX is WebGL-only; bail cleanly when absent (Canvas renderer or no altar).
  if (!img || !img.preFX) {
    scene.altarGlowStrength = 0;
    return;
  }

  const arc = getAltarArc(scene);
  const wasGlowing = scene.altarGlowStrength > 0.001;

  // Ramp overall strength toward on/off.
  scene.altarGlowStrength = approach(
    scene.altarGlowStrength,
    arc ? 1 : 0,
    dt / FADE_SECONDS,
  );

  // Track the arc color. Snap on first contact (avoids a white flash from the
  // idle color), otherwise crossfade when switching arcs while staying on.
  if (arc) {
    const targetRgb = ALTAR_ARC_CONFIG[arc].rgb;
    if (!wasGlowing) {
      scene.altarGlowRgb = [...targetRgb];
    } else {
      const colorStep = (dt / COLOR_FADE_SECONDS) * 255;
      for (let i = 0; i < 3; i++) {
        scene.altarGlowRgb[i] = approach(
          scene.altarGlowRgb[i],
          targetRgb[i],
          colorStep,
        );
      }
    }
  }

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
    glow = img.preFX.addGlow(packRgb(scene.altarGlowRgb), 0, GLOW_INNER);
    img.setData(GLOW_DATA_KEY, glow);
  }
  glow.color = packRgb(scene.altarGlowRgb);
  glow.outerStrength = scene.altarGlowStrength * GLOW_OUTER_MAX;
}
