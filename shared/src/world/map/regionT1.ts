import { buildRegionNodes } from './authoring';

export const REGION_T1_NODES = buildRegionNodes({
  regionId: 't1',
  tier: 1,
  origin: { row: 2, col: 2 },
  mask: [
    '.####.',
    '######',
    '######',
    '######',
    '#####.',
    '.####.',
    '.##...',
  ],
  biomes: ['mountain', 'cave', 'forest', 'plains', 'swamp'],
  dungeonCells: [
    { row: 2, col: 3 },
    { row: 2, col: 6 },
    { row: 3, col: 7 },
    { row: 8, col: 3 },
    { row: 7, col: 6 },
  ],
  specials: [
    {
      id: 'node-clearing',
      displayName: 'Clearing',
      map: { row: 5, col: 4 },
      kind: 'tutorial',
      biomeGroup: 'clearing',
      biomeTier: 0,
      featureSetId: 'clearing',
      featureVariant: 0,
    },
  ],
});
