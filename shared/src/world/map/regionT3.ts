import { buildRegionNodes } from './authoring';

export const REGION_T3_NODES = buildRegionNodes({
  regionId: 't3',
  tier: 3,
  origin: { row: 10, col: 8 },
  mask: [
    '..###..',
    '.######',
    '#######',
    '#######',
    '######.',
    '#######',
    '.######',
    '.####..',
  ],
  biomes: ['tundra', 'mountain', 'cave', 'jungle', 'desert', 'volcanic', 'swamp'],
  dungeonCells: [
    { row: 17, col: 9 },
    { row: 17, col: 12 },
    { row: 16, col: 14 },
    { row: 15, col: 8 },
    { row: 15, col: 14 },
    { row: 11, col: 14 },
    { row: 13, col: 14 },
  ],
  specials: [
    {
      id: 'node-t3-sanctuary',
      displayName: 'T3 Sanctuary',
      map: { row: 11, col: 10 },
      kind: 'sanctuary',
      biomeGroup: 'sanctuary',
      mobDensity: 0,
      featureSetId: 'sanctuary',
      featureVariant: 3,
    },
  ],
});
