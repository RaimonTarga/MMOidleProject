/**
 * The ability-node database (design §19, §22) — derived, not authored.
 *
 * `offers.ts` says which three packets each ability offers and `keystones.ts`
 * names each ability's three keystone verbs. Everything else is built here from
 * one table per question, so a new ability needs three pairs in `offers.ts` (and
 * a trio in `keystones.ts`) and nothing else:
 *
 *   - the amplifier row is GENERATED: per packet option, one option per axis the
 *     route can move ({@link nodePayoffAxes}) — the payoff's natural axis
 *     ({@link nodePayoffAxis}) first, as the default, and "a shorter wind-up" on
 *     a cast (design §22.9, §22.10);
 *   - the keystone row is the ability's trio, one option per verb (§22.11);
 *   - the cross row is DERIVED: one option per offer, each borrowing that offer
 *     at `ROW_SCALAR.cross` — only the two that are not the active packet ever
 *     fire (design §22.1);
 *   - the visual signature comes from {@link ABILITY_NODE_FX}, every key of
 *     which already exists in `LINEAGE_FX_KEYS` and already has a client
 *     handler, so a node draws the lane's grammar and adds no client work;
 *   - the player-facing name is the PACKET's name and the blurb is the payoff's
 *     sentence, because design §19 asks for "a generic tree keyed to packets".
 *
 * Which band a row is gated in follows the ability rather than the calendar;
 * `abilityNodeRowTier` / `abilityNodeBandTier` in `resolve.ts` are that rule's
 * one home.
 */
import { ABILITY_DATABASE } from '../../abilities';
import type { AbilityDef, AbilityNameParts } from '../../abilities';
import { PAYOFF_UNIT } from '../lineages/magnitudes';
import { packetDefinition } from '../lineages/packets';
import type { AmplifiedAxis, LineageFxKey, PacketId, PayoffKind } from '../lineages/types';
import { payoffLandsOnTarget } from '../lineages/types';
import { ABILITY_PACKET_OFFERS } from './offers';
import {
  abilityKeystoneDefinition, abilityKeystoneTrio, keystoneFxLane,
} from './keystones';
import { abilityNodeBandTier, abilityNodeRowTier, activePacketLane } from './resolve';
import type {
  AbilityNodeDefinition, AbilityNodeOption, AbilityNodeProgress, AbilityNodeRow,
} from './types';
import { ABILITY_NODE_ROWS } from './types';

/**
 * The lane grammar a node draws, keyed by the (lane, payoff) pair it fires.
 *
 * Every entry is an EXISTING {@link LineageFxKey} with an existing client
 * handler: a node is the lane's own effect seen on an ability, not a new effect,
 * so design §8's "one thing you can see" is satisfied without a new switch arm.
 */
export const ABILITY_NODE_FX: Map<string, LineageFxKey> = new Map<string, LineageFxKey>([
  // Offensive faces — what a Technique node draws.
  ['tempo/echo-hit', 'tempo.ghost-strike'],
  ['empowered/vulnerability', 'empowered.weak-point'],
  ['empowered/plating-shred', 'empowered.plating-crack'],
  ['affliction/hemorrhage', 'affliction.bleed-pips'],
  ['affliction/poison-stack', 'affliction.venom-pips'],
  ['affliction/contagion', 'affliction.stinger-echo'],
  ['control/slow', 'control.frost-drag'],
  ['kill-chain/speed-window', 'kill-chain.kill-pulse'],
  ['engagement/damage-window', 'engagement.opening-flash'],
  ['technique/technique-refund', 'technique.cast-flare'],
  // Defensive faces — what a Guard node draws. One per packet, from design §8's
  // face list: Avoid = a blur, Sustain = a pulse or a ward shell, Endure = chips.
  ['tempo/engagement-dr', 'tempo.evasive-blur'],
  ['engagement/engagement-dr', 'engagement.sidestep-blur'],
  ['control/engagement-dr', 'control.chill-blur'],
  // Avoid-face evasion-window (design §6, added 2026-10-01). Engagement's own
  // key, reused rather than new art — `brace-sparks` already has a client case.
  ['engagement/evasion-window', 'engagement.brace-sparks'],
  ['kill-chain/recovery-window', 'kill-chain.recovery-pulse'],
  ['barrier-tempo/ward', 'barrier-tempo.ward-shell'],
  ['bulwark/plating-stack', 'bulwark.plating-chip'],
]);

