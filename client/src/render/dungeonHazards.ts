import type { DungeonGauntletView } from "@mmo-idle/shared";
import type { GameScene } from "../scenes/GameScene";
import { DEPTH } from "./depth";

type TemporaryHazard = NonNullable<DungeonGauntletView["temporaryHazards"]>[number];

const ROT_FILL = 0x4b9a47;
const ROT_LINE = 0xd8ff7a;

export function syncDungeonHazards(
  scene: GameScene,
  gauntlet: DungeonGauntletView | undefined,
): void {
  const hazards = gauntlet?.temporaryHazards ?? [];
  const live = new Set(hazards.map((hazard) => hazard.id));

  for (const [id, graphic] of scene.dungeonHazards) {
    if (live.has(id)) continue;
    graphic.destroy();
    scene.dungeonHazards.delete(id);
  }

  for (const hazard of hazards) {
    let graphic = scene.dungeonHazards.get(hazard.id);
    if (!graphic) {
      graphic = scene.add.graphics().setDepth(DEPTH.BG_DECOR + 0.25);
      scene.dungeonHazards.set(hazard.id, graphic);
    }
    drawHazard(graphic, hazard);
  }
}

function drawHazard(
  graphic: Phaser.GameObjects.Graphics,
  hazard: TemporaryHazard,
): void {
  const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 220);
  const alpha = 0.28 + pulse * 0.1;
  graphic.clear();
  graphic.fillStyle(ROT_FILL, alpha);
  graphic.lineStyle(5, ROT_LINE, 0.85);
  graphic.fillCircle(hazard.x, hazard.y, hazard.radius);
  graphic.strokeCircle(hazard.x, hazard.y, hazard.radius);
  graphic.lineStyle(2, ROT_LINE, 0.45);
  graphic.strokeCircle(hazard.x, hazard.y, hazard.radius * 0.68);
}
