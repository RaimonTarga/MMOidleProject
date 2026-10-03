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
import type { DefensiveFace, LineageStatKey, PacketId } from './types';

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
}

/**
 * Scaling-stat notes:
 *  - `control` and `engagement` both scale flat Attack at T1. Control has no stat
 *    of its own yet (slow/chill magnitudes are authored, not scaled); the Phase 3
 *    class-by-class review (bible open decision 1) is where it gets one if it needs it.
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
  }],
  ['empowered', {
    id: 'empowered', name: 'Empowered', scalingStat: 'attackPct', shardName: 'Anvil Shard',
    wants: 'attack %, empowered multiplier', firesOn: 'your class mechanic',
    paysWith: 'vulnerability, plating shred, stagger',
    weakAgainst: 'swarms, evasive mobs',
    color: '#ffb347', weaponEligible: true,
  }],
  ['affliction', {
    id: 'affliction', name: 'Affliction', scalingStat: 'onHitDamage', shardName: 'Venom Shard',
    wants: 'conversion %, stacks', firesOn: 'stacks reaching cap',
    paysWith: 'hemorrhage, poison, Detonate, Contagion',
    weakAgainst: 'dot-resistant mobs, short fights',
    color: '#9be564', weaponEligible: true,
  }],
  ['control', {
    id: 'control', name: 'Control', scalingStat: 'attack', shardName: 'Shackle Shard',
    wants: 'slow, chill', firesOn: 'a hit on a slowed target',
    paysWith: 'root, stun, bonus damage vs controlled',
    weakAgainst: 'control-immune bosses',
    color: '#8fb8ff', weaponEligible: true,
  }],
  ['kill-chain', {
    id: 'kill-chain', name: 'Kill Chain', scalingStat: 'speed', shardName: 'Bone Shard',
    wants: 'move speed, on-kill', firesOn: 'a kill',
    paysWith: 'recovery bursts, kill speed, cooldown refunds',
    weakAgainst: 'a lone boss with nothing to chain',
    color: '#c58fff', weaponEligible: true,
  }],
  ['engagement', {
    id: 'engagement', name: 'Engagement', scalingStat: 'attack', shardName: 'Spark Shard',
    wants: 'approach, the first hit', firesOn: 'the start of a fight',
    paysWith: 'engagement DR, opening burst, barrier refill',
    weakAgainst: 'long attrition fights',
    color: '#ff9f9f', weaponEligible: true,
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
  }],
];

export const PACKET_DEFINITIONS: Map<PacketId, PacketDefinition> =
  new Map<PacketId, PacketDefinition>(packetEntries);

export function packetDefinition(id: PacketId): PacketDefinition | undefined {
  return PACKET_DEFINITIONS.get(id);
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
