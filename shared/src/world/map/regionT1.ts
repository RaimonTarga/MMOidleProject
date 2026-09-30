import type { NodeBlend } from '../../data/families';
import { buildRegionNodes } from './authoring';

/**
 * T1 node blends (design §12, Phase 2a).
 *
 * Each normal node is a share vector over its biome's three families, and the
 * LIST IS THE NODE COUNT for that biome — it took that job from the modifier
 * list, so a list's length is welded to the hand-cut mask below. See the warning
 * on `RegionAuthoringInput.blends`.
 *
 * Three families per biome give three shapes that each read as one dominant
 * family, plus a two-family node and an even one. Cave and Swamp carry a sixth
 * because their native modifier used to earn them a sixth node; Phase 2b, which
 * deletes modifiers, is where the mask may be re-cut to an even five per biome.
 *
 * Shares are authored so the dominant family is unambiguous, except in the
 * deliberate 45/45 pair where the tie breaks in family-table order.
 *
 * ⚠ KNOWN GAP (Phase 2a): the T1 monster pools field only one or two of each
 * biome's three families — the rest of each family's mobs are authored into the
 * T2/T3 pools of the same biome. Spawning therefore resolves a blend against the
 * node's own tier pool and re-scales the shares over what it can actually field
 * (`resolveNodeBlend`). These authored blends are the design target; they become
 * fully visible once the T1 pools grow a mob for the missing family.
 */
const PLAINS_BLENDS: readonly NodeBlend[] = [
  { 'plains-herd': 0.70, 'plains-swarm': 0.20, 'plains-sky': 0.10 },
  { 'plains-swarm': 0.70, 'plains-sky': 0.20, 'plains-herd': 0.10 },
  { 'plains-sky': 0.70, 'plains-herd': 0.20, 'plains-swarm': 0.10 },
  { 'plains-herd': 0.45, 'plains-swarm': 0.45, 'plains-sky': 0.10 },
  { 'plains-herd': 0.34, 'plains-swarm': 0.33, 'plains-sky': 0.33 },
];

const FOREST_BLENDS: readonly NodeBlend[] = [
  { 'forest-pack': 0.70, 'forest-grove': 0.20, 'forest-canopy': 0.10 },
  { 'forest-grove': 0.70, 'forest-canopy': 0.20, 'forest-pack': 0.10 },
  { 'forest-canopy': 0.70, 'forest-pack': 0.20, 'forest-grove': 0.10 },
  { 'forest-pack': 0.45, 'forest-grove': 0.45, 'forest-canopy': 0.10 },
  { 'forest-pack': 0.34, 'forest-grove': 0.33, 'forest-canopy': 0.33 },
];

const MOUNTAIN_BLENDS: readonly NodeBlend[] = [
  { 'mountain-crag': 0.70, 'mountain-ridge': 0.20, 'mountain-hopper': 0.10 },
  { 'mountain-ridge': 0.70, 'mountain-hopper': 0.20, 'mountain-crag': 0.10 },
  { 'mountain-hopper': 0.70, 'mountain-crag': 0.20, 'mountain-ridge': 0.10 },
  { 'mountain-crag': 0.45, 'mountain-ridge': 0.45, 'mountain-hopper': 0.10 },
  { 'mountain-crag': 0.34, 'mountain-ridge': 0.33, 'mountain-hopper': 0.33 },
];

const CAVE_BLENDS: readonly NodeBlend[] = [
  { 'cave-brood': 0.70, 'cave-brute': 0.20, 'cave-deep': 0.10 },
  { 'cave-brute': 0.70, 'cave-deep': 0.20, 'cave-brood': 0.10 },
  { 'cave-deep': 0.70, 'cave-brood': 0.20, 'cave-brute': 0.10 },
  { 'cave-brood': 0.45, 'cave-brute': 0.45, 'cave-deep': 0.10 },
  { 'cave-brood': 0.34, 'cave-brute': 0.33, 'cave-deep': 0.33 },
  { 'cave-brute': 0.55, 'cave-deep': 0.30, 'cave-brood': 0.15 },
];

const SWAMP_BLENDS: readonly NodeBlend[] = [
  { 'swamp-mire': 0.70, 'swamp-coven': 0.20, 'swamp-stalker': 0.10 },
  { 'swamp-coven': 0.70, 'swamp-stalker': 0.20, 'swamp-mire': 0.10 },
  { 'swamp-stalker': 0.70, 'swamp-mire': 0.20, 'swamp-coven': 0.10 },
  { 'swamp-mire': 0.45, 'swamp-coven': 0.45, 'swamp-stalker': 0.10 },
  { 'swamp-mire': 0.34, 'swamp-coven': 0.33, 'swamp-stalker': 0.33 },
  { 'swamp-coven': 0.55, 'swamp-stalker': 0.30, 'swamp-mire': 0.15 },
];

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
  blends: {
    mountain: MOUNTAIN_BLENDS,
    cave: CAVE_BLENDS,
    forest: FOREST_BLENDS,
    plains: PLAINS_BLENDS,
    swamp: SWAMP_BLENDS,
  },
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
