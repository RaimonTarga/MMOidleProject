/**
 * Lineage cards that no longer exist, and what a save that bought one gets back.
 *
 * Design §26.1 (legibility run, 2026-10-05) replaced every weapon's T1 band: the
 * three lane-named leans (`<weapon>-t1-<lane>-stat`) became the generic Attack /
 * Speed / Effect trio, and the T1 verb row became ONE card, the weapon's own verb
 * (its id kept). The two other verbs per weapon, and the fifteen lane leans, left
 * the band. Production saves own them, so the hydration path refunds them
 * (`refundRetiredLineageCards`, server side) at the price they cost — today's T1
 * row price, because the price a save actually paid (full, or the half-price
 * lineage-switch discount) was never recorded. Normalisation drops the ids
 * themselves (`normalizeLineageProgressMap`: unknown card ids, and any active row
 * pointing at one), so nothing here ever reaches the runtime.
 *
 * Shape only (the tier is always 1); the price is computed from `magnitudes.ts`.
 * Kept as data rather than derived from the card files, because the cards are gone.
 */
import type { PacketId } from './types';

export interface RetiredLineageCard {
  id: string;
  lineageId: string;
  /** The row it sat in; its price is that T1 row's. */
  row: 'stat' | 'payoff';
  /** The lane it was paid in: the shard the refund returns. */
  lane: PacketId;
  /** Its name, for the refund's log line. */
  name: string;
}

const retired = (
  lineageId: string, row: 'stat' | 'payoff', lane: PacketId, name: string,
): [string, RetiredLineageCard] => {
  const id = `${lineageId}-t1-${lane}-${row}`;
  return [id, { id, lineageId, row, lane, name }];
};

/** Every retired T1 card, by id. The kept fixed verbs are NOT here. */
export const RETIRED_LINEAGE_CARDS: ReadonlyMap<string, RetiredLineageCard> = new Map<string, RetiredLineageCard>([
  // The Dagger (Swamp): leans, and the two verbs that are not Into the Wound.
  retired('dagger', 'stat', 'affliction', 'Coated Edge'),
  retired('dagger', 'stat', 'control', 'Tendon Cut'),
  retired('dagger', 'stat', 'kill-chain', 'Silent Step'),
  retired('dagger', 'payoff', 'control', 'Easy Prey'),
  retired('dagger', 'payoff', 'kill-chain', 'Next Throat'),
  // The Rapier (Forest): Flurry is kept.
  retired('rapier', 'stat', 'tempo', 'Quick Wrist'),
  retired('rapier', 'stat', 'affliction', 'Envenomed'),
  retired('rapier', 'stat', 'engagement', 'Keen Edge'),
  retired('rapier', 'payoff', 'affliction', 'Venom Point'),
  retired('rapier', 'payoff', 'engagement', 'Opening Lunge'),
  // The Hammer (Mountain): the Control verb is kept (renamed Easy Prey).
  retired('hammer', 'stat', 'empowered', 'Overhead'),
  retired('hammer', 'stat', 'control', 'Crushing Weight'),
  retired('hammer', 'stat', 'engagement', 'Closing Stride'),
  retired('hammer', 'payoff', 'empowered', 'Crash Down'),
  retired('hammer', 'payoff', 'engagement', 'Doorbreaker'),
  // The Axe (Cave): Chopping Rhythm is kept.
  retired('axe', 'stat', 'tempo', 'Loose Grip'),
  retired('axe', 'stat', 'kill-chain', 'Bloodscent'),
  retired('axe', 'stat', 'empowered', 'Hewing Arc'),
  retired('axe', 'payoff', 'kill-chain', 'Next Head'),
  retired('axe', 'payoff', 'empowered', 'Cleaving Blow'),
  // The Broadsword (Plains): Set Piece is kept.
  retired('broadsword', 'stat', 'kill-chain', 'Warpath'),
  retired('broadsword', 'stat', 'empowered', 'Weight Behind It'),
  retired('broadsword', 'stat', 'technique', 'Drilled Form'),
  retired('broadsword', 'payoff', 'kill-chain', 'Onward'),
  retired('broadsword', 'payoff', 'empowered', 'Crowning Blow'),
]);

export function retiredLineageCard(id: string): RetiredLineageCard | undefined {
  return RETIRED_LINEAGE_CARDS.get(id);
}
