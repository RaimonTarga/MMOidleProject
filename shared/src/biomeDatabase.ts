export interface BiomeDefinition {
  id: string;
  name: string;
  /** Phaser hex color applied to the node background rectangle. */
  backgroundColor: number;
  /**
   * Monster pools keyed by biomeTier (the node's ring difficulty).
   * Spawning picks pool[node.biomeTier]. Falls back to pool[1] if the tier
   * has no explicit entry. Empty object = safe zone, nothing spawns.
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
}

export const BIOME_DATABASE: Map<string, BiomeDefinition> = new Map([

  ['clearing', {
    id: 'clearing', name: 'Clearing',
    backgroundColor: 0x101a10,   // soft dim green — safe starting area
    monsterPoolByTier: { 0: ['tiny-slime'] },
    essenceType: 'essence',
  }],

  ['forest', {
    id: 'forest', name: 'Forest',
    backgroundColor: 0x0a1a0a,
    monsterPoolByTier: {
      1: ['forest-slime', 'wolf'],
      2: ['ancient-wolf', 'ironwood-golem'],
      3: ['cursed-wolf', 'treant'],
      4: ['elder-treant', 'spectral-wolf'],
    },
    bossPoolByTier: {
      1: ['forest-warden'],
    },
    essenceType: 'essence',
  }],

  ['mountain', {
    id: 'mountain', name: 'Mountain',
    backgroundColor: 0x141418,
    monsterPoolByTier: {
      1: ['stone-slime', 'rock-beetle'],
      2: ['granite-titan', 'stone-eagle'],
      3: ['rune-golem', 'storm-eagle'],
      4: ['colossal-titan', 'thunder-condor'],
    },
    essenceType: 'essence',
  }],

  ['plains', {
    id: 'plains', name: 'Plains',
    backgroundColor: 0x141a08,
    monsterPoolByTier: {
      1: ['plains-slime', 'boar'],
      2: ['stampede-bull', 'prairie-wolf'],
      3: ['war-mammoth', 'dire-wolf'],
      4: ['ancient-guardian', 'stampede-king'],
    },
    essenceType: 'essence',
  }],

  ['swamp', {
    id: 'swamp', name: 'Swamp',
    backgroundColor: 0x0c1708,
    monsterPoolByTier: {
      1: ['bog-slime', 'mud-toad'],
      2: ['swamp-hydra', 'bog-witch'],
      3: ['bog-horror', 'plague-witch'],
      4: ['hydra-elder', 'shadow-toad'],
    },
    essenceType: 'essence',
  }],

  ['cave', {
    id: 'cave', name: 'Cave',
    backgroundColor: 0x0c0c0f,
    monsterPoolByTier: {
      1: ['cave-bat', 'cave-spider'],
      2: ['giant-spider', 'cave-troll'],
      3: ['cave-behemoth', 'venom-queen'],
      4: ['stone-colossus', 'abyss-crawler'],
    },
    essenceType: 'essence',
  }],

  ['jungle', {
    id: 'jungle', name: 'Jungle',
    backgroundColor: 0x081508,
    monsterPoolByTier: {
      1: ['jungle-snake', 'jungle-ape'],
      2: ['anaconda', 'jungle-titan'],
      3: ['feral-gorilla', 'pit-viper'],
      4: ['ancient-titan', 'jungle-wyvern'],
    },
    essenceType: 'essence',
  }],

  ['tundra', {
    id: 'tundra', name: 'Tundra',
    backgroundColor: 0x0e1218,
    monsterPoolByTier: {
      2: ['frost-slime', 'ice-bear'],
      3: ['frost-giant', 'blizzard-wolf'],
      4: ['arctic-leviathan', 'ice-specter'],
    },
    bossPoolByTier: {
      2: ['glacial-colossus'],
    },
    essenceType: 'essence',
  }],

  ['desert', {
    id: 'desert', name: 'Desert',
    backgroundColor: 0x1a1608,
    monsterPoolByTier: {
      2: ['sand-scorpion', 'stone-basilisk'],
      3: ['sand-kraken', 'bone-drake'],
      4: ['pharaoh-construct', 'desert-wyrm'],
    },
    essenceType: 'essence',
  }],

  ['volcanic', {
    id: 'volcanic', name: 'Volcanic',
    backgroundColor: 0x1a0808,
    monsterPoolByTier: {
      2: ['ember-slime', 'magma-golem'],
      3: ['lava-titan', 'fire-elemental'],
      4: ['infernal-drake', 'magma-colossus'],
    },
    bossPoolByTier: {
      2: ['infernal-tyrant'],
    },
    essenceType: 'essence',
  }],

  ['necropolis', {
    id: 'necropolis', name: 'Necropolis',
    backgroundColor: 0x0c0810,   // deep purple-black
    monsterPoolByTier: {
      3: ['skeleton-warrior', 'lich'],
      4: ['bone-colossus', 'death-knight'],
    },
    bossPoolByTier: {
      3: ['lich-king'],
    },
    essenceType: 'essence',
  }],

  ['abyss', {
    id: 'abyss', name: 'Abyss',
    backgroundColor: 0x060410,   // near-void, deep indigo-black
    monsterPoolByTier: {
      4: ['void-horror', 'abyssal-titan'],
    },
    bossPoolByTier: {
      4: ['void-titan'],
    },
    essenceType: 'essence',
  }],
]);
