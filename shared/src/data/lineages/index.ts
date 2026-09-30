/**
 * The lineage database (progression rework Phase 1a, extended Phase 4).
 *
 * Five weapon lineages, one per T1 biome (design §2), plus five each of armor,
 * recovery and mobility lineages (design §17 — PROVISIONAL, not yet approved;
 * see each file's header) for twenty total.
 */
import { AXE_LINEAGE } from './axe';
import { BROADSWORD_LINEAGE } from './broadsword';
import { DAGGER_LINEAGE } from './dagger';
import { HAMMER_LINEAGE } from './hammer';
import { RAPIER_LINEAGE } from './rapier';
import { ROBE_LINEAGE } from './robe';
import { BINDINGS_LINEAGE } from './bindings';
import { PLATE_LINEAGE } from './plate';
import { HIDE_LINEAGE } from './hide';
import { WRAPPINGS_LINEAGE } from './wrappings';
import { STONE_LINEAGE } from './stone';
import { HEARTROOT_LINEAGE } from './heartroot';
import { BARRIER_LINEAGE } from './barrier';
import { PULSE_LINEAGE } from './pulse';
import { EYE_LINEAGE } from './eye';
import { FLEET_LINEAGE } from './fleet';
import { WRAPS_LINEAGE } from './wraps';
import { TREADS_LINEAGE } from './treads';
import { WING_LINEAGE } from './wing';
import { MARSH_LINEAGE } from './marsh';
import type { EquipmentSlot } from '../../items';
import type { LineageCard, LineageDefinition, LineageForm, PacketId } from './types';

const lineageEntries: [string, LineageDefinition][] = [
  ['broadsword', BROADSWORD_LINEAGE],
  ['rapier', RAPIER_LINEAGE],
  ['hammer', HAMMER_LINEAGE],
  ['axe', AXE_LINEAGE],
  ['dagger', DAGGER_LINEAGE],
  ['robe', ROBE_LINEAGE],
  ['bindings', BINDINGS_LINEAGE],
  ['plate', PLATE_LINEAGE],
  ['hide', HIDE_LINEAGE],
  ['wrappings', WRAPPINGS_LINEAGE],
  ['stone', STONE_LINEAGE],
  ['heartroot', HEARTROOT_LINEAGE],
  ['barrier', BARRIER_LINEAGE],
  ['pulse', PULSE_LINEAGE],
  ['eye', EYE_LINEAGE],
  ['fleet', FLEET_LINEAGE],
  ['wraps', WRAPS_LINEAGE],
  ['treads', TREADS_LINEAGE],
  ['wing', WING_LINEAGE],
  ['marsh', MARSH_LINEAGE],
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

/**
 * The distinct Lane-A packets of a biome's three non-weapon lineages (design
 * §17's shard-sourcing stopgap): Engagement, Bulwark and Barrier tempo have no
 * T1 mob family at all, so a biome boss kill also drops shards of these —
 * derived from the registered lineages rather than a second hand-kept table.
 * See `server/src/systems/player/progression/rewards.ts`.
 */
export function biomeDefensiveLaneAPackets(biome: string): PacketId[] {
  const packets = new Set<PacketId>();
  for (const lineage of LINEAGE_DATABASE.values()) {
    if (lineage.slot === 'weapon' || lineage.homeBiome !== biome) continue;
    packets.add(lineage.lanes[0]);
  }
  return [...packets];
}

export * from './types';
export * from './packets';
export * from './magnitudes';
export * from './resolve';
export * from './capstones';
