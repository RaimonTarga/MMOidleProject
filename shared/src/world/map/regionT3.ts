import type { NodeBlend } from '../../data/families';
import { buildRegionNodes } from './authoring';
import { resolveSanctuaryNodeDisplayName } from './displayNames';

/**
 * T3 node blends (design §12, W1-C — PROVISIONAL, see families/index.ts).
 *
 * Tundra/Mountain/Cave/Jungle/Desert/Volcanic/Swamp all have an authored
 * family table by this wave (`shared/src/data/families/index.ts`): the five
 * starter biomes plus Jungle/Desert reuse their existing families (their
 * T3 mobs already live in those families' `monsterIds`), and Tundra/Volcanic
 * are the new biomes authored in this same wave. Desert's T3 blends name all
 * THREE families for the first time (Stalker's T3+ members debut here), though
 * its T3 pool fields only two of them (see DESERT_T3_BLENDS).
 *
 * Counted against the live T3 normal node count (2026-10-01): tundra 5,
 * mountain 5, cave 6, jungle 5, desert 5, volcanic 6, swamp 6 (38 total) —
 * `(5 - bans) + (native ? 1 : 0)` per `nodeModifierTypes.ts`. Each list below
 * is authored to exactly that length; see the warning on
 * `RegionAuthoringInput.blends` in `authoring.ts` before resizing any of them.
 */
const TUNDRA_T3_BLENDS: readonly NodeBlend[] = [
  { 'tundra-glacial': 0.70, 'tundra-rime': 0.30 },
  { 'tundra-rime': 0.70, 'tundra-glacial': 0.30 },
  { 'tundra-glacial': 0.60, 'tundra-rime': 0.40 },
  { 'tundra-rime': 0.60, 'tundra-glacial': 0.40 },
  { 'tundra-glacial': 0.50, 'tundra-rime': 0.50 },
];

const MOUNTAIN_T3_BLENDS: readonly NodeBlend[] = [
  { 'mountain-crag': 0.70, 'mountain-ridge': 0.20, 'mountain-hopper': 0.10 },
  { 'mountain-ridge': 0.70, 'mountain-hopper': 0.20, 'mountain-crag': 0.10 },
  { 'mountain-hopper': 0.70, 'mountain-crag': 0.20, 'mountain-ridge': 0.10 },
  { 'mountain-crag': 0.45, 'mountain-ridge': 0.45, 'mountain-hopper': 0.10 },
  { 'mountain-crag': 0.34, 'mountain-ridge': 0.33, 'mountain-hopper': 0.33 },
];

const CAVE_T3_BLENDS: readonly NodeBlend[] = [
  { 'cave-brood': 0.70, 'cave-brute': 0.20, 'cave-deep': 0.10 },
  { 'cave-brute': 0.70, 'cave-deep': 0.20, 'cave-brood': 0.10 },
  { 'cave-deep': 0.70, 'cave-brood': 0.20, 'cave-brute': 0.10 },
  { 'cave-brood': 0.45, 'cave-brute': 0.45, 'cave-deep': 0.10 },
  { 'cave-brood': 0.34, 'cave-brute': 0.33, 'cave-deep': 0.33 },
  { 'cave-brute': 0.55, 'cave-deep': 0.30, 'cave-brood': 0.15 },
];

const JUNGLE_T3_BLENDS: readonly NodeBlend[] = [
  { 'jungle-ape': 0.70, 'jungle-undergrowth': 0.20, 'jungle-stalker': 0.10 },
  // 02 — Stalker territory, not Undergrowth (verbs-that-fire C, PROVISIONAL): no
  // Undergrowth body lives at T3 (snake/blowdarter are T2, lizard/constrictor T4), so
  // the node spawned Stalker 7 / Ape 3 while paying Venom. Spawns unchanged.
  { 'jungle-stalker': 0.70, 'jungle-ape': 0.30 },
  { 'jungle-stalker': 0.70, 'jungle-ape': 0.20, 'jungle-undergrowth': 0.10 },
  { 'jungle-ape': 0.45, 'jungle-undergrowth': 0.45, 'jungle-stalker': 0.10 },
  { 'jungle-ape': 0.34, 'jungle-undergrowth': 0.33, 'jungle-stalker': 0.33 },
];

