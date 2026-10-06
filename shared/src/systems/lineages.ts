/**
 * Lineage tree rules — the shared authority (progression rework Phase 1a).
 *
 * Pure functions the SERVER applies and the CLIENT gates buttons with, so the
 * two can never disagree (the arrangement the retired +N ladder and evolve path
 * had with `checkUpgrade`/`checkEvolve`). Nothing here mutates; the Phase 1b handlers in
 * `server/src/systems/player/economy/lineages.ts` validate with these, then spend
 * and mutate.
 *
 * Design authority: `design_docs/progression-rework-design.md` §2, §4, §5, §7.
 *
 * The two invariants every check enforces:
 *  - **Owned is forever, active is a choice.** Buying is permanent and costs;
 *    swapping which owned card is active, or which owned form is worn, is free,
 *    instant, and never fails for economic reasons.
 *  - **One row, one active card.** A row is a choice, not a shopping list.
 */
import { ESSENCE_LABELS } from '../items';
import { RETIRED_LINEAGE_CARDS } from '../data/lineages/retired';
import { RECIPE_DATABASE } from '../data/recipes';
import { BIOME_DATABASE } from '../biomeDatabase';
import { shardName } from '../data/lineages/packets';
import type { EquipmentSlot, EssenceType } from '../items';
import type { SubVariant } from '../data/skillTree/types';
import { biomeLevelCap } from '../config/gameConfig';
import type { HoldsInventory } from '../components/core/networkedSlices';
import {
  cardsForTier, formsAtGate, isLineageParked, LINEAGE_DATABASE, lineageForRecipeId, lineagesForSlot,
} from '../data/lineages';
import { capstoneMaterialName } from '../data/lineages/capstones';
import {
  ROW_SCALAR, clampLeanRank, lengthenPayload, lineageMasteryLevelForRow, quickenMoment, rankNumeral,
  rowsForTier, scalePayloadSize, tierHasRow,
} from '../data/lineages/magnitudes';
import {
  applyComposition, cardStatKey, composeVerb, formGateBiomeLevel, formGateMastery, isRankedCard,
  isVerbCard, leanPayloadLane, lineageCardCost, lineageGateCost, maxCardRank, resolveLineageCapstone,
  resolveLineageCard,
} from '../data/lineages/resolve';
import type { VerbComposition } from '../data/lineages/resolve';
import { compositionParts, effectLeanLine, statLine } from '../data/lineages/sentences';
import type { ComposedSentenceParts } from '../data/lineages/sentences';
import { payoffLandsOnTarget } from '../data/lineages/types';
import type {
  AmplifiedAxis, DefensiveFace, LineageCard, LineageDefinition, LineageForm,
  LineagePayoff, LineageProgress, LineageProgressMap, LineageStatEffects,
  LineageTrigger, PacketId, PayoffKind, ResolvedLineageCapstone, ResolvedLineageCard, RowKind,
} from '../data/lineages/types';

export interface LineageCheck {
  ok: boolean;
  reason?: string;
}

/**
 * The status-effect id a timed payoff is carried on (progression rework 1c).
 *
 * A window IS its status effect: the runtime reads the magnitude back off it and
 * the buff bar reads the clock off the same entry, so the mechanic and the HUD can
 * never disagree about how long is left. `data` is `{ totalMs, magnitude }` — the
 * only two numbers either side needs.
 *
 * Shared rather than server-local because the client's buff tiles key off the id.
 */
export function lineageStatusEffectId(payoff: PayoffKind): string {
  return `lineage.${payoff}`;
}

/**
 * The defensive face a frame expresses (design §3.1). Defensive cards pay out in
 * full on the matching face and at `OFF_FACE_SCALAR` off it — bias, never lock,
 * so no encounter hard-counters a frame. Offensive cards ignore this entirely.
 *
 * No sub-variant chosen yet means no bias: a card pays in full rather than being
 * penalised for a choice the player has not made.
 */
export function defensiveFaceForSubVariant(sub: SubVariant | null | undefined): DefensiveFace | undefined {
  switch (sub) {
    case 'light':    return 'avoid';
    case 'balanced': return 'sustain';
    case 'heavy':    return 'endure';
    default:         return undefined;
  }
}

const OK: LineageCheck = { ok: true };

/**
 * Why every check refuses a parked lineage (design §24.5). One string, so the
 * server's reply, the client's disabled button and the tests all say the same.
 */
export const PARKED_LINEAGE_REASON = 'This slot has no tree yet.';
const PARKED: LineageCheck = { ok: false, reason: PARKED_LINEAGE_REASON };

// ─── State helpers ───────────────────────────────────────────────────────────

/**
 * A fresh tree for a lineage: nothing owned but the T1 base form, which is the
 * item the player just crafted from the Make tab.
 */
export function emptyLineageProgress(lineage: LineageDefinition, wornForm?: string): LineageProgress {
  const base = wornForm ?? baseFormRecipeId(lineage);
  return { ownedCards: [], active: {}, ownedForms: base ? [base] : [], wornForm: base ?? '' };
}

/** The tier-1 form, the one crafted rather than gated. */
export function baseFormRecipeId(lineage: LineageDefinition): string | undefined {
  return lineage.forms.find((f) => f.tier === 1)?.recipeId;
}

/**
 * Hydration-safe normalization. Drops unknown lineage ids, unknown card and form
 * ids, active entries whose card is not owned, and worn forms that are not owned
 * — so a save written before a card was renamed or retired loads clean instead of
 * granting a card that no longer exists.
 */
export function normalizeLineageProgressMap(
  stored: Partial<Record<string, Partial<LineageProgress>>> | undefined,
): LineageProgressMap {
  const out: LineageProgressMap = {};
  for (const [lineageId, raw] of Object.entries(stored ?? {})) {
    const lineage = LINEAGE_DATABASE.get(lineageId);
    if (!lineage || !raw) continue;

    const knownCards = new Set(lineage.cards.map((c) => c.id));
    const knownForms = new Set(lineage.forms.map((f) => f.recipeId));
    // A save is untrusted shape: anything that is not the list or map it should be
    // reads as empty rather than throwing the whole load.
    const list = (value: unknown): string[] => (Array.isArray(value) ? value.filter((id) => typeof id === 'string') : []);
    const ownedCards = [...new Set(list(raw.ownedCards).filter((id) => knownCards.has(id)))];
    const ownedForms = list(raw.ownedForms).filter((id) => knownForms.has(id));

    const active: Partial<Record<RowKind, string>> = {};
    const storedActive = raw.active && typeof raw.active === 'object' ? raw.active : {};
    for (const [row, cardId] of Object.entries(storedActive) as [RowKind, string][]) {
      const card = lineage.cards.find((c) => c.id === cardId);
      if (card && card.row === row && ownedCards.includes(cardId)) active[row] = cardId;
    }

    // Ownership is never invented here. The base form is recorded when the player
    // holds it (`syncLineagesFromInventory` on attach, craft and equip), and a tree
    // with no owned form stays empty — pushing the base form on every load was
    // review finding B1 (2026-10-02): a free T1 item per lineage per relog.
    const wornForm = typeof raw.wornForm === 'string' && ownedForms.includes(raw.wornForm)
      ? raw.wornForm
      : (ownedForms[0] ?? '');

    // Ranks (design §26.1): every OWNED ranked card carries its rank, a missing
    // one normalised to I and anything out of the table clamped into it; a rank
    // for a card the save does not own, or one that is not ranked, is dropped.
    const ranks: Record<string, number> = {};
    for (const id of ownedCards) {
      const card = lineage.cards.find((c) => c.id === id);
      if (!card || !isRankedCard(card)) continue;
      const stored = raw.ranks && typeof raw.ranks === 'object' ? raw.ranks[id] : undefined;
      ranks[id] = clampLeanRank(typeof stored === 'number' ? stored : 1);
    }

    out[lineageId] = {
      ownedCards, active, ownedForms, wornForm,
      ...(Object.keys(ranks).length > 0 ? { ranks } : {}),
    };
  }
  return out;
}

