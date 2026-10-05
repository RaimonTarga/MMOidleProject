/**
 * Lineage tree economy — the four server handlers (progression rework Phase 1b).
 *
 * Each one validates with the SHARED check (`checkUnlockCard`, `checkSetActive`,
 * `checkUnlockForm`, `checkWearForm`), spends, mutates `holdsInventory.lineages`
 * through `mutateSlice`, and recalculates stats. The client gates its buttons
 * with the same checks, so the two can never disagree.
 *
 * Buying is permanent and costs. Activating a card and wearing an owned form are
 * free and instant: "owned is forever, active is a choice" (design §1).
 */
import {
  LINEAGE_DATABASE,
  PARKED_LINEAGE_REASON,
  TEST_ROOM_NODE_ID,
  checkSetActive,
  checkUnlockCard,
  checkUnlockForm,
  checkWearForm,
  globalMastery,
  isLineageParked,
  isRankedCard,
  lineageCardPrice,
  lineageGateCost,
  maxCardRank,
  nextCardRank,
  statRowIsCollapsed,
} from '@mmo-idle/shared';
import type {
  EssenceType, LineageCard, LineageCost, LineageDefinition, LineageProgress,
  LineageWallet, PacketId, RowKind,
} from '@mmo-idle/shared';
import type { World } from '../../../world/World';
import type { PlayerEntity } from '../../../ecs/entity';
import { recalculatePlayerEntityStats } from '../../../ecs/playerEntityFormulas';
import { markSliceDirty, mutateSlice } from '../../../ecs/dirtyHelpers';
import { equipItem } from './inventory';
import { ensureLineageProgress, writeLineageProgress } from './lineageSync';

export type LineageAction = 'unlockCard' | 'setActive' | 'unlockForm' | 'wearForm';

export interface LineageResult {
  success: boolean;
  reason?: string;
  lineageId: string;
  action: LineageAction;
}

const fail = (lineageId: string, action: LineageAction, reason: string): LineageResult =>
  ({ success: false, reason, lineageId, action });

/**
 * The lineage a request names, or the refusal for it. A parked lineage (design
 * §24.5) is refused HERE, before `ensureLineageProgress` can see it, so no
 * request for a parked tree ever creates or writes one (review finding B1 was
 * exactly an empty tree persisted on request).
 */
function liveLineage(lineageId: string, action: LineageAction): LineageDefinition | LineageResult {
  const lineage = LINEAGE_DATABASE.get(lineageId);
  if (!lineage) return fail(lineageId, action, 'Unknown lineage.');
  if (isLineageParked(lineage)) return fail(lineageId, action, PARKED_LINEAGE_REASON);
  return lineage;
}

const isRefusal = (value: LineageDefinition | LineageResult): value is LineageResult =>
  'success' in value;

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

/** The card currently slotted in a row, or undefined when the row is empty. */
function slottedCard(
  lineage: LineageDefinition,
  progress: LineageProgress,
  row: RowKind,
): LineageCard | undefined {
  const id = progress.active[row];
  return id ? lineage.cards.find((c) => c.id === id) : undefined;
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

/**
 * Buy a card. Permanent, and the only one of the four that costs materials.
 *
 * A RANKED card (the T1 lean trio, design §26.1) is bought one rank at a time
 * through this same intent (`lineage:unlockCard { cardId }`): the first purchase
 * owns it at rank I, each further one buys the NEXT rank — its own Global Mastery
 * gate and price, checked by `checkUnlockCard` — and leaves the active rows alone.
 */
export function unlockLineageCard(
  world: World,
  entity: PlayerEntity,
  lineageId: string,
  cardId: string,
): LineageResult {
  const lineage = liveLineage(lineageId, 'unlockCard');
  if (isRefusal(lineage)) return lineage;
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
    const { cost } = lineageCardPrice({ lineage, card, lineages: entity.holdsInventory.lineages, progress });
    paid = costTotals(cost);
    spend(world, entity, cost);
  }

  writeLineageProgress(world, entity, lineageId, progress, (current) => {
    const rank = nextCardRank(current, card) ?? maxCardRank(card);
    const ranks = isRankedCard(card) ? { ...(current.ranks ?? {}), [cardId]: rank } : current.ranks;
    // A rank-up: the card is owned already, so ownership and the rows stay as
    // they are — only the rank moves.
    if (current.ownedCards.includes(cardId)) return { ...current, ...(ranks ? { ranks } : {}) };
    const ownedCards = [...current.ownedCards, cardId];
    // A row the player has nothing in yet activates the card they just bought;
    // a row already filled is left alone, because swapping is their choice.
    //
    // A stat row still pointing at a card the gate collapsed counts as EMPTY:
    // that card is base stats now (design §4) and can never be slotted again, so
    // leaving it there would make the first T2 stat card look like it did
    // nothing. `checkSetActive` is the authority on whether the new card may sit
    // in the row at all — buying a collapsed band's stat row is a reslot of what
    // the form absorbed, not a slot change.
    const slotted = slottedCard(lineage, current, card.row);
    const rowOpen = !slotted || statRowIsCollapsed(lineage, current, slotted);
    const active = rowOpen
      && checkSetActive({ lineage, progress: { ...current, ownedCards }, row: card.row, cardId }).ok
      ? { ...current.active, [card.row]: cardId }
      : current.active;
    return { ...current, ownedCards, active, ...(ranks ? { ranks } : {}) };
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
  const lineage = liveLineage(lineageId, 'setActive');
  if (isRefusal(lineage)) return lineage;

  const progress = ensureLineageProgress(world, entity, lineage);
  const check = checkSetActive({ lineage, progress, row, cardId });
  if (!check.ok) return fail(lineageId, 'setActive', check.reason ?? 'Cannot activate that card.');

  const replacedCardId = progress.active[row] ?? null;
  writeLineageProgress(world, entity, lineageId, progress, (current) => {
    const active = { ...current.active };
    if (cardId === null) delete active[row];
    else active[row] = cardId;
    return { ...current, active };
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
  const lineage = liveLineage(lineageId, 'unlockForm');
  if (isRefusal(lineage)) return lineage;
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

  writeLineageProgress(world, entity, lineageId, progress, (current) => (
    { ...current, ownedForms: [...current.ownedForms, recipeId] }
  ));
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
  const lineage = liveLineage(lineageId, 'wearForm');
  if (isRefusal(lineage)) return lineage;

  const progress = ensureLineageProgress(world, entity, lineage);
  const check = checkWearForm({ lineage, progress, recipeId });
  if (!check.ok) return fail(lineageId, 'wearForm', check.reason ?? 'Cannot wear that form.');

  writeLineageProgress(world, entity, lineageId, progress, (current) => ({ ...current, wornForm: recipeId }));
  mutateSlice(world, entity, 'holdsInventory', (inv) => {
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
