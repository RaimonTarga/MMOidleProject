import { buildRegionNodes } from './authoring';

export const REGION_T2_NODES = buildRegionNodes({
  regionId: 't2',
  tier: 2,
  origin: { row: 2, col: 8 },
  mask: [
    '.#####.',
    '#######',
    '#######',
    '######.',
    '.######',
    '#######',
    '.#####.',
    '..##...',
  ],
  biomes: ['forest', 'plains', 'mountain', 'cave', 'swamp', 'jungle', 'desert'],
  eliteGroundBiomes: ['jungle'],
  dungeonCells: [
    { row: 2, col: 13 },
    { row: 3, col: 14 },
    { row: 6, col: 14 },
    { row: 7, col: 8 },
    { row: 8, col: 9 },
    { row: 8, col: 13 },
    { row: 9, col: 11 },
  ],
  specials: [
    {
      id: 'node-t2-sanctuary',
      displayName: 'T2 Sanctuary',
      map: { row: 4, col: 9 },
      kind: 'sanctuary',
      biomeGroup: 'sanctuary',
      mobDensity: 0,
      featureSetId: 'sanctuary',
      featureVariant: 2,
    },
  ],
});