// ─── Ranks (design §26.1) ────────────────────────────────────────────────────

/**
 * The rank the player owns of a card: 0 when not owned, else its rank (≥ 1). An
 * unranked owned card is rank 1; a ranked one with no stored rank is rank 1 too
 * (hydration writes it in, but a tree built in memory may not have).
 */
export function cardRank(
  progress: Pick<LineageProgress, 'ownedCards' | 'ranks'> | undefined,
  cardId: string,
): number {
  if (!progress?.ownedCards.includes(cardId)) return 0;
  return clampLeanRank(progress.ranks?.[cardId] ?? 1);
}

/**
 * The rank buying this card would give: 1 for an unowned card, the next rank for
 * an owned ranked card below its max, undefined when there is nothing left to buy
 * (an owned unranked card, or a ranked one at its max).
 */
export function nextCardRank(
  progress: Pick<LineageProgress, 'ownedCards' | 'ranks'> | undefined,
  card: Pick<LineageCard, 'id' | 'leanKind'>,
): number | undefined {
  const current = cardRank(progress, card.id);
  if (current === 0) return 1;
  return current < maxCardRank(card) ? current + 1 : undefined;
}

export { isRankedCard, maxCardRank, rankNumeral };

/**
 * The player's tree for a lineage, or an untouched one. Never returns undefined,
 * so no caller has to branch on "has this player met this lineage yet" — and
 * nothing outside this file reads `holdsInventory.lineages` raw.
 */
export function lineageProgressFor(
  inventory: Pick<HoldsInventory, 'lineages'> | undefined,
  lineageId: string,
): LineageProgress {
  return inventory?.lineages?.[lineageId]
    ?? { ownedCards: [], active: {}, ownedForms: [], wornForm: '' };
}

// ─── Mastery and the switch discount ─────────────────────────────────────────

/** Re-exported so callers do not reach into the magnitude table for a gate check. */
export { lineageMasteryLevelForRow, rowsForTier, tierHasRow };

/**
 * The DOOR biome a band gates on — design §21.
 *
 * A band of tier N is earned in the biome whose boss let the player into tier N,
 * which is the biome of the form they wear at that tier. The Rapier's T3 band is
 * Jungle work, the Broadsword's is Desert work, the Axe's T4 band is Graveyard or
 * Trench work depending on which T4 axe is in hand. The home biome is only ever
 * the T1 door, so gating every band on it made the upper bands unreachable: Forest
 * and Plains stop at level 12 and a T4 row wants a level in the twenties.
 *
 * Three cases, in order:
 *  - The worn form IS of this tier: its biome. This is the lit band, and swapping
 *    to a form of the same tier from another biome re-resolves the whole band.
 *  - A band BELOW the worn form's (collapsed, still a wardrobe to buy from): the
 *    first owned form of that tier in authored order. Any owned door of that tier
 *    is a door the player genuinely walked through; authored order just makes the
 *    answer stable when they own both.
 *  - A band the player has not reached (silhouette) or an empty tree: the first
 *    authored form of that tier, else the home biome. Nothing there is buyable —
 *    `checkUnlockCard` refuses on the worn tier first — so this is a display
 *    default, and for tier 1 it is the base form, i.e. the home biome.
 */
export function lineageBandBiome(
  lineage: Pick<LineageDefinition, 'homeBiome' | 'forms'>,
  progress: Pick<LineageProgress, 'wornForm' | 'ownedForms'>,
  tier: number,
): string {
  const worn = lineage.forms.find((f) => f.recipeId === progress.wornForm);
  if (worn && worn.tier === tier) return worn.biome;
  const owned = lineage.forms.find(
    (f) => f.tier === tier && progress.ownedForms.includes(f.recipeId),
  );
  if (owned) return owned.biome;
  return lineage.forms.find((f) => f.tier === tier)?.biome ?? lineage.homeBiome;
}

/**
 * A card resolved against its band's door biome (design §21) — the one way the
 * server, the client and the tutorial should ever resolve a card they have the
 * player's tree for. `resolveLineageCard` with no `bandBiome` falls back to the
 * home biome, which is only right at T1.
 */
export function resolveLineageCardFor(
  lineage: LineageDefinition,
  progress: Pick<LineageProgress, 'wornForm' | 'ownedForms'> & Partial<Pick<LineageProgress, 'ownedCards' | 'ranks'>>,
  card: LineageCard,
  options: { frameFace?: DefensiveFace; discounted?: boolean; rank?: number } = {},
): ResolvedLineageCard {
  return resolveLineageCard(card, lineage, {
    ...options,
    // A ranked card resolves at the rank the player OWNS (rank I when they own
    // none) unless the caller names one — the purchase check names the NEXT rank.
    rank: options.rank ?? ownedRankOf(progress, card.id),
    bandBiome: lineageBandBiome(lineage, progress, card.tier),
  });
}

function ownedRankOf(progress: Partial<Pick<LineageProgress, 'ownedCards' | 'ranks'>>, cardId: string): number {
  if (progress.ownedCards && !progress.ownedCards.includes(cardId)) return 1;
  return clampLeanRank(progress.ranks?.[cardId] ?? 1);
}

/**
 * A card resolved at a given rank (design §26.1): its value, its sentence numbers,
 * its Global Mastery gate, and the cost of BUYING that rank. For the page's rank
 * preview and price tag. An unranked card ignores `rank`.
 */
export function resolveLineageCardAtRank(
  lineage: LineageDefinition,
  progress: Pick<LineageProgress, 'wornForm' | 'ownedForms'> & Partial<Pick<LineageProgress, 'ownedCards' | 'ranks'>>,
  card: LineageCard,
  rank: number,
  options: { frameFace?: DefensiveFace; discounted?: boolean } = {},
): ResolvedLineageCard {
  return resolveLineageCardFor(lineage, progress, card, { ...options, rank });
}

