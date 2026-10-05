/**
 * The ONE seam between the HUD/panels (agent D) and the two contracts other
 * agents of the legibility run implement in shared (reports/legibility/SCOPE.md):
 *
 *  - Contract 1, ranks (agent A): `cardRank`, `maxCardRank`,
 *    `resolveLineageCardAtRank`, `cardSentence(card, progress, { rank })`,
 *    `composedSentenceParts`, `LineageCard.leanKind`, `LineageProgress.ranks`.
 *  - Contract 3, status ids (agent B): `isAfflictionStatusId`, `isHoldStatusId`.
 *
 * Every client file reads those names through HERE, never from shared directly,
 * so wiring the real API in is a change to this one file. Until a function exists
 * in shared, the fallback below answers with today's model (no ranks: an owned
 * card is rank I of I; the classifiers are a local list mirroring the server's
 * `playerDotsOnMonster` families and `monsterIsHeld`).
 *
 * The shared function is used the moment it is exported (looked up by name), so a
 * merge of A's or B's branch switches the page over before this file is edited;
 * the edit after the merge only replaces the lookups with typed imports.
 */
import * as shared from '@mmo-idle/shared';
import {
  composeVerb,
  isVerbCard,
  leanLaneFor,
  momentText,
  payloadText,
  pureSentenceText,
  resolveLineageCardFor,
  type LineageCard,
  type LineageDefinition,
  type LineageProgress,
  type PacketId,
  type ResolvedLineageCard,
} from '@mmo-idle/shared';

/** Look a contract function up on the shared barrel, if it has landed. */
function contract<T>(name: string): T | undefined {
  const value = (shared as unknown as Record<string, unknown>)[name];
  return typeof value === 'function' ? (value as T) : undefined;
}

// ─── Contract 1: ranks ───────────────────────────────────────────────────────

export type LeanKind = 'attack' | 'speed' | 'effect';

/** The T1 lean trio's kind (`LineageCard.leanKind`), or undefined for any other card. */
export function leanKindOf(card: LineageCard): LeanKind | undefined {
  return (card as LineageCard & { leanKind?: LeanKind }).leanKind;
}

/** 0 when not owned, else the owned rank (≥ 1). */
export function cardRank(progress: LineageProgress, cardId: string): number {
  const real = contract<(p: LineageProgress, id: string) => number>('cardRank');
  if (real) return real(progress, cardId);
  if (!progress.ownedCards.includes(cardId)) return 0;
  return (progress as LineageProgress & { ranks?: Record<string, number> }).ranks?.[cardId] ?? 1;
}

/** 3 for a ranked card (the T1 lean trio), 1 otherwise. */
export function maxCardRank(card: LineageCard): number {
  const real = contract<(c: LineageCard) => number>('maxCardRank');
  if (real) return real(card);
  return leanKindOf(card) ? 3 : 1;
}

/** The card resolved at `rank`: its numbers, its Global Mastery gate, the cost of buying that rank. */
export function resolveCardAtRank(
  lineage: LineageDefinition,
  progress: LineageProgress,
  card: LineageCard,
  rank: number,
): ResolvedLineageCard {
  const real = contract<(l: LineageDefinition, p: LineageProgress, c: LineageCard, r: number) => ResolvedLineageCard>(
    'resolveLineageCardAtRank',
  );
  return real ? real(lineage, progress, card, rank) : resolveLineageCardFor(lineage, progress, card);
}

/** A card's one sentence at its owned rank, or at `rank` for a preview. */
export function cardSentenceAt(card: LineageCard, progress: LineageProgress, rank?: number): string | undefined {
  // `cardSentence` takes `opts.rank` once Contract 1 lands; before, the extra
  // argument is ignored and the sentence reads the only rank there is.
  const sentence = shared.cardSentence as (c: LineageCard, p: LineageProgress, opts?: { rank?: number }) => string | undefined;
  return sentence(card, progress, rank !== undefined ? { rank } : undefined);
}

/** The two halves of a verb's sentence, for the two-colour plate (never parsed from text). */
export interface SentenceParts {
  moment: string;
  payload: string;
  momentLane: PacketId;
  payloadLane: PacketId;
  pure: boolean;
}

/**
 * The active verb's sentence as its two halves — `composedSentenceParts` from
 * shared once it lands. The fallback composes the same halves the shared
 * sentence generator joins (`momentText` / `payloadText`); a pure pair's sentence
 * is hand-authored and whole, so it comes back as one half in the verb's lane.
 */
export function composedParts(
  lineage: LineageDefinition,
  progress: LineageProgress,
  opts?: { rank?: number; leanId?: string },
): SentenceParts | undefined {
  const real = contract<(l: LineageDefinition, p: LineageProgress, o?: { rank?: number; leanId?: string }) => SentenceParts | undefined>(
    'composedSentenceParts',
  );
  if (real) return real(lineage, progress, opts);
  const verbId = progress.active.payoff;
  if (!verbId || !progress.ownedCards.includes(verbId)) return undefined;
  const verb = lineage.cards.find((c) => c.id === verbId);
  if (!verb || !isVerbCard(verb)) return undefined;
  const composed = composeVerb(verb.lane, leanLaneFor(lineage, progress), verb.tier);
  if (!composed) return undefined;
  if (composed.pure || !composed.leanLane) {
    const whole = pureSentenceText(verb.lane, verb.tier);
    return whole ? { moment: whole, payload: '', momentLane: verb.lane, payloadLane: verb.lane, pure: true } : undefined;
  }
  const moment = momentText(verb.lane, composed.trigger);
  const payload = payloadText(composed.leanLane, 1, composed.payoff);
  if (moment === undefined || payload === undefined) return undefined;
  return { moment, payload: `${payload}.`, momentLane: verb.lane, payloadLane: composed.leanLane, pure: false };
}

// ─── Contract 3: status ids ──────────────────────────────────────────────────

/** Fallback list: the DoT records the server's `playerDotsOnMonster` families own. */
const AFFLICTION_IDS: ReadonlySet<string> = new Set([
  'dot', 'dot-smolder', 'dot-conf', 'cadence-hemorrhage', 'energy-storm', 'void-corruption',
  'lineage.bleed', 'lineage.hemorrhage', 'lineage.lean-bleed', 'lineage.poison',
]);

/** Fallback list: the holds `monsterIsHeld` reads (slowed, rooted, chilled, frozen, stunned). */
const HOLD_IDS: ReadonlySet<string> = new Set([
  'ability-slowed', 'ability-rooted', 'dot-chill', 'dot-frozen', 'stunned', 'slow', 'root',
]);

/** Does this target status id count as "afflicted" (any damage-over-time)? */
export function isAfflictionStatusId(id: string): boolean {
  const real = contract<(id: string) => boolean>('isAfflictionStatusId');
  if (real) return real(id);
  // A weapon reservoir (`poison-dagger-burn`, `cinderbrand-burn`, …) is a DoT too.
  return AFFLICTION_IDS.has(id) || id.endsWith('-burn');
}

/** Does this target status id count as "held" (slowed, rooted, chilled, frozen, stunned)? */
export function isHoldStatusId(id: string): boolean {
  const real = contract<(id: string) => boolean>('isHoldStatusId');
  if (real) return real(id);
  return HOLD_IDS.has(id) || id.startsWith('lineage.hobbled') || id.startsWith('lineage.pinned');
}
