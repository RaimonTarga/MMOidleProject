/**
 * Mob families — what a biome's monsters are made of, and which shard they drop
 * (design §12).
 *
 * "Key materials are shards, keyed by packet, not by biome. Each family drops the
 * shard of the packet it favours, so the material's name says what it buys and
 * the map says where it drops."
 *
 * **Scope in Phase 1b.** Only the `drops` half of this table is live: the reward
 * seam reads the family of the monster that died and grants its shard. Phase 2
 * adds the other half — per-node blends, family-driven spawning, and the removal
 * of node modifiers — and `punishes` is the encounter contract it will check
 * ("does the intended lane win by ~30%? does the punished lane still clear?").
 *
 * **Every non-boss monster of a T1 biome belongs to exactly one family**, because
 * families must partition the biome's pool: a mob in no family is a kill that
 * pays no shard. `families.test.ts` enforces the partition. Bosses are outside it
 * — they drop their biome's capstone material instead (design §5).
 *
 * Plains and Forest are LOCKED (the first slice). Mountain, Cave and Swamp are
 * PROPOSED from design §12.1 and are reviewed before Phase 4 (bible open
 * decision 2), as is a second T1 source for Engagement shards — Plains Sky is
 * currently the only one (bible open decision 3 covers the same gap for Bulwark
 * and Barrier tempo, which have no T1 family at all).
 *
 * The mobs §12.1 did not name are assigned here by kind, so the partition holds:
 * prairie-yearling with the Herd, young-wolf and dire-whelp with the Pack, and so
 * on. Those assignments are authoring, not design decisions, and move freely.
 */
import type { PacketId } from '../lineages/types';

export type FamilyId =
  // Plains
  | 'plains-herd' | 'plains-swarm' | 'plains-sky'
  // Forest
  | 'forest-pack' | 'forest-grove' | 'forest-canopy'
  // Mountain
  | 'mountain-crag' | 'mountain-ridge' | 'mountain-hopper'
  // Cave
  | 'cave-brood' | 'cave-brute' | 'cave-deep'
  // Swamp
  | 'swamp-mire' | 'swamp-coven' | 'swamp-stalker';

export interface FamilyDefinition {
  id: FamilyId;
  /** Player-facing name, for the node info panel and the map. */
  name: string;
  biome: string;
  /** The monsters that make up this family. Non-boss only. */
  monsterIds: readonly string[];
  /** The shard every kill in this family drops. */
  drops: PacketId;
  /** The lane this family is built to punish (design §12; Phase 2 measures it). */
  punishes: PacketId;
}

