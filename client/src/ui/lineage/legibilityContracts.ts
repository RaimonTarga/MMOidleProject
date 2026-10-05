/**
 * The seam between the HUD/panels and the two shared contracts the legibility run
 * landed (reports/legibility/SCOPE.md):
 *
 *  - Contract 1, ranks (agent A): `cardRank`, `maxCardRank`,
 *    `resolveLineageCardAtRank`, `cardSentence(card, progress, { rank })`,
 *    `composedSentenceParts(lineage, progress, { leanId?, rank? })`,
 *    `LineageCard.leanKind`, `LineageProgress.ranks`.
 *  - Contract 3, status ids (agent B): `isAfflictionStatusId`, `isHoldStatusId`
 *    (`shared/src/systems/targetConditions.ts`).
 *
 * Typed re-exports under the names the client was written against, so the
 * page, the Upgrade list, the Stats panel and the ring read one module.
 */
import {
  cardRank,
  cardSentence,
  composedSentenceParts,
  isAfflictionStatusId,
  isHoldStatusId,
  maxCardRank,
  resolveLineageCardAtRank,
  type ComposedSentenceParts,
  type LeanKind,
  type LineageCard,
  type LineageDefinition,
  type LineageProgress,
  type ResolvedLineageCard,
} from '@mmo-idle/shared';

export { cardRank, isAfflictionStatusId, isHoldStatusId, maxCardRank };
export type { LeanKind };

/** The two halves of a verb's sentence, for the two-colour plate (never parsed from text). */
export type SentenceParts = ComposedSentenceParts;

/** The T1 lean trio's kind, or undefined for any other card. */
export function leanKindOf(card: LineageCard): LeanKind | undefined {
  return card.leanKind;
}

/** The card resolved at `rank`: its numbers, its Global Mastery gate, the cost of buying that rank. */
export function resolveCardAtRank(
  lineage: LineageDefinition,
  progress: LineageProgress,
  card: LineageCard,
  rank: number,
): ResolvedLineageCard {
  return resolveLineageCardAtRank(lineage, progress, card, rank);
}

/** A card's one sentence at its owned rank, or at `rank` for a preview. */
export function cardSentenceAt(card: LineageCard, progress: LineageProgress, rank?: number): string | undefined {
  return cardSentence(card, progress, rank !== undefined ? { rank } : {});
}

/** The active verb's sentence in its two halves, with the active (or a previewed) lean and rank. */
export function composedParts(
  lineage: LineageDefinition,
  progress: LineageProgress,
  opts?: { rank?: number; leanId?: string | null },
): SentenceParts | undefined {
  return composedSentenceParts(lineage, progress, opts ?? {});
}
