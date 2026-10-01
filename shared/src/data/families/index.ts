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
 *
 * **Jungle and Desert (T2 — W1-E, 2026-10-01)** add the first T2 family slice,
 * approved by the designer's re-homing/families brief. Jungle's ten non-boss
 * mobs partition exactly across its three families (Ape / Undergrowth /
 * Stalker). Desert's approved families (Basilisk / Scorpion / Stalker, the
 * last T3+ only) only named seven of its ten — the leftover scarab "Dealer"
 * line is assigned by kind, same policy as above, with the reasoning inline on
 * each entry below; that assignment is this wave's own authoring/review item,
 * flagged in the implementation report, not a locked design call.
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
  | 'swamp-mire' | 'swamp-coven' | 'swamp-stalker'
  // Jungle (T2 — W1-E)
  | 'jungle-ape' | 'jungle-undergrowth' | 'jungle-stalker'
  // Desert (T2 — W1-E)
  | 'desert-basilisk' | 'desert-scorpion' | 'desert-stalker';

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
    monsterIds: ['grass-kite', 'savanna-hawk'],
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
    monsterIds: ['bramble-pod', 'canopy-sprite'],
    drops: 'affliction', punishes: 'control',
  }],

  // ── Mountain (proposed — reviewed before Phase 4) ──────────────────────────
  ['mountain-crag', {
    id: 'mountain-crag', name: 'Crag', biome: 'mountain',
    monsterIds: ['rockback-ram', 'granite-titan', 'mountain-colossus', 'granite-mammoth', 'cragback-rhino', 'avalanche-tyrant'],
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
    monsterIds: ['brood-spiderling', 'giant-spider', 'deep-spider'],
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
    monsterIds: ['bog-slime', 'bog-lurker'],
    drops: 'affliction', punishes: 'empowered',
  }],
  ['swamp-coven', {
    id: 'swamp-coven', name: 'Coven', biome: 'swamp',
    monsterIds: ['fen-hexer', 'bog-witch', 'swamp-hydra', 'plague-hydra', 'mire-hex-spitter'],
    drops: 'control', punishes: 'tempo',
  }],
  ['swamp-stalker', {
    id: 'swamp-stalker', name: 'Stalker', biome: 'swamp',
    monsterIds: ['mud-toad', 'mire-stalker'],
    drops: 'kill-chain', punishes: 'bulwark',
  }],

  // ── Jungle (T2 — W1-E) ──────────────────────────────────────────────────────
  // Jungle's ten non-boss mobs partition EXACTLY across these three families —
  // no "assigned by kind" gap here (contrast Desert below).
  ['jungle-ape', {
    id: 'jungle-ape', name: 'Ape', biome: 'jungle',
    monsterIds: ['jungle-ape', 'silverback', 'apex-silverback'],
    // Empowered/Tempo mirrors Plains Herd and Forest Grove: every Empowered
    // family in the game so far punishes Tempo.
    drops: 'empowered', punishes: 'tempo',
  }],
  ['jungle-undergrowth', {
    id: 'jungle-undergrowth', name: 'Undergrowth', biome: 'jungle',
    monsterIds: ['jungle-snake', 'jungle-blowdarter', 'emerald-constrictor', 'thornback-lizard'],
    // Affliction/Control mirrors Forest Canopy, Jungle's own ancestor biome.
    drops: 'affliction', punishes: 'control',
  }],
  ['jungle-stalker', {
    id: 'jungle-stalker', name: 'Stalker', biome: 'jungle',
    monsterIds: ['jungle-stalker', 'canopy-harrier', 'hunting-panther'],
    // Engagement/Affliction mirrors Plains Sky, the game's other Engagement source.
    drops: 'engagement', punishes: 'affliction',
  }],

  // ── Desert (T2 — W1-E) ──────────────────────────────────────────────────────
  // Desert's ten non-boss mobs do NOT partition across the three approved
  // families (design review item, see the file header): Basilisk, Scorpion and
  // Stalker between them name only 7 of the 10. The leftover three are the
  // scarab "Dealer" line (dust-djinn / sandweaver / sandspitter-cobra) — kiting,
  // high-direct-damage, carries no CC of its own (see desert.monsters.ts's
  // header) — which §12.1's approved table never gave a family of its own.
  // Assigned here BY KIND so the partition holds, per the same "mobs the design
  // did not name are assigned here, and move freely" policy already governing
  // Mountain/Cave/Swamp:
  //   - dust-djinn (T2) pairs 1:1 (`pack.followers`) with BOTH T2 controllers
  //     (sand-scorpion AND stone-basilisk), so there is no single "its" family
  //     by pairing alone. Placed with Scorpion: Basilisk already has 3 members
  //     across every tier (stone/desert/dune-basilisk) to Scorpion's 2
  //     (sand-scorpion, sand-viper), so this is also the family-size balance
  //     call. It must NOT go to Stalker: Stalker is T3+-only by design (its two
  //     named members are T3/T4), so a T2 body there would field a T2 node with
  //     a family that has no T2 blend member — see regionT2.ts.
  //   - sandweaver (T3) and sandspitter-cobra (T4) are placed with Stalker
  //     (kill-chain): both are the dealer line's high-direct-damage, fast-kill
  //     bodies, which fits "kill chain" better than it fits either controller
  //     family, and both are T3+ so Stalker's T3+-only shape is unchanged.
  ['desert-basilisk', {
    id: 'desert-basilisk', name: 'Basilisk', biome: 'desert',
    monsterIds: ['stone-basilisk', 'desert-basilisk', 'dune-basilisk'],
    // Empowered/Tempo mirrors Plains Herd, Forest Grove, Jungle Ape.
    drops: 'empowered', punishes: 'tempo',
  }],
  ['desert-scorpion', {
    id: 'desert-scorpion', name: 'Scorpion', biome: 'desert',
    // dust-djinn: the shared T2 Dealer, assigned here — see the header comment above.
    monsterIds: ['sand-scorpion', 'sand-viper', 'dust-djinn'],
    // Control/Kill-chain mirrors Mountain Ridge.
    drops: 'control', punishes: 'kill-chain',
  }],
  ['desert-stalker', {
    id: 'desert-stalker', name: 'Stalker', biome: 'desert',
    // T3+ only (design table): dune-stalker/dune-tyrant are its named members;
    // sandweaver/sandspitter-cobra are the Dealer line assigned here by kind —
    // see the header comment above. No T2 member, so Desert fields only
    // Basilisk + Scorpion at T2 (regionT2.ts's blends are two-way).
    monsterIds: ['dune-stalker', 'dune-tyrant', 'sandweaver', 'sandspitter-cobra'],
    // Kill-chain/Bulwark mirrors Swamp Stalker (same family name, same pairing).
    drops: 'kill-chain', punishes: 'bulwark',
  }],
];

