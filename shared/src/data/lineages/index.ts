/**
 * The lineage database (progression rework Phase 1a).
 *
 * Five weapon lineages, one per T1 biome (design §2). Armor, charm and boots
 * lineages land in Phase 4 and register here the same way.
 */
import { AXE_LINEAGE } from './axe';
import { BROADSWORD_LINEAGE } from './broadsword';
import { DAGGER_LINEAGE } from './dagger';
import { HAMMER_LINEAGE } from './hammer';
import { RAPIER_LINEAGE } from './rapier';
import type { EquipmentSlot } from '../../items';
import type { LineageCard, LineageDefinition, LineageForm, PacketId } from './types';

const lineageEntries: [string, LineageDefinition][] = [
  ['broadsword', BROADSWORD_LINEAGE],
  ['rapier', RAPIER_LINEAGE],
  ['hammer', HAMMER_LINEAGE],
  ['axe', AXE_LINEAGE],
  ['dagger', DAGGER_LINEAGE],
];

export const LINEAGE_DATABASE: Map<string, LineageDefinition> =
  new Map<string, LineageDefinition>(lineageEntries);

export function lineageDefinition(id: string): LineageDefinition | undefined {
  return LINEAGE_DATABASE.get(id);
}

/** Every lineage that fills `slot`. The slot holds the lineage, not an item. */
export function lineagesForSlot(slot: EquipmentSlot): LineageDefinition[] {
  return [...LINEAGE_DATABASE.values()].filter((l) => l.slot === slot);
}

/** The lineage a card belongs to, by card id — the runtime's lookup. */
export function lineageForCardId(cardId: string): LineageDefinition | undefined {
  for (const lineage of LINEAGE_DATABASE.values()) {
    if (lineage.cards.some((c) => c.id === cardId)) return lineage;
  }
  return undefined;
}

export function lineageCard(lineageId: string, cardId: string): LineageCard | undefined {
  return LINEAGE_DATABASE.get(lineageId)?.cards.find((c) => c.id === cardId);
}

export function lineageForm(lineageId: string, recipeId: string): LineageForm | undefined {
  return LINEAGE_DATABASE.get(lineageId)?.forms.find((f) => f.recipeId === recipeId);
}

/** The lineage that owns a form's recipe id — how an equipped item finds its tree. */
export function lineageForRecipeId(recipeId: string): LineageDefinition | undefined {
  for (const lineage of LINEAGE_DATABASE.values()) {
    if (lineage.forms.some((f) => f.recipeId === recipeId)) return lineage;
  }
  return undefined;
}

/** The forms a tier's gate opens — every form one tier above it. */
export function formsAtGate(lineage: LineageDefinition, gateTier: number): LineageForm[] {
  return lineage.forms.filter((f) => f.tier === gateTier + 1);
}

/** The cards in one band. */
export function cardsForTier(lineage: LineageDefinition, tier: number): LineageCard[] {
  return lineage.cards.filter((c) => c.tier === tier);
}

/** Which lineages of a slot carry `lane` — the coverage rule's raw material. */
export function lineagesWithLane(slot: EquipmentSlot, lane: PacketId): LineageDefinition[] {
  return lineagesForSlot(slot).filter((l) => l.lanes.includes(lane));
}

export * from './types';
export * from './packets';
export * from './magnitudes';
export * from './resolve';
export * from './capstones';