/**
 * Whether this row is HALF PRICE on this lineage because the player already owns
 * the same row at the same tier on another lineage of the same slot (design §2:
 * "a respec at T2 costs an afternoon, not a restart"). Gates are never discounted.
 */
export function lineageSwitchDiscount(params: {
  card: Pick<LineageCard, 'lineageId' | 'tier' | 'row'>;
  slot: EquipmentSlot;
  lineages: LineageProgressMap | undefined;
}): boolean {
  const { card, slot, lineages } = params;
  if (!lineages) return false;
  for (const other of lineagesForSlot(slot)) {
    if (other.id === card.lineageId) continue;
    const owned = lineages[other.id]?.ownedCards;
    if (!owned?.length) continue;
    const match = other.cards.some(
      (c) => c.tier === card.tier && c.row === card.row && owned.includes(c.id),
    );
    if (match) return true;
  }
  return false;
}

// ─── Affordability ───────────────────────────────────────────────────────────

/** A biome's display name for refusal text — "Forest", never "forest" (review L21). */
function biomeName(biomeGroup: string): string {
  return BIOME_DATABASE.get(biomeGroup)?.name ?? biomeGroup;
}

function affordEssence(
  cost: Partial<Record<EssenceType, number>>,
  essences: Partial<Record<EssenceType, number>>,
): LineageCheck {
  for (const [type, amount] of Object.entries(cost) as [EssenceType, number][]) {
    if ((essences[type] ?? 0) < amount) {
      return { ok: false, reason: `Not enough ${ESSENCE_LABELS[type]} essence (need ${amount}).` };
    }
  }
  return OK;
}

function affordShards(
  cost: Partial<Record<PacketId, number>>,
  shards: Partial<Record<PacketId, number>> | undefined,
): LineageCheck {
  for (const [packet, amount] of Object.entries(cost) as [PacketId, number][]) {
    if ((shards?.[packet] ?? 0) < amount) {
      // The player's noun, never the lane id (design §24.2, review L21).
      return { ok: false, reason: `Not enough ${shardName(packet)}s (need ${amount}).` };
    }
  }
  return OK;
}

// ─── The four checks ─────────────────────────────────────────────────────────

/** The wallets and progression a lineage purchase is judged against. */
export interface LineageWallet {
  essences: Partial<Record<EssenceType, number>>;
  /** Shard wallet, keyed by packet. Phase 2 puts it on `TracksProgression`. */
  shards?: Partial<Record<PacketId, number>>;
  /** Capstone wallet, keyed by biome. Phase 2 puts it on `TracksProgression`. */
  capstones?: Record<string, number>;
  /** Biome-local levels, keyed by biome group. */
  biomeLevels: Record<string, number>;
  globalMastery?: number;
  playerTier?: number;
  /** Test room skips ownership and cost gates, like `checkEvolve`. */
  isTestRoom?: boolean;
}

/**
 * Can the player BUY this card? Mastery gates *when*, materials gate *whether*
 * (design §4).
 */
export function checkUnlockCard(params: {
  lineage: LineageDefinition;
  card: LineageCard;
  progress: LineageProgress;
  wallet: LineageWallet;
  /** Cards already owned across the slot, for the switch discount. */
  lineages?: LineageProgressMap;
}): LineageCheck {
  const { lineage, card, progress, wallet, lineages } = params;

  if (isLineageParked(lineage)) return PARKED;
  if (card.lineageId !== lineage.id) return { ok: false, reason: 'That card belongs to another lineage.' };
  if (!lineage.cards.some((c) => c.id === card.id)) return { ok: false, reason: 'Unknown card.' };
  // An owned RANKED card is bought again for its next rank (design §26.1); every
  // other owned card, and a ranked one at its max, has nothing left to buy.
  const rank = nextCardRank(progress, card);
  if (rank === undefined) {
    return isRankedCard(card)
      ? { ok: false, reason: `Already at rank ${rankNumeral(maxCardRank(card))}.` }
      : { ok: false, reason: 'Already owned.' };
  }
  if (!lineage.lanes.includes(card.lane)) return { ok: false, reason: 'That lane is not on this lineage.' };

  // A band opens by wearing a form of that tier — the gate IS the band's key.
  const wornTier = wornFormTier(lineage, progress);
  if (card.tier > wornTier) {
    return { ok: false, reason: `Requires a tier-${card.tier} form. Pay the tier-${card.tier - 1} gate first.` };
  }

  // Amplifier / keystone / cross rows modify a card the player must already own.
  if (card.modifies && !progress.ownedCards.includes(card.modifies)) {
    const target = lineage.cards.find((c) => c.id === card.modifies);
    return { ok: false, reason: `Requires ${target?.name ?? 'the row below'} first.` };
  }

  if (wallet.isTestRoom) return OK;

  const discounted = lineageSwitchDiscount({ card, slot: lineage.slot, lineages });
  const resolved = resolveLineageCardFor(lineage, progress, card, { discounted, rank });

  // The band gates on its door biome, not on the home biome (design §21), so the
  // level AND the biome it is read in both come off the resolved card.
  const level = wallet.biomeLevels[resolved.requiredBiomeGroup] ?? 0;
  if (level < resolved.requiredBiomeLevel) {
    return {
      ok: false,
      reason: `Requires ${biomeName(resolved.requiredBiomeGroup)} level ${resolved.requiredBiomeLevel}.`,
    };
  }
  if (wallet.globalMastery !== undefined && wallet.globalMastery < resolved.requiredGlobalMastery) {
    return { ok: false, reason: `Requires Global Mastery ${resolved.requiredGlobalMastery}.` };
  }

  const essence = affordEssence(resolved.cost.essence, wallet.essences);
  if (!essence.ok) return essence;
  return affordShards(resolved.cost.shards, wallet.shards);
}

/**
 * Can the player make this owned card the active one for its row? Free, instant,
 * and the only failure modes are "you do not own it", "wrong row", and "that stat
 * row is already inside your form" (band collapse — see {@link statRowIsCollapsed}).
 */
export function checkSetActive(params: {
  lineage: LineageDefinition;
  progress: LineageProgress;
  row: RowKind;
  /** null clears the row. */
  cardId: string | null;
}): LineageCheck {
  const { lineage, progress, row, cardId } = params;
  if (isLineageParked(lineage)) return PARKED;
  if (cardId === null) return OK;
  const card = lineage.cards.find((c) => c.id === cardId);
  if (!card) return { ok: false, reason: 'Unknown card.' };
  if (card.row !== row) return { ok: false, reason: `That card is a ${card.row} card, not a ${row} card.` };
  if (!progress.ownedCards.includes(cardId)) return { ok: false, reason: 'You do not own that card.' };
  // The visible stat row is always the current tier's (design §4): a collapsed
  // band's stat row has folded into the worn form's base stats and is permanent,
  // so it can never be slotted a second time. Every OTHER row of a collapsed
  // band stays selectable — the band is a wardrobe to reslot from.
  if (statRowIsCollapsed(lineage, progress, card)) {
    return { ok: false, reason: 'That stat row is already part of your form.' };
  }
  return OK;
}

