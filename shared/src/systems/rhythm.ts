/**
 * The rhythm readout's shared half (design §24.6; course-correction W2-B).
 *
 * "In combat, one rhythm readout near the HP bar, shared with the frame loop's
 * window/bank, shows a filling ring per active triggered card (at most three)
 * that flashes when the payoff is ready. Not buff tiles."
 *
 * Pure. The server reads {@link rhythmFirings} to decide whether the
 * `ShowsRhythm` slice is attached and which keys it carries; the client reads the
 * same function to decide which rings to draw. One answer, two readers, so the
 * slice and the rings can never disagree about which cards have a rhythm.
 */
import { LINEAGE_DATABASE } from '../data/lineages';
import type { BuffId } from '../components/combat/buffs';
import type {
  LineageTrigger,
  PacketId,
  PayoffKind,
  ResolvedLineageCapstone,
  ResolvedLineageCard,
  RowKind,
} from '../data/lineages/types';

/** The mockup's ceiling: the triggered cards first, then the frame ring. */
export const RHYTHM_MAX_RINGS = 3;

/**
 * How a ring reads its moment, from the trigger's shape (never from its lane):
 *
 *  - `count`            `hit-nth` with n > 1: hits toward the payoff, "3/6".
 *  - `cap`              a rate-capped moment (`capMs`): ready, or the cap's clock.
 *  - `latch-body`       `first-hit` per body: ready for the CURRENT target until spent.
 *  - `latch-engagement` `first-hit` per engagement: ready until spent, re-arms after a lull.
 *  - `carry`            `kill` with `carry`: empty until a kill arms the next hit.
 *  - `pulse`            everything else (the mechanic, a Technique, a kill, a dodge, …):
 *                       the server keeps no count toward it, so the ring pulses when
 *                       the payoff fires and otherwise rests.
 */
export type RhythmShape =
  | 'count'
  | 'cap'
  | 'latch-body'
  | 'latch-engagement'
  | 'carry'
  | 'pulse';

export function rhythmShape(trigger: LineageTrigger, perTarget: boolean): RhythmShape {
  if ((trigger.capMs ?? 0) > 0) return 'cap';
  if (trigger.kind === 'hit-nth' && Math.round(trigger.n ?? 1) > 1) return 'count';
  if (trigger.kind === 'first-hit') return perTarget ? 'latch-body' : 'latch-engagement';
  if (trigger.kind === 'kill' && trigger.carry) return 'carry';
  return 'pulse';
}

/** One triggered card or worn capstone, as the readout sees it. */
export interface RhythmFiring {
  /** Card or capstone id — the runtime's per-card counter key, and the slice's. */
  key: string;
  /** The ring label and the floating word. */
  name: string;
  /** The ring's colour: the card's own lane (a verb is its moment's lane). */
  lane: PacketId;
  trigger: LineageTrigger;
  shape: RhythmShape;
  /** What it pays — a timed self payoff's window shows on this ring while live. */
  payoff: PayoffKind;
  /**
   * The packet whose payload it pays: a composed verb's active lean (its own lane
   * when pure), a cross card's borrowed lane, else its own lane. Keys the ring
   * label's payload glyph.
   */
  payloadLane: PacketId;
  source: 'card' | 'capstone';
}

/**
 * The buff tile each timed self payoff's window is projected as (the server's
 * `LINEAGE_BUFFS`). The readout draws a live window on the ring of the card that
 * opened it, so these tiles leave the buff bar wherever a ring claims them.
 */
export const LINEAGE_WINDOW_BUFF_IDS = {
  'damage-window': 'lineage-damage',
  'speed-window': 'lineage-speed',
  'recovery-window': 'lineage-recovery',
  'engagement-dr': 'lineage-guard',
  'ward': 'lineage-ward',
  'plating-stack': 'lineage-plate',
  'technique-window': 'lineage-technique',
  'evasion-window': 'lineage-evasion',
} as const satisfies Partial<Record<PayoffKind, BuffId>>;

