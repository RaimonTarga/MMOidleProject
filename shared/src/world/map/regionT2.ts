import type { NodeBlend } from '../../data/families';
import { buildRegionNodes } from './authoring';
import { resolveSanctuaryNodeDisplayName } from './displayNames';

/**
 * T2 node blends (design §12, W1-E).
 *
 * The starter five (Forest/Plains/Mountain/Cave/Swamp) reuse their T1 family
 * table — those families already list their T2 mobs (see
 * `shared/src/data/families/index.ts`), this is only a second, separate node
 * list for them. Jungle and Desert use the Jungle/Desert families authored in
 * the same wave. Desert fields only two families at T2 (Basilisk, Scorpion —
 * Stalker is T3+ only, see the family table's header), so its blends are
 * two-way, not three.
 *
 * Counted against the live T2 normal node count (2026-10-01): forest 5,
 * plains 5, mountain 5, cave 6, swamp 6, jungle 5, desert 5 (37 total). Each
 * list below is authored to exactly that length — see the warning on
 * `RegionAuthoringInput.blends` in `authoring.ts` before resizing any of them.
 *
 * ⚠ Authoring this changes what a T2 node actually spawns (blend replaces the
 * flat per-biome pool for the first time at this tier), so every existing T2
 * balance baseline measured against the old flat pool is void — flagged for
 * the designer, same class of change as the T1 Mountain de-duplication noted
 * in the 2026-10-01 overnight report.
 */
const FOREST_T2_BLENDS: readonly NodeBlend[] = [
  { 'forest-pack': 0.70, 'forest-grove': 0.20, 'forest-canopy': 0.10 },
  { 'forest-grove': 0.70, 'forest-canopy': 0.20, 'forest-pack': 0.10 },
  { 'forest-canopy': 0.70, 'forest-pack': 0.20, 'forest-grove': 0.10 },
  { 'forest-pack': 0.45, 'forest-grove': 0.45, 'forest-canopy': 0.10 },
  { 'forest-pack': 0.34, 'forest-grove': 0.33, 'forest-canopy': 0.33 },
];

const PLAINS_T2_BLENDS: readonly NodeBlend[] = [
  { 'plains-herd': 0.70, 'plains-swarm': 0.20, 'plains-sky': 0.10 },
  { 'plains-swarm': 0.70, 'plains-sky': 0.20, 'plains-herd': 0.10 },
  { 'plains-sky': 0.70, 'plains-herd': 0.20, 'plains-swarm': 0.10 },
  { 'plains-herd': 0.45, 'plains-swarm': 0.45, 'plains-sky': 0.10 },
  { 'plains-herd': 0.34, 'plains-swarm': 0.33, 'plains-sky': 0.33 },
];

const MOUNTAIN_T2_BLENDS: readonly NodeBlend[] = [
  { 'mountain-crag': 0.70, 'mountain-ridge': 0.20, 'mountain-hopper': 0.10 },
  { 'mountain-ridge': 0.70, 'mountain-hopper': 0.20, 'mountain-crag': 0.10 },
  { 'mountain-hopper': 0.70, 'mountain-crag': 0.20, 'mountain-ridge': 0.10 },
  { 'mountain-crag': 0.45, 'mountain-ridge': 0.45, 'mountain-hopper': 0.10 },
  { 'mountain-crag': 0.34, 'mountain-ridge': 0.33, 'mountain-hopper': 0.33 },
];

const CAVE_T2_BLENDS: readonly NodeBlend[] = [
  { 'cave-brood': 0.70, 'cave-brute': 0.20, 'cave-deep': 0.10 },
  { 'cave-brute': 0.70, 'cave-deep': 0.20, 'cave-brood': 0.10 },
  { 'cave-deep': 0.70, 'cave-brood': 0.20, 'cave-brute': 0.10 },
  { 'cave-brood': 0.45, 'cave-brute': 0.45, 'cave-deep': 0.10 },
  { 'cave-brood': 0.34, 'cave-brute': 0.33, 'cave-deep': 0.33 },
  { 'cave-brute': 0.55, 'cave-deep': 0.30, 'cave-brood': 0.15 },
];

