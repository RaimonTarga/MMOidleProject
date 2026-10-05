/**
 * The eight packets (design §3) — the full lane vocabulary, one table.
 *
 * A packet answers three questions the same way everywhere it appears: what the
 * player scales, what fires, and what pays. That is why two lineages carrying the
 * same lane look alike on purpose — the lane IS the shape, and the lineage
 * differentiates through its other two lanes and its capstone.
 *
 * `favours`/`punishes` are the encounter contract (design §12): every variant
 * family names the lane it favours and the lane it punishes, and Phase 2's family
 * data is checked against this table so no packet is unanswerable.
 */
import type {
  DefensiveFace, LineageFxKey, LineageStatKey, PacketId, PayoffKind, TriggerKind,
} from './types';

/**
 * A packet's moment, as a SHAPE (design §24.2): which trigger fires a verb of this
 * lane. The numbers (`n`, the rate cap) live in `PACKET_HALF_NUMBERS`
 * (`magnitudes.ts`); `packetMoment` (`resolve.ts`) joins the two.
 */
export interface PacketMomentShape {
  kind: TriggerKind;
  /** `first-hit` only: latched per BODY rather than per engagement. */
  perTarget?: boolean;
  /** `kill` only: the kill arms, the next landed hit fires. */
  carry?: boolean;
}

/**
 * The two halves a packet contributes to a T1 band (design §24.2) — shapes and
 * phrases only, no numbers.
 *
 * The VERB row names the moment; the LEAN row names the payload. A verb fires its
 * own lane's moment and delivers the active lean's payload; with no lean, or a
 * lean of its own lane, it delivers its lane's PURE payload instead. The pure
 * pair always fires on the packet's own moment.
 *
 * Phrases are TEMPLATES. `{slot}` markers are filled from the half's numbers in
 * `PACKET_HALF_NUMBERS`, so a designer number change updates the text — no
 * sentence is ever typed per pair (`sentences.ts` renders them):
 *
 *   {nth}      the moment's `n` as an ordinal            6 → "6th"
 *   {cap}      the moment's `capMs` in seconds           5000 → "5 s"
 *   {duration} the payload's `durationMs` in seconds     1500 → "1.5 s"
 *   {times}    an echo's share as a count                1 → "twice"
 *   {swing}    a DoT's share of the hit as swings        1 → "a whole swing"
 *   {mult}     a hit multiplier as a word                2 → "double"
 *   {asHard}   a hit multiplier, comparative             1.5 → "half again"
 *   {shareOf}  a fraction, partitive                     1/3 → "a third of", 0.5 → "half"
 *   {loadPct}  the loaded hit's bonus                    1.5 → "+50%"
 *   {redose}   a re-dose share as a verb                 1 → "doubles"
 */
export interface PacketHalves {
  /** The verb row: the moment. */
  moment: PacketMomentShape;
  /** The lean row: the payload this lane hands a verb of ANOTHER lane. */
  payload: PayoffKind;
  /** The payload's own fx — a payload owns its effect (rule 4). */
  payloadFx: LineageFxKey;
  /** Same lane, or no lean: the pure payload, fired on `moment`. */
  pure: { payload: PayoffKind; fx: LineageFxKey };
  /**
   * The moment as a sentence opener. `subject` moments read "X <payload>.";
   * `clause` moments read "X, the hit <payload>.".
   */
  momentPhrase: { text: string; kind: 'subject' | 'clause' };
  /** The payload as a predicate: what the hit, or the moment, does. */
  payloadPhrase: string;
  /**
   * The one hand-authored sentence per packet: the pure pair (design §24.2).
   *
   * One ` | ` marks where its MOMENT ends and its payload begins (legibility run,
   * design §26.4: the page colours the two halves of a sentence, and never parses
   * text to find them). The marker is never rendered: `pureSentenceText` joins the
   * halves with a space and `pureSentenceParts` returns them apart.
   */
  pureSentence: string;
  /**
   * What this lane's MOMENT cannot reach, as the short note the weapon page shows
   * under a verb of the lane (design §24.9: Kill chain "is weak on bosses" until
   * the boss HP bar shows quarters). Absent for a moment every fight supplies.
   */
  momentCaveat?: string;
}

