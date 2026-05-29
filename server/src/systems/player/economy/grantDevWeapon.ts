import {
  DEV_GODMODE_ARMOR_ID,
  DEV_PHASE_TESTER_WEAPON_ID,
  ITEM_DATABASE,
} from '@mmo-idle/shared';
import type { PlayerEntity } from '../../../ecs/entity';
import { markSliceDirty } from '../../../ecs/dirtyHelpers';
import type { World } from '../../../world/World';
import { syncDevInvulnerability } from '../../../dev/syncDevInvulnerability';
import { equipItem } from './inventory';

function ensureInInventory(entity: PlayerEntity, itemId: string): void {
  const equipped =
    entity.holdsInventory.equipment.weapon === itemId
    || entity.holdsInventory.equipment.armor === itemId
    || entity.holdsInventory.equipment.recovery === itemId
    || entity.holdsInventory.equipment.mobility === itemId;
  const inInventory = entity.holdsInventory.inventory.includes(itemId);

  if (!equipped && !inInventory) {
    entity.holdsInventory.inventory = [...entity.holdsInventory.inventory, itemId];
  }
}

export function grantDevLoadout(world: World, entity: PlayerEntity): boolean {
  if (
    !ITEM_DATABASE.has(DEV_PHASE_TESTER_WEAPON_ID)
    || !ITEM_DATABASE.has(DEV_GODMODE_ARMOR_ID)
  ) {
    return false;
  }

  ensureInInventory(entity, DEV_PHASE_TESTER_WEAPON_ID);
  ensureInInventory(entity, DEV_GODMODE_ARMOR_ID);

  const weaponOk = equipItem(world, entity, DEV_PHASE_TESTER_WEAPON_ID);
  const armorOk = equipItem(world, entity, DEV_GODMODE_ARMOR_ID);
  syncDevInvulnerability(world, entity);

  if (weaponOk || armorOk) {
    markSliceDirty(world, entity, 'holdsInventory');
  }

  return weaponOk && armorOk;
}

/** @deprecated Use grantDevLoadout */
export function grantDevPhaseTester(world: World, entity: PlayerEntity): boolean {
  return grantDevLoadout(world, entity);
}
