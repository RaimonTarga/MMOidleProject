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
import type { LineageStatKey, PacketId } from './types';

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
    id: 'tempo', name: 'Tempo', scalingStat: 'attackSpeedPct',
    wants: 'attack speed, on-hit', firesOn: 'every nth hit',
    paysWith: 'echo hits, speed windows, rampage',
    weakAgainst: 'fortified plating, a single big target',
    color: '#7fe3ff', weaponEligible: true,
  }],
  ['empowered', {
    id: 'empowered', name: 'Empowered', scalingStat: 'attackPct',
    wants: 'attack %, empowered multiplier', firesOn: 'your class mechanic',
    paysWith: 'vulnerability, plating shred, stagger',
    weakAgainst: 'swarms, evasive mobs',
    color: '#ffb347', weaponEligible: true,
  }],
  ['affliction', {
    id: 'affliction', name: 'Affliction', scalingStat: 'onHitDamage',
    wants: 'conversion %, stacks', firesOn: 'stacks reaching cap',
    paysWith: 'hemorrhage, poison, Detonate, Contagion',
    weakAgainst: 'dot-resistant mobs, short fights',
    color: '#9be564', weaponEligible: true,
  }],
  ['control', {
    id: 'control', name: 'Control', scalingStat: 'attack',
    wants: 'slow, chill', firesOn: 'a hit on a slowed target',
    paysWith: 'root, stun, bonus damage vs controlled',
    weakAgainst: 'control-immune bosses',
    color: '#8fb8ff', weaponEligible: true,
  }],
  ['kill-chain', {
    id: 'kill-chain', name: 'Kill Chain', scalingStat: 'speed',
    wants: 'move speed, on-kill', firesOn: 'a kill',
    paysWith: 'recovery bursts, kill speed, cooldown refunds',
    weakAgainst: 'a lone boss with nothing to chain',
    color: '#c58fff', weaponEligible: true,
  }],
  ['engagement', {
    id: 'engagement', name: 'Engagement', scalingStat: 'attack',
    wants: 'approach, the first hit', firesOn: 'the start of a fight',
    paysWith: 'engagement DR, opening burst, barrier refill',
    weakAgainst: 'long attrition fights',
    color: '#ff9f9f', weaponEligible: true,
  }],
  ['bulwark', {
    id: 'bulwark', name: 'Bulwark', scalingStat: 'plating',
    wants: 'plating, stationary DR', firesOn: 'standing still, or a hit taken',
    paysWith: 'plating stacks, absorb ramp, ward',
    weakAgainst: 'fights that demand mobility',
    color: '#b8b8a0', weaponEligible: false,
  }],
  ['barrier-tempo', {
    id: 'barrier-tempo', name: 'Barrier Tempo', scalingStat: 'recovery',
    wants: 'barrier %, recharge', firesOn: 'the barrier breaking',
    paysWith: 'break heal, refill on a max hit',
    weakAgainst: 'sustained chip damage',
    color: '#7fd8c8', weaponEligible: false,
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
 * Player-facing name of a lane's shard material, e.g. `tempo` → "Tempo Shard".
 *
 * Shards are keyed by PACKET, not by biome (design §12), so the material's name
 * says what it buys and the map says where it drops. There is no per-tier
 * variant: a tier multiplies the quantity, never the name.
 */
export function shardName(id: PacketId): string {
  return `${PACKET_DEFINITIONS.get(id)?.name ?? id} Shard`;
}