export interface PacketDefinition {
  id: PacketId;
  /** Player-facing lane name. */
  name: string;
  /** The stat the lane's stat row scales (design §4: the one row that is a number). */
  scalingStat: LineageStatKey;
  /** One line for the tree UI's lane header. */
  wants: string;
  firesOn: string;
  paysWith: string;
  weakAgainst: string;
  /** Lane colour: weapon trail, buff clock, and the gate aura (design §8). */
  color: string;
  /** False for the two defensive-only packets weapons never draw from. */
  weaponEligible: boolean;
  /**
   * The player-facing name of this packet's shard material (design §24.2): one
   * physical noun per packet, because the player never reads a lane name on a
   * material. Lane names stay the internal vocabulary; the player sees shards,
   * colours and sentences. Read through {@link shardName}.
   */
  shardName: string;
  /**
   * The lean-and-verb halves (design §24.2). Present on the seven weapon-eligible
   * packets; absent on Bulwark and Barrier tempo, which §24.2 gives no halves
   * while the non-weapon trees are parked.
   */
  halves?: PacketHalves;
}

/**
 * Scaling-stat notes:
 *  - `control` scales `slowOnHit` (design §24.9): the lean slows on every hit, so
 *    it SEEDS its own moment's hold, as Affliction's DoT potency seeds its bleed.
 *    Until then it scaled flat Attack, a placeholder shared with `engagement`.
 *  - `bulwark` and `barrier-tempo` are placeholders until Phase 4 authors the
 *    defensive matrices; no weapon lane can reach them, so nothing reads them yet.
 */
