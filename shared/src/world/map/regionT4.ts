import type { NodeBlend } from '../../data/families';
import { buildRegionNodes } from './authoring';
import { resolveSanctuaryNodeDisplayName } from './displayNames';

/**
 * T4 node blends (design §12, W1-C — PROVISIONAL, see families/index.ts).
 *
 * Mountain/Jungle/Desert/Volcanic reuse their existing (T1/T2-authored)
 * families, same as T3. Tundra/Volcanic's families were authored alongside
 * their T3 blends (`regionT3.ts`) in this same wave. Graveyard and Trench are
 * T4-only biomes (no T1-T3 presence in `biomeDatabase.ts`'s
 * `monsterPoolByTier`), so these are their first blends.
 *
 * Counted against the live T4 normal node count (2026-10-01): mountain 5,
 * tundra 5, jungle 5, desert 5, volcanic 6, graveyard 6, trench 6 (38 total).
 * Each list below is authored to exactly that length; see the warning on
 * `RegionAuthoringInput.blends` in `authoring.ts` before resizing any of them.
 */
const MOUNTAIN_T4_BLENDS: readonly NodeBlend[] = [
  { 'mountain-crag': 0.70, 'mountain-ridge': 0.20, 'mountain-hopper': 0.10 },
  { 'mountain-ridge': 0.70, 'mountain-hopper': 0.20, 'mountain-crag': 0.10 },
  { 'mountain-hopper': 0.70, 'mountain-crag': 0.20, 'mountain-ridge': 0.10 },
  { 'mountain-crag': 0.45, 'mountain-ridge': 0.45, 'mountain-hopper': 0.10 },
  { 'mountain-crag': 0.34, 'mountain-ridge': 0.33, 'mountain-hopper': 0.33 },
];

const TUNDRA_T4_BLENDS: readonly NodeBlend[] = [
  { 'tundra-glacial': 0.70, 'tundra-rime': 0.30 },
  { 'tundra-rime': 0.70, 'tundra-glacial': 0.30 },
  { 'tundra-glacial': 0.60, 'tundra-rime': 0.40 },
  { 'tundra-rime': 0.60, 'tundra-glacial': 0.40 },
  { 'tundra-glacial': 0.50, 'tundra-rime': 0.50 },
];

const JUNGLE_T4_BLENDS: readonly NodeBlend[] = [
  { 'jungle-ape': 0.70, 'jungle-undergrowth': 0.20, 'jungle-stalker': 0.10 },
  { 'jungle-undergrowth': 0.70, 'jungle-stalker': 0.20, 'jungle-ape': 0.10 },
  { 'jungle-stalker': 0.70, 'jungle-ape': 0.20, 'jungle-undergrowth': 0.10 },
  { 'jungle-ape': 0.45, 'jungle-undergrowth': 0.45, 'jungle-stalker': 0.10 },
  { 'jungle-ape': 0.34, 'jungle-undergrowth': 0.33, 'jungle-stalker': 0.33 },
];

const DESERT_T4_BLENDS: readonly NodeBlend[] = [
  { 'desert-basilisk': 0.70, 'desert-scorpion': 0.20, 'desert-stalker': 0.10 },
  { 'desert-scorpion': 0.70, 'desert-stalker': 0.20, 'desert-basilisk': 0.10 },
  { 'desert-stalker': 0.70, 'desert-basilisk': 0.20, 'desert-scorpion': 0.10 },
  { 'desert-basilisk': 0.45, 'desert-scorpion': 0.45, 'desert-stalker': 0.10 },
  { 'desert-basilisk': 0.34, 'desert-scorpion': 0.33, 'desert-stalker': 0.33 },
];

const VOLCANIC_T4_BLENDS: readonly NodeBlend[] = [
  { 'volcanic-swarm': 0.70, 'volcanic-anchor': 0.20, 'volcanic-ashfall': 0.10 },
  { 'volcanic-anchor': 0.70, 'volcanic-ashfall': 0.20, 'volcanic-swarm': 0.10 },
  { 'volcanic-ashfall': 0.70, 'volcanic-swarm': 0.20, 'volcanic-anchor': 0.10 },
  { 'volcanic-swarm': 0.45, 'volcanic-anchor': 0.45, 'volcanic-ashfall': 0.10 },
  { 'volcanic-swarm': 0.34, 'volcanic-anchor': 0.33, 'volcanic-ashfall': 0.33 },
  { 'volcanic-anchor': 0.55, 'volcanic-ashfall': 0.30, 'volcanic-swarm': 0.15 },
];

const GRAVEYARD_T4_BLENDS: readonly NodeBlend[] = [
  { 'graveyard-crawler': 0.70, 'graveyard-plague': 0.20, 'graveyard-choir': 0.10 },
  { 'graveyard-plague': 0.70, 'graveyard-choir': 0.20, 'graveyard-crawler': 0.10 },
  { 'graveyard-choir': 0.70, 'graveyard-crawler': 0.20, 'graveyard-plague': 0.10 },
  { 'graveyard-crawler': 0.45, 'graveyard-plague': 0.45, 'graveyard-choir': 0.10 },
  { 'graveyard-crawler': 0.34, 'graveyard-plague': 0.33, 'graveyard-choir': 0.33 },
  { 'graveyard-plague': 0.55, 'graveyard-choir': 0.30, 'graveyard-crawler': 0.15 },
];

const TRENCH_T4_BLENDS: readonly NodeBlend[] = [
  { 'trench-hunter': 0.70, 'trench-kiter': 0.20, 'trench-anchor': 0.10 },
  { 'trench-kiter': 0.70, 'trench-anchor': 0.20, 'trench-hunter': 0.10 },
  { 'trench-anchor': 0.70, 'trench-hunter': 0.20, 'trench-kiter': 0.10 },
  { 'trench-hunter': 0.45, 'trench-kiter': 0.45, 'trench-anchor': 0.10 },
  { 'trench-hunter': 0.34, 'trench-kiter': 0.33, 'trench-anchor': 0.33 },
  { 'trench-kiter': 0.55, 'trench-anchor': 0.30, 'trench-hunter': 0.15 },
];

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
  blends: {
    mountain: MOUNTAIN_T4_BLENDS,
    tundra: TUNDRA_T4_BLENDS,
    jungle: JUNGLE_T4_BLENDS,
    desert: DESERT_T4_BLENDS,
    volcanic: VOLCANIC_T4_BLENDS,
    graveyard: GRAVEYARD_T4_BLENDS,
    trench: TRENCH_T4_BLENDS,
  },
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
      displayName: resolveSanctuaryNodeDisplayName(4),
      map: { row: 12, col: 4 },
      kind: 'sanctuary',
      biomeGroup: 'sanctuary',
      mobDensity: 0,
      featureSetId: 'sanctuary',
      featureVariant: 4,
    },
  ],
});
