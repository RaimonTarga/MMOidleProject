import type { EquipmentSlot } from '@mmo-idle/shared';
import { ITEM_DATABASE } from '@mmo-idle/shared';
import type { World } from '../world/World';
import type { PlayerEntity } from '../ecs/components/player';
import { syncArchetypeSlices } from '../ecs/archetypeSliceSync';
import { recalculatePlayerEntityStats } from '../ecs/playerEntityFormulas';

export function equipItem(world: World, entity: PlayerEntity, definitionId: string): boolean {
  const def = ITEM_DATABASE.get(definitionId);
  if (!def) return false;

  const idx = entity.holdsInventory.inventory.indexOf(definitionId);
  if (idx === -1) return false;

  const slot = def.slot;

  entity.holdsInventory.inventory = [
    ...entity.holdsInventory.inventory.slice(0, idx),
    ...entity.holdsInventory.inventory.slice(idx + 1),
  ];

  const displaced = entity.holdsInventory.equipment[slot];
  if (displaced) {
    entity.holdsInventory.inventory = [...entity.holdsInventory.inventory, displaced];
  }

  entity.holdsInventory.equipment[slot] = definitionId;
  recalculatePlayerEntityStats(world, entity);
  syncArchetypeSlices(world, entity);
  return true;
}

export function unequipItem(world: World, entity: PlayerEntity, slot: EquipmentSlot): boolean {
  const current = entity.holdsInventory.equipment[slot];
  if (!current) return false;

  entity.holdsInventory.equipment[slot] = null;
  entity.holdsInventory.inventory = [...entity.holdsInventory.inventory, current];
  recalculatePlayerEntityStats(world, entity);
  syncArchetypeSlices(world, entity);
  return true;
}
