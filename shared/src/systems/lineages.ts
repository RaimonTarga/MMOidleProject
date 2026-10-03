/**
 * Lineage tree rules — the shared authority (progression rework Phase 1a).
 *
 * These are to the lineage tree what `checkUpgrade`/`checkEvolve` are to the
 * +N ladder: pure functions the SERVER applies and the CLIENT gates buttons with,
 * so the two can never disagree. Nothing here mutates; the Phase 1b handlers in
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
import type { EquipmentSlot, EssenceType } from '../items';
import type { SubVariant } from '../data/skillTree/types';
import { biomeLevelCap } from '../config/gameConfig';
import type { HoldsInventory } from '../components/core/networkedSlices';
import {
  cardsForTier, formsAtGate, isLineageParked, LINEAGE_DATABASE, lineageForRecipeId, lineagesForSlot,
} from '../data/lineages';
import { capstoneMaterialName } from '../data/lineages/capstones';
import {
  ROW_SCALAR, lineageMasteryLevelForRow, rowsForTier, tierHasRow,
} from '../data/lineages/magnitudes';
import {
  formGateBiomeLevel, formGateMastery, lineageCardCost, lineageGateCost,
  resolveLineageCapstone, resolveLineageCard,
} from '../data/lineages/resolve';
import type {
  AmplifiedAxis, DefensiveFace, LineageCard, LineageDefinition, LineageForm,
  LineagePayoff, LineageProgress, LineageProgressMap, LineageStatEffects,
  PacketId, PayoffKind, ResolvedLineageCapstone, ResolvedLineageCard, RowKind,
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
    const ownedCards = (raw.ownedCards ?? []).filter((id) => knownCards.has(id));
    const ownedForms = (raw.ownedForms ?? []).filter((id) => knownForms.has(id));

    const active: Partial<Record<RowKind, string>> = {};
    for (const [row, cardId] of Object.entries(raw.active ?? {}) as [RowKind, string][]) {
      const card = lineage.cards.find((c) => c.id === cardId);
      if (card && card.row === row && ownedCards.includes(cardId)) active[row] = cardId;
    }

    // Ownership is never invented here. The base form is recorded when the player
    // holds it (`syncLineagesFromInventory` on attach, craft and equip), and a tree
    // with no owned form stays empty — pushing the base form on every load was
    // review finding B1 (2026-10-02): a free T1 item per lineage per relog.
    const wornForm = raw.wornForm && ownedForms.includes(raw.wornForm)
      ? raw.wornForm
      : (ownedForms[0] ?? '');

    out[lineageId] = { ownedCards, active, ownedForms, wornForm };
  }
  return out;
}

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
  progress: Pick<LineageProgress, 'wornForm' | 'ownedForms'>,
  card: LineageCard,
  options: { frameFace?: DefensiveFace; discounted?: boolean } = {},
): ResolvedLineageCard {
  return resolveLineageCard(card, lineage, {
    ...options,
    bandBiome: lineageBandBiome(lineage, progress, card.tier),
  });
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
      return { ok: false, reason: `Not enough ${packet} shards (need ${amount}).` };
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
  if (progress.ownedCards.includes(card.id)) return { ok: false, reason: 'Already owned.' };
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
  const resolved = resolveLineageCardFor(lineage, progress, card, { discounted });

  // The band gates on its door biome, not on the home biome (design §21), so the
  // level AND the biome it is read in both come off the resolved card.
  const level = wallet.biomeLevels[resolved.requiredBiomeGroup] ?? 0;
  if (level < resolved.requiredBiomeLevel) {
    return {
      ok: false,
      reason: `Requires ${resolved.requiredBiomeGroup} level ${resolved.requiredBiomeLevel}.`,
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
  if (level < required) return { ok: false, reason: `Requires ${form.biome} level ${required}.` };
  if (wallet.playerTier !== undefined && biomeLevelCap(wallet.playerTier, form.biome) < required) {
    return { ok: false, reason: `${form.biome} cannot reach level ${required} at your tier yet.` };
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
  return composeAmplifiers(out);
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

/** Move one axis of `target`'s payoff by the amplifier row's scalar. */
function applyAmplification(target: ResolvedLineageCard, amp: ResolvedLineageCard): void {
  const payoff = target.payoff;
  if (!payoff) return;
  const boost = ROW_SCALAR.amplifier;
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

/** What a card would cost right now, discount included. For the UI's price tag. */
export function lineageCardPrice(params: {
  lineage: LineageDefinition;
  card: LineageCard;
  lineages?: LineageProgressMap;
}) {
  const discounted = lineageSwitchDiscount({
    card: params.card, slot: params.lineage.slot, lineages: params.lineages,
  });
  return { cost: lineageCardCost(params.card, params.lineage, { discounted }), discounted };
}
