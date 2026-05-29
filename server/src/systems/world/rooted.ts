import type { World } from "../../world/World";
import type { ServerEntity } from "../../ecs/entity";
import { isMonsterEntity } from "../../ecs/entity";
import { attachComponent, detachComponent } from "../../ecs/markerHelpers";
import { stopEntity } from "./movement";

export function setRooted(
  world: World,
  entity: ServerEntity,
  rooted: boolean,
): void {
  if (rooted) {
    attachComponent(world, entity, "isRooted", {});
    stopEntity(world, entity);
    if (isMonsterEntity(entity)) {
      world.clearMonsterKnockback(entity.isMonster.id);
      entity.controlsMonster.kiteTimer = 0;
      entity.controlsMonster.chargeRemainingMs = 0;
    }
    return;
  }

  detachComponent(world, entity, "isRooted");
}
