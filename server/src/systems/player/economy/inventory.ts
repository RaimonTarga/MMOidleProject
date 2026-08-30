import type { EquipmentSlot } from '@mmo-idle/shared';
import { ITEM_DATABASE, TEST_ROOM_NODE_ID, relicIsUnlocked } from '@mmo-idle/shared';
import type { World } from '../../../world/World';
import type { PlayerEntity } from '../../../ecs/entity';
import { syncArchetypeSlices } from '../../../ecs/archetypeSliceSync';
import {
  recalculatePlayerEntityStats,
  recalculatePlayerStatsPreservingCombatState,
} from '../../../ecs/playerEntityFormulas';
import { resetCoreCombatState } from '../../combat/cores';

function recalculateAfterEquipmentChange(
  world: World,
  entity: PlayerEntity,
  slot: EquipmentSlot,
): void {
  if (slot === 'core') {
    // Core swapping is allowed in combat, but it must not wipe class resources,
    // cooldowns, status effects, or ramps. Only Core-owned focus state resets.
    recalculatePlayerStatsPreservingCombatState(world, entity);
    resetCoreCombatState(entity);
    return;
  }
  recalculatePlayerEntityStats(world, entity);
}

export function equipItem(world: World, entity: PlayerEntity, definitionId: string): boolean {
  const def = ITEM_DATABASE.get(definitionId);
  if (!def) return false;
  if (def.slot === 'relic' && !relicIsUnlocked(
    entity.tracksProgression.playerTier,
    entity.hasPosition.nodeId === TEST_ROOM_NODE_ID,
  )) return false;

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
  recalculateAfterEquipmentChange(world, entity, slot);
  syncArchetypeSlices(world, entity);
  return true;
}

export function unequipItem(world: World, entity: PlayerEntity, slot: EquipmentSlot): boolean {
  const current = entity.holdsInventory.equipment[slot];
  if (!current) return false;

  entity.holdsInventory.equipment[slot] = null;
  entity.holdsInventory.inventory = [...entity.holdsInventory.inventory, current];
  recalculateAfterEquipmentChange(world, entity, slot);
  syncArchetypeSlices(world, entity);
  return true;
}