export const FAMILY_DATABASE: Map<FamilyId, FamilyDefinition> =
  new Map<FamilyId, FamilyDefinition>(familyEntries);

/** Biomes whose pool the family table covers. A kill outside these drops no shard. */
export const FAMILY_BIOMES: readonly string[] = [
  'plains', 'forest', 'mountain', 'cave', 'swamp', 'jungle', 'desert',
];

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

// ── Node blends (design §12, Phase 2a) ──────────────────────────────────────
//
// A node is not a modifier any more: it is a BLEND of its biome's families. The
// blend says what you will be fighting there, and because each family drops one
// shard, it also says what the node pays. Authored per node in
// `shared/src/world/map/regionT1.ts`.

/**
 * A node's mob composition: the share of its spawns each family takes.
 *
 * Shares sum to 1 (validated to 1e-6, since authored decimals do not sum
 * exactly in binary), and every key must be a family of the node's own biome.
 * A share finer than `1 / BLEND_SPAWN_SLOTS` rounds away in the spawn cycle —
 * do not author 3% of anything and expect to meet it.
 */
export type NodeBlend = Partial<Record<FamilyId, number>>;

/**
 * Slots in one spawn cycle. Ten, so a 70/20/10 node visibly spawns 7-2-1 rather
 * than "roughly seven in ten, eventually" — spawning cycles this order instead of
 * rolling, so the blend is something a player can read off a node in one visit.
 */
export const BLEND_SPAWN_SLOTS = 10;

