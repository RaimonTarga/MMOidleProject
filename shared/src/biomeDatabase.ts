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
   * Density is the OTHER half of each biome's threat: high-density biomes
   * (plains/forest/jungle) pressure tanks via volume; low-density (mountain/
   * cave/desert) pressure via per-hit. The per-mob stats assume these values.
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

  // FOREST — fast movement + FREQUENT (low-cd) attacks; low per-hit, no armor.
  // Evasion's home; squishy, fast weapons shred. High-ish density.
  ['forest', {
    id: 'forest', name: 'Forest',
    backgroundColor: 0x0a1a0a,
    monsterPoolByTier: {
      1: ['forest-slime', 'wolf'],
      2: ['ancient-wolf', 'ironwood-golem', 'canopy-sprite'],
    },
    bossPoolByTier: {
      1: ['forest-warden'],
      2: ['forest-elder'],
    },
    essenceType: 'essence',
    mobDensity: 13,
  }],

  // MOUNTAIN — rare HUGE hits that trip the damage cap; slow + charge to connect.
  // Low density: the threat is per-hit, not volume. Damage-cap's home.
  ['mountain', {
    id: 'mountain', name: 'Mountain',
    backgroundColor: 0x141418,
    monsterPoolByTier: {
      1: ['cliff-hopper', 'ridge-archer'],
      2: ['granite-titan', 'stone-eagle', 'peak-archer'],
      3: ['mountain-colossus', 'avalanche-ram', 'summit-trebuchet'],
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

  // PLAINS — swarm of small, fast, low-per-hit mobs; volume is the threat.
  // Highest density; plating's home. The all-rounder / floor biome.
  ['plains', {
    id: 'plains', name: 'Plains',
    backgroundColor: 0x141a08,
    monsterPoolByTier: {
      1: ['plains-slime', 'boar'],
      2: ['stampede-bull', 'prairie-wolf', 'savanna-hawk'],
    },
    bossPoolByTier: {
      1: ['plains-champion'],
      2: ['plains-tyrant'],
    },
    essenceType: 'essence',
    mobDensity: 16,
  }],

  // SWAMP — trivial direct damage, heavy stacking DoT; attrition. Dot-resist's
  // home (its armor's debt loop turns direct hits into resist-able DoT too).
  ['swamp', {
    id: 'swamp', name: 'Swamp',
    backgroundColor: 0x0c1708,
    monsterPoolByTier: {
      1: ['bog-slime', 'mud-toad'],
      2: ['swamp-hydra', 'bog-witch', 'mire-stalker'],
      3: ['plague-hydra', 'mire-curse-witch', 'bog-lurker'],
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
      4: ['stone-colossus', 'trench-crawler'],
    },
    bossPoolByTier: {
      1: ['cave-sentinel'],
      2: ['cave-terror'],
      3: ['cave-dread'],
      4: ['cave-titan'],
    },
    essenceType: 'essence',
    mobDensity: 5,
  }],

  // ── T2+ biomes (not available at T1) ──────────────────────────────────────

  // JUNGLE (debuts T2) — HIGH density, aggressive; on-hit / hardening profile.
  ['jungle', {
    id: 'jungle', name: 'Jungle',
    backgroundColor: 0x081508,
    monsterPoolByTier: {
      2: ['jungle-snake', 'jungle-ape', 'jungle-blowdarter'],
      3: ['jungle-stalker', 'silverback', 'canopy-harrier'],
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
      3: ['frost-lurker', 'glacier-bear', 'rime-caster'],
      4: ['arctic-leviathan', 'ice-specter'],
    },
    bossPoolByTier: {
      3: ['frost-colossus'],
      4: ['glacial-titan'],
    },
    essenceType: 'essence',
    mobDensity: 6,
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
      4: ['pharaoh-construct', 'desert-wyrm'],
    },
    bossPoolByTier: {
      2: ['desert-pharaoh'],
      3: ['sand-emperor'],
      4: ['desert-eternal'],
    },
    essenceType: 'essence',
    mobDensity: 5,
  }],

  // Volcanic first appears at T3 — not available in T1 or T2 zones.
  ['volcanic', {
    id: 'volcanic', name: 'Volcanic',
    backgroundColor: 0x1a0808,
    monsterPoolByTier: {
      3: ['ember-imp', 'cinder-hound', 'magma-brute', 'ash-slinger'],
      4: ['infernal-drake', 'magma-colossus'],
    },
    bossPoolByTier: {
      3: ['volcanic-titan'],
      4: ['inferno-lord'],
    },
    essenceType: 'essence',
    mobDensity: 18,
  }],

  // GRAVEYARD (T4) — was 'graveyard'. EXTREME-high-density weak undead swarm;
  // carries a NEW mechanic (plague / DoT-contagion), not a plains re-run.
  // ⚠ id changed necropolis -> graveyard: propagate in world-gen / zone config.
  // Mob pool is placeholder pending the new-mechanic mobs.
  ['graveyard', {
    id: 'graveyard', name: 'Graveyard',
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
    mobDensity: 20,
  }],

  // DEEP-SEA TRENCH (T4) — was 'trench'. EXTREME-low-density rare trenchal terrors;
  // carries a NEW mechanic (execute / finisher), not a desert re-run.
  // ⚠ id changed abyss -> trench: propagate in world-gen / zone config.
  // Mob pool is placeholder pending the new-mechanic mobs.
  ['trench', {
    id: 'trench', name: 'Deep-Sea Trench',
    backgroundColor: 0x001a4d,
    monsterPoolByTier: {
      4: ['void-horror', 'trenchal-titan'],
    },
    bossPoolByTier: {
      4: ['void-overlord', 'void-titan'],
    },
    essenceType: 'essence',
    mobDensity: 3,
  }],
]);