/**
 * Can the player pay the gate that opens this form? The gate costs essence,
 * the shard of the lane the form crowns, and the biome boss's capstone material
 * — which is why the boss is the only way up (design §5).
 */
export function checkUnlockForm(params: {
  lineage: LineageDefinition;
  form: LineageForm;
  progress: LineageProgress;
  wallet: LineageWallet;
}): LineageCheck {
  const { lineage, form, progress, wallet } = params;

  if (isLineageParked(lineage)) return PARKED;
  if (!lineage.forms.some((f) => f.recipeId === form.recipeId)) {
    return { ok: false, reason: 'That form is not part of this lineage.' };
  }
  if (progress.ownedForms.includes(form.recipeId)) return { ok: false, reason: 'Already owned.' };

  const gateTier = form.tier - 1;
  if (gateTier < 1) return { ok: false, reason: 'That form is crafted, not gated.' };
  if (wornFormTier(lineage, progress) < gateTier) {
    return { ok: false, reason: `Requires a tier-${gateTier} form first.` };
  }

  if (wallet.isTestRoom) return OK;

  // The gate is gated by the FORM's biome — a Jungle door needs Jungle levels.
  const level = wallet.biomeLevels[form.biome] ?? 0;
  const required = formGateBiomeLevel(form);
  if (level < required) return { ok: false, reason: `Requires ${biomeName(form.biome)} level ${required}.` };
  if (wallet.playerTier !== undefined && biomeLevelCap(wallet.playerTier, form.biome) < required) {
    return { ok: false, reason: `${biomeName(form.biome)} cannot reach level ${required} at your tier yet.` };
  }
  const mastery = formGateMastery(form);
  if (wallet.globalMastery !== undefined && wallet.globalMastery < mastery) {
    return { ok: false, reason: `Requires Global Mastery ${mastery}.` };
  }

  const cost = lineageGateCost(form, lineage);
  const essence = affordEssence(cost.essence, wallet.essences);
  if (!essence.ok) return essence;
  const shards = affordShards(cost.shards, wallet.shards);
  if (!shards.ok) return shards;

  const held = wallet.capstones?.[cost.capstone.biome] ?? 0;
  if (held < cost.capstone.amount) {
    return {
      ok: false,
      reason: `Not enough ${capstoneMaterialName(cost.capstone.biome)} (need ${cost.capstone.amount}).`,
    };
  }
  return OK;
}

/** Can the player wear this owned form? Free and instant, like swapping gear. */
export function checkWearForm(params: {
  lineage: LineageDefinition;
  progress: LineageProgress;
  recipeId: string;
}): LineageCheck {
  const { lineage, progress, recipeId } = params;
  if (isLineageParked(lineage)) return PARKED;
  if (!lineage.forms.some((f) => f.recipeId === recipeId)) {
    return { ok: false, reason: 'That form is not part of this lineage.' };
  }
  if (!progress.ownedForms.includes(recipeId)) return { ok: false, reason: 'You do not own that form.' };
  return OK;
}

// ─── Resolution for the runtime ──────────────────────────────────────────────

/** The tier of the form the player is wearing; 0 when they hold none. */
export function wornFormTier(lineage: LineageDefinition, progress: LineageProgress): number {
  return lineage.forms.find((f) => f.recipeId === progress.wornForm)?.tier ?? 0;
}

/**
 * The cards actually in play on one lineage: the active card of every row the
 * player owns one for. Everything else is owned but inert.
 */
export function resolveLineageCards(
  lineage: LineageDefinition,
  progress: LineageProgress,
  frameFace?: DefensiveFace,
): ResolvedLineageCard[] {
  const out: ResolvedLineageCard[] = [];
  for (const cardId of Object.values(progress.active)) {
    if (!cardId || !progress.ownedCards.includes(cardId)) continue;
    const card = lineage.cards.find((c) => c.id === cardId);
    if (!card) continue;
    // A stat row the form has absorbed is paid out by `absorbedStatCards`, not
    // here. Skipping it is what makes the fold land EXACTLY ONCE even when a
    // save still points `active.stat` at the card the gate collapsed.
    if (statRowIsCollapsed(lineage, progress, card)) continue;
    out.push(resolveLineageCardFor(lineage, progress, card, { frameFace }));
  }
  composeVerbs(out, lineage, progress);
  return composeAmplifiers(out);
}

// ─── The lean and verb compose, at every weapon band (design §24.2, §24.9) ───

/**
 * The lane of the active LEAN: the owned card in the active stat row, of any tier.
 * Its lane names the payload every verb of this lineage delivers.
 *
 * A collapsed band's stat card still counts when the save points `active.stat` at
 * it: the lane identity carries up through the gate (design §4), and the player
 * changes it by slotting the current tier's stat row. Its NUMBER is in the worn
 * form by then (`absorbedStatCards` follows this same lane); only its lane is read
 * here, because the payload's size is the VERB's tier (`composeVerb`). Above T2 no
 * band authors a stat row, so the lane carried through the T2 gate is the lean
 * from there on (clearing the row reads every verb pure).
 */
export function leanLaneFor(lineage: LineageDefinition, progress: LineageProgress): PacketId | undefined {
  const cardId = progress.active.stat;
  if (!cardId || !progress.ownedCards.includes(cardId)) return undefined;
  const card = lineage.cards.find((c) => c.id === cardId && c.row === 'stat');
  // The T1 trio's lane is colour and currency (design §26.1): an Attack or Speed
  // lean names no payload, an Effect lean names the fixed verb's own lane.
  return card ? leanPayloadLane(card) : undefined;
}

/**
 * The payload SCALES the lineage's leans put on its verbs (design §26.1: "on a
 * weapon with no mechanic of its own, Effect is the size of the verb's payload"),
 * keyed by the lane whose packet payload they scale — the Effect card's own lane.
 *
 * Read from the same two places every lean pays from: the active stat card while
 * its band is lit, and the stat cards a collapsed band absorbed into the worn form
 * (`absorbedStatCards`), each at the rank the player owns. So an Effect lean the
 * T2 gate absorbed keeps making that payload bigger — a gate never makes a card
 * read smaller — wherever the payload lands: the pure pair of a verb of its lane,
 * or that lane's payload on a verb its lean composes with.
 */
