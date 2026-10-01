/**
 * Lineage tree economy — the four server handlers (progression rework Phase 1b).
 *
 * Each one validates with the SHARED check (`checkUnlockCard`, `checkSetActive`,
 * `checkUnlockForm`, `checkWearForm`), spends, mutates `holdsInventory.lineages`
 * through `mutateSlice`, and recalculates stats. The client gates its buttons
 * with the same checks, so the two can never disagree — this is exactly the
 * arrangement `upgradeItem` has with `checkUpgrade`.
 *
 * Buying is permanent and costs. Activating a card and wearing an owned form are
 * free and instant: "owned is forever, active is a choice" (design §1).
 */
import {
  LINEAGE_DATABASE,
  TEST_ROOM_NODE_ID,
  checkSetActive,
  checkUnlockCard,
  checkUnlockForm,
  checkWearForm,
  globalMastery,
  lineageCardPrice,
  lineageGateCost,
} from '@mmo-idle/shared';
import type { EssenceType, LineageCost, LineageWallet, PacketId, RowKind } from '@mmo-idle/shared';
import type { World } from '../../../world/World';
import type { PlayerEntity } from '../../../ecs/entity';
import { recalculatePlayerEntityStats } from '../../../ecs/playerEntityFormulas';
import { markSliceDirty, mutateSlice } from '../../../ecs/dirtyHelpers';
import { equipItem } from './inventory';
import { ensureLineageProgress } from './lineageSync';

export type LineageAction = 'unlockCard' | 'setActive' | 'unlockForm' | 'wearForm';

export interface LineageResult {
  success: boolean;
  reason?: string;
  lineageId: string;
  action: LineageAction;
}

const fail = (lineageId: string, action: LineageAction, reason: string): LineageResult =>
  ({ success: false, reason, lineageId, action });

// ─── Shared plumbing ─────────────────────────────────────────────────────────

/** The wallets and progression the shared checks judge a purchase against. */
function walletFor(entity: PlayerEntity): LineageWallet {
  const prog = entity.tracksProgression;
  return {
    essences: prog.essences,
    shards: prog.shards,
    capstones: prog.capstones,
    biomeLevels: prog.biomeLevel,
    globalMastery: globalMastery(prog.biomeLevel),
    playerTier: prog.playerTier,
    isTestRoom: entity.hasPosition.nodeId === TEST_ROOM_NODE_ID,
  };
}

/** Totals of a resolved cost, for the telemetry row. Never used to spend. */
function costTotals(cost: LineageCost, capstone?: { biome: string; amount: number }): {
  essenceSpent: number; shardsSpent: number; capstonesSpent: number;
} {
  const sum = (values: (number | undefined)[]): number =>
    values.reduce<number>((total, value) => total + (value ?? 0), 0);
  return {
    essenceSpent: sum(Object.values(cost.essence)),
    shardsSpent: sum(Object.values(cost.shards)),
    capstonesSpent: capstone?.amount ?? 0,
  };
}

/** Spend a resolved cost. Only ever called after the matching check passed. */
function spend(world: World, entity: PlayerEntity, cost: LineageCost, capstone?: { biome: string; amount: number }): void {
  const prog = entity.tracksProgression;
  for (const [type, amount] of Object.entries(cost.essence) as [EssenceType, number][]) {
    prog.essences[type] = (prog.essences[type] ?? 0) - amount;
  }
  for (const [packet, amount] of Object.entries(cost.shards) as [PacketId, number][]) {
    prog.shards[packet] = (prog.shards[packet] ?? 0) - amount;
  }
  if (capstone) {
    prog.capstones[capstone.biome] = (prog.capstones[capstone.biome] ?? 0) - capstone.amount;
  }
  markSliceDirty(world, entity, 'tracksProgression');
}

// ─── The four handlers ───────────────────────────────────────────────────────

/** Buy a card. Permanent, and the only one of the four that costs materials. */
export function unlockLineageCard(
  world: World,
  entity: PlayerEntity,
  lineageId: string,
  cardId: string,
): LineageResult {
  const lineage = LINEAGE_DATABASE.get(lineageId);
  if (!lineage) return fail(lineageId, 'unlockCard', 'Unknown lineage.');
  const card = lineage.cards.find((c) => c.id === cardId);
  if (!card) return fail(lineageId, 'unlockCard', 'Unknown card.');

  const progress = ensureLineageProgress(world, entity, lineage);
  const wallet = walletFor(entity);
  const check = checkUnlockCard({
    lineage, card, progress, wallet, lineages: entity.holdsInventory.lineages,
  });
  if (!check.ok) return fail(lineageId, 'unlockCard', check.reason ?? 'Cannot buy that card.');

  let paid = { essenceSpent: 0, shardsSpent: 0, capstonesSpent: 0 };
  if (!wallet.isTestRoom) {
    const { cost } = lineageCardPrice({ lineage, card, lineages: entity.holdsInventory.lineages });
    paid = costTotals(cost);
    spend(world, entity, cost);
  }

  mutateSlice(world, entity, 'holdsInventory', (inv) => {
    const current = inv.lineages![lineageId]!;
    const ownedCards = [...current.ownedCards, cardId];
    // A row the player has nothing in yet activates the card they just bought;
    // a row already filled is left alone, because swapping is their choice.
    const active = current.active[card.row] === undefined
      ? { ...current.active, [card.row]: cardId }
      : current.active;
    inv.lineages = { ...inv.lineages, [lineageId]: { ...current, ownedCards, active } };
  });
  recalculatePlayerEntityStats(world, entity);
  world.gameplay?.lineage(entity, 'lineage.card-unlocked', {
    lineageId, lane: card.lane, row: card.row, cardId, ...paid,
    ownedCards: entity.holdsInventory.lineages?.[lineageId]?.ownedCards.length ?? 0,
  });
  return { success: true, lineageId, action: 'unlockCard' };
}

