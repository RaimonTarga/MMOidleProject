/**
 * The Upgrade panel's list as data (design §26.4: "The old Upgrade tab's slot,
 * named Upgrade, opens on the five worn items. The weapon opens its page; a plain
 * item says it is a plain item."; the composite mockup's "Worn items" tab).
 *
 * One entry per worn slot, the weapon first. The weapon carries its band's STEP
 * PIPS (at T1: form · lean I · II · III · verb · gate, design §26.1) and a badge
 * counting what the player can buy right now. Every state comes from the shared
 * checks (`checkUnlockCard`, `checkUnlockForm`) the server applies; nothing here
 * decides gameplay. Pure, for `server/test/weaponPage.test.ts`.
 */
import {
  ITEM_DATABASE,
  RECIPE_DATABASE,
  bandContents,
  checkUnlockCard,
  checkUnlockForm,
  emptyLineageProgress,
  lineageForEquippedItem,
  wornFormTier,
  type EquipmentMap,
  type EquipmentSlot,
  type LineageCard,
  type LineageDefinition,
  type LineageProgress,
  type LineageProgressMap,
  type LineageWallet,
} from '@mmo-idle/shared';
import { SLOT_LABELS, biomeName } from '../crafting/common';
import { statEntries } from '../crafting/itemDisplay';
import { cardRank, maxCardRank } from './legibilityContracts';

/** The worn slots the list shows, weapon first. The relic only when one is worn. */
export const UPGRADE_SLOTS: readonly EquipmentSlot[] = ['weapon', 'armor', 'recovery', 'mobility', 'core', 'relic'];

export type StepKey = 'form' | 'lean' | 'verb' | 'row' | 'gate';

/** One step of the lit band, as a pip: done, the next one, or still ahead. */
export interface StepPip {
  key: StepKey;
  /** "Form", "Lean I", "Lean II", "Verb", "Gate". */
  label: string;
  done: boolean;
  /** The first step not yet done. */
  next: boolean;
}

/** What the weapon's page has for sale right now (`checkUnlockCard` / `checkUnlockForm` say ok). */
export interface BuyableCount {
  /** Ranks of owned ranked cards the player can buy (Contract 1: buying an owned lean buys its next rank). */
  ranks: number;
  /** Cards not yet owned the player can buy. */
  cards: number;
  /** A gate the player can pay. */
  gate: boolean;
}

export interface WornEntry {
  slot: EquipmentSlot;
  slotLabel: string;
  defId: string | null;
  name: string;
  icon: string | null;
  /** "Weapon · Swamp lineage · Tier 1", "Armor · Forest · +44 HP". */
  sub: string;
  /** `page`: the weapon's page opens; `plain`: a plain item (§24.5); `empty`: nothing worn. */
  kind: 'page' | 'plain' | 'empty';
  steps: StepPip[];
  buyable: BuyableCount;
  /** The badge text ("1 rank to buy"), or undefined with nothing to buy. */
  badge?: string;
}

const NUMERALS = ['', 'I', 'II', 'III', 'IV', 'V'];

/** The pips of the lit band: form, lean (one per rank), verb, the other rows, gate. */
export function bandSteps(lineage: LineageDefinition, progress: LineageProgress): StepPip[] {
  const tier = Math.max(1, wornFormTier(lineage, progress));
  const { cards, gateForms } = bandContents(lineage, tier);
  const steps: Omit<StepPip, 'next'>[] = [{ key: 'form', label: 'Form', done: true }];

  const leans = cards.filter((c) => c.row === 'stat');
  if (leans.length > 0) {
    const ranks = Math.max(...leans.map((c) => maxCardRank(c)));
    const owned = Math.max(0, ...leans.map((c) => cardRank(progress, c.id)));
    if (ranks > 1) {
      for (let r = 1; r <= ranks; r++) steps.push({ key: 'lean', label: `Lean ${NUMERALS[r] ?? r}`, done: owned >= r });
    } else {
      steps.push({ key: 'lean', label: 'Lean', done: owned >= 1 });
    }
  }
  const verbs = cards.filter((c) => c.row === 'payoff');
  if (verbs.length > 0) steps.push({ key: 'verb', label: 'Verb', done: verbs.some((c) => progress.ownedCards.includes(c.id)) });
  for (const row of ['amplifier', 'keystone', 'cross'] as const) {
    const inRow = cards.filter((c) => c.row === row);
    if (inRow.length === 0) continue;
    steps.push({ key: 'row', label: row.charAt(0).toUpperCase() + row.slice(1), done: inRow.some((c) => progress.ownedCards.includes(c.id)) });
  }
  if (gateForms.length > 0) {
    steps.push({ key: 'gate', label: 'Gate', done: gateForms.some((f) => progress.ownedForms.includes(f.recipeId)) });
  }
  const firstOpen = steps.findIndex((s) => !s.done);
  return steps.map((s, i) => ({ ...s, next: i === firstOpen }));
}

