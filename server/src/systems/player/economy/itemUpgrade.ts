import { ITEM_DATABASE, UPGRADES_RETIRED_REASON } from '@mmo-idle/shared';
import type { World } from '../../../world/World';
import type { PlayerEntity } from '../../../ecs/entity';

export interface UpgradeResult {
  success: boolean;
  reason?: string;
  itemId: string;
  newLevel: number;
}

/**
 * Take an item one `+N` step higher — RETIRED on every slot (design §24.5).
 *
 * Weapons left the ladder in progression rework Phase 2b; armour, charm and boots
 * left it in the course correction, their +1..+5 totals folded into base stats so
 * an item is crafted at full power. One rule now: refused, nothing spent, no
 * level written. The socket event stays wired so an old client gets a reason
 * rather than silence.
 */
export function upgradeItem(
  _world: World,
  entity: PlayerEntity,
  itemId: string,
): UpgradeResult {
  const current = entity.holdsInventory.itemUpgrades[itemId] ?? 0;
  if (!ITEM_DATABASE.has(itemId)) return { success: false, reason: 'Unknown item.', itemId, newLevel: current };
  return { success: false, reason: UPGRADES_RETIRED_REASON, itemId, newLevel: current };
}