/** Make an owned card the active one for its row, or clear the row. Free. */
export function setLineageActive(
  world: World,
  entity: PlayerEntity,
  lineageId: string,
  row: RowKind,
  cardId: string | null,
): LineageResult {
  const lineage = LINEAGE_DATABASE.get(lineageId);
  if (!lineage) return fail(lineageId, 'setActive', 'Unknown lineage.');

  const progress = ensureLineageProgress(world, entity, lineage);
  const check = checkSetActive({ lineage, progress, row, cardId });
  if (!check.ok) return fail(lineageId, 'setActive', check.reason ?? 'Cannot activate that card.');

  const replacedCardId = progress.active[row] ?? null;
  mutateSlice(world, entity, 'holdsInventory', (inv) => {
    const current = inv.lineages![lineageId]!;
    const active = { ...current.active };
    if (cardId === null) delete active[row];
    else active[row] = cardId;
    inv.lineages = { ...inv.lineages, [lineageId]: { ...current, active } };
  });
  recalculatePlayerEntityStats(world, entity);
  // Only a REPLACEMENT is a swap. Activating into an empty row is the tail of a
  // purchase, and counting it would double every first card in "swaps per session".
  if (replacedCardId !== null && replacedCardId !== cardId) {
    world.gameplay?.lineage(entity, 'lineage.card-swapped', {
      lineageId, row, cardId, replacedCardId,
      lane: lineage.cards.find((c) => c.id === (cardId ?? replacedCardId))?.lane ?? null,
      ownedCards: entity.holdsInventory.lineages?.[lineageId]?.ownedCards.length ?? 0,
    });
  }
  return { success: true, lineageId, action: 'setActive' };
}

/**
 * Pay a gate: essence, the crowned lane's shard, and the biome boss's capstone.
 *
 * This is the evolution — it buys the FORM, not the wearing of it. The player
 * still chooses which owned form to wear, for free, afterwards.
 */
export function unlockLineageForm(
  world: World,
  entity: PlayerEntity,
  lineageId: string,
  recipeId: string,
): LineageResult {
  const lineage = LINEAGE_DATABASE.get(lineageId);
  if (!lineage) return fail(lineageId, 'unlockForm', 'Unknown lineage.');
  const form = lineage.forms.find((f) => f.recipeId === recipeId);
  if (!form) return fail(lineageId, 'unlockForm', 'That form is not part of this lineage.');

  const progress = ensureLineageProgress(world, entity, lineage);
  const wallet = walletFor(entity);
  const check = checkUnlockForm({ lineage, form, progress, wallet });
  if (!check.ok) return fail(lineageId, 'unlockForm', check.reason ?? 'Cannot pay that gate.');

  let paid = { essenceSpent: 0, shardsSpent: 0, capstonesSpent: 0 };
  if (!wallet.isTestRoom) {
    const cost = lineageGateCost(form, lineage);
    paid = costTotals(cost, cost.capstone);
    spend(world, entity, cost, cost.capstone);
  }

  mutateSlice(world, entity, 'holdsInventory', (inv) => {
    const current = inv.lineages![lineageId]!;
    inv.lineages = {
      ...inv.lineages,
      [lineageId]: { ...current, ownedForms: [...current.ownedForms, recipeId] },
    };
  });
  recalculatePlayerEntityStats(world, entity);
  world.gameplay?.lineage(entity, 'lineage.gate-paid', {
    lineageId, formRecipeId: recipeId, lane: form.capstone?.lane ?? null, ...paid,
    ownedCards: entity.holdsInventory.lineages?.[lineageId]?.ownedCards.length ?? 0,
  });
  return { success: true, lineageId, action: 'unlockForm' };
}

/**
 * Wear an owned form. Free and instant, under the same rules as swapping gear.
 *
 * `equipment[slot]` mirrors `wornForm`, and it is set through the ordinary equip
 * path so archetype slices rebuild exactly as they do for any other item.
 */
export function wearLineageForm(
  world: World,
  entity: PlayerEntity,
  lineageId: string,
  recipeId: string,
): LineageResult {
  const lineage = LINEAGE_DATABASE.get(lineageId);
  if (!lineage) return fail(lineageId, 'wearForm', 'Unknown lineage.');

  const progress = ensureLineageProgress(world, entity, lineage);
  const check = checkWearForm({ lineage, progress, recipeId });
  if (!check.ok) return fail(lineageId, 'wearForm', check.reason ?? 'Cannot wear that form.');

  mutateSlice(world, entity, 'holdsInventory', (inv) => {
    const current = inv.lineages![lineageId]!;
    inv.lineages = { ...inv.lineages, [lineageId]: { ...current, wornForm: recipeId } };
    // The worn form has to be in the bag for the equip path to find it. Owning
    // the form IS owning the item, so a gated form the player never physically
    // crafted still appears here.
    if (!inv.inventory.includes(recipeId) && inv.equipment[lineage.slot] !== recipeId) {
      inv.inventory = [...inv.inventory, recipeId];
    }
  });
  equipItem(world, entity, recipeId);
  return { success: true, lineageId, action: 'wearForm' };
}
