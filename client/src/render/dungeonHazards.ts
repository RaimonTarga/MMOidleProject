import type { GameScene } from "../scenes/GameScene";
import { HAZARD_POOL_ART } from "../sprites";
import { DEPTH } from "./depth";

interface TemporaryHazard {
  id: string;
  x: number;
  y: number;
  radius: number;
  remainingMs: number;
}

interface TemporaryHazardView {
  temporaryHazards?: TemporaryHazard[];
}

export function syncDungeonHazards(
  scene: GameScene,
  gauntlet: TemporaryHazardView | undefined,
): void {
  const hazards = gauntlet?.temporaryHazards ?? [];
  const live = new Set(hazards.map((hazard) => hazard.id));

  for (const [id, image] of scene.dungeonHazards) {
    if (live.has(id)) continue;
    image.destroy();
    scene.dungeonHazards.delete(id);
  }

  for (const hazard of hazards) {
    let image = scene.dungeonHazards.get(hazard.id);
    if (!image) {
      image = scene.add
        .image(hazard.x, hazard.y, HAZARD_POOL_ART.poison.key)
        .setDepth(DEPTH.BG_DECOR + 0.25);
      scene.dungeonHazards.set(hazard.id, image);
    }
    drawHazard(image, hazard);
  }
}

function drawHazard(
  image: Phaser.GameObjects.Image,
  hazard: TemporaryHazard,
): void {
  const pulse = 0.94 + Math.sin(performance.now() / 260) * 0.06;
  const expiryFade = Math.min(1, Math.max(0, hazard.remainingMs / 750));
  image
    .setPosition(hazard.x, hazard.y)
    .setDisplaySize(hazard.radius * 2.1, hazard.radius * 2.1)
    .setAlpha(expiryFade * pulse);
}