const familyEntries: [FamilyId, FamilyDefinition][] = [
  // ── Plains (locked) ────────────────────────────────────────────────────────
  ['plains-herd', {
    id: 'plains-herd', name: 'Herd', biome: 'plains',
    monsterIds: ['boar', 'stampede-bull', 'prairie-yearling'],
    drops: 'empowered', punishes: 'tempo',
  }],
  ['plains-swarm', {
    id: 'plains-swarm', name: 'Swarm', biome: 'plains',
    monsterIds: ['plains-slime', 'prairie-wolf'],
    drops: 'tempo', punishes: 'empowered',
  }],
  ['plains-sky', {
    id: 'plains-sky', name: 'Sky', biome: 'plains',
    monsterIds: ['savanna-hawk'],
    drops: 'engagement', punishes: 'affliction',
  }],

  // ── Forest (locked) ────────────────────────────────────────────────────────
  ['forest-pack', {
    id: 'forest-pack', name: 'Pack', biome: 'forest',
    monsterIds: ['wolf', 'ancient-wolf', 'young-wolf', 'dire-whelp'],
    drops: 'tempo', punishes: 'empowered',
  }],
  ['forest-grove', {
    id: 'forest-grove', name: 'Grove', biome: 'forest',
    monsterIds: ['ironwood-golem', 'forest-slime'],
    drops: 'empowered', punishes: 'tempo',
  }],
  ['forest-canopy', {
    id: 'forest-canopy', name: 'Canopy', biome: 'forest',
    monsterIds: ['canopy-sprite'],
    drops: 'affliction', punishes: 'control',
  }],

  // ── Mountain (proposed — reviewed before Phase 4) ──────────────────────────
  ['mountain-crag', {
    id: 'mountain-crag', name: 'Crag', biome: 'mountain',
    monsterIds: ['granite-titan', 'mountain-colossus', 'granite-mammoth', 'cragback-rhino', 'avalanche-tyrant'],
    drops: 'empowered', punishes: 'affliction',
  }],
  ['mountain-ridge', {
    id: 'mountain-ridge', name: 'Ridge', biome: 'mountain',
    monsterIds: ['ridge-archer', 'peak-archer', 'crag-mortar'],
    drops: 'control', punishes: 'kill-chain',
  }],
  ['mountain-hopper', {
    id: 'mountain-hopper', name: 'Hopper', biome: 'mountain',
    monsterIds: ['cliff-hopper', 'stone-eagle', 'avalanche-ram', 'cliffside-roc'],
    drops: 'tempo', punishes: 'empowered',
  }],

  // ── Cave (proposed) ────────────────────────────────────────────────────────
  ['cave-brood', {
    id: 'cave-brood', name: 'Brood', biome: 'cave',
    monsterIds: ['giant-spider', 'deep-spider'],
    drops: 'affliction', punishes: 'tempo',
  }],
  ['cave-brute', {
    id: 'cave-brute', name: 'Brute', biome: 'cave',
    monsterIds: ['cave-brute', 'cave-troll', 'cavern-troll'],
    drops: 'empowered', punishes: 'affliction',
  }],
  ['cave-deep', {
    id: 'cave-deep', name: 'Deep', biome: 'cave',
    monsterIds: ['cave-lurker', 'cave-gargoyle', 'crystal-gargoyle'],
    drops: 'kill-chain', punishes: 'engagement',
  }],

  // ── Swamp (proposed) ───────────────────────────────────────────────────────
  ['swamp-mire', {
    id: 'swamp-mire', name: 'Mire', biome: 'swamp',
    monsterIds: ['bog-slime', 'mud-toad', 'bog-lurker'],
    drops: 'affliction', punishes: 'empowered',
  }],
  ['swamp-coven', {
    id: 'swamp-coven', name: 'Coven', biome: 'swamp',
    monsterIds: ['bog-witch', 'swamp-hydra', 'plague-hydra', 'mire-hex-spitter'],
    drops: 'control', punishes: 'tempo',
  }],
  ['swamp-stalker', {
    id: 'swamp-stalker', name: 'Stalker', biome: 'swamp',
    monsterIds: ['mire-stalker'],
    drops: 'kill-chain', punishes: 'bulwark',
  }],
];

export const FAMILY_DATABASE: Map<FamilyId, FamilyDefinition> =
  new Map<FamilyId, FamilyDefinition>(familyEntries);

/** Biomes whose pool the family table covers. A kill outside these drops no shard. */
export const FAMILY_BIOMES: readonly string[] = ['plains', 'forest', 'mountain', 'cave', 'swamp'];

/** monsterId → family, built once. The reward seam's only lookup. */
const FAMILY_BY_MONSTER: Map<string, FamilyDefinition> = (() => {
  const map = new Map<string, FamilyDefinition>();
  for (const family of FAMILY_DATABASE.values()) {
    for (const id of family.monsterIds) map.set(id, family);
  }
  return map;
})();

export function familyForMonster(monsterTypeId: string): FamilyDefinition | undefined {
  return FAMILY_BY_MONSTER.get(monsterTypeId);
}

/** The shard a kill of this monster drops, or undefined outside the T1 biomes. */
export function shardForMonster(monsterTypeId: string): PacketId | undefined {
  return FAMILY_BY_MONSTER.get(monsterTypeId)?.drops;
}

export function familiesForBiome(biome: string): FamilyDefinition[] {
  return [...FAMILY_DATABASE.values()].filter((f) => f.biome === biome);
}

/** Every family that drops a given packet's shard — the coverage rule's input. */
export function familiesDropping(packet: PacketId): FamilyDefinition[] {
  return [...FAMILY_DATABASE.values()].filter((f) => f.drops === packet);
}