export function lineagePayloadScales(
  lineage: LineageDefinition,
  progress: LineageProgress,
): Partial<Record<PacketId, number>> {
  const out: Partial<Record<PacketId, number>> = {};
  const add = (card: LineageCard): void => {
    if (cardStatKey(card) !== 'payloadScale') return;
    const value = resolveLineageCardFor(lineage, progress, card).statEffects?.payloadScale ?? 0;
    if (value > 0) out[card.lane] = (out[card.lane] ?? 0) + value;
  };
  const activeId = progress.active.stat;
  const active = activeId && progress.ownedCards.includes(activeId)
    ? lineage.cards.find((c) => c.id === activeId && c.row === 'stat')
    : undefined;
  if (active && !statRowIsCollapsed(lineage, progress, active)) add(active);
  for (const card of absorbedStatCards(lineage, progress)) add(card);
  return out;
}

/**
 * `composeVerb`, then the payload scale of the payload's lane (design §26.1). The
 * payload's lane is the verb's own on a pure pair, the lean's otherwise.
 */
function composeScaled(
  verbLane: PacketId,
  leanLane: PacketId | undefined,
  tier: number,
  scales: Partial<Record<PacketId, number>>,
  verbSeedsHold = false,
): VerbComposition | undefined {
  const composed = composeVerb(verbLane, leanLane, tier, verbSeedsHold);
  if (!composed) return undefined;
  const payloadLane = composed.pure ? composed.verbLane : composed.leanLane;
  const scale = payloadLane ? scales[payloadLane] ?? 0 : 0;
  if (scale > 0) scalePayloadSize(composed.payoff, 1 + scale);
  return composed;
}

/**
 * Re-compose every active VERB against the active lean, in place: the verb's
 * moment with the lean's payload, or the verb lane's pure pair for the same lane
 * or no lane-naming lean, sized by the verb's own tier and by the payload scale
 * an Effect lean puts on it. Legacy payoff cards (they author their own trigger
 * and payoff) are untouched, as are amplifiers, keystones and cross rows.
 */
function composeVerbs(cards: ResolvedLineageCard[], lineage: LineageDefinition, progress: LineageProgress): void {
  const leanLane = leanLaneFor(lineage, progress);
  const scales = lineagePayloadScales(lineage, progress);
  for (const resolved of cards) {
    if (!isVerbCard(resolved.card)) continue;
    applyComposition(resolved, composeScaled(resolved.card.lane, leanLane, resolved.card.tier, scales, resolved.card.seeds === 'slow'));
  }
}

/** A preview of the lean (design §26.4: the plate re-reads under a rank preview). */
export interface ComposedSentenceOptions {
  /**
   * Read as if this owned-or-not stat card were the active lean (null: no lean).
   * Omitted: the active lean.
   */
  leanId?: string | null;
  /** Read the lean (the previewed one, else the active one) at this rank. */
  rank?: number;
}

function previewProgress(progress: LineageProgress, options: ComposedSentenceOptions): LineageProgress {
  if (options.leanId === undefined && options.rank === undefined) return progress;
  const active = { ...progress.active };
  const ownedCards = [...progress.ownedCards];
  const ranks = { ...(progress.ranks ?? {}) };
  if (options.leanId === null) delete active.stat;
  else if (options.leanId !== undefined) {
    active.stat = options.leanId;
    if (!ownedCards.includes(options.leanId)) ownedCards.push(options.leanId);
  }
  const leanId = active.stat;
  if (options.rank !== undefined && leanId) ranks[leanId] = clampLeanRank(options.rank);
  return { ...progress, active, ownedCards, ranks };
}

/**
 * The active verb's sentence in its two halves, with the active lean (or a
 * previewed one) — `{ moment, payload, momentLane, payloadLane, pure }` for the
 * page's two-colour sentence (design §26.4), so the client never parses text.
 * Undefined when no verb is active. `composedSentence` is these joined.
 */
export function composedSentenceParts(
  lineage: LineageDefinition,
  progress: LineageProgress,
  options: ComposedSentenceOptions = {},
): ComposedSentenceParts | undefined {
  const verbId = progress.active.payoff;
  if (!verbId || !progress.ownedCards.includes(verbId)) return undefined;
  const verb = lineage.cards.find((c) => c.id === verbId);
  if (!verb || !isVerbCard(verb)) return undefined;
  const view = previewProgress(progress, options);
  const composed = composeScaled(verb.lane, leanLaneFor(lineage, view), verb.tier, lineagePayloadScales(lineage, view), verb.seeds === 'slow');
  return composed ? compositionParts(composed) : undefined;
}

/**
 * The sentence the lineage's active verb reads right now, with the active lean —
 * or undefined when no verb is active (design §24.2).
 */
export function composedSentence(
  lineage: LineageDefinition,
  progress: LineageProgress,
  options: ComposedSentenceOptions = {},
): string | undefined {
  const parts = composedSentenceParts(lineage, progress, options);
  if (!parts) return undefined;
  return parts.moment ? `${parts.moment} ${parts.payload}` : parts.payload;
}

/**
 * One card as one sentence (design §24.6, rule 5: no flavour text rendered).
 *
 *  - A stat card (the LEAN): its resolved stat line, "+9% attack speed.", at the
 *    rank the player owns (rank I when they own none), or at `options.rank` for a
 *    preview. A T1 EFFECT lean names the weapon's mechanic instead of a stat
 *    ("+10% poison potency.", "+10% to Flurry's second strike.").
 *  - A VERB (any tier): the sentence it reads with the player's active lean RIGHT
 *    NOW, with its own tier's numbers and the payload scale an Effect lean puts
 *    on it, owned or not — a verb tile re-renders when the lean changes.
 *
 * Undefined for every other row (legacy payoff, amplifier, keystone, cross),
 * which the tree still renders from `description` and resolved numbers.
 */
export function cardSentence(
  card: LineageCard,
  progress: LineageProgress,
  options: { rank?: number } = {},
): string | undefined {
  const lineage = LINEAGE_DATABASE.get(card.lineageId);
  if (!lineage) return undefined;
  if (card.row === 'stat') {
    const resolved = resolveLineageCardFor(lineage, progress, card, { rank: options.rank });
    const verb = card.leanKind === 'effect'
      ? lineage.cards.find((c) => c.tier === card.tier && c.row === 'payoff' && c.lane === card.lane)
      : undefined;
    return effectLeanLine(resolved.statEffects, {
      lane: card.lane, verbName: verb?.name, reservoir: weaponReservoirNoun(lineage, progress, card.tier),
    });
  }
  if (isVerbCard(card)) {
    const composed = composeScaled(card.lane, leanLaneFor(lineage, progress), card.tier, lineagePayloadScales(lineage, progress), card.seeds === 'slow');
    if (!composed) return undefined;
    const parts = compositionParts(composed);
    return parts && (parts.moment ? `${parts.moment} ${parts.payload}` : parts.payload);
  }
  return undefined;
}

/** What a weapon's own damage-over-time reservoir is called, by its element. */
const RESERVOIR_NOUN: Partial<Record<string, string>> = { poison: 'poison', frost: 'frost', fire: 'burn' };

/**
 * The reservoir a lean of this band amplifies, as the player's noun ("poison"), or
 * undefined for a weapon with none (design §26.2: a weapon that already afflicts —
 * its form authors a `weaponDot` — is amplified, never joined). Read off the worn
 * form when it is this lineage's, else the band's first authored form.
 */