/** The fx key for one (lane, payoff) pair, or undefined when none is declared. */
export function abilityNodeFx(lane: PacketId, payoff: PayoffKind): LineageFxKey | undefined {
  return ABILITY_NODE_FX.get(`${lane}/${payoff}`);
}

/**
 * The DEFAULT axis an ability amplifier moves, per payoff kind.
 *
 * Derived rather than authored so the default can never be an inert option: an
 * on-target payoff gains a second body, a timed self payoff holds longer, and an
 * untimed self payoff gets bigger. Since design §22.10 the amplifier is a free
 * choice among every axis the route has ({@link nodePayoffAxes}); this is the
 * first of them, and the one an old save's amplifier keeps.
 */
export function nodePayoffAxis(payoff: PayoffKind): AmplifiedAxis {
  if (payoffLandsOnTarget(payoff)) return 'targets';
  // A self payoff with no window has no duration to lengthen, so `duration`
  // would be an amplifier charging a price and changing nothing — exactly what
  // `applyAmplifiedAxis` silently does with it. `technique-refund` is the first
  // such payoff the node table uses, and its magnitude is its whole content.
  return PAYOFF_UNIT.get(payoff)?.durationMs ? 'duration' : 'magnitude';
}

/** The ability shapes whose wind-up the `cast` axis can shorten (design §22.9). */
function windsUp(shape: AbilityDef['shape'] | undefined): boolean {
  return shape === 'cast' || shape === 'charge';
}

/**
 * EVERY axis the route of `payoff` can move on an ability of `shape`, the default
 * first (design §22.10: "any axis applies to the active route: second body,
 * longer window, bigger payoff, or shorter wind-up on a cast").
 *
 * Only axes that DO something are offered, so no amplifier charges a price and
 * changes nothing:
 *  - `targets`   on a payoff that lands on a body — except `contagion`, which
 *                already picks its own victims (`applyPayoff` refuses to spread it
 *                twice);
 *  - `duration`  on a payoff with a window;
 *  - `magnitude` always (every node payoff is a share or a size);
 *  - `cast`      on an ability that winds up: `cast` or `charge` (§22.9).
 */
export function nodePayoffAxes(payoff: PayoffKind, shape?: AbilityDef['shape']): AmplifiedAxis[] {
  const axes: AmplifiedAxis[] = [nodePayoffAxis(payoff)];
  const add = (axis: AmplifiedAxis): void => {
    if (!axes.includes(axis)) axes.push(axis);
  };
  if (payoffLandsOnTarget(payoff) && payoff !== 'contagion') add('targets');
  if (PAYOFF_UNIT.get(payoff)?.durationMs) add('duration');
  add('magnitude');
  if (windsUp(shape)) add('cast');
  return axes;
}

/**
 * The player-facing sentence for a payoff, in the voice of "this ability ALSO".
 * One line per payoff kind the node table uses; the magnitude is appended by the
 * UI from the resolved numbers, never written here.
 */
const PAYOFF_BLURB: Record<string, string> = {
  'echo-hit': 'also lands an echo of the hit.',
  'vulnerability': 'also brands the target, raising the damage it takes.',
  'plating-shred': "also strips part of the target's plating.",
  'hemorrhage': 'also opens a bleed on the target.',
  'poison-stack': 'also seeds a stack of poison.',
  'slow': "also drags at the target's stride.",
  'contagion': 'also spreads what the target carries to a neighbour.',
  'damage-window': 'also opens a damage window.',
  'speed-window': 'also opens an attack-speed window.',
  'engagement-dr': 'also braces you against incoming damage.',
  'recovery-window': 'also switches on a slice of your Recovery.',
  'ward': 'also raises a ward that absorbs damage.',
  'plating-stack': 'also banks a stack of plating.',
  'technique-refund': 'also pays part of its own cooldown back.',
  'technique-window': 'also loads the next Technique.',
  'evasion-window': 'also opens a window where you are more likely to graze a hit.',
};

