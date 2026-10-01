/**
 * The ability-node database (design §19) — derived, not authored.
 *
 * `offers.ts` says which three packets each ability offers. Everything else is
 * built here from one table per question, so a new ability needs three pairs in
 * `offers.ts` and nothing else:
 *
 *   - the amplifier row is GENERATED, one option per packet option, carrying the
 *     axis that packet's payoff can actually move ({@link NODE_PAYOFF_AXIS});
 *   - the visual signature comes from {@link ABILITY_NODE_FX}, every key of
 *     which already exists in `LINEAGE_FX_KEYS` and already has a client
 *     handler, so a node draws the lane's grammar and adds no client work;
 *   - the player-facing name is the PACKET's name and the blurb is the payoff's
 *     sentence, because design §19 asks for "a generic tree keyed to packets".
 *
 * Which band a row is gated in follows the ability rather than the calendar;
 * `abilityNodeRowTier` in `resolve.ts` is that rule's one home.
 */
import { ABILITY_DATABASE } from '../../abilities';
import type { AbilityDef } from '../../abilities';
import { packetDefinition } from '../lineages/packets';
import type { AmplifiedAxis, LineageFxKey, PacketId, PayoffKind } from '../lineages/types';
import { payoffLandsOnTarget } from '../lineages/types';
import { ABILITY_PACKET_OFFERS } from './offers';
import { abilityNodeRowTier } from './resolve';
import type {
  AbilityNodeDefinition, AbilityNodeOption, AbilityNodeRow,
} from './types';

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
 * The axis an ability amplifier moves, per payoff kind.
 *
 * Derived rather than authored so the row can never carry an inert option: an
 * on-target payoff gains a second body, a timed self payoff holds longer. Those
 * are the two axes that are always meaningful for the payoffs ability nodes use,
 * and `duration` on an untimed payoff or `targets` on a self window would be a
 * card charging a price and changing nothing.
 */
export function nodePayoffAxis(payoff: PayoffKind): AmplifiedAxis {
  return payoffLandsOnTarget(payoff) ? 'targets' : 'duration';
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
  'evasion-window': 'also opens a window where you are more likely to dodge outright.',
};

/** The blurb for a payoff, or a plain fallback if a new kind arrives unnamed. */
export function nodePayoffBlurb(payoff: PayoffKind): string {
  return PAYOFF_BLURB[payoff] ?? `also fires ${payoff}.`;
}

/** What an amplifier option promises, from its axis. */
export function nodeAxisBlurb(axis: AmplifiedAxis): string {
  switch (axis) {
    case 'duration': return 'The window holds longer.';
    case 'targets':  return 'It also lands on a second body.';
    case 'magnitude': return 'The payoff itself is bigger.';
    default:         return 'It fires from a second moment too.';
  }
}

/** A node option's player-facing name: the lane's own name (design §19). */
export function abilityNodeName(option: Pick<AbilityNodeOption, 'lane'>): string {
  return packetDefinition(option.lane)?.name ?? option.lane;
}

/** A node option's player-facing line. */
export function abilityNodeDescription(option: AbilityNodeOption): string {
  if (option.row === 'amplifier') {
    return `${nodeAxisBlurb(option.amplifies ?? 'duration')} Needs the ${abilityNodeName(option)} node.`;
  }
  return `This ability ${nodePayoffBlurb(option.payoff)}`;
}

/** The option id for one row and lane. Stable: it is persisted in `owned`. */
export function abilityNodeId(abilityId: string, row: AbilityNodeRow, lane: PacketId): string {
  return `${abilityId}.${row}.${lane}`;
}

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
  // One amplifier per packet option, carrying that payoff's own axis. Tied by
  // `modifies`, so — exactly like a lineage amplifier — the one whose packet is
  // not the active packet is a legal, inert loadout rather than an error.
  for (const [lane, payoff] of offers) {
    options.push({
      id: abilityNodeId(ability.id, 'amplifier', lane),
      abilityId: ability.id,
      row: 'amplifier',
      lane,
      payoff,
      modifies: abilityNodeId(ability.id, 'packet', lane),
      amplifies: nodePayoffAxis(payoff),
    });
  }

  return {
    abilityId: ability.id,
    family: ability.slot,
    rowTier: {
      packet: abilityNodeRowTier(ability, 'packet'),
      amplifier: abilityNodeRowTier(ability, 'amplifier'),
    },
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

/** One option by id, across the whole database — the runtime's lookup. */
export function abilityNodeOption(abilityId: string, optionId: string): AbilityNodeOption | undefined {
  return ABILITY_NODE_DATABASE.get(abilityId)?.options.find((o) => o.id === optionId);
}

export * from './types';
export * from './offers';
export * from './resolve';