/** The window tile a payoff opens, or undefined for a payoff with no window. */
export function lineageWindowBuffId(payoff: PayoffKind): BuffId | undefined {
  return (LINEAGE_WINDOW_BUFF_IDS as Partial<Record<PayoffKind, BuffId>>)[payoff];
}

function cardPayloadLane(resolved: ResolvedLineageCard): PacketId {
  const composed = resolved.composition;
  if (composed) return composed.pure ? composed.verbLane : composed.leanLane ?? composed.verbLane;
  return resolved.card.borrowsLane ?? resolved.card.lane;
}

/**
 * Which row's card the readout shows first. The payoff row is the verb the
 * player chose (or a T2+ payoff that replaced it); a T4 cross card is a second
 * choice; a worn capstone was granted with the form. A keystone is not a firing
 * (it changes a rule, `firingsFor` skips it) and an amplifier is folded into the
 * card it modifies before the runtime ever sees it.
 */
const ROW_RANK: Partial<Record<RowKind, number>> = { payoff: 0, cross: 1 };
const OTHER_ROW_RANK = 1.5;
const CAPSTONE_RANK = 2;

/**
 * Every firing a ring could show, in readout order: what `lineageCards.ts`'s
 * `firingsFor` would dispatch — the same "has a trigger and a payoff, and is not a
 * keystone" test — ranked payoff row, cross row, worn capstone.
 */
export function rhythmFirings(effects: {
  cards: readonly ResolvedLineageCard[];
  capstones: readonly ResolvedLineageCapstone[];
}): RhythmFiring[] {
  const ranked: Array<{ rank: number; firing: RhythmFiring }> = [];
  for (const resolved of effects.cards) {
    if (!resolved.trigger || !resolved.payoff) continue;
    if (resolved.card.row === 'keystone') continue;
    ranked.push({
      rank: ROW_RANK[resolved.card.row] ?? OTHER_ROW_RANK,
      firing: {
        key: resolved.card.id,
        name: resolved.card.name,
        lane: resolved.card.lane,
        trigger: resolved.trigger,
        shape: rhythmShape(resolved.trigger, resolved.perTargetTrigger === true),
        payoff: resolved.payoff.kind,
        payloadLane: cardPayloadLane(resolved),
        source: 'card',
      },
    });
  }
  for (const worn of effects.capstones) {
    ranked.push({
      rank: CAPSTONE_RANK,
      firing: {
        key: worn.capstone.id,
        name: worn.capstone.name,
        lane: worn.capstone.lane,
        trigger: worn.trigger,
        shape: rhythmShape(worn.trigger, false),
        payoff: worn.payoff.kind,
        payloadLane: worn.capstone.lane,
        source: 'capstone',
      },
    });
  }
  // Stable: equal ranks keep the resolver's order.
  return ranked
    .map((entry, index) => ({ ...entry, index }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map((entry) => entry.firing);
}

/** A card's or capstone's player-facing name and lane, by id. */
export interface RhythmIdentity {
  name: string;
  lane: PacketId;
}

let identityIndex: Map<string, RhythmIdentity> | undefined;

/**
 * Name and lane of the card or capstone a `card-fx` event names — what the
 * floating word prints. Undefined for anything else (an ability node's option, a
 * keystone link), which draws no word.
 */
export function rhythmIdentity(id: string): RhythmIdentity | undefined {
  if (!identityIndex) {
    identityIndex = new Map<string, RhythmIdentity>();
    for (const lineage of LINEAGE_DATABASE.values()) {
      for (const card of lineage.cards) identityIndex.set(card.id, { name: card.name, lane: card.lane });
      for (const form of lineage.forms) {
        if (form.capstone) identityIndex.set(form.capstone.id, { name: form.capstone.name, lane: form.capstone.lane });
      }
    }
  }
  return identityIndex.get(id);
}
