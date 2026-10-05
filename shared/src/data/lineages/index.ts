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

/**
 * Is this tree parked (design §24.5)? A parked lineage keeps its data and is
 * unreachable everywhere: no page entry, nothing purchasable, nothing resolved
 * at runtime, no tree created for it, and its forms are plain recipes. Every
 * armour, charm and boots lineage is parked for the second playtest.
 */
export function isLineageParked(lineage: Pick<LineageDefinition, 'parked'> | string | undefined): boolean {
  const def = typeof lineage === 'string' ? LINEAGE_DATABASE.get(lineage) : lineage;
  return def?.parked === true;
}

/** The lineages a player can actually reach — every one that is not parked. */
export function liveLineages(): LineageDefinition[] {
  return [...LINEAGE_DATABASE.values()].filter((l) => !isLineageParked(l));
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

/**
 * A form that is opened at its lineage's gate (tier >= 2), never crafted. The
 * re-homed doors have no `evolvesFrom`, so the crafting guard and the Make tab
 * need this rather than the recipe graph (review finding B4, 2026-10-02).
 *
 * A PARKED lineage's forms are not gated: with its tree unreachable they are
 * plain recipes, crafted at their biome level like any other item (design
 * §24.5 — "a T2 vest is a plain recipe gated by biome level"). One check, read
 * by the server's craft guard and the Make tab alike.
 */
export function isGatedLineageForm(recipeId: string): boolean {
  for (const lineage of LINEAGE_DATABASE.values()) {
    const form = lineage.forms.find((f) => f.recipeId === recipeId);
    if (form) return form.tier > 1 && !isLineageParked(lineage);
  }
  return false;
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
 * The distinct Lane-A packets of every lineage homed in a biome — the input to
 * design §18.6's boss shard stopgap: "the boss pays four shards of the lineage's
 * Lane A packet plus the capstone, so a boss-only lane buys a payoff card in two
 * kills". Derived from the registered lineages rather than a second hand-kept
 * table. See `server/src/systems/player/progression/rewards.ts`.
 *
 * WHY EVERY LINEAGE AND NOT JUST THE DEFENSIVE ONES. This read the three
 * non-weapon lineages only, because when §17 wrote the stopgap every WEAPON Lane A
 * already had a mob family dropping its shard. §22's Technique packet broke that
 * assumption: it is the Broadsword's Lane A, and with Plains Swarm its only
 * family source it would otherwise have ONE T1 source where §12's coverage rule
 * asks for two. §18.6's sentence says "the lineage's Lane A packet" without
 * qualification, so the rule is now what it says. The four other weapon Lane As
 * (Rapier and Axe Tempo, Hammer Empowered, Dagger Affliction) already had family
 * sources, so for them this is a small boss-kill bonus rather than access.
 *
 * PARKED LINEAGES PAY NOTHING (design §24.5, course-correction report item 17). A
 * parked tree can spend no shard, so its Lane A is not paid: while the armour,
 * charm and boots trees are parked the stopgap pays the weapon lanes only, and no
 * boss pays Iron (Bulwark) or Glass (Barrier tempo) Shards. Read off
 * `isLineageParked`, so un-parking a tree restores its Lane A here with no other
 * edit.
 */
export function biomeLaneAPackets(biome: string): PacketId[] {
  const packets = new Set<PacketId>();
  for (const lineage of LINEAGE_DATABASE.values()) {
    if (lineage.homeBiome !== biome) continue;
    if (isLineageParked(lineage)) continue;
    packets.add(lineage.lanes[0]);
  }
  return [...packets];
}

export * from './types';
export * from './packets';
export * from './keystones';
export * from './magnitudes';
export * from './resolve';
export * from './capstones';
export * from './sentences';
export * from './retired';