/** What the lit band sells right now, by the shared checks. */
export function buyableOnPage(
  lineage: LineageDefinition,
  progress: LineageProgress,
  wallet: LineageWallet,
  lineages?: LineageProgressMap,
): BuyableCount {
  const tier = Math.max(1, wornFormTier(lineage, progress));
  const { cards, gateForms } = bandContents(lineage, tier);
  let ranks = 0;
  let unowned = 0;
  const sells = (card: LineageCard) => checkUnlockCard({ lineage, card, progress, wallet, lineages }).ok;
  for (const card of cards) {
    const owned = progress.ownedCards.includes(card.id);
    if (owned) {
      if (maxCardRank(card) > 1 && cardRank(progress, card.id) < maxCardRank(card) && sells(card)) ranks++;
    } else if (sells(card)) {
      unowned++;
    }
  }
  const gate = gateForms.some((form) => !progress.ownedForms.includes(form.recipeId)
    && checkUnlockForm({ lineage, form, progress, wallet }).ok);
  return { ranks, cards: unowned, gate };
}

/** "1 rank to buy", "2 cards to buy", "gate ready", or undefined. */
export function buyableBadge(count: BuyableCount): string | undefined {
  if (count.ranks > 0) return `${count.ranks} rank${count.ranks === 1 ? '' : 's'} to buy`;
  if (count.cards > 0) return `${count.cards} card${count.cards === 1 ? '' : 's'} to buy`;
  if (count.gate) return 'gate ready';
  return undefined;
}

/** The number the menu entry's badge shows: everything there is to buy, the gate as one. */
export function buyableTotal(count: BuyableCount): number {
  return count.ranks + count.cards + (count.gate ? 1 : 0);
}

const NOTHING: BuyableCount = { ranks: 0, cards: 0, gate: false };

function plainSub(slot: EquipmentSlot, defId: string): string {
  const recipe = RECIPE_DATABASE.get(defId);
  const stats = statEntries(recipe?.stats as Record<string, number> | undefined)
    .slice(0, 2)
    .map((s) => `${s.value} ${s.label}`);
  return [SLOT_LABELS[slot] ?? slot, recipe?.recipeGroup ? biomeName(recipe.recipeGroup) : undefined, ...stats]
    .filter(Boolean).join(' · ');
}

/**
 * The worn items, weapon first: the weapon with its page (steps and badge), every
 * other worn item a plain item. An empty weapon or armour slot still shows, so
 * the list always opens on the same rows; an empty relic slot does not.
 */
export function wornEntries(params: {
  equipment: EquipmentMap;
  lineages: LineageProgressMap;
  wallet: LineageWallet;
}): WornEntry[] {
  const { equipment, lineages, wallet } = params;
  const out: WornEntry[] = [];
  for (const slot of UPGRADE_SLOTS) {
    const defId = equipment[slot] ?? null;
    if (!defId && slot === 'relic') continue;
    const slotLabel = SLOT_LABELS[slot] ?? slot;
    if (!defId) {
      out.push({ slot, slotLabel, defId, name: `No ${slotLabel.toLowerCase()}`, icon: null, sub: slotLabel, kind: 'empty', steps: [], buyable: NOTHING });
      continue;
    }
    const def = ITEM_DATABASE.get(defId);
    const lineage = lineageForEquippedItem(defId);
    if (lineage) {
      const progress = lineages[lineage.id] ?? emptyLineageProgress(lineage, defId);
      const tier = Math.max(1, wornFormTier(lineage, progress));
      const buyable = buyableOnPage(lineage, progress, wallet, lineages);
      out.push({
        slot, slotLabel, defId, name: def?.name ?? defId, icon: def?.icon ?? null,
        sub: `${slotLabel} · ${biomeName(lineage.homeBiome)} lineage · Tier ${tier}`,
        kind: 'page', steps: bandSteps(lineage, progress), buyable,
        ...(buyableBadge(buyable) ? { badge: buyableBadge(buyable) } : {}),
      });
      continue;
    }
    out.push({
      slot, slotLabel, defId, name: def?.name ?? defId, icon: def?.icon ?? null,
      sub: plainSub(slot, defId), kind: 'plain', steps: [], buyable: NOTHING,
    });
  }
  return out;
}