const packetEntries: [PacketId, PacketDefinition][] = [
  ['tempo', {
    id: 'tempo', name: 'Tempo', scalingStat: 'attackSpeedPct', shardName: 'Gale Shard',
    wants: 'attack speed, on-hit', firesOn: 'every nth hit',
    paysWith: 'echo hits, speed windows, rampage',
    weakAgainst: 'fortified plating, a single big target',
    color: '#7fe3ff', weaponEligible: true,
    // "Lands twice" is a real second swing through the proc seam (skips plating,
    // pays half DR, carries on-hit), not double damage on paper (design §24.2).
    halves: {
      moment: { kind: 'hit-nth' },
      payload: 'echo-hit', payloadFx: 'tempo.ghost-strike',
      pure: { payload: 'echo-hit', fx: 'tempo.ghost-strike' },
      momentPhrase: { text: 'Every {nth} hit', kind: 'subject' },
      payloadPhrase: 'lands {times}',
      pureSentence: 'Every {nth} hit | strikes {times}.',
    },
  }],
  ['empowered', {
    id: 'empowered', name: 'Empowered', scalingStat: 'attackPct', shardName: 'Anvil Shard',
    wants: 'attack %, empowered multiplier', firesOn: 'your class mechanic',
    paysWith: 'vulnerability, plating shred, stagger',
    weakAgainst: 'swarms, evasive mobs',
    color: '#ffb347', weaponEligible: true,
    // The payload is the Signature idea: the hit COUNTS AS the mechanic — never
    // emits it (rule 3). The pure pair is a bigger mechanic hit, because
    // Empowered × Empowered would otherwise read "when your mechanic fires, it
    // counts as your mechanic firing".
    halves: {
      moment: { kind: 'mechanic-fired' },
      payload: 'mechanic-proxy', payloadFx: 'empowered.mechanic-flash',
      pure: { payload: 'big-hit', fx: 'empowered.crash' },
      momentPhrase: { text: 'When your class mechanic fires (every {cap} at most)', kind: 'clause' },
      payloadPhrase: 'counts as your class mechanic firing',
      pureSentence: 'Your mechanic | hits {asHard} as hard.',
    },
  }],
  ['affliction', {
    // DoT potency, not on-hit (design §24.2, corrected 2026-10-03): on-hit is the
    // fast attacker's package and stays a WEAPON base stat that Tempo multiplies.
    id: 'affliction', name: 'Affliction', scalingStat: 'dotPotencyPct', shardName: 'Venom Shard',
    wants: 'DoT potency, stacks', firesOn: 'a hit on an afflicted target',
    paysWith: 'hemorrhage, poison, Detonate, Contagion',
    weakAgainst: 'dot-resistant mobs, short fights',
    color: '#9be564', weaponEligible: true,
    halves: {
      moment: { kind: 'hit-afflicted' },
      payload: 'hemorrhage', payloadFx: 'affliction.heavy-drip',
      pure: { payload: 'redose', fx: 'affliction.double-dose' },
      momentPhrase: {
        text: 'A hit on a target you have already afflicted (every {cap} at most)',
        kind: 'subject',
      },
      payloadPhrase: 'leaves a heavy poison or bleed, {swing} over {duration}',
      pureSentence: 'Hitting an afflicted target | {redose} its affliction.',
    },
  }],
  ['control', {
    id: 'control', name: 'Control', scalingStat: 'slowOnHit', shardName: 'Shackle Shard',
    wants: 'slow, chill', firesOn: 'a hit on a slowed target',
    paysWith: 'root, stun, bonus damage vs controlled',
    weakAgainst: 'control-immune bosses',
    color: '#8fb8ff', weaponEligible: true,
    // Both payloads go through the monster control rules (control immunity, the
    // stun ladder), and the moment's own rate cap is what stops them chaining.
    halves: {
      moment: { kind: 'hit-held' },
      payload: 'root', payloadFx: 'control.shackle',
      pure: { payload: 'stun', fx: 'control.knockdown' },
      momentPhrase: {
        text: 'A hit on a slowed or rooted target (every {cap} at most)',
        kind: 'subject',
      },
      payloadPhrase: 'roots the target for {duration}',
      pureSentence: 'Hitting a held target | knocks it down for {duration}.',
    },
  }],
  ['kill-chain', {
    id: 'kill-chain', name: 'Kill Chain', scalingStat: 'speed', shardName: 'Bone Shard',
    wants: 'move speed, on-kill', firesOn: 'a kill',
    paysWith: 'recovery bursts, kill speed, cooldown refunds',
    weakAgainst: 'a lone boss with nothing to chain',
    color: '#c58fff', weaponEligible: true,
    // "Your next hit after a kill" is the `kill` trigger with a carry latch rather
    // than a third new trigger kind: the vocabulary is capped (design §6).
    halves: {
      moment: { kind: 'kill', carry: true },
      payload: 'heal-and-load', payloadFx: 'kill-chain.heal-load',
      pure: { payload: 'heal-and-load', fx: 'kill-chain.heal-load' },
      momentPhrase: { text: 'Your next hit after a kill', kind: 'subject' },
      payloadPhrase: 'heals {shareOf} your pool and lands loaded ({loadPct})',
      // The heal lands with the next hit, not the kill (course-correction report
      // item 20), so the pure sentence says when it happens.
      pureSentence: 'Your next hit after a kill | heals {shareOf} your pool and lands loaded ({loadPct}).',
      momentCaveat: 'weak on bosses',
    },
  }],
  ['engagement', {
    id: 'engagement', name: 'Engagement', scalingStat: 'attack', shardName: 'Spark Shard',
    wants: 'approach, the first hit', firesOn: 'the start of a fight',
    paysWith: 'engagement DR, opening burst, barrier refill',
    weakAgainst: 'long attrition fights',
    color: '#ff9f9f', weaponEligible: true,
    halves: {
      moment: { kind: 'first-hit', perTarget: true },
      payload: 'big-hit', payloadFx: 'engagement.lunge',
      pure: { payload: 'big-hit', fx: 'engagement.lunge' },
      momentPhrase: { text: 'Your first hit on each new target', kind: 'subject' },
      payloadPhrase: 'is a lunge for {mult} damage',
      pureSentence: 'Your first hit on each target | is a lunge for {mult} damage.',
    },
  }],
  ['bulwark', {
    id: 'bulwark', name: 'Bulwark', scalingStat: 'plating', shardName: 'Iron Shard',
    wants: 'plating, stationary DR', firesOn: 'standing still, or a hit taken',
    paysWith: 'plating stacks, absorb ramp, ward',
    weakAgainst: 'fights that demand mobility',
    color: '#b8b8a0', weaponEligible: false,
  }],
  ['barrier-tempo', {
    id: 'barrier-tempo', name: 'Barrier Tempo', scalingStat: 'recovery', shardName: 'Glass Shard',
    wants: 'barrier %, recharge', firesOn: 'the barrier breaking',
    paysWith: 'break heal, refill on a max hit',
    weakAgainst: 'sustained chip damage',
    color: '#7fd8c8', weaponEligible: false,
  }],
  // The ninth packet (design §22, run 4). Its colour is a rose-magenta because
  // 316° is the midpoint of the only gap left in the eight hues above — Kill
  // chain's violet sits at 272° and Engagement's salmon at 360°, and everything
  // else is between 33° and 218°. A lane's colour has ONE owner (design §18.2),
  // so the tree accent, the shard glyph, the buff clock and the combat flare all
  // read this line and move together.
  ['technique', {
    id: 'technique', name: 'Technique', scalingStat: 'techniquePowerPct', shardName: 'Sigil Shard',
    wants: 'Technique power, Technique cooldown reduction',
    firesOn: 'a Technique landing',
    paysWith: 'cooldown refunds, a window that empowers the next Technique',
    weakAgainst: 'fights shorter than a cooldown, hard control on the wind-up',
    color: '#ff7fd4', weaponEligible: true,
    halves: {
      moment: { kind: 'technique-cast' },
      payload: 'technique-refund', payloadFx: 'technique.refund-flash',
      pure: { payload: 'technique-refund', fx: 'technique.refund-flash' },
      momentPhrase: { text: 'When a Technique lands', kind: 'clause' },
      // The payload only ever rides ANOTHER lane's moment (a Technique lean on the
      // Technique verb is the pure pair), where no Technique landed — so it
      // refunds every Technique's cooldown, as the runtime does, never "that" one.
      payloadPhrase: 'refunds {shareOf} your Technique cooldowns',
      pureSentence: 'A landed Technique | refunds {shareOf} its cooldown.',
    },
  }],
];