/**
 * Stalker's T3+ members debut here — but the T3 pool fields only Basilisk and
 * Stalker: `dune-stalker` (its monster file's "soft controller T3", the Scorpion
 * line's middle step) is filed under Stalker, so Scorpion has no T3 body.
 */
const DESERT_T3_BLENDS: readonly NodeBlend[] = [
  { 'desert-basilisk': 0.70, 'desert-scorpion': 0.20, 'desert-stalker': 0.10 },
  // 02 — Stalker territory, not Scorpion (verbs-that-fire C, PROVISIONAL): with no T3
  // Scorpion the node spawned Stalker 7 / Basilisk 3 while paying Shackle. Spawns
  // unchanged.
  { 'desert-stalker': 0.70, 'desert-basilisk': 0.30 },
  { 'desert-stalker': 0.70, 'desert-basilisk': 0.20, 'desert-scorpion': 0.10 },
  { 'desert-basilisk': 0.45, 'desert-scorpion': 0.45, 'desert-stalker': 0.10 },
  { 'desert-basilisk': 0.34, 'desert-scorpion': 0.33, 'desert-stalker': 0.33 },
];

const VOLCANIC_T3_BLENDS: readonly NodeBlend[] = [
  { 'volcanic-swarm': 0.70, 'volcanic-anchor': 0.20, 'volcanic-ashfall': 0.10 },
  { 'volcanic-anchor': 0.70, 'volcanic-ashfall': 0.20, 'volcanic-swarm': 0.10 },
  { 'volcanic-ashfall': 0.70, 'volcanic-swarm': 0.20, 'volcanic-anchor': 0.10 },
  { 'volcanic-swarm': 0.45, 'volcanic-anchor': 0.45, 'volcanic-ashfall': 0.10 },
  { 'volcanic-swarm': 0.34, 'volcanic-anchor': 0.33, 'volcanic-ashfall': 0.33 },
  { 'volcanic-anchor': 0.55, 'volcanic-ashfall': 0.30, 'volcanic-swarm': 0.15 },
];

const SWAMP_T3_BLENDS: readonly NodeBlend[] = [
  { 'swamp-mire': 0.70, 'swamp-coven': 0.20, 'swamp-stalker': 0.10 },
  { 'swamp-coven': 0.70, 'swamp-stalker': 0.20, 'swamp-mire': 0.10 },
  // 03 — Mire territory, not Stalker (verbs-that-fire C, PROVISIONAL): no Stalker body
  // lives at T3 (mud-toad is T1, mire-stalker T2), so the node spawned Mire 7 /
  // Coven 3 while paying Bone. Spawns unchanged.
  { 'swamp-mire': 0.70, 'swamp-coven': 0.30 },
  { 'swamp-mire': 0.45, 'swamp-coven': 0.45, 'swamp-stalker': 0.10 },
  { 'swamp-mire': 0.34, 'swamp-coven': 0.33, 'swamp-stalker': 0.33 },
  { 'swamp-coven': 0.55, 'swamp-stalker': 0.30, 'swamp-mire': 0.15 },
];

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
  blends: {
    tundra: TUNDRA_T3_BLENDS,
    mountain: MOUNTAIN_T3_BLENDS,
    cave: CAVE_T3_BLENDS,
    jungle: JUNGLE_T3_BLENDS,
    desert: DESERT_T3_BLENDS,
    volcanic: VOLCANIC_T3_BLENDS,
    swamp: SWAMP_T3_BLENDS,
  },
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
      displayName: resolveSanctuaryNodeDisplayName(3),
      map: { row: 11, col: 10 },
      kind: 'sanctuary',
      biomeGroup: 'sanctuary',
      mobDensity: 0,
      featureSetId: 'sanctuary',
      featureVariant: 3,
    },
  ],
});
