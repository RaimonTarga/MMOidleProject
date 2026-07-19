export interface BiomeDefinition {
  id: string;
  name: string;
  /** Phaser hex color applied to the node background rectangle. */
  backgroundColor: number;
  /**
   * Monster pools keyed by biomeTier (the node's ring difficulty).
   * Spawning picks pool[node.biomeTier]. A tier with no entry (or an empty
   * array) spawns NOTHING — there is no fallback to another tier.
   */
  monsterPoolByTier: Partial<Record<number, string[]>>;
  /**
   * Boss monster pools for dungeon variants of this biome, keyed by biomeTier.
   * Exactly one boss is maintained per dungeon node — it respawns on death.
   * Empty or absent = this biome has no boss variant.
   */
  bossPoolByTier?: Partial<Record<number, string[]>>;
  /**
   * Essence variant collected here. Currently all biomes share 'essence';
   * reserved for a future multi-essence economy without a schema change.
   */
  essenceType: string;
  /**
   * How many non-boss monsters the server targets per node of this biome.
   * Falls back to GAME_CONFIG.MONSTERS_PER_NODE when omitted.
   * High density = more but weaker monsters; low density = fewer but tougher.
   * Density is the OTHER half of each biome's threat: high-density biomes
   * (plains/forest/jungle) pressure tanks via volume; low-density (mountain/
   * cave/desert) pressure via per-hit. The per-mob stats assume these values.
   */
  mobDensity?: number;
}

/**
 * Player-facing name for a biome's catalyst, e.g. `forest` → "Forest Catalyst".
 * Falls back to the capitalized group key if the biome is unknown.
 */
export function catalystLabel(biomeGroup: string): string {
  const name =
    BIOME_DATABASE.get(biomeGroup)?.name ??
    biomeGroup.charAt(0).toUpperCase() + biomeGroup.slice(1);
  return `${name} Catalyst`;
}

