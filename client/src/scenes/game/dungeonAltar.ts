import { getDungeonDef, type DungeonView } from "@mmo-idle/shared";
import { getOwnBase } from "../../render/interpolation";
import type { GameScene } from "./GameScene";

export const DUNGEON_ALTAR_LABEL = "Disturb the Altar";

/** Whether the local player is inside the current dungeon altar's activation circle. */
export function isAtDungeonAltar(scene: GameScene): boolean {
  const altar = getDungeonDef(scene.state.ownNodeId)?.altar;
  const base = getOwnBase(scene.state);
  if (!altar || !base) return false;
  const dx = base.x - altar.x;
  const dy = base.y - altar.y;
  return dx * dx + dy * dy <= altar.activationRadius * altar.activationRadius;
}

/** Whether the local player can use the dungeon altar right now. */
export function canActivateDungeonAltar(
  scene: GameScene,
  dungeon: DungeonView | null,
): boolean {
  return (
    dungeon?.nodeId === scene.state.ownNodeId &&
    dungeon.status === "idle" &&
    dungeon.canActivate &&
    isAtDungeonAltar(scene)
  );
}