/** The blurb for a payoff, or a plain fallback if a new kind arrives unnamed. */
export function nodePayoffBlurb(payoff: PayoffKind): string {
  return PAYOFF_BLURB[payoff] ?? `also fires ${payoff}.`;
}

/** What an amplifier option promises, from its axis. One sentence. */
export function nodeAxisBlurb(axis: AmplifiedAxis): string {
  switch (axis) {
    case 'duration': return 'The window holds longer.';
    case 'targets':  return 'It also lands on a second body.';
    case 'magnitude': return 'The payoff itself is bigger.';
    case 'cast':     return 'The wind-up is shorter.';
    default:         return 'It fires from a second moment too.';
  }
}

/** An amplifier option's short label, from its axis (the card's name). */
export function nodeAxisLabel(axis: AmplifiedAxis): string {
  switch (axis) {
    case 'duration': return 'Longer window';
    case 'targets':  return 'Second body';
    case 'magnitude': return 'Bigger payoff';
    case 'cast':     return 'Shorter wind-up';
    default:         return 'Second moment';
  }
}

/** A node option's player-facing name: the lane's own name (design §19). */
export function abilityNodeName(option: Pick<AbilityNodeOption, 'lane'>): string {
  return packetDefinition(option.lane)?.name ?? option.lane;
}

/** A node option's player-facing line — one sentence (design §26.4). */
export function abilityNodeDescription(option: AbilityNodeOption): string {
  switch (option.row) {
    case 'amplifier':
      return nodeAxisBlurb(option.amplifies ?? 'duration');
    case 'keystone':
      return abilityKeystoneDefinition(option.keystone ?? '')?.rule ?? 'A keystone verb.';
    case 'cross':
      return `Borrowed at half strength: this ability ${nodePayoffBlurb(option.payoff)}`;
    default:
      return `This ability ${nodePayoffBlurb(option.payoff)}`;
  }
}

// ─── Names grow with the rows (design §22.7, grammar finalised in §22.10) ─────

/** The packet row's adjective, from the payoff (§22.10's table). */
const PAYOFF_ADJECTIVE: Partial<Record<PayoffKind, string>> = {
  'echo-hit': 'Echoing',
  'vulnerability': 'Branding',
  'plating-shred': 'Sundering',
  'hemorrhage': 'Bleeding',
  'poison-stack': 'Venomed',
  'slow': 'Chilling',
  'damage-window': 'Opening',
  'speed-window': 'Quickening',
  'technique-refund': 'Drilled',
  'engagement-dr': 'Braced',
  'recovery-window': 'Mending',
  'ward': 'Warded',
  'plating-stack': 'Plated',
  'evasion-window': 'Fleet',
};

/** The amplifier row's "of X", from the axis (§22.10's table). */
const AXIS_OF: Partial<Record<AmplifiedAxis, string>> = {
  targets: 'of Many',
  duration: 'of the Lingering',
  magnitude: 'of Weight',
  cast: 'of Haste',
};

/** The cross row's "with Y", from the borrowed payoff's noun (§22.10's table). */
const PAYOFF_WITH: Partial<Record<PayoffKind, string>> = {
  'echo-hit': 'with Echoes',
  'vulnerability': 'with Brands',
  'plating-shred': 'with Sundering',
  'hemorrhage': 'with Bleeding',
  'poison-stack': 'with Venom',
  'slow': 'with Chill',
  'damage-window': 'with Opening',
  'speed-window': 'with Quickening',
  'technique-refund': 'with Drill',
  'engagement-dr': 'with Bracing',
  'recovery-window': 'with Mending',
  'ward': 'with Ward',
  'plating-stack': 'with Plate',
  'evasion-window': 'with Fleetness',
};

/** The adjective a packet payoff lends the ability's name, if it has one. */
export function nodePayoffAdjective(payoff: PayoffKind): string | undefined {
  return PAYOFF_ADJECTIVE[payoff];
}

/** The "with Y" a borrowed payoff lends the ability's name, if it has one. */
export function nodeCrossPhrase(payoff: PayoffKind): string | undefined {
  return PAYOFF_WITH[payoff];
}

