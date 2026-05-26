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
  /**
   * How many non-boss monsters the server targets per node of this biome.
   * Falls back to GAME_CONFIG.MONSTERS_PER_NODE when omitted.
   * High density = more but weaker monsters; low density = fewer but tougher.
   */
  mobDensity?: number;
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
  // Threat profile: fast/sustained, low defense — easy to burst down
  ['forest', {
    id: 'forest', name: 'Forest',
    backgroundColor: 0x0a1a0a,
    monsterPoolByTier: {
      1: ['forest-slime', 'wolf'],
      2: ['ancient-wolf', 'ironwood-golem', 'canopy-sprite'],
      3: ['cursed-wolf', 'treant'],
      4: ['elder-treant', 'spectral-wolf'],
    },
    bossPoolByTier: {
      1: ['forest-warden'],
      2: ['forest-elder'],
      3: ['elder-forest-warden'],
      4: ['elder-treant-lord'],
    },
    essenceType: 'essence',
    mobDensity: 13,
  }],

  // Threat profile: two varieties — fast skirmishers (high pull range, low defense)
  // and pseudo-ranged attackers (long attack range, average stats)
  ['mountain', {
    id: 'mountain', name: 'Mountain',
    backgroundColor: 0x141418,
    monsterPoolByTier: {
      1: ['cliff-hopper', 'ridge-archer'],
      2: ['granite-titan', 'stone-eagle', 'peak-archer'],
      3: ['rune-golem', 'storm-eagle'],
      4: ['colossal-titan', 'thunder-condor'],
    },
    bossPoolByTier: {
      1: ['mountain-sentinel'],
      2: ['stone-warden'],
      3: ['peak-titan'],
      4: ['mountain-titan'],
    },
    essenceType: 'essence',
    mobDensity: 7,
  }],

  // Threat profile: balanced, no specialization — jack of all trades
  ['plains', {
    id: 'plains', name: 'Plains',
    backgroundColor: 0x141a08,
    monsterPoolByTier: {
      1: ['plains-slime', 'boar'],
      2: ['stampede-bull', 'prairie-wolf', 'savanna-hawk'],
      3: ['war-mammoth', 'dire-wolf'],
      4: ['ancient-guardian', 'stampede-king'],
    },
    bossPoolByTier: {
      1: ['plains-champion'],
      2: ['plains-overlord'],
      3: ['plains-warlord'],
      4: ['stampede-emperor'],
    },
    essenceType: 'essence',
    mobDensity: 16,
  }],

  // Threat profile: attrition — DoT/poison attackers with above-average defense;
  // slow but ramping damage output; higher tiers introduce debuffs
  ['swamp', {
    id: 'swamp', name: 'Swamp',
    backgroundColor: 0x0c1708,
    monsterPoolByTier: {
      1: ['bog-slime', 'mud-toad'],
      2: ['swamp-hydra', 'bog-witch', 'mire-stalker'],
      3: ['bog-horror', 'plague-witch'],
      4: ['hydra-elder', 'shadow-toad'],
    },
    bossPoolByTier: {
      1: ['bog-sovereign'],
      2: ['mire-lord'],
      3: ['bog-ancient'],
      4: ['swamp-sovereign'],
    },
    essenceType: 'essence',
    mobDensity: 10,
  }],

  // Threat profile: high defense, hard and slow hits — damage spikiness;
  // hardest T1 biome to farm due to plating; low pull range (ambush style)
  ['cave', {
    id: 'cave', name: 'Caverns',
    backgroundColor: 0x0c0c0f,
    monsterPoolByTier: {
      1: ['cave-lurker', 'cave-brute'],
      2: ['giant-spider', 'cave-troll', 'cave-gargoyle'],
      3: ['cave-behemoth', 'venom-queen'],
      4: ['stone-colossus', 'abyss-crawler'],
    },
    bossPoolByTier: {
      1: ['cave-sentinel'],
      2: ['cave-terror'],
      3: ['cave-overlord'],
      4: ['cave-titan'],
    },
    essenceType: 'essence',
    mobDensity: 5,
  }],

  // ── T2+ biomes (not available at T1) ──────────────────────────────────────
  // Jungle first appears at T2 — dense, aggressive, mixed threat profile
  ['jungle', {
    id: 'jungle', name: 'Jungle',
    backgroundColor: 0x081508,
    monsterPoolByTier: {
      2: ['jungle-snake', 'jungle-ape', 'jungle-blowdarter'],
      3: ['feral-gorilla', 'pit-viper'],
      4: ['ancient-titan', 'jungle-wyvern'],
    },
    bossPoolByTier: {
      2: ['jungle-colossus'],
      3: ['jungle-titan-lord'],
      4: ['jungle-ancient-lord'],
    },
    essenceType: 'essence',
    mobDensity: 15,
  }],

  ['tundra', {
    id: 'tundra', name: 'Tundra',
    backgroundColor: 0x0e1218,
    monsterPoolByTier: {
      3: ['frost-slime', 'ice-bear', 'frost-giant', 'blizzard-wolf'],
      4: ['arctic-leviathan', 'ice-specter'],
    },
    bossPoolByTier: {
      2: ['glacial-colossus'],
      3: ['frost-colossus'],
      4: ['glacial-titan'],
    },
    essenceType: 'essence',
    mobDensity: 6,
  }],

  ['desert', {
    id: 'desert', name: 'Desert',
    backgroundColor: 0x1a1608,
    monsterPoolByTier: {
      2: ['sand-scorpion', 'stone-basilisk', 'dune-asp'],
      3: ['sand-kraken', 'bone-drake'],
      4: ['pharaoh-construct', 'desert-wyrm'],
    },
    bossPoolByTier: {
      2: ['desert-pharaoh'],
      3: ['sand-emperor'],
      4: ['desert-eternal'],
    },
    essenceType: 'essence',
    mobDensity: 14,
  }],

  // Volcanic first appears at T3 — not available in T1 or T2 zones.
  ['volcanic', {
    id: 'volcanic', name: 'Volcanic',
    backgroundColor: 0x1a0808,
    monsterPoolByTier: {
      3: ['ember-slime', 'magma-golem', 'lava-titan', 'fire-elemental'],
      4: ['infernal-drake', 'magma-colossus'],
    },
    bossPoolByTier: {
      3: ['volcanic-titan'],
      4: ['inferno-lord'],
    },
    essenceType: 'essence',
    mobDensity: 5,
  }],

  // Necropolis first appears at T4 — deep undead territory.
  ['necropolis', {
    id: 'necropolis', name: 'Necropolis',
    backgroundColor: 0x0c0810,
    monsterPoolByTier: {
      3: ['skeleton-warrior', 'lich'],
      4: ['bone-colossus', 'death-knight'],
    },
    bossPoolByTier: {
      3: ['lich-king'],
      4: ['undying-lord'],
    },
    essenceType: 'essence',
    mobDensity: 13,
  }],

  // Abyss first appears at T4 — end-game void zones only.
  ['abyss', {
    id: 'abyss', name: 'Abyss',
    backgroundColor: 0x060410,
    monsterPoolByTier: {
      4: ['void-horror', 'abyssal-titan'],
    },
    bossPoolByTier: {
      4: ['void-titan'],
    },
    essenceType: 'essence',
    mobDensity: 5,
  }],
]);