/** Authoring order, so equal shares break ties the way the table above reads. */
const FAMILY_ORDER: Map<FamilyId, number> = new Map(
  familyEntries.map(([id], index) => [id, index]),
);

/** Families with a positive share, strongest first (ties in authoring order). */
export function blendEntries(blend: NodeBlend): { family: FamilyId; share: number }[] {
  return (Object.entries(blend) as [FamilyId, number | undefined][])
    .filter((entry): entry is [FamilyId, number] => (entry[1] ?? 0) > 0)
    .sort(
      (a, b) =>
        b[1] - a[1] ||
        (FAMILY_ORDER.get(a[0]) ?? 0) - (FAMILY_ORDER.get(b[0]) ?? 0),
    )
    .map(([family, share]) => ({ family, share }));
}

export function blendShareTotal(blend: NodeBlend): number {
  return Object.values(blend).reduce<number>((sum, share) => sum + (share ?? 0), 0);
}

/** The family a node reads as. Undefined only for an empty blend. */
export function dominantBlendFamily(blend: NodeBlend): FamilyId | undefined {
  return blendEntries(blend)[0]?.family;
}

/** Drop the families `keep` rejects and re-scale the survivors to sum to 1. */
export function renormalizeBlend(
  blend: NodeBlend,
  keep: (family: FamilyId) => boolean,
): NodeBlend {
  const kept = blendEntries(blend).filter((entry) => keep(entry.family));
  const total = kept.reduce((sum, entry) => sum + entry.share, 0);
  if (total <= 0) return {};
  const out: NodeBlend = {};
  for (const entry of kept) out[entry.family] = entry.share / total;
  return out;
}

/**
 * The repeating spawn order a blend produces: `slots` long, each family holding
 * its rounded share of the slots, spread rather than clumped so a node does not
 * field its whole dominant family before the first of anything else.
 *
 * Largest-remainder rounding, then a deficit-first placement. Deterministic:
 * the same blend always yields the same order, which is what makes the spawn
 * composition testable without spawning anything.
 */
export function blendSpawnCycle(
  blend: NodeBlend,
  slots: number = BLEND_SPAWN_SLOTS,
): FamilyId[] {
  const entries = blendEntries(blend);
  if (entries.length === 0 || slots <= 0) return [];
  const total = entries.reduce((sum, entry) => sum + entry.share, 0);
  if (total <= 0) return [];

  const ideal = entries.map((entry) => (entry.share / total) * slots);
  const counts = ideal.map((value) => Math.floor(value));
  const byRemainder = ideal
    .map((value, index) => ({ index, remainder: value - Math.floor(value) }))
    .sort((a, b) => b.remainder - a.remainder || a.index - b.index);
  let assigned = counts.reduce((sum, count) => sum + count, 0);
  for (let i = 0; assigned < slots && byRemainder.length > 0; i += 1, assigned += 1) {
    counts[byRemainder[i % byRemainder.length].index] += 1;
  }

  const cycle: FamilyId[] = [];
  const placed = counts.map(() => 0);
  for (let slot = 0; slot < slots; slot += 1) {
    let best = -1;
    let bestDeficit = -Infinity;
    for (let index = 0; index < entries.length; index += 1) {
      if (placed[index] >= counts[index]) continue;
      const deficit = (counts[index] / slots) * (slot + 1) - placed[index];
      if (deficit > bestDeficit + 1e-9) {
        bestDeficit = deficit;
        best = index;
      }
    }
    if (best < 0) break;
    cycle.push(entries[best].family);
    placed[best] += 1;
  }
  return cycle;
}

/**
 * How many times the family at `cursor` has already come up in this cycle,
 * counting every completed cycle. Spawning uses it to walk the family's own mob
 * list, so one integer per node drives both choices.
 */
export function blendFamilyOccurrence(
  cycle: readonly FamilyId[],
  cursor: number,
): number {
  if (cycle.length === 0) return 0;
  const position = ((cursor % cycle.length) + cycle.length) % cycle.length;
  const family = cycle[position];
  const perCycle = cycle.filter((id) => id === family).length;
  let before = 0;
  for (let index = 0; index < position; index += 1) {
    if (cycle[index] === family) before += 1;
  }
  return Math.floor(cursor / cycle.length) * perCycle + before;
}