export function weaponReservoirNoun(
  lineage: LineageDefinition,
  progress: Pick<LineageProgress, 'wornForm'>,
  tier: number,
): string | undefined {
  const worn = lineage.forms.some((f) => f.recipeId === progress.wornForm) ? progress.wornForm : undefined;
  const recipeId = worn ?? lineage.forms.find((f) => f.tier === tier)?.recipeId;
  const dot = recipeId ? RECIPE_DATABASE.get(recipeId)?.weaponDot : undefined;
  return dot ? RESERVOIR_NOUN[dot.element] ?? 'affliction' : undefined;
}

/**
 * Does this band's lean and verb compose (design §24.9: the rows read "Lean" and
 * "Verb" only where they do)? True when the band's payoff row is verbs.
 */
export function bandComposes(lineage: LineageDefinition, tier: number): boolean {
  return cardsForTier(lineage, tier).some((c) => isVerbCard(c));
}

// ─── The amplifier row modifies a payoff; it does not add one (design §4) ────

/**
 * Fold every active amplifier into the payoff it names, and drop it from the list.
 *
 * Design §4: "Amplifier — modifies the owned payoff: duration, second target,
 * extra trigger." Before this, nothing read `card.modifies` except the purchase
 * gate, so an active amplifier was emitted as an ordinary card and the runtime
 * fired its payoff as a SECOND effect. That was wrong in three different ways at
 * once, depending on the payoff kind: on `vulnerability` and `plating-shred` the
 * §18.1 max-wins rule swallowed the duplicate whole, so the card was dead; on
 * `echo-hit` it echoed twice; on the DoTs it stacked. None of those is "the owned
 * payoff, amplified".
 *
 * Composing HERE, at resolve time, is what keeps the combat runtime unchanged and
 * keeps design §6's "one multiplier per hit" true of an amplified build: the
 * payoff's own numbers move, so nothing lands a second multiplicative layer.
 *
 * The strength of the move is `ROW_SCALAR.amplifier` — the amplifier row's own
 * entry in the magnitude table, already the authored home for "what an amplifier
 * is worth". No new number enters the table.
 *
 * An amplifier whose target is owned but NOT the active card of its row
 * contributes nothing, and says so by simply not being in the returned list. One
 * active card per row (design §1) means a player can slot an amplifier against a
 * payoff they are not currently running; that is a legal, useless loadout, not an
 * error, and the tree's build readout is where it should read as inert.
 */
function composeAmplifiers(cards: ResolvedLineageCard[]): ResolvedLineageCard[] {
  const amplifiers = cards.filter((c) => c.card.row === 'amplifier');
  if (amplifiers.length === 0) return cards;

  const kept = cards.filter((c) => c.card.row !== 'amplifier');
  for (const amp of amplifiers) {
    const target = kept.find((c) => c.card.id === amp.card.modifies);
    if (!target?.payoff) continue;
    applyAmplification(target, amp);
  }
  return kept;
}

/**
 * Move one axis of a resolved payoff, in place, by `boost`.
 *
 * The three axes that live entirely inside the payoff, split out of
 * {@link applyAmplification} so the ability-node amplifier (design §19) moves an
 * axis by exactly the same arithmetic rather than owning a second copy of it.
 * The `trigger` axis stays in the card-level function below: it adds a MOMENT,
 * which is a property of the card, not of its payoff.
 */
export function applyAmplifiedAxis(
  payoff: LineagePayoff,
  axis: AmplifiedAxis,
  boost: number,
): void {
  switch (axis) {
    case 'duration':
      // Only a timed payoff has a window to lengthen. A stacking one does not,
      // and silently "amplifying" nothing would be a dead card wearing a number.
      if (payoff.durationMs !== undefined && payoff.durationMs > 0) {
        payoff.durationMs = Math.round(payoff.durationMs * (1 + boost));
      }
      break;
    case 'magnitude':
      payoff.magnitude = payoff.magnitude * (1 + boost);
      break;
    case 'targets':
      // Guarded by `coverage.test.ts` to on-target payoffs: a second body is
      // meaningless for a window that opens on the player.
      payoff.extraTargets = (payoff.extraTargets ?? 0) + 1;
      break;
    default:
      break;
  }
}

// ─── The amplifier on a COMPOSED pair (design §24.9) ─────────────────────────

/**
 * What an amplifier of `axis` actually moves on a composed pair — the pair's
 * four axes are frequency, targets, duration and size (see `AmplifiedAxis`):
 *
 *  - `trigger`  → `frequency` when the moment has a count or a cap to shorten;
 *  - `targets`  → `targets` when the payload lands on a body;
 *  - `duration` → `duration` when the payload holds for a time;
 *  - otherwise, and always for `magnitude`, → `size`.
 *
 * THE FALLBACK IS THE RULE THAT MAKES A ROW OF AMPLIFIERS SAFE TO COMPOSE: which
 * payload a verb pays is the lean's choice, so an amplifier authored for one
 * payload meets three. One that met a pair without its axis used to do nothing
 * and still charge for it; here it makes the pair bigger instead, and the page
 * says so (`composedAmplifierMove` is what it reads).
 */
export type ComposedAmplifierMove = 'frequency' | 'targets' | 'duration' | 'size';

export function composedAmplifierMove(
  trigger: Pick<LineageTrigger, 'kind' | 'n' | 'capMs'>,
  payoff: Pick<LineagePayoff, 'kind' | 'durationMs'>,
  axis: AmplifiedAxis | undefined,
  boost: number = ROW_SCALAR.amplifier,
): ComposedAmplifierMove {
  switch (axis) {
    case 'trigger':
      return quickenMoment(trigger, 1 + boost) ? 'frequency' : 'size';
    case 'targets':
      return payoffLandsOnTarget(payoff.kind) ? 'targets' : 'size';
    case 'duration':
      return (payoff.durationMs ?? 0) > 0 ? 'duration' : 'size';
    default:
      return 'size';
  }
}

/**
 * Move one axis of a COMPOSED pair, in place, by `boost` — the amplifier row on a
 * verb (design §24.9). Returns what it moved. The authored amplifier's own
 * trigger and payoff are not read: on a pair, the moment is the verb's and the
 * payload the lean's.
 */
export function applyComposedAmplifier(
  target: Pick<ResolvedLineageCard, 'trigger' | 'payoff'>,
  axis: AmplifiedAxis | undefined,
  boost: number = ROW_SCALAR.amplifier,
): ComposedAmplifierMove | undefined {
  const { trigger, payoff } = target;
  if (!trigger || !payoff) return undefined;
  const move = composedAmplifierMove(trigger, payoff, axis, boost);
  switch (move) {
    case 'frequency':
      target.trigger = quickenMoment(trigger, 1 + boost) ?? trigger;
      break;
    case 'targets':
      payoff.extraTargets = (payoff.extraTargets ?? 0) + 1;
      break;
    case 'duration':
      lengthenPayload(payoff, 1 + boost);
      break;
    case 'size':
      scalePayloadSize(payoff, 1 + boost);
      break;
  }
  return move;
}