/** The "of X" an amplifier axis lends the ability's name, if it has one. */
export function nodeAxisPhrase(axis: AmplifiedAxis): string | undefined {
  return AXIS_OF[axis];
}

/**
 * The words the ability's ACTIVE rows lend its name (design §22.10), for
 * `abilityDisplayName`: *Bleeding Sweep* → *Bleeding Sweep of Many* → *Bleeding
 * Whirlwind of Many* → *Bleeding Whirlwind of Many, with Echoes*.
 *
 * Each word comes from a row that is actually live: the packet's adjective, the
 * amplifier's "of X" only while it modifies the active packet, the keystone's noun
 * only for a live verb, and the cross's "with Y" only while it borrows a lane that
 * is not the packet's own — so the name never promises a row that does nothing.
 * Every word is derived from the payoff or the axis, never authored per ability.
 */
export function abilityNodeNameParts(
  abilityId: string,
  progress: AbilityNodeProgress | undefined,
): AbilityNameParts {
  const tree = ABILITY_NODE_DATABASE.get(abilityId);
  if (!tree || !progress) return {};
  const activeOption = (row: AbilityNodeRow): AbilityNodeOption | undefined => {
    const id = progress.active[row];
    return id && progress.owned.includes(id)
      ? tree.options.find((o) => o.id === id && o.row === row)
      : undefined;
  };
  const parts: AbilityNameParts = {};
  const packet = activeOption('packet');
  if (packet) {
    const adjective = nodePayoffAdjective(packet.payoff);
    if (adjective) parts.adjective = adjective;
    const amplifier = activeOption('amplifier');
    if (amplifier && amplifier.modifies === packet.id && amplifier.amplifies) {
      const of = nodeAxisPhrase(amplifier.amplifies);
      if (of) parts.of = of;
    }
    const cross = activeOption('cross');
    if (cross && cross.lane !== packet.lane) {
      const withY = nodeCrossPhrase(cross.payoff);
      if (withY) parts.with = withY;
    }
  }
  const keystone = activeOption('keystone');
  const verb = keystone?.keystone ? abilityKeystoneDefinition(keystone.keystone) : undefined;
  if (verb?.live) parts.noun = verb.name;
  return parts;
}

// ─── Ids ─────────────────────────────────────────────────────────────────────

/**
 * The option id for one row and lane. Stable: it is persisted in `owned`.
 *
 * An amplifier's DEFAULT axis keeps the bare `ability.amplifier.lane` id it has
 * had since design §19, so every save written before the free axis (§22.10)
 * still names the same option and does exactly what it did; the other axes of
 * the route are `ability.amplifier.lane.axis`. Pass the axis to name one.
 */
export function abilityNodeId(
  abilityId: string,
  row: AbilityNodeRow,
  lane: PacketId,
  axis?: AmplifiedAxis,
): string {
  const base = `${abilityId}.${row}.${lane}`;
  if (row !== 'amplifier' || axis === undefined) return base;
  const offer = ABILITY_PACKET_OFFERS.get(abilityId)?.find(([offerLane]) => offerLane === lane);
  if (offer && nodePayoffAxis(offer[1]) === axis) return base;
  return `${base}.${axis}`;
}

/** The option id for one keystone verb. Stable: it is persisted in `owned`. */
export function abilityKeystoneNodeId(abilityId: string, keystoneId: string): string {
  return `${abilityId}.keystone.${keystoneId}`;
}

/** The id an option's own fields derive — what every generated id must equal. */
export function abilityNodeOptionId(option: AbilityNodeOption): string {
  if (option.row === 'keystone') return abilityKeystoneNodeId(option.abilityId, option.keystone ?? '');
  return abilityNodeId(option.abilityId, option.row, option.lane, option.amplifies);
}

// ─── The database ────────────────────────────────────────────────────────────

