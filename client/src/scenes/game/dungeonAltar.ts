import {
  getDungeonGauntletDef,
  type DungeonGauntletView,
} from "@mmo-idle/shared";
import { getOwnBase } from "../../render/interpolation";
import type { GameScene } from "./GameScene";

export const DUNGEON_ALTAR_LABEL = "Activate Trial";

/** Whether the local player is inside the current dungeon altar's activation circle. */
export function isAtDungeonAltar(scene: GameScene): boolean {
  const altar = getDungeonGauntletDef(scene.state.ownNodeId)?.altar;
  const base = getOwnBase(scene.state);
  if (!altar || !base) return false;
  const dx = base.x - altar.x;
  const dy = base.y - altar.y;
  return dx * dx + dy * dy <= altar.activationRadius * altar.activationRadius;
}

/** Whether the local player can use the dungeon altar right now. */
export function canActivateDungeonAltar(
  scene: GameScene,
  gauntlet: DungeonGauntletView | null,
): boolean {
  return (
    gauntlet?.nodeId === scene.state.ownNodeId &&
    gauntlet.status === "idle" &&
    gauntlet.canActivate &&
    isAtDungeonAltar(scene)
  );
}