/** Move one axis of `target`'s payoff by the amplifier row's scalar. */
function applyAmplification(target: ResolvedLineageCard, amp: ResolvedLineageCard): void {
  const payoff = target.payoff;
  if (!payoff) return;
  const boost = ROW_SCALAR.amplifier;
  // A verb's pair is the player's composition, not the author's (design §24.9).
  if (target.composition) {
    applyComposedAmplifier(target, amp.card.amplifies, boost);
    return;
  }
  switch (amp.card.amplifies) {
    case 'duration':
    case 'magnitude':
    case 'targets':
      applyAmplifiedAxis(payoff, amp.card.amplifies, boost);
      break;
    case 'trigger':
      // The modified payoff also fires on the amplifier's moment. The amplifier's
      // own trigger is the whole content of this axis.
      if (!amp.trigger) break;
      if (amp.trigger.kind === target.card.trigger) {
        // Naming the trigger the payoff ALREADY fires on does not add a moment —
        // it re-scopes the one it has, from once per engagement to once per body.
        // Rapier's Fresh Opening is the case: "every new body the duel turns to
        // counts as a fresh opening hit". `coverage.test.ts` allows this only for
        // `first-hit`, the one trigger that latches per engagement.
        target.perTargetTrigger = true;
      } else {
        target.extraTriggers = [...(target.extraTriggers ?? []), amp.trigger];
      }
      break;
    default:
      break;
  }
}

// ─── Band collapse: the stat row the worn form absorbed (design §4) ──────────

/**
 * Has this card's band collapsed under the worn form, taking its stat row with
 * it? True only for a `stat` card of a tier BELOW the worn form's.
 *
 * Design §4: "The stat row's value folds into the next form's base stats at the
 * gate, so the visible stat row is always the current tier's." Every other row of
 * a collapsed band is untouched — the payoff row of T1 stays buyable, owned, and
 * selectable, because the collapsed band is a wardrobe to reslot from.
 */
export function statRowIsCollapsed(
  lineage: LineageDefinition,
  progress: LineageProgress,
  card: Pick<LineageCard, 'row' | 'tier'>,
): boolean {
  return card.row === 'stat' && card.tier < wornFormTier(lineage, progress);
}

/**
 * The stat cards the worn form has absorbed into its base stats: at most ONE per
 * collapsed band, never a stack.
 *
 * One per band because `active` is one card per row across the whole tree (plan
 * §1.2 decision 1) — the player only ever played one stat row per band, so owning
 * all three lanes' T1 stat cards buys a wardrobe, not three absorptions. WHICH one
 * follows the lane of the stat row the player is on now, so the lane identity
 * carries up through the gate and the player still controls the choice by picking
 * their current tier's stat row; failing that (they own no stat card of that band
 * in that lane) it is the lineage's own lane order, which is its matrix order.
 *
 * Non-weapon lineages have no stat row at all (design §4, §17), so they author no
 * `stat` cards and this returns nothing for them: absorption is a no-op rather
 * than a special case.
 */
export function absorbedStatCards(
  lineage: LineageDefinition,
  progress: LineageProgress,
): LineageCard[] {
  const wornTier = wornFormTier(lineage, progress);
  if (wornTier < 2) return [];

  const activeStatId = progress.active.stat;
  const activeLane = activeStatId
    ? lineage.cards.find((c) => c.id === activeStatId)?.lane
    : undefined;
  const laneRank = (card: LineageCard): number => {
    const index = lineage.lanes.indexOf(card.lane);
    return index < 0 ? lineage.lanes.length : index;
  };

  const out: LineageCard[] = [];
  for (let tier = 1; tier < wornTier; tier++) {
    const owned = lineage.cards.filter(
      (c) => c.row === 'stat' && c.tier === tier && progress.ownedCards.includes(c.id),
    );
    if (owned.length === 0) continue;
    const onLane = activeLane ? owned.find((c) => c.lane === activeLane) : undefined;
    out.push(onLane ?? [...owned].sort((a, b) => laneRank(a) - laneRank(b))[0]!);
  }
  return out;
}

/** The worn form's capstone, if the worn form has one. Granted, never bought. */
export function resolveWornCapstone(
  lineage: LineageDefinition,
  progress: LineageProgress,
  frameFace?: DefensiveFace,
): ResolvedLineageCapstone | undefined {
  const form = lineage.forms.find((f) => f.recipeId === progress.wornForm);
  return form ? resolveLineageCapstone(form, { frameFace }) : undefined;
}

export interface ActiveLineageEffects {
  cards: ResolvedLineageCard[];
  capstones: ResolvedLineageCapstone[];
  /**
   * Summed stat rows, ready to fold into the stat rebuild: the active stat row of
   * the lit band PLUS every stat row a collapsed band folded into the worn form
   * (see {@link absorbedStatCards}). One bag, so a value cannot land twice.
   */
  statEffects: LineageStatEffects;
  /**
   * The collapsed bands' absorbed stat rows, already summed into `statEffects`.
   * Reported separately for the tree panel's "in your form" readout — a caller
   * that applies these on top of `statEffects` would double them.
   */
  absorbed: ResolvedLineageCard[];
}

/**
 * Everything the player's lineages contribute right now, across every slot.
 *
 * A lineage only contributes while its worn form is the item equipped in its
 * slot — owning a second tree changes nothing until you wear it. This is what
 * Phase 1b's recalc and card runtime consume.
 *
 * A PARKED lineage contributes nothing at all — no cards, no absorbed stat
 * rows, and no capstone (design §24.5). A save that still holds a parked tree
 * keeps it untouched; it is simply not resolved. The capstone goes with the
 * cards: a parked lineage's T2+ forms are plain recipes now, so a verb granted
 * for wearing one would be a lineage verb with no tree behind it.
 */