export const BIOME_DATABASE: Map<string, BiomeDefinition> = new Map([

  ['clearing', {
    id: 'clearing', name: 'Clearing',
    backgroundColor: 0x101a10,
    monsterPoolByTier: { 0: ['tiny-slime'] },
    essenceType: 'essence',
    mobDensity: 12,
  }],

  ['testroom', {
    id: 'testroom', name: 'Test Room',
    backgroundColor: 0x1a1a2a,
    monsterPoolByTier: {},
    essenceType: 'essence',
  }],

  // ── T1 biomes ─────────────────────────────────────────────────────────────

  // FOREST — fast movement + FREQUENT (low-cd) attacks; low per-hit, no armor.
  // Evasion's home; squishy, fast weapons shred. High-ish density.
  ['forest', {
    id: 'forest', name: 'Forest',
    backgroundColor: 0x0a1a0a,
    monsterPoolByTier: {
      1: ['forest-slime', 'wolf'],
      2: ['ancient-wolf', 'ironwood-golem', 'canopy-sprite'],
      // ⚠ T4 trash not yet authored — forest T4 ring nodes spawn nothing.
    },
    bossPoolByTier: {
      1: ['gnarled-greatbear'],
      2: ['apex-timberclaw'],
    },
    essenceType: 'essence',
    mobDensity: 18,
  }],

  // MOUNTAIN — rare HUGE hits that trip the damage cap; slow + charge to connect.
  // Low density: the threat is per-hit, not volume. Damage-cap's home.
  ['mountain', {
    id: 'mountain', name: 'Mountain',
    backgroundColor: 0x141418,
    monsterPoolByTier: {
      1: ['cliff-hopper', 'cliff-hopper', 'ridge-archer'],
      2: ['granite-titan', 'stone-eagle', 'peak-archer'],
      3: ['mountain-colossus', 'avalanche-ram', 'crag-mortar'],
      4: ['granite-mammoth', 'avalanche-tyrant', 'cliffside-roc', 'cragback-rhino'],
    },
    bossPoolByTier: {
      1: ['crag-behemoth'],
      2: ['stoneplate-juggernaut'],
      3: ['crag-gorged-horn-behemoth'],
      4: ['iron-crest-titan'],
    },
    essenceType: 'essence',
    mobDensity: 12,
  }],

  // PLAINS — swarm of small, fast, low-per-hit mobs; volume is the threat.
  // Highest density; plating's home. The all-rounder / floor biome.
  ['plains', {
    id: 'plains', name: 'Plains',
    backgroundColor: 0x141a08,
    monsterPoolByTier: {
      1: ['plains-slime', 'boar'],
      2: ['stampede-bull', 'prairie-wolf', 'savanna-hawk'],
      // ⚠ T4 trash not yet authored — plains T4 ring nodes spawn nothing.
    },
    bossPoolByTier: {
      1: ['tusked-razorback'],
      2: ['gorging-razortusk'],
    },
    essenceType: 'essence',
    mobDensity: 24,
  }],

  // SWAMP — trivial direct damage, heavy stacking DoT; attrition. Dot-resist's
  // home (its armor's debt loop turns direct hits into resist-able DoT too).
  ['swamp', {
    id: 'swamp', name: 'Swamp',
    backgroundColor: 0x0c1708,
    monsterPoolByTier: {
      1: ['bog-slime', 'mud-toad'],
      2: ['swamp-hydra', 'bog-witch', 'mire-stalker'],
      3: ['plague-hydra', 'mire-hex-spitter', 'bog-lurker'],
    },
    bossPoolByTier: {
      1: ['grave-toadeater'],
      2: ['mire-gorged-behemoth'],
      3: ['rot-spore-croc-behemoth']
    },
    essenceType: 'essence',
    mobDensity: 10,
  }],

  // CAVE — few ELITE mobs, MIXED shapes (fast / bruiser / ranged), real DR +
  // plating. %DR is the universal answer; slow/piercing weapons earn keep here.
  // Lowest starter density. The intended "mixed trio" exception.
  ['cave', {
    id: 'cave', name: 'Caverns',
    backgroundColor: 0x0c0c0f,
    monsterPoolByTier: {
      1: ['cave-lurker', 'cave-brute'],
      2: ['giant-spider', 'cave-troll', 'cave-gargoyle'],
      3: ['deep-spider', 'cavern-troll', 'crystal-gargoyle'],
    },
    bossPoolByTier: {
      1: ['obsidian-broodmother'],
      2: ['chitinous-dreadbore'],
      3: ['deep-core-burrow-gorger'],
    },
    essenceType: 'essence',
    mobDensity: 8,
  }],

  // ── T2+ biomes (not available at T1) ──────────────────────────────────────

  // JUNGLE (debuts T2) — HIGH density, aggressive; on-hit / hardening profile.
  ['jungle', {
    id: 'jungle', name: 'Jungle',
    backgroundColor: 0x081508,
    monsterPoolByTier: {
      2: ['jungle-snake', 'jungle-ape', 'jungle-blowdarter'],
      3: ['jungle-stalker', 'silverback', 'canopy-harrier'],
      4: ['hunting-panther', 'apex-silverback', 'thornback-lizard', 'emerald-constrictor'],
    },
    bossPoolByTier: {
      2: ['jungle-dread-gorger'],
      3: ['apex-bramble-slasher'],
      4: ['verdant-crown-predator'],
    },
    essenceType: 'essence',
    mobDensity: 15,
  }],

  ['tundra', {
    id: 'tundra', name: 'Tundra',
    backgroundColor: 0x0e1218,
    monsterPoolByTier: {
      3: ['frost-lurker', 'glacier-bear', 'rime-caster'],
      4: ['rime-tusk-mastodon', 'glacial-direbear', 'hoarfrost-yeti', 'permafrost-behemoth'],
    },
    bossPoolByTier: {
      3: ['frost-plated-rime-mammoth'],
      4: ['glacial-patriarch'],
    },
    essenceType: 'essence',
    mobDensity: 8,
  }],

  // DESERT (debuts T2) — the LOW-density "standoff": few tough, debuff-laden
  // enemies. Density corrected 14 -> 5 to match the locked identity (was the
  // long-standing assignment error).
  ['desert', {
    id: 'desert', name: 'Desert',
    backgroundColor: 0x1a1608,
    monsterPoolByTier: {
      2: ['sand-scorpion', 'stone-basilisk', 'dust-djinn'],
      3: ['dune-stalker', 'desert-basilisk', 'sandweaver'],
      4: ['sand-viper', 'dune-basilisk', 'sandspitter-cobra', 'dune-tyrant'],
    },
    bossPoolByTier: {
      2: ['dune-stalker-emperor'],
      3: ['dune-carapace-monarch'],
      4: ['dune-throne-sovereign'],
    },
    essenceType: 'essence',
    mobDensity: 8,
  }],

  // Volcanic first appears at T3 — not available in T1 or T2 zones.
  ['volcanic', {
    id: 'volcanic', name: 'Volcanic',
    backgroundColor: 0x1a0808,
    monsterPoolByTier: {
      3: ['ember-scuttler', 'cinder-hound', 'magma-brute', 'ash-slinger'],
      4: ['ember-skink', 'infernal-direhound', 'obsidian-tortoise', 'ashspitter-salamander', 'magma-salamander'],
    },
    bossPoolByTier: {
      3: ['cinder-shell-magma-salamander'],
      4: ['caldera-sovereign'],
    },
    essenceType: 'essence',
    mobDensity: 18,
  }],

  // GRAVEYARD (T4) — EXTREME-high-density weak undead swarm; plague/contagion
  // theme. Debuts at T4 (all graveyard nodes are biomeTier 4 — no T3 pool).
  ['graveyard', {
    id: 'graveyard', name: 'Wasteland',
    backgroundColor: 0x0c0810,
    monsterPoolByTier: {
      4: ['bone-crawler', 'plague-hound', 'carrion-vulture', 'charnel-brute', 'plague-rat', 'gravewright'],
    },
    bossPoolByTier: {
      4: ['charnel-crown-sovereign'],
    },
    essenceType: 'essence',
    mobDensity: 20,
  }],

  // DEEP-SEA TRENCH (T4) — EXTREME-low-density rare abyssal terrors; execute /
  // patient single-target theme. The Void Overlord is NOT in the pool — it is
  // placed explicitly via nodeBiomes bossTypeId on its throne node.
  ['trench', {
    id: 'trench', name: 'Deep-Sea Trench',
    backgroundColor: 0x001a4d,
    monsterPoolByTier: {
      4: ['abyssal-serpent', 'hadal-stalker', 'elder-leviathan'],
    },
    bossPoolByTier: {
      4: ['elder-trench-serpent'],
    },
    essenceType: 'essence',
    mobDensity: 5,
  }],

  // ABYSS (T4) — the Void Overlord's throne. Has NO ambient monsters: the only
  // occupant is the overlord, placed explicitly via nodeBiomes bossTypeId on its
  // throne node. Empty pools = nothing ever spawns here ambiently.
  ['abyss', {
    id: 'abyss', name: 'The Abyss',
    backgroundColor: 0x0a0014,
    monsterPoolByTier: {},
    essenceType: 'essence',
    mobDensity: 0,
  }],
]);
