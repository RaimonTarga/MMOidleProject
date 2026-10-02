/**
 * Ability node rules — the shared authority (design §19).
 *
 * These are to ability nodes what `checkUnlockCard`/`checkSetActive` are to
 * lineage cards: pure functions the SERVER applies and the CLIENT gates buttons
 * with, so the two can never disagree. Nothing here mutates.
 *
 * The two invariants, inherited verbatim from the lineage tree:
 *  - **Owned is forever, active is a choice.** Buying is permanent and costs;
 *    swapping which owned option is active is free, instant, and never fails for
 *    economic reasons.
 *  - **One row, one active option.** A row is a choice, not a shopping list.
 *
 * And one of its own: **you must know the ability.** A node hangs off an ability
 * the player has learned, so the packet row of an unlearned ability is not a
 * cheaper way to buy a payoff — it is not for sale at all.
 */
import { ABILITY_DATABASE } from '../abilities';
import { ESSENCE_LABELS } from '../items';
import type { EssenceType } from '../items';
import {
  ABILITY_NODE_DATABASE, abilityNodeOptionsForRow, abilityNodePayoff,
  resolveAbilityNodeOption,
} from '../data/abilityNodes';
import type {
  AbilityNodeDefinition, AbilityNodeOption, AbilityNodeProgress,
  AbilityNodeProgressMap, AbilityNodeRow, ResolvedAbilityNodeOption,
} from '../data/abilityNodes';
import { ABILITY_NODE_SHARE } from '../data/lineages/magnitudes';
import type { LineagePayoff, PacketId } from '../data/lineages/types';
import { applyAmplifiedAxis } from './lineages';
import type { LineageCheck, LineageWallet } from './lineages';

const OK: LineageCheck = { ok: true };

// ─── State helpers ───────────────────────────────────────────────────────────

/** A fresh tree: nothing owned, nothing active. */
export function emptyAbilityNodeProgress(): AbilityNodeProgress {
  return { owned: [], active: {} };
}

/**
 * The player's nodes for one ability, or an untouched set. Never undefined, so
 * no caller has to branch on "has this player met this ability's tree yet".
 */
export function abilityNodeProgressFor(
  nodes: AbilityNodeProgressMap | undefined,
  abilityId: string,
): AbilityNodeProgress {
  return nodes?.[abilityId] ?? { owned: [], active: {} };
}

/**
 * Hydration-safe normalization. Drops unknown ability ids, unknown option ids,
 * and active entries whose option is not owned or sits in another row — so a
 * save written before an offer changed loads clean instead of granting a node
 * that no longer exists.
 *
 * Absent from every save written before design §19 shipped, which is why this
 * needs no migration: an undefined map normalizes to an empty one.
 */
export function normalizeAbilityNodeProgressMap(
  stored: Partial<Record<string, Partial<AbilityNodeProgress>>> | undefined,
): AbilityNodeProgressMap {
  const out: AbilityNodeProgressMap = {};
  for (const [abilityId, raw] of Object.entries(stored ?? {})) {
    const tree = ABILITY_NODE_DATABASE.get(abilityId);
    if (!tree || !raw) continue;

    const known = new Map(tree.options.map((o) => [o.id, o]));
    const owned = (raw.owned ?? []).filter((id) => known.has(id));

    const active: Partial<Record<AbilityNodeRow, string>> = {};
    for (const [row, optionId] of Object.entries(raw.active ?? {}) as [AbilityNodeRow, string][]) {
      const option = optionId ? known.get(optionId) : undefined;
      if (option && option.row === row && owned.includes(optionId)) active[row] = optionId;
    }

    out[abilityId] = { owned, active };
  }
  return out;
}

// ─── Affordability (same shape as the lineage checks) ────────────────────────

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

// ─── The two checks ──────────────────────────────────────────────────────────

/** What a node purchase is judged against. The lineage wallet plus the pool. */
export interface AbilityNodeWallet extends LineageWallet {
  /** `TracksProgression.knownAbilities` — a node needs its ability learned. */
  knownAbilities?: readonly string[];
}

/**
 * Can the player BUY this option? Mastery gates *when*, materials gate *whether*
 * (design §4), and knowing the ability gates *at all*.
 */
export function checkUnlockAbilityNode(params: {
  option: AbilityNodeOption;
  progress: AbilityNodeProgress;
  wallet: AbilityNodeWallet;
}): LineageCheck {
  const { option, progress, wallet } = params;

  const tree = ABILITY_NODE_DATABASE.get(option.abilityId);
  if (!tree) return { ok: false, reason: 'That ability has no nodes.' };
  if (!tree.options.some((o) => o.id === option.id)) return { ok: false, reason: 'Unknown node.' };
  if (progress.owned.includes(option.id)) return { ok: false, reason: 'Already owned.' };

  if (wallet.knownAbilities && !wallet.knownAbilities.includes(option.abilityId)) {
    return { ok: false, reason: 'Learn the ability first.' };
  }

  // The amplifier row modifies a packet node the player must already own — the
  // same prerequisite `checkUnlockCard` enforces through `card.modifies`.
  if (option.modifies && !progress.owned.includes(option.modifies)) {
    return { ok: false, reason: 'Buy that packet node first.' };
  }

  if (wallet.isTestRoom) return OK;

  const resolved = resolveAbilityNodeOption(option);
  if (wallet.globalMastery !== undefined && wallet.globalMastery < resolved.requiredGlobalMastery) {
    return { ok: false, reason: `Requires Global Mastery ${resolved.requiredGlobalMastery}.` };
  }

  const essence = affordEssence(resolved.cost.essence, wallet.essences);
  if (!essence.ok) return essence;
  return affordShards(resolved.cost.shards, wallet.shards);
}