export function resolveActiveLineages(
  inventory: Pick<HoldsInventory, 'equipment' | 'lineages'> | undefined,
  frameFace?: DefensiveFace,
): ActiveLineageEffects {
  const cards: ResolvedLineageCard[] = [];
  const capstones: ResolvedLineageCapstone[] = [];
  const absorbed: ResolvedLineageCard[] = [];
  const statEffects: LineageStatEffects = {};
  const addStats = (resolved: ResolvedLineageCard): void => {
    for (const [key, value] of Object.entries(resolved.statEffects ?? {}) as [keyof LineageStatEffects, number][]) {
      // A payload scale is not a character stat (design §26.1): it is already in
      // the verb's resolved payload (`lineagePayloadScales`), and the stat rebuild
      // must never see it.
      if (key === 'payloadScale') continue;
      statEffects[key] = (statEffects[key] ?? 0) + value;
    }
  };
  if (!inventory) return { cards, capstones, statEffects, absorbed };

  for (const [lineageId, progress] of Object.entries(inventory.lineages ?? {})) {
    const lineage = LINEAGE_DATABASE.get(lineageId);
    if (!lineage || !progress || isLineageParked(lineage)) continue;
    if (inventory.equipment[lineage.slot] !== progress.wornForm) continue;

    for (const resolved of resolveLineageCards(lineage, progress, frameFace)) {
      cards.push(resolved);
      addStats(resolved);
    }
    // Band collapse (design §4): a collapsed band's stat row is part of the worn
    // form now, so it pays out whether or not it is the slotted one — and only
    // from here, because `resolveLineageCards` skips it. It is NOT pushed to
    // `cards`: an absorbed row is base stats, not a card the runtime fires.
    for (const card of absorbedStatCards(lineage, progress)) {
      const resolved = resolveLineageCardFor(lineage, progress, card, { frameFace });
      absorbed.push(resolved);
      addStats(resolved);
    }
    const capstone = resolveWornCapstone(lineage, progress, frameFace);
    if (capstone) capstones.push(capstone);
  }
  return { cards, capstones, statEffects, absorbed };
}

/**
 * The tree an equipped item opens — how the inventory panel turns a slot into a
 * tree. Undefined for items with no lineage (cores, relics) AND for a parked
 * lineage's forms (design §24.5): a parked slot shows no tree entry anywhere.
 * `lineageForRecipeId` stays the raw data lookup.
 */
export function lineageForEquippedItem(recipeId: string | null | undefined): LineageDefinition | undefined {
  const lineage = recipeId ? lineageForRecipeId(recipeId) : undefined;
  return lineage && !isLineageParked(lineage) ? lineage : undefined;
}

// ─── Amplifier connectors (design §4, §8) ────────────────────────────────────

/** What a card modifies, and whether a connector can be a straight tick to it. */
export interface LineageCardTie {
  targetId: string;
  name: string;
  /**
   * The modified card is the tile DIRECTLY ABOVE this one: same band, same lane,
   * the row immediately before it. Only then can the tree draw a vertical tick —
   * anywhere else it names the card instead, because a tick pointing at the wrong
   * column would be a lie.
   */
  adjacent: boolean;
}

/**
 * The card an `amplifier` / `keystone` / `cross` row modifies, resolved for the
 * tree's connector. Reads `modifies` off the card — the authored contract — so it
 * is correct for a band with no amplifier cards at all and for a full one, without
 * knowing a single card id.
 */
export function lineageCardTie(
  lineage: LineageDefinition,
  card: LineageCard,
  /** The band's rows in render order, i.e. `rowsForTier(card.tier)` as drawn. */
  bandRows: readonly RowKind[],
): LineageCardTie | undefined {
  if (!card.modifies) return undefined;
  const target = lineage.cards.find((c) => c.id === card.modifies);
  if (!target) return undefined;
  const above = bandRows.indexOf(target.row);
  const adjacent = above >= 0
    && bandRows.indexOf(card.row) - above === 1
    && target.lane === card.lane
    && target.tier === card.tier;
  return { targetId: target.id, name: target.name, adjacent };
}

/** The cards and forms a band shows: one lit band, plus the doors below it. */
export function bandContents(lineage: LineageDefinition, tier: number): {
  cards: LineageCard[];
  gateForms: LineageForm[];
} {
  return { cards: cardsForTier(lineage, tier), gateForms: formsAtGate(lineage, tier) };
}

/**
 * What a card would cost right now, discount included. For the UI's price tag and
 * the server's spend. A ranked card is priced at the rank buying it would give —
 * `rank` when named, else the NEXT rank of `progress` (rank I with no progress, and
 * the max rank's own price when there is nothing left to buy).
 */
export function lineageCardPrice(params: {
  lineage: LineageDefinition;
  card: LineageCard;
  lineages?: LineageProgressMap;
  progress?: Pick<LineageProgress, 'ownedCards' | 'ranks'>;
  rank?: number;
}) {
  const discounted = lineageSwitchDiscount({
    card: params.card, slot: params.lineage.slot, lineages: params.lineages,
  });
  const rank = params.rank
    ?? (params.progress ? nextCardRank(params.progress, params.card) ?? maxCardRank(params.card) : 1);
  return { cost: lineageCardCost(params.card, params.lineage, { discounted, rank }), discounted, rank };
}

// ─── Retired cards: the save refund (design §26.1) ───────────────────────────

/** What a save's retired cards are worth, and which they were. */
export interface RetiredCardRefund {
  cardIds: string[];
  essence: Partial<Record<EssenceType, number>>;
  shards: Partial<Record<PacketId, number>>;
}

/**
 * The refund a STORED (pre-normalisation) lineage map is owed for the cards
 * design §26.1 retired from the T1 band (`RETIRED_LINEAGE_CARDS`): each owned
 * retired card's T1 row price, at TODAY's table and undiscounted — what a save
 * paid (full, or the half-price switch discount) was never recorded, so the
 * player-favourable price is the one returned.
 *
 * Pure and total: it never throws on a malformed save and mutates nothing. The
 * ids themselves are dropped by `normalizeLineageProgressMap` (unknown card ids,
 * and any active row pointing at one), so once a normalised tree is saved the
 * refund finds nothing — idempotent across loads.
 */
export function retiredLineageCardRefund(
  stored: Partial<Record<string, Partial<LineageProgress>>> | undefined,
): RetiredCardRefund {
  const out: RetiredCardRefund = { cardIds: [], essence: {}, shards: {} };
  if (!stored || typeof stored !== 'object') return out;
  for (const [lineageId, raw] of Object.entries(stored)) {
    const lineage = LINEAGE_DATABASE.get(lineageId);
    const owned: unknown[] = raw && Array.isArray(raw.ownedCards) ? raw.ownedCards : [];
    if (!lineage) continue;
    for (const id of new Set(owned)) {
      const retired = typeof id === 'string' ? RETIRED_LINEAGE_CARDS.get(id) : undefined;
      if (typeof id !== 'string' || !retired || retired.lineageId !== lineageId) continue;
      // Still a live card of the lineage would mean it was never retired.
      if (lineage.cards.some((c) => c.id === id)) continue;
      const shape: LineageCard = {
        id, lineageId, tier: 1, row: retired.row, lane: retired.lane,
        name: retired.name, description: '', fx: `${retired.lane}.trail` as LineageCard['fx'],
      };
      const cost = lineageCardCost(shape, lineage);
      for (const [type, amount] of Object.entries(cost.essence) as [EssenceType, number][]) {
        out.essence[type] = (out.essence[type] ?? 0) + amount;
      }
      for (const [packet, amount] of Object.entries(cost.shards) as [PacketId, number][]) {
        out.shards[packet] = (out.shards[packet] ?? 0) + amount;
      }
      out.cardIds.push(id);
    }
  }
  return out;
}
