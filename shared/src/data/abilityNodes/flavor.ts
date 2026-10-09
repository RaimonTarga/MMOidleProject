/**
 * Flavor progression (design §22.7, the name grammar finalised in §22.10): an
 * ability's identity deepens with its rows — in its NAME and in its ICON — so the
 * tree reads as verbs, not as bigger numbers.
 *
 * Everything here is DERIVED from the rows the player has active and from the lane
 * or axis each row names, never authored per ability:
 *
 *  - the name's words come from the payoff (the packet's adjective, the cross's
 *    "with Y"), from the axis (the amplifier's "of X") and from the keystone (its
 *    noun replaces the ability's). `abilityDisplayName` (abilities.ts) is the ONE
 *    entry point every surface reads; this file only says which words the rows
 *    lend it ({@link abilityNodeNameParts});
 *  - the icon is a LAYER LIST over the ability's one hand-made glyph: the packet's
 *    lane colour as a frame, the amplifier's axis as a small overlay glyph, the
 *    cross's borrowed lane as an edge, the keystone as a border treatment plus,
 *    where its rule has a silhouette, a second glyph ({@link abilityIconLayers}).
 *    The client composes it from existing art (`client/src/ui/abilityIcons.ts`);
 *    nothing here names a file.
 *
 * The only thing authored per keystone is its SILHOUETTE word (a spin, a line, a
 * fork, a shell …) — §22.7's "only the keystone's second glyph and its animation
 * are authored, one per keystone". It says which shape the second glyph shows;
 * which piece of art draws that shape is the client's.
 *
 * Not the Ornate skin (design §26.4's later track): no frames-as-ornament, no
 * gems, no light passes. A frame here is a lane's colour, never decoration.
 */
import type { AbilityNameParts } from '../../abilities';
import { ABILITY_DATABASE } from '../../abilities';
import type { AmplifiedAxis, PacketId, PayoffKind } from '../lineages/types';
import { ABILITY_NODE_DATABASE } from './index';
import { abilityKeystoneDefinition } from './keystones';
import type { AbilityNodeOption, AbilityNodeProgress, AbilityNodeRow } from './types';

// ─── The rows actually in play ───────────────────────────────────────────────

/**
 * The options an ability's ACTIVE rows hold that actually do something — the one
 * reading both the name and the icon take, so the two can never disagree:
 *
 *  - `packet`    the active, owned packet option;
 *  - `amplifier` only while it modifies the active packet (an amplifier left on
 *                another route is a legal, inert loadout and lends nothing);
 *  - `keystone`  only a LIVE verb (a silhouette is shown on the tree, never worn);
 *  - `cross`     only while it borrows a lane that is not the packet's own (the
 *                same payoff twice never fires).
 */
export interface AbilityActiveRows {
  packet?: AbilityNodeOption;
  amplifier?: AbilityNodeOption;
  keystone?: AbilityNodeOption;
  cross?: AbilityNodeOption;
}