export const PACKET_DEFINITIONS: Map<PacketId, PacketDefinition> =
  new Map<PacketId, PacketDefinition>(packetEntries);

export function packetDefinition(id: PacketId): PacketDefinition | undefined {
  return PACKET_DEFINITIONS.get(id);
}

/** A packet's lean-and-verb halves (design §24.2), or undefined for a defensive one. */
export function packetHalves(id: PacketId): PacketHalves | undefined {
  return PACKET_DEFINITIONS.get(id)?.halves;
}

/** The stat a lane's stat row scales. */
export function packetScalingStat(id: PacketId): LineageStatKey {
  const def = PACKET_DEFINITIONS.get(id);
  if (!def) throw new Error(`unknown packet '${id}'`);
  return def.scalingStat;
}

/**
 * The defensive face a packet expresses (design §3.1, §17): "Avoid = Engagement,
 * Tempo, Control · Sustain = Kill chain, Barrier tempo, Affliction · Endure =
 * Bulwark, Empowered." A defensive card's `face` is DERIVED from its lane through
 * this table, not hand-authored per card — one source instead of 45 by-hand copies.
 */
const PACKET_FACE: Record<PacketId, DefensiveFace> = {
  'tempo': 'avoid',
  'engagement': 'avoid',
  'control': 'avoid',
  'kill-chain': 'sustain',
  'barrier-tempo': 'sustain',
  'affliction': 'sustain',
  'bulwark': 'endure',
  'empowered': 'endure',
  // PROVISIONAL and currently unread: no non-weapon lineage carries the
  // Technique lane yet (design §22 moves exactly one WEAPON lineage onto it), so
  // nothing resolves a Technique card's face. Avoid is the reading that fits the
  // lane — a Technique is timing and positioning, and the Light frame's
  // quickness is what a build around one wants — and the ability pass (§22.1)
  // revisits it when it authors Technique a defensive home.
  'technique': 'avoid',
};

/** The defensive face a lane expresses (design §17). */
export function packetDefaultFace(id: PacketId): DefensiveFace {
  return PACKET_FACE[id];
}

/**
 * Player-facing name of a lane's shard material, e.g. `tempo` → "Gale Shard".
 *
 * Shards are keyed by PACKET, not by biome (design §12), and named with one
 * physical noun per packet (design §24.2), so the material never shows a lane
 * name. There is no per-tier variant: a tier multiplies the quantity, never the
 * name.
 */
export function shardName(id: PacketId): string {
  return PACKET_DEFINITIONS.get(id)?.shardName ?? `${id} shard`;
}