/**
 * Can the player make this owned option the active one for its row? Free and
 * instant; the only failure modes are "you do not own it" and "wrong row".
 */
export function checkSetAbilityNode(params: {
  abilityId: string;
  progress: AbilityNodeProgress;
  row: AbilityNodeRow;
  /** null clears the row. */
  optionId: string | null;
}): LineageCheck {
  const { abilityId, progress, row, optionId } = params;
  if (optionId === null) return OK;
  const option = ABILITY_NODE_DATABASE.get(abilityId)?.options.find((o) => o.id === optionId);
  if (!option) return { ok: false, reason: 'Unknown node.' };
  if (option.row !== row) return { ok: false, reason: `That node is a ${option.row} node, not a ${row} node.` };
  if (!progress.owned.includes(optionId)) return { ok: false, reason: 'You do not own that node.' };
  return OK;
}

// ─── Resolution for the runtime ──────────────────────────────────────────────

/**
 * One ability's node firing: the payoff its active packet node pays, with its
 * active amplifier already folded in.
 *
 * Folding at resolve time is what keeps the combat runtime unchanged and keeps
 * design §6's "one multiplier per hit" true — the payoff's own numbers move,
 * so nothing lands a second multiplicative layer. Exactly what
 * `composeAmplifiers` does for lineage cards, by exactly the same call.
 */
export interface AbilityNodeFiring {
  abilityId: string;
  /** The packet option that pays. Its id is the per-card key and proc tag. */
  option: AbilityNodeOption;
  payoff: LineagePayoff;
  /** The amplifier option folded in, when one was active and applicable. */
  amplifier?: AbilityNodeOption;
}

/**
 * What this ability fires right now, or undefined when nothing is slotted.
 *
 * An amplifier slotted against a packet the player is not currently running
 * contributes nothing and says so by simply not appearing — a legal, useless
 * loadout, not an error, the same way a lineage amplifier behaves.
 */
export function resolveAbilityNodeFiring(
  abilityId: string,
  progress: AbilityNodeProgress,
): AbilityNodeFiring | undefined {
  const tree = ABILITY_NODE_DATABASE.get(abilityId);
  if (!tree) return undefined;

  const packetId = progress.active.packet;
  if (!packetId || !progress.owned.includes(packetId)) return undefined;
  const option = tree.options.find((o) => o.id === packetId && o.row === 'packet');
  if (!option) return undefined;
  const payoff = abilityNodePayoff(option);
  if (!payoff) return undefined;

  const firing: AbilityNodeFiring = { abilityId, option, payoff };

  const ampId = progress.active.amplifier;
  const amplifier = ampId && progress.owned.includes(ampId)
    ? tree.options.find((o) => o.id === ampId && o.row === 'amplifier')
    : undefined;
  if (amplifier && amplifier.modifies === option.id && amplifier.amplifies) {
    applyAmplifiedAxis(payoff, amplifier.amplifies, ABILITY_NODE_SHARE.amplifier);
    firing.amplifier = amplifier;
  }
  return firing;
}

/** Every ability on this player that has a node firing right now. */
export function resolveActiveAbilityNodes(
  nodes: AbilityNodeProgressMap | undefined,
): Map<string, AbilityNodeFiring> {
  const out = new Map<string, AbilityNodeFiring>();
  for (const [abilityId, progress] of Object.entries(nodes ?? {})) {
    if (!progress) continue;
    const firing = resolveAbilityNodeFiring(abilityId, progress);
    if (firing) out.set(abilityId, firing);
  }
  return out;
}

// ─── Authoring reads for the UI ──────────────────────────────────────────────

/** Both rows of one ability's tree, resolved, in render order. */
export function resolveAbilityNodeRows(tree: AbilityNodeDefinition): {
  row: AbilityNodeRow;
  options: ResolvedAbilityNodeOption[];
}[] {
  return (['packet', 'amplifier'] as const).map((row) => ({
    row,
    options: abilityNodeOptionsForRow(tree, row).map(resolveAbilityNodeOption),
  }));
}

/** The node tree of an ability the player has learned, or undefined. */
export function abilityNodeTreeFor(abilityId: string): AbilityNodeDefinition | undefined {
  return ABILITY_DATABASE.has(abilityId) ? ABILITY_NODE_DATABASE.get(abilityId) : undefined;
}