export function abilityActiveRows(
  abilityId: string,
  progress: AbilityNodeProgress | undefined,
): AbilityActiveRows {
  const tree = ABILITY_NODE_DATABASE.get(abilityId);
  if (!tree || !progress) return {};
  const activeOption = (row: AbilityNodeRow): AbilityNodeOption | undefined => {
    const id = progress.active[row];
    return id && progress.owned.includes(id)
      ? tree.options.find((o) => o.id === id && o.row === row)
      : undefined;
  };
  const rows: AbilityActiveRows = {};
  const packet = activeOption('packet');
  if (packet) {
    rows.packet = packet;
    const amplifier = activeOption('amplifier');
    if (amplifier && amplifier.modifies === packet.id && amplifier.amplifies) rows.amplifier = amplifier;
    const cross = activeOption('cross');
    if (cross && cross.lane !== packet.lane) rows.cross = cross;
  }
  const keystone = activeOption('keystone');
  if (keystone?.keystone && abilityKeystoneDefinition(keystone.keystone)?.live) rows.keystone = keystone;
  return rows;
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
 * Each word comes from a row that is actually live ({@link abilityActiveRows}), so
 * the name never promises a row that does nothing. Every word is derived from the
 * payoff, the axis or the keystone, never authored per ability.
 */
export function abilityNodeNameParts(
  abilityId: string,
  progress: AbilityNodeProgress | undefined,
): AbilityNameParts {
  const rows = abilityActiveRows(abilityId, progress);
  const parts: AbilityNameParts = {};
  if (rows.packet) {
    const adjective = nodePayoffAdjective(rows.packet.payoff);
    if (adjective) parts.adjective = adjective;
  }
  if (rows.amplifier?.amplifies) {
    const of = nodeAxisPhrase(rows.amplifier.amplifies);
    if (of) parts.of = of;
  }
  if (rows.cross) {
    const withY = nodeCrossPhrase(rows.cross.payoff);
    if (withY) parts.with = withY;
  }
  const verb = rows.keystone?.keystone ? abilityKeystoneDefinition(rows.keystone.keystone) : undefined;
  if (verb) parts.noun = verb.name;
  return parts;
}

// ─── Icons compose with the rows (design §22.7) ──────────────────────────────

/**
 * The shape a keystone's second glyph shows — the closed list of silhouettes the
 * first verbs' rules have (design §22.7: "where the keystone's silhouette differs
 * from the base (a spin, a line, a fork), a second glyph layered over the base").
 */
export type AbilityKeystoneSilhouette =
  | 'spin'      // the body turns: a cleave every tick
  | 'quake'     // the ground goes again
  | 'stagger'   // a body knocked off its rhythm (the control ladder's shortest rung)
  | 'spread'    // what a body carried passes on
  | 'net'       // the hold widens to the neighbours
  | 'burst'     // a body goes off and takes its neighbours with it
  | 'fade'      // you, gone from their eyes (an outline left behind)
  | 'line'      // one shot, straight through
  | 'jump'      // the effect hops body to body
  | 'fork'      // a hit splits to a second body
  | 'formation' // the mend runs down the line
  | 'shell'     // nothing gets in
  | 'snare'     // the attacker is held
  | 'scythe'    // the harvest moves on
  | 'flow';     // the window streams on through every dodge

/**
 * The silhouette per keystone verb. The first verb of every trio (§22.4, §22.8,
 * Breakthrough for Trample per §22.11, Flow ahead of Afterimage per §22.12) has
 * one; the later verbs get theirs when their rules are implemented (Afterimage
 * keeps the one it was given as a first verb). A verb with no entry wears the
 * border alone.
 */
export const ABILITY_KEYSTONE_SILHOUETTES: Map<string, AbilityKeystoneSilhouette> =
  new Map<string, AbilityKeystoneSilhouette>([
    // Techniques
    ['whirlwind', 'spin'],
    ['aftershock', 'quake'],
    ['breakthrough', 'stagger'],
    ['outbreak', 'spread'],
    ['dragnet', 'net'],
    ['chain-reaction', 'burst'],
    ['vanish', 'fade'],
    ['pierce', 'line'],
    ['relay', 'jump'],
    ['fork', 'fork'],
    ['harvest', 'scythe'],
    // Guards
    ['shared-breath', 'formation'],
    ['immunity', 'shell'],
    ['riposte', 'stagger'],
    ['entangle', 'snare'],
    ['unyielding', 'shell'],
    ['backlash', 'burst'],
    ['overflow', 'shell'],
    ['flow', 'flow'],
    ['afterimage', 'fade'],
  ]);

/** A keystone verb's silhouette, or undefined when it wears the border alone. */
export function abilityKeystoneSilhouette(keystoneId: string): AbilityKeystoneSilhouette | undefined {
  return ABILITY_KEYSTONE_SILHOUETTES.get(keystoneId);
}

/**
 * One layer of a composed ability icon, bottom to top. Each names WHAT the layer
 * says (a lane, an axis, a verb); the client decides the art and the placement.
 *
 *  - `base`            the ability's own glyph (`ability.icon`, else its id);
 *  - `lane-frame`      the packet row: the active lane's colour as a frame;
 *  - `cross-edge`      the cross row: the borrowed lane's colour on one edge;
 *  - `keystone-border` the keystone row: a border treatment in the verb's lane;
 *  - `keystone-glyph`  the keystone's second glyph, where its rule has a silhouette;
 *  - `axis-glyph`      the amplifier row: a small overlay glyph for its axis.
 */
export type AbilityIconLayer =
  | { kind: 'base'; glyph: string }
  | { kind: 'lane-frame'; lane: PacketId }
  | { kind: 'cross-edge'; lane: PacketId }
  | { kind: 'keystone-border'; lane: PacketId; keystone: string }
  | { kind: 'keystone-glyph'; keystone: string; silhouette: AbilityKeystoneSilhouette }
  | { kind: 'axis-glyph'; axis: AmplifiedAxis };

/**
 * The composed icon of an ability, as a layer list: a pure function of (ability,
 * active rows), so the bar, the panel and a test all read the same answer. No
 * rows: the base glyph alone. An unknown ability: an empty list.
 */
export function abilityIconLayers(
  abilityId: string,
  progress: AbilityNodeProgress | undefined,
): AbilityIconLayer[] {
  const ability = ABILITY_DATABASE.get(abilityId);
  if (!ability) return [];
  const layers: AbilityIconLayer[] = [{ kind: 'base', glyph: ability.icon?.trim() || ability.id }];
  const rows = abilityActiveRows(abilityId, progress);
  if (rows.packet) layers.push({ kind: 'lane-frame', lane: rows.packet.lane });
  if (rows.cross) layers.push({ kind: 'cross-edge', lane: rows.cross.lane });
  const keystoneId = rows.keystone?.keystone;
  if (rows.keystone && keystoneId) {
    // The keystone option's lane is the one its fx draws in — the colour its card wears.
    layers.push({ kind: 'keystone-border', lane: rows.keystone.lane, keystone: keystoneId });
    const silhouette = abilityKeystoneSilhouette(keystoneId);
    if (silhouette) layers.push({ kind: 'keystone-glyph', keystone: keystoneId, silhouette });
  }
  if (rows.amplifier?.amplifies) layers.push({ kind: 'axis-glyph', axis: rows.amplifier.amplifies });
  return layers;
}
