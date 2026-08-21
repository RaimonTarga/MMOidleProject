import { buildRegionNodes } from './authoring';

export const REGION_T4_NODES = buildRegionNodes({
  regionId: 't4',
  tier: 4,
  origin: { row: 9, col: 1 },
  mask: [
    '.#####.',
    '#######',
    '#######',
    '#######',
    '######.',
    '#######',
    '#######',
  ],
  biomes: [
    'mountain',
    'tundra',
    'jungle',
    'desert',
    'volcanic',
    'graveyard',
    'trench',
  ],
  dungeonCells: [
    { row: 9, col: 2 },
    { row: 9, col: 6 },
    { row: 10, col: 1 },
    { row: 10, col: 7 },
    { row: 15, col: 1 },
    { row: 15, col: 7 },
    { row: 14, col: 7 },
  ],
  specials: [
    {
      id: 'node-t4-sanctuary',
      displayName: 'T4 Sanctuary',
      map: { row: 12, col: 4 },
      kind: 'sanctuary',
      biomeGroup: 'sanctuary',
      mobDensity: 0,
      featureSetId: 'sanctuary',
      featureVariant: 4,
    },
  ],
});
