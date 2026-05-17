import type { PlayerState, EquipmentSlot } from '@mmo-idle/shared';
import { ITEM_DATABASE } from '@mmo-idle/shared';
import { recalculatePlayerStats } from './stats';

export function equipItem(player: PlayerState, definitionId: string): boolean {
  const def = ITEM_DATABASE.get(definitionId);
  if (!def) return false;

  const idx = player.inventory.indexOf(definitionId);
  if (idx === -1) return false;

  const slot = def.slot;

  // Remove item from inventory
  player.inventory = [
    ...player.inventory.slice(0, idx),
    ...player.inventory.slice(idx + 1),
  ];

  // Return previously equipped item to inventory
  const displaced = player.equipment[slot];
  if (displaced) player.inventory = [...player.inventory, displaced];

  player.equipment[slot] = definitionId;
  recalculatePlayerStats(player);
  return true;
}

export function unequipItem(player: PlayerState, slot: EquipmentSlot): boolean {
  const current = player.equipment[slot];
  if (!current) return false;

  player.equipment[slot] = null;
  player.inventory = [...player.inventory, current];
  recalculatePlayerStats(player);
  return true;
}
