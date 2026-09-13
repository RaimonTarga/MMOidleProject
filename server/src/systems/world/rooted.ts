import { ABILITY_ROOT_EFFECT_ID, getFlag, getStatusEffect, setFlag } from '@mmo-idle/shared';
import type { World } from "../../world/World";
import type { ServerEntity } from "../../ecs/entity";
import { isMonsterEntity } from "../../ecs/entity";
import { attachComponent, detachComponent } from "../../ecs/markerHelpers";
import { stopEntity } from "./movement";

/** A scripted owner can take over an ability-only root without stealing it. */
export function hasIndependentRoot(entity: ServerEntity): boolean {
  return !!entity.isRooted && !(isMonsterEntity(entity) &&
    getFlag(entity.tracksCombat, 'abilityOwnsRoot'));
}

export function setRooted(
  world: World,
  entity: ServerEntity,
  rooted: boolean,
): void {
  if (rooted) {
    if (isMonsterEntity(entity)) setFlag(entity.tracksCombat, 'abilityOwnsRoot', false);
    attachComponent(world, entity, "isRooted", {});
    stopEntity(world, entity);
    if (isMonsterEntity(entity)) {
      world.clearMonsterKnockback(entity.isMonster.id);
      entity.controlsMonster.kiteTimer = 0;
      entity.controlsMonster.chargeRemainingMs = 0;
    }
    return;
  }

  if (isMonsterEntity(entity) &&
      (getStatusEffect(entity.tracksCombat, ABILITY_ROOT_EFFECT_ID)?.remainingMs ?? 0) > 0) {
    // The scripted hold ended, but Binding Strike still owns its remaining time.
    setFlag(entity.tracksCombat, 'abilityOwnsRoot', true);
    return;
  }
  detachComponent(world, entity, "isRooted");
}