const SWAMP_T2_BLENDS: readonly NodeBlend[] = [
  // 01 — Coven territory, not Mire (verbs-that-fire C, PROVISIONAL): no Mire body lives
  // at T2 (bog-slime is T1, bog-lurker T3), so this node already spawned Coven 7 /
  // Stalker 3 while paying Venom. Two-way like Desert's T2 blends; spawns unchanged.
  { 'swamp-coven': 0.70, 'swamp-stalker': 0.30 },
  { 'swamp-coven': 0.70, 'swamp-stalker': 0.20, 'swamp-mire': 0.10 },
  { 'swamp-stalker': 0.70, 'swamp-mire': 0.20, 'swamp-coven': 0.10 },
  // 04 — Coven territory, not Mire (verbs-that-fire C, PROVISIONAL): the 45/45 tie went
  // to Mire, which has no T2 body, so the node spawned Coven 8 / Stalker 2. Spawns
  // unchanged.
  { 'swamp-coven': 0.80, 'swamp-stalker': 0.20 },
  // 05 — Stalker territory, not Mire (verbs-that-fire C, PROVISIONAL): Mire has no T2
  // body, so the node spawned Coven 5 / Stalker 5. Stalker leads (6 / 4) rather than
  // Coven so the tier's Bone Shards come from two nodes, not one (Coven already leads
  // 01, 02, 04 and 06).
  { 'swamp-stalker': 0.60, 'swamp-coven': 0.40 },
  { 'swamp-coven': 0.55, 'swamp-stalker': 0.30, 'swamp-mire': 0.15 },
];

const JUNGLE_T2_BLENDS: readonly NodeBlend[] = [
  { 'jungle-ape': 0.70, 'jungle-undergrowth': 0.20, 'jungle-stalker': 0.10 },
  { 'jungle-undergrowth': 0.70, 'jungle-stalker': 0.20, 'jungle-ape': 0.10 },
  // 03 — Undergrowth territory, not Stalker (verbs-that-fire C, PROVISIONAL): no Jungle
  // Stalker lives below T3, so the node spawned Ape 7 / Undergrowth 3 while paying
  // Spark. Undergrowth leads (6 / 4) rather than Ape so the tier pays Venom from two
  // nodes — the Stinger's gate shard and a Rapier lane — not Anvil from four.
  { 'jungle-undergrowth': 0.60, 'jungle-ape': 0.40 },
  { 'jungle-ape': 0.45, 'jungle-undergrowth': 0.45, 'jungle-stalker': 0.10 },
  { 'jungle-ape': 0.34, 'jungle-undergrowth': 0.33, 'jungle-stalker': 0.33 },
];

/** Two-way: Desert's Stalker family fields no T2 member (T3+ only). */
const DESERT_T2_BLENDS: readonly NodeBlend[] = [
  { 'desert-basilisk': 0.70, 'desert-scorpion': 0.30 },
  { 'desert-scorpion': 0.70, 'desert-basilisk': 0.30 },
  { 'desert-basilisk': 0.60, 'desert-scorpion': 0.40 },
  { 'desert-scorpion': 0.60, 'desert-basilisk': 0.40 },
  { 'desert-basilisk': 0.50, 'desert-scorpion': 0.50 },
];

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
  blends: {
    forest: FOREST_T2_BLENDS,
    plains: PLAINS_T2_BLENDS,
    mountain: MOUNTAIN_T2_BLENDS,
    cave: CAVE_T2_BLENDS,
    swamp: SWAMP_T2_BLENDS,
    jungle: JUNGLE_T2_BLENDS,
    desert: DESERT_T2_BLENDS,
  },
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
      displayName: resolveSanctuaryNodeDisplayName(2),
      map: { row: 4, col: 9 },
      kind: 'sanctuary',
      biomeGroup: 'sanctuary',
      mobDensity: 0,
      featureSetId: 'sanctuary',
      featureVariant: 2,
    },
  ],
});
