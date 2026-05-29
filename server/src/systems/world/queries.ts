import { distanceSq, type Vec2 } from "@mmo-idle/shared";
import type { World } from "../../world/World";
import type { PlayerEntity } from "../../ecs/entity";

/**
 * Returns all player entities in `nodeId` within `radius` px of `center`.
 * Today this is every player in the node (party filter lands here later).
 */
export function alliesInNodeWithin(
  world: World,
  center: Vec2,
  nodeId: string,
  radius: number,
): PlayerEntity[] {
  const r2 = radius * radius;
  const out: PlayerEntity[] = [];
  for (const p of world.livePlayersInNode(nodeId)) {
    if (distanceSq(p.hasPosition.current, center) <= r2) {
      out.push(p);
    }
  }
  return out;
}
