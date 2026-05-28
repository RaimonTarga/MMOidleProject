import {
  ITEM_DATABASE,
  TEST_ROOM_NODE_ID,
  checkUpgrade,
  upgradeCostFor,
} from '@mmo-idle/shared';
import type { World } from '../../../world/World';
import type { PlayerEntity } from '../../../ecs/entity';
import { recalculatePlayerEntityStats } from '../../../ecs/playerEntityFormulas';
import { markSliceDirty } from '../../../ecs/dirtyHelpers';

export interface UpgradeResult {
  success: boolean;
  reason?: string;
  itemId: string;
  newLevel: number;
}

export function upgradeItem(
  world: World,
  entity: PlayerEntity,
  itemId: string,
): UpgradeResult {
  const inv = entity.holdsInventory;
  const current = inv.itemUpgrades[itemId] ?? 0;
  const fail = (reason: string): UpgradeResult => ({ success: false, reason, itemId, newLevel: current });

  const def = ITEM_DATABASE.get(itemId);
  if (!def) return fail('Unknown item.');

  const owned =
    inv.inventory.includes(itemId) ||
    Object.values(inv.equipment).includes(itemId);
  if (!owned) return fail("You don't own this item.");

  const isTestRoom = entity.hasPosition.nodeId === TEST_ROOM_NODE_ID;
  const biomeLevel = def.biomeGroup
    ? (entity.tracksProgression.biomeLevel[def.biomeGroup] ?? 0)
    : 0;

  // Test room ignores biome-level + essence gates (mirrors craftRecipe behaviour).
  if (!isTestRoom) {
    const check = checkUpgrade({
      item: def,
      currentPlus: current,
      biomeLevel,
      essences: entity.tracksProgression.essences,
    });
    if (!check.ok) return fail(check.reason ?? 'Cannot upgrade.');
  } else if (!def.biomeGroup) {
    return fail('This item cannot be upgraded.');
  } else if (current >= 3) {
    return fail('Already at maximum upgrade.');
  }

  const targetPlus = current + 1;
  const cost = upgradeCostFor(def, targetPlus);
  if (!cost) return fail('This item cannot be upgraded.');

  if (!isTestRoom) {
    entity.tracksProgression.essences[cost.type] -= cost.amount;
    markSliceDirty(world, entity, 'tracksProgression');
  }

  inv.itemUpgrades = { ...inv.itemUpgrades, [itemId]: targetPlus };
  markSliceDirty(world, entity, 'holdsInventory');
  recalculatePlayerEntityStats(world, entity);

  return { success: true, itemId, newLevel: targetPlus };
}
