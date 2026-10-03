/**
 * Mob families — what a biome's monsters are made of, and which shard they drop
 * (design §12).
 *
 * "Key materials are shards, keyed by packet, not by biome. Each family drops the
 * shard of the packet it favours, so the material's name says what it buys and
 * the map says where it drops."
 *
 * **One shard per node (design §24.3, 2026-10-03).** A kill no longer pays the
 * shard of the family it came from: every node is categorised under its DOMINANT
 * family, and every non-boss kill in the node pays that family's `drops`, minority
 * families included (`nodeShard` in `world/nodeBlends.ts` is the one reading; the
 * reward seam calls it). `drops` therefore means "the shard a node this family
 * leads pays", and only a node with no blend (a dungeon) still pays per mob.
 *
 * **A biome's families are its weapon's lanes (design §24.4).** The three families
 * of a T1 biome drop exactly the three lanes of that biome's weapon lineage, so
 * "stay in the Forest to build Forest gear" needs no lookup. Four moves made it
 * true — Sky → kill-chain, Grove → engagement, Hopper → engagement, Brood → tempo —
 * with `punishes` unchanged.
 *
 * **Every non-boss monster of a T1 biome belongs to exactly one family**, because
 * families must partition the biome's pool: a mob in no family is a kill that
 * pays no shard. `families.test.ts` enforces the partition. Bosses are outside it
 * — they drop their biome's capstone material instead (design §5).
 *
 * Plains and Forest are LOCKED (the first slice). Mountain, Cave and Swamp are
 * PROPOSED from design §12.1 and are reviewed before Phase 4 (bible open
 * decision 2). Bulwark and Barrier tempo have no T1 family at all (bible open
 * decision 3); the biome boss's Lane-A stopgap (design §18.6) is their source
 * once their trees return — while the non-weapon trees are parked (§24.5) the
 * stopgap pays the weapon lanes only, and nothing pays Iron or Glass.
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
 *
 * **T3/T4 pass (W1-C, 2026-10-01) — every assignment below is PROVISIONAL.**
 * Plains/Forest/Mountain/Cave/Swamp/Jungle/Desert's T3/T4 members join their
 * EXISTING T1/T2 families where the role matches (no new families for those
 * seven — their rosters already partition cleanly; see each biome's own
 * comment above). `mountain-crag`/`mountain-hopper` had one existing
 * misfile fixed in this pass: `avalanche-tyrant` is the Hopper lineage's own
 * apex (cliff-hopper -> avalanche-ram -> avalanche-tyrant, per
 * `mountain.monsters.ts`'s own lineage banner) and had been filed under Crag;
 * moved to Hopper, no other change.
 *
 * Four biomes debut here with NO T1/T2 presence, so they get fresh families
 * partitioned by role per `shared/src/data/monsters/*.ts`'s own banners
 * (ecology doc role grids agree): Tundra (2: Glacial bruiser line / Rime
 * caster line — only two legible roles in a deliberately low-density, elite-
 * focused roster), Volcanic (3: Swarm fodder+catcher packs / Anchor armored
 * herds+elite / Ashfall ranged DoT gunners), Graveyard a.k.a. Wasteland (3:
 * Crawler fast corpse-fodder / Plague DoT+death-rider bodies / Choir ranged
 * support+necromancer backline), Trench (3, one mob each — the biome's own
 * banner already names them THE HUNTER / THE KITER / THE ANCHOR, reused
 * verbatim as family names). `drops`/`punishes` pairs below are chosen against
 * each packet's own `weakAgainst` text in `data/lineages/packets.ts` where it
 * speaks directly to the shape (e.g. Tempo is "weak against fortified
 * plating, a single big target", so every slow/heavy/shielded family here
 * punishes Tempo; Affliction is "weak against... short fights", so the
 * low-HP/fast-dying Hadal Stalker punishes it) — not re-derived from scratch
 * per family. None of this is reviewed with the designer yet.
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
  | 'desert-basilisk' | 'desert-scorpion' | 'desert-stalker'
  // Tundra (T3/T4 — W1-C, provisional)
  | 'tundra-glacial' | 'tundra-rime'
  // Volcanic (T3/T4 — W1-C, provisional)
  | 'volcanic-swarm' | 'volcanic-anchor' | 'volcanic-ashfall'
  // Graveyard / Wasteland (T4 — W1-C, provisional)
  | 'graveyard-crawler' | 'graveyard-plague' | 'graveyard-choir'
  // Trench (T4 — W1-C, provisional)
  | 'trench-hunter' | 'trench-kiter' | 'trench-anchor';

export interface FamilyDefinition {
  id: FamilyId;
  /** Player-facing name, for the node info panel and the map. */
  name: string;
  biome: string;
  /** The monsters that make up this family. Non-boss only. */
  monsterIds: readonly string[];
  /**
   * The shard a node this family DOMINATES pays, for every kill in it (design
   * §24.3). Not what one of its bodies pays on a node another family leads.
   */
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
  // Swarm drops TECHNIQUE, not Tempo (design §22, run 4): area and control
  // Techniques are what beat many weak bodies, so the shard the swarm pays is the
  // one that buys them. Tempo's T1 sources are Forest Pack and Cave Brood (§24.4).
  ['plains-swarm', {
    id: 'plains-swarm', name: 'Swarm', biome: 'plains',
    monsterIds: ['plains-slime', 'prairie-wolf'],
    drops: 'technique', punishes: 'empowered',
  }],
  // Sky drops KILL CHAIN, not Engagement (design §24.4): the Plains weapon's lanes
  // are technique / kill-chain / empowered.
  ['plains-sky', {
    id: 'plains-sky', name: 'Sky', biome: 'plains',
    monsterIds: ['grass-kite', 'savanna-hawk'],
    drops: 'kill-chain', punishes: 'affliction',
  }],

  // ── Forest (locked) ────────────────────────────────────────────────────────
  ['forest-pack', {
    id: 'forest-pack', name: 'Pack', biome: 'forest',
    monsterIds: ['wolf', 'ancient-wolf', 'young-wolf', 'dire-whelp'],
    drops: 'tempo', punishes: 'empowered',
  }],
  // Grove drops ENGAGEMENT, not Empowered (design §24.4): the Rapier's lanes are
  // tempo / affliction / engagement.
  ['forest-grove', {
    id: 'forest-grove', name: 'Grove', biome: 'forest',
    monsterIds: ['ironwood-golem', 'forest-slime'],
    drops: 'engagement', punishes: 'tempo',
  }],
  ['forest-canopy', {
    id: 'forest-canopy', name: 'Canopy', biome: 'forest',
    monsterIds: ['bramble-pod', 'canopy-sprite'],
    drops: 'affliction', punishes: 'control',
  }],

  // ── Mountain (proposed — reviewed before Phase 4) ──────────────────────────
  ['mountain-crag', {
    id: 'mountain-crag', name: 'Crag', biome: 'mountain',
    monsterIds: ['rockback-ram', 'granite-titan', 'mountain-colossus', 'granite-mammoth', 'cragback-rhino'],
    drops: 'empowered', punishes: 'affliction',
  }],
  ['mountain-ridge', {
    id: 'mountain-ridge', name: 'Ridge', biome: 'mountain',
    monsterIds: ['ridge-archer', 'peak-archer', 'crag-mortar'],
    drops: 'control', punishes: 'kill-chain',
  }],
  ['mountain-hopper', {
    id: 'mountain-hopper', name: 'Hopper', biome: 'mountain',
    // avalanche-tyrant (T4-W1-C fix): the Caprine lineage's own apex
    // (cliff-hopper -> avalanche-ram -> avalanche-tyrant, mountain.monsters.ts's
    // lineage banner) — was filed under Crag, moved here to match the role.
    monsterIds: ['cliff-hopper', 'stone-eagle', 'avalanche-ram', 'cliffside-roc', 'avalanche-tyrant'],
    // ENGAGEMENT, not Tempo (design §24.4): the Mountain weapon's lanes are
    // empowered / control / engagement.
    drops: 'engagement', punishes: 'empowered',
  }],

  // ── Cave (proposed) ────────────────────────────────────────────────────────
  // TEMPO, not Affliction (design §24.4): the Cave weapon's lanes are tempo /
  // kill-chain / empowered. §24.4 moves `drops` only and leaves `punishes` as it
  // was, so the Brood now favours AND punishes Tempo — the one family that does.
  // That collision is the designer's to resolve; `lineageMaterials.test.ts` names
  // it in SAME_LANE_FAMILIES so it cannot spread quietly.
  ['cave-brood', {
    id: 'cave-brood', name: 'Brood', biome: 'cave',
    monsterIds: ['brood-spiderling', 'giant-spider', 'deep-spider'],
    drops: 'tempo', punishes: 'tempo',
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

  // ── Tundra (T3/T4 — W1-C, provisional) ─────────────────────────────────────
  // Low-to-mid density, elite-focused roster (tundra.monsters.ts's own banner):
  // only two legible roles, not three — a committed melee line and a ranged
  // control-caster line. No swarm/opener shape exists here to justify a third
  // family.
  ['tundra-glacial', {
    id: 'tundra-glacial', name: 'Glacial', biome: 'tundra',
    // The committed-melee line (frost-lurker -> rime-tusk-mastodon) plus the
    // defensive-window elites (glacier-bear/glacial-direbear's Ice Armor +
    // Shatter) and the apex (permafrost-behemoth): slow, heavy, and in the
    // shield-bearers' case explicitly built to waste chip/DoT against the
    // shell and reward a burst. Same shape as Mountain Crag/Cave Brute.
    monsterIds: ['frost-lurker', 'glacier-bear', 'rime-tusk-mastodon', 'glacial-direbear', 'permafrost-behemoth'],
    // Empowered/Tempo mirrors every other slow-heavy family (Mountain Crag,
    // Cave Brute, Jungle Ape, Desert Basilisk, Volcano Anchor): Tempo's own
    // `weakAgainst` is literally "fortified plating, a single big target".
    drops: 'empowered', punishes: 'tempo',
  }],
  ['tundra-rime', {
    id: 'tundra-rime', name: 'Rime', biome: 'tundra',
    // Ranged control casters: Frostbind/Deep Freeze are root-on-a-gate spells.
    monsterIds: ['rime-caster', 'hoarfrost-yeti'],
    // Control/Kill-chain mirrors Mountain Ridge, Desert Scorpion.
    drops: 'control', punishes: 'kill-chain',
  }],

  // ── Volcanic (T3/T4 — W1-C, provisional) ────────────────────────────────────
  // volcano.monsters.ts's own banner names three shapes: catcher+fodder packs,
  // the anchor herd (armored, holds the fight open so Heat keeps climbing), and
  // the stationary ranged Burn gunners.
  ['volcanic-swarm', {
    id: 'volcanic-swarm', name: 'Swarm', biome: 'volcanic',
    // Pack alphas (cinder-hound/infernal-direhound, fast anti-kite catchers)
    // plus their fodder (ember-scuttler/ember-skink): many fast, short-lived
    // bodies, the same shape as Forest Pack / Plains Swarm / Mountain Hopper.
    monsterIds: ['ember-scuttler', 'cinder-hound', 'ember-skink', 'infernal-direhound'],
    drops: 'tempo', punishes: 'empowered',
  }],
  ['volcanic-anchor', {
    id: 'volcanic-anchor', name: 'Anchor', biome: 'volcanic',
    // The anchor herds (magma-brute/obsidian-tortoise) plus the elite
    // defensive-window magma-salamander (Obsidian Shell rewards burst over
    // chip, folded in the same way Mountain folds cragback-rhino into Crag):
    // slow, heavy, armored.
    monsterIds: ['magma-brute', 'obsidian-tortoise', 'magma-salamander'],
    // Empowered/Tempo: Tempo's `weakAgainst` names exactly this shape.
    drops: 'empowered', punishes: 'tempo',
  }],
  ['volcanic-ashfall', {
    id: 'volcanic-ashfall', name: 'Ashfall', biome: 'volcanic',
    // Stationary ranged Burn gunners (ash-slinger/ashspitter-salamander):
    // DoT-heavy, same shape as Forest Canopy/Swamp Mire/Cave Brood.
    monsterIds: ['ash-slinger', 'ashspitter-salamander'],
    // Affliction answers DoT-heavy (design brief), not the lane it punishes.
    // Engagement's own `weakAgainst` is "long attrition fights", which a
    // standing Burn stack is built to cause.
    drops: 'affliction', punishes: 'engagement',
  }],

  // ── Graveyard / Wasteland (T4 — W1-C, provisional) ──────────────────────────
  // graveyard.monsters.ts's own banner: corpse-fodder bodies, the one
  // dedicated plague creature plus the deferred (unspawned, T5) armored
  // anchor, and the ranged necromancer+support backline. `charnel-brute` is
  // never spawned (monsterPoolByTier has no T4 entry for it) but still lives
  // in MONSTER_DATABASE, so the partition still needs to claim it.
  ['graveyard-crawler', {
    id: 'graveyard-crawler', name: 'Crawler', biome: 'graveyard',
    // Fast, numerous, ability-free corpse fodder — the Gravewright's ammunition.
    monsterIds: ['bone-crawler', 'plague-rat'],
    drops: 'tempo', punishes: 'empowered',
  }],
  ['graveyard-plague', {
    id: 'graveyard-plague', name: 'Plague', biome: 'graveyard',
    // plague-hound is the biome's one dedicated DoT+death-rider body;
    // charnel-brute (deferred/unspawned) is folded in here rather than given
    // its own never-fielded family, same policy as Mountain's standalone elite.
    monsterIds: ['plague-hound', 'charnel-brute'],
    // Affliction answers DoT-heavy (design brief). Engagement's `weakAgainst`
    // is "long attrition fights", which a plague/death-rider body is built
    // to cause.
    drops: 'affliction', punishes: 'engagement',
  }],
  ['graveyard-choir', {
    id: 'graveyard-choir', name: 'Choir', biome: 'graveyard',
    // Ranged backline: the necromancer that raises your kills and the
    // vulture that hastens everything else. Both are squishy priority targets
    // ("dies fast once you commit", per gravewright's own comment) — the same
    // "kill it first" shape as Plains Sky/Jungle Stalker/Trench's Kiter.
    monsterIds: ['carrion-vulture', 'gravewright'],
    // Engagement/Affliction mirrors every other ranged-priority-target family.
    // Affliction's own `weakAgainst` names "short fights", which a focused
    // backline kill is.
    drops: 'engagement', punishes: 'affliction',
  }],

  // ── Trench (T4 — W1-C, provisional) ─────────────────────────────────────────
  // EXTREME low density, three single-target problems, one mob each — the
  // biome's own banner already names them THE HUNTER / THE KITER / THE
  // ANCHOR, reused verbatim.
  ['trench-hunter', {
    id: 'trench-hunter', name: 'Hunter', biome: 'trench',
    // abyssal-serpent: relentless melee pursuit, huge HP/DR, a periodic
    // anti-heal Wound bite. The textbook "long attrition fight".
    monsterIds: ['abyssal-serpent'],
    // Affliction answers its own debuff-dealer shape (design brief), same
    // policy as every DoT/debuff family. Engagement's `weakAgainst` is "long
    // attrition fights", exactly what the Hunter's sustained chase + Wound
    // forces.
    drops: 'affliction', punishes: 'engagement',
  }],
  ['trench-kiter', {
    id: 'trench-kiter', name: 'Kiter', biome: 'trench',
    // hadal-stalker: armored ranged skirmisher, lowest HP of the three elites.
    monsterIds: ['hadal-stalker'],
    // Engagement mirrors every other ranged-skirmisher family. Affliction's
    // `weakAgainst` names "short fights" — the Stalker is explicitly the
    // lowest-HP of the trio, i.e. the shortest fight.
    drops: 'engagement', punishes: 'affliction',
  }],
  ['trench-anchor', {
    id: 'trench-anchor', name: 'Anchor', biome: 'trench',
    // elder-leviathan: enormous HP, plating 22 + DR 0.40, very slow, a
    // periodic Carapace shell.
    monsterIds: ['elder-leviathan'],
    // Empowered mirrors every other slow-heavy-armored family. Tempo's own
    // `weakAgainst` text ("fortified plating, a single big target") is this
    // monster's stat line verbatim.
    drops: 'empowered', punishes: 'tempo',
  }],
];

export const FAMILY_DATABASE: Map<FamilyId, FamilyDefinition> =
  new Map<FamilyId, FamilyDefinition>(familyEntries);

/**
 * Biomes whose pool the family table covers. A dungeon kill (no blend, so it pays
 * per mob) outside these drops no shard.
 */
export const FAMILY_BIOMES: readonly string[] = [
  'plains', 'forest', 'mountain', 'cave', 'swamp', 'jungle', 'desert',
  'tundra', 'volcanic', 'graveyard', 'trench',
];

/** monsterId → family, built once. */
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

/**
 * This monster's FAMILY's shard. Since design §24.3 that is what a kill of it pays
 * only on a node with no blend (a dungeon); on a blended node every kill pays
 * `nodeShard(nodeId)` instead, whatever the body's family.
 */
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
// blend says what you will be fighting there, and its dominant family says what
// the node pays (design §24.3: one shard per node). Authored per node in
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
