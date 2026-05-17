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
    backgroundColor: 0x0a1a0a,   // dark green
    monsterPoolByTier: {
      1: ['forest-slime', 'wolf'],
      2: ['ancient-wolf', 'ironwood-golem'],
    },
    essenceType: 'essence',
  }],

  ['mountain', {
    id: 'mountain', name: 'Mountain',
    backgroundColor: 0x141418,   // dark slate gray
    monsterPoolByTier: {
      1: ['stone-slime', 'rock-beetle'],
      2: ['granite-titan', 'stone-eagle'],
    },
    essenceType: 'essence',
  }],

  ['plains', {
    id: 'plains', name: 'Plains',
    backgroundColor: 0x141a08,   // dark olive / yellow-green
    monsterPoolByTier: {
      1: ['plains-slime', 'boar'],
      2: ['stampede-bull', 'prairie-wolf'],
    },
    essenceType: 'essence',
  }],

  ['swamp', {
    id: 'swamp', name: 'Swamp',
    backgroundColor: 0x0c1708,   // murky dark green-brown
    monsterPoolByTier: {
      1: ['bog-slime', 'mud-toad'],
      2: ['swamp-hydra', 'bog-witch'],
    },
    essenceType: 'essence',
  }],

  ['cave', {
    id: 'cave', name: 'Cave',
    backgroundColor: 0x0c0c0f,   // near black — underground
    monsterPoolByTier: {
      1: ['cave-bat', 'cave-spider'],
      2: ['giant-spider', 'cave-troll'],
    },
    essenceType: 'essence',
  }],

  ['jungle', {
    id: 'jungle', name: 'Jungle',
    backgroundColor: 0x081508,   // deep tropical green
    monsterPoolByTier: {
      1: ['jungle-snake', 'jungle-ape'],
      2: ['anaconda', 'jungle-titan'],
    },
    essenceType: 'essence',
  }],

  ['tundra', {
    id: 'tundra', name: 'Tundra',
    backgroundColor: 0x0e1218,   // icy blue-gray
    monsterPoolByTier: {
      2: ['frost-slime', 'ice-bear'],
    },
    essenceType: 'essence',
  }],

  ['desert', {
    id: 'desert', name: 'Desert',
    backgroundColor: 0x1a1608,   // sandy dark tan
    monsterPoolByTier: {
      2: ['sand-scorpion', 'stone-basilisk'],
    },
    essenceType: 'essence',
  }],

  ['volcanic', {
    id: 'volcanic', name: 'Volcanic',
    backgroundColor: 0x1a0808,   // dark ember red
    monsterPoolByTier: {
      2: ['ember-slime', 'magma-golem'],
    },
    essenceType: 'essence',
  }],
]);
