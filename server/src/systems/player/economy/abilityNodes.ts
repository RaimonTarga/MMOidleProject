/**
 * Ability node economy — the two server handlers (design §19).
 *
 * Each validates with the SHARED check (`checkUnlockAbilityNode`,
 * `checkSetAbilityNode`), spends, mutates `tracksProgression.abilityNodes`
 * through `mutateSlice`, and recalculates stats. The client gates its buttons
 * with the same checks, so the two can never disagree — exactly the arrangement
 * the lineage handlers have, and for the same reason.
 *
 * Buying is permanent and costs. Activating an owned node is free and instant:
 * "owned is forever, active is a choice".
 */
import {
  TEST_ROOM_NODE_ID,
  abilityNodeProgressFor,
  abilityNodeTreeFor,
  checkSetAbilityNode,
  checkUnlockAbilityNode,
  globalMastery,
  resolveAbilityNodeOption,
} from '@mmo-idle/shared';
import type {
  AbilityNodeProgress, AbilityNodeRow, AbilityNodeWallet, EssenceType,
  LineageCost, PacketId,
} from '@mmo-idle/shared';
import type { World } from '../../../world/World';
import type { PlayerEntity } from '../../../ecs/entity';
import { recalculatePlayerEntityStats } from '../../../ecs/playerEntityFormulas';
import { markSliceDirty, mutateSlice } from '../../../ecs/dirtyHelpers';

export type AbilityNodeAction = 'unlockNode' | 'setNode';

export interface AbilityNodeResult {
  success: boolean;
  reason?: string;
  abilityId: string;
  action: AbilityNodeAction;
}

const fail = (abilityId: string, action: AbilityNodeAction, reason: string): AbilityNodeResult =>
  ({ success: false, reason, abilityId, action });

/** The wallets and progression the shared checks judge a purchase against. */
function walletFor(entity: PlayerEntity): AbilityNodeWallet {
  const prog = entity.tracksProgression;
  return {
    essences: prog.essences,
    shards: prog.shards,
    capstones: prog.capstones,
    biomeLevels: prog.biomeLevel,
    globalMastery: globalMastery(prog.biomeLevel),
    playerTier: prog.playerTier,
    knownAbilities: prog.knownAbilities,
    isTestRoom: entity.hasPosition.nodeId === TEST_ROOM_NODE_ID,
  };
}

/** Spend a resolved cost. Only ever called after the matching check passed. */
function spend(world: World, entity: PlayerEntity, cost: LineageCost): void {
  const prog = entity.tracksProgression;
  for (const [type, amount] of Object.entries(cost.essence) as [EssenceType, number][]) {
    prog.essences[type] = (prog.essences[type] ?? 0) - amount;
  }
  for (const [packet, amount] of Object.entries(cost.shards) as [PacketId, number][]) {
    prog.shards[packet] = (prog.shards[packet] ?? 0) - amount;
  }
  markSliceDirty(world, entity, 'tracksProgression');
}

/** Buy a node. Permanent, and the only one of the two that costs materials. */
export function unlockAbilityNode(
  world: World,
  entity: PlayerEntity,
  abilityId: string,
  optionId: string,
): AbilityNodeResult {
  const tree = abilityNodeTreeFor(abilityId);
  if (!tree) return fail(abilityId, 'unlockNode', 'That ability has no nodes.');
  const option = tree.options.find((o) => o.id === optionId);
  if (!option) return fail(abilityId, 'unlockNode', 'Unknown node.');

  const progress = abilityNodeProgressFor(entity.tracksProgression.abilityNodes, abilityId);
  const wallet = walletFor(entity);
  const check = checkUnlockAbilityNode({ option, progress, wallet });
  if (!check.ok) return fail(abilityId, 'unlockNode', check.reason ?? 'Cannot buy that node.');

  if (!wallet.isTestRoom) spend(world, entity, resolveAbilityNodeOption(option).cost);

  mutateSlice(world, entity, 'tracksProgression', (prog) => {
    // Materialised here and nowhere earlier: a refused purchase must not leave a
    // progress entry behind, because the slice is broadcast and persisted.
    const current = abilityNodeProgressFor(prog.abilityNodes, abilityId);
    const owned = [...current.owned, optionId];
    // A row the player has nothing in yet activates what they just bought; a row
    // already filled is left alone, because swapping is their choice.
    const active = current.active[option.row] === undefined
      ? { ...current.active, [option.row]: optionId }
      : current.active;
    prog.abilityNodes = { ...prog.abilityNodes, [abilityId]: { owned, active } };
  });
  recalculatePlayerEntityStats(world, entity);
  return { success: true, abilityId, action: 'unlockNode' };
}

/** Make an owned node the active one for its row, or clear the row. Free. */
export function setAbilityNode(
  world: World,
  entity: PlayerEntity,
  abilityId: string,
  row: AbilityNodeRow,
  optionId: string | null,
): AbilityNodeResult {
  if (!abilityNodeTreeFor(abilityId)) {
    return fail(abilityId, 'setNode', 'That ability has no nodes.');
  }
  const progress = abilityNodeProgressFor(entity.tracksProgression.abilityNodes, abilityId);
  const check = checkSetAbilityNode({ abilityId, progress, row, optionId });
  if (!check.ok) return fail(abilityId, 'setNode', check.reason ?? 'Cannot activate that node.');

  mutateSlice(world, entity, 'tracksProgression', (prog) => {
    const current = prog.abilityNodes?.[abilityId] ?? { owned: [], active: {} };
    const active = { ...current.active };
    if (optionId === null) delete active[row];
    else active[row] = optionId;
    prog.abilityNodes = { ...prog.abilityNodes, [abilityId]: { ...current, active } };
  });
  recalculatePlayerEntityStats(world, entity);
  return { success: true, abilityId, action: 'setNode' };
}