function buildDefinition(ability: AbilityDef): AbilityNodeDefinition | undefined {
  const offers = ABILITY_PACKET_OFFERS.get(ability.id);
  if (!offers) return undefined;

  const options: AbilityNodeOption[] = [];
  for (const [lane, payoff] of offers) {
    options.push({
      id: abilityNodeId(ability.id, 'packet', lane),
      abilityId: ability.id,
      row: 'packet',
      lane,
      payoff,
    });
  }
  // The amplifier row: per packet option, one option per axis its route can move,
  // the default first. Tied by `modifies`, so — exactly like a lineage amplifier —
  // one whose packet is not the active packet is a legal, inert loadout rather
  // than an error.
  for (const [lane, payoff] of offers) {
    for (const axis of nodePayoffAxes(payoff, ability.shape)) {
      options.push({
        id: abilityNodeId(ability.id, 'amplifier', lane, axis),
        abilityId: ability.id,
        row: 'amplifier',
        lane,
        payoff,
        modifies: abilityNodeId(ability.id, 'packet', lane),
        amplifies: axis,
      });
    }
  }
  // The keystone row: the ability's trio (design §22.11). An ability the trios
  // table does not name (a §22.2 cut) has an empty keystone row.
  for (const verb of abilityKeystoneTrio(ability.id) ?? []) {
    options.push({
      id: abilityKeystoneNodeId(ability.id, verb.id),
      abilityId: ability.id,
      row: 'keystone',
      lane: keystoneFxLane(verb.fx),
      payoff: verb.payoff,
      keystone: verb.id,
    });
  }
  // The cross row: derived, one option per offer. The one on the active packet's
  // own lane never fires (it would be the same payoff twice), so the panel shows
  // the other two — "one option per non-active offer" (design §22.1).
  for (const [lane, payoff] of offers) {
    options.push({
      id: abilityNodeId(ability.id, 'cross', lane),
      abilityId: ability.id,
      row: 'cross',
      lane,
      payoff,
    });
  }

  const rowTier = {} as Record<AbilityNodeRow, number>;
  const rowOwnTier = {} as Record<AbilityNodeRow, number>;
  for (const row of ABILITY_NODE_ROWS) {
    rowTier[row] = abilityNodeBandTier(ability, row);
    rowOwnTier[row] = abilityNodeRowTier(ability, row);
  }

  return {
    abilityId: ability.id,
    family: ability.slot,
    rowTier,
    rowOwnTier,
    options,
  };
}

const definitionEntries: [string, AbilityNodeDefinition][] = [];
for (const ability of ABILITY_DATABASE.values()) {
  const definition = buildDefinition(ability);
  if (definition) definitionEntries.push([ability.id, definition]);
}

export const ABILITY_NODE_DATABASE: Map<string, AbilityNodeDefinition> =
  new Map<string, AbilityNodeDefinition>(definitionEntries);

export function abilityNodeTree(abilityId: string): AbilityNodeDefinition | undefined {
  return ABILITY_NODE_DATABASE.get(abilityId);
}

/** The options of one row, in render order. */
export function abilityNodeOptionsForRow(
  tree: AbilityNodeDefinition,
  row: AbilityNodeRow,
): AbilityNodeOption[] {
  return tree.options.filter((o) => o.row === row);
}

/**
 * The options of one row the player should SEE, given their progress (design
 * §22.10): the amplifier row shows the axes of the ACTIVE route (with no packet
 * slotted, each route's default, so the row still says what it is for); the cross
 * row shows the two offers that are not the active packet; the packet and
 * keystone rows show everything.
 */
export function abilityNodeVisibleOptions(
  tree: AbilityNodeDefinition,
  row: AbilityNodeRow,
  progress: AbilityNodeProgress | undefined,
): AbilityNodeOption[] {
  const options = abilityNodeOptionsForRow(tree, row);
  const lane = activePacketLane(tree.abilityId, progress);
  if (row === 'amplifier') {
    if (!lane) return options.filter((o) => o.id === abilityNodeId(tree.abilityId, 'amplifier', o.lane));
    return options.filter((o) => o.lane === lane);
  }
  if (row === 'cross') return lane ? options.filter((o) => o.lane !== lane) : options;
  return options;
}

/** One option by id, across the whole database — the runtime's lookup. */
export function abilityNodeOption(abilityId: string, optionId: string): AbilityNodeOption | undefined {
  return ABILITY_NODE_DATABASE.get(abilityId)?.options.find((o) => o.id === optionId);
}

export * from './types';
export * from './offers';
export * from './resolve';
export * from './keystones';
