/**
 * The eight keystones — one per packet (design §4, as amended 2026-10-01).
 *
 * WHAT A KEYSTONE IS. Every other row is data over a closed vocabulary: a
 * trigger, a payoff, a number from `magnitudes.ts`. The keystone row is the one
 * exception, and it is deliberate — design §4 calls it "what does it become? (rule
 * change)". A keystone does not add an effect; it changes how an effect the player
 * already owns behaves. That cannot be authored, so each one is a small named
 * module in `server/src/systems/combat/keystones/`.
 *
 * ONE PER PACKET, NOT ONE PER LANE SLOT. The amendment matters for authoring: a
 * lineage's T3 keystone card names its lane, and the LANE decides the rule. Five
 * weapon lineages carrying Tempo all play Chain; what differs is the card's name,
 * its description and which other lanes it sits beside. So this table is keyed by
 * `PacketId` and has exactly eight rows, and a T3 card is a flavour of the row its
 * lane points at.
 *
 * WHAT IS IN HERE AND WHAT IS NOT. Shared owns the IDENTITY of a keystone (which
 * lane, what it is called, what rule it states, which fx key it draws, and the
 * payoff kind its magnitude is resolved from when it has one) because the tree
 * panel, the card tooltips and the authoring tests all need it. Shared owns none
 * of the BEHAVIOUR: the rule lives on the server, where the seams it changes are.
 *
 * Design authority: `design_docs/progression-rework-design.md` §4.
 */
import type { LineageFxKey, PacketId, PayoffKind } from './types';
import { PACKET_IDS, keystoneFxKey } from './types';

/** Stable id of a keystone — the rule's own name, lowercased. */
export type KeystoneId =
  | 'chain'
  | 'shockwave'
  | 'festering'
  | 'ladder'
  | 'refund'
  | 'always-first'
  | 'immovable'
  | 'unbroken';

export interface KeystoneDefinition {
  id: KeystoneId;
  /** The packet whose keystone row this is. One keystone per lane, every slot. */
  lane: PacketId;
  /** Player-facing name. A lineage's T3 card may rename it in its own flavour. */
  name: string;
  /** The rule, in one sentence, for the tooltip and the tree's build readout. */
  rule: string;
  /** Always `<lane>.keystone`. Carried so a caller never rebuilds the string. */
  fx: LineageFxKey;
  /**
   * The payoff kind a lineage's T3 keystone card MUST be authored with, for the
   * two keystones that pay out a share of a hit (Chain's link, Shockwave's area
   * hit). Absent on the six whose rule is a timing or a refusal: their numbers
   * are the durations and reaches in `LINEAGE_UNITS`, and the card's authored
   * payoff is only there because `coverage.test.ts` requires every non-stat row
   * to do something the moment it is bought.
   *
   * The share itself is the card's OWN resolved magnitude, straight off the one
   * magnitude table at `ROW_SCALAR.keystone` — so the frame-face bias and the
   * tier column apply to it exactly as they do to a payoff row, and the runtime
   * resolves nothing. Naming the kind here is what keeps twenty lineages'
   * flavours of one shared rule paying the same share.
   */
  payoff?: PayoffKind;
}

const keystoneEntries: [PacketId, KeystoneDefinition][] = [
  ['tempo', {
    id: 'chain', lane: 'tempo', name: 'Chain',
    rule: 'An echo hit keeps re-triggering until a hit misses or no fresh target is in reach.',
    fx: keystoneFxKey('tempo'), payoff: 'echo-hit',
  }],
  ['empowered', {
    id: 'shockwave', lane: 'empowered', name: 'Shockwave',
    rule: 'The hit that spends your mechanic becomes an area hit around the target.',
    fx: keystoneFxKey('empowered'), payoff: 'echo-hit',
  }],
  ['affliction', {
    id: 'festering', lane: 'affliction', name: 'Festering',
    rule: 'Your damage-over-time on a target does not expire while you keep hitting it.',
    fx: keystoneFxKey('affliction'),
  }],
  ['control', {
    id: 'ladder', lane: 'control', name: 'Ladder',
    rule: 'Hitting a slowed target roots it; hitting a rooted target stuns it. Once per step per target.',
    fx: keystoneFxKey('control'),
  }],
  ['kill-chain', {
    id: 'refund', lane: 'kill-chain', name: 'Refund',
    rule: 'A kill readies your class mechanic.',
    fx: keystoneFxKey('kill-chain'),
  }],
  ['engagement', {
    id: 'always-first', lane: 'engagement', name: 'Always First',
    rule: 'The first hit on each new target counts as your mechanic firing.',
    fx: keystoneFxKey('engagement'),
  }],
  ['bulwark', {
    id: 'immovable', lane: 'bulwark', name: 'Immovable',
    rule: 'Stationary guard and plating stacks hold for two seconds after you move, and nothing displaces you while they stand.',
    fx: keystoneFxKey('bulwark'),
  }],
  ['barrier-tempo', {
    id: 'unbroken', lane: 'barrier-tempo', name: 'Unbroken',
    rule: 'Your barrier keeps recharging through hits while you are above half health.',
    fx: keystoneFxKey('barrier-tempo'),
  }],
];

/** Keyed by lane: the keystone every lineage carrying that lane plays. */
export const KEYSTONE_DEFINITIONS: Map<PacketId, KeystoneDefinition> =
  new Map<PacketId, KeystoneDefinition>(keystoneEntries);

/** The keystone of a lane. Every packet has exactly one (design §4). */
export function keystoneDefinition(lane: PacketId): KeystoneDefinition | undefined {
  return KEYSTONE_DEFINITIONS.get(lane);
}

/** Every keystone, in packet order. */
export const KEYSTONES: readonly KeystoneDefinition[] =
  PACKET_IDS.map((lane) => KEYSTONE_DEFINITIONS.get(lane)!);
