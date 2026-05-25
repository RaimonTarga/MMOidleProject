import type { PlayerSnapshot, EquipmentSlot } from '@mmo-idle/shared';
import { ITEM_DATABASE } from '@mmo-idle/shared';
import { recalculatePlayerStats } from './stats';
import type { World } from '../world/World';
import type { PlayerEntity } from '../ecs/components/player';
import { withPlayerSnapshotDraft } from '../ecs/playerSnapshotAdapter';

export function equipItem(world: World, player: PlayerSnapshot | PlayerEntity, definitionId: string): boolean {
  if ('entityId' in player) {
    return withPlayerSnapshotDraft(world, player, draft => equipItemSnapshot(draft, definitionId));
  }
  return equipItemSnapshot(player, definitionId);
}

export function equipItemSnapshot(player: PlayerSnapshot, definitionId: string): boolean {
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

export function unequipItem(world: World, player: PlayerSnapshot | PlayerEntity, slot: EquipmentSlot): boolean {
  if ('entityId' in player) {
    return withPlayerSnapshotDraft(world, player, draft => unequipItemSnapshot(draft, slot));
  }
  return unequipItemSnapshot(player, slot);
}

function unequipItemSnapshot(player: PlayerSnapshot, slot: EquipmentSlot): boolean {
  const current = player.equipment[slot];
  if (!current) return false;

  player.equipment[slot] = null;
  player.inventory = [...player.inventory, current];
  recalculatePlayerStats(player);
  return true;
}
