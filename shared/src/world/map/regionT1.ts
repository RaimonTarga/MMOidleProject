import type { NodeBlend } from '../../data/families';
import { buildRegionNodes } from './authoring';

/**
 * T1 node blends (design §12, Phase 2a; re-cut in Phase 2b, 2026-10-01).
 *
 * Each normal node is a share vector over its biome's three families, and the
 * LIST IS THE NODE COUNT for that biome — it took that job from the modifier
 * list, so a list's length is welded to the hand-cut mask below. See the warning
 * on `RegionAuthoringInput.blends`.
 *
 * Three families per biome give three shapes that each read as one dominant
 * family, plus a two-family node and an even one, for an even five per biome.
 * Cave and Swamp used to carry a sixth node because their native modifier
 * earned them an extra one; Phase 2b deleted the `modifier` field from every
 * T1 node (cosmetic only — shard granting is family-keyed, not modifier-keyed)
 * and re-cut the mask from 27 to 25 normal cells to match, trimming both
 * blend lists to five entries (dropped each one's sixth/most-skewed entry).
 *
 * Shares are authored so the dominant family is unambiguous, except in the
 * deliberate 45/45 pair where the tie breaks in family-table order.
 *
 * ORDER IS DISTANCE (T1 entry pressure, 2026-10-02). Index N is cell -0(N+1), and a
 * cell's id comes from the procedural territory growth, so it carries no position at
 * all. The order that matters is the one a player meets the cells in: the nearest
 * UNCLEARED node from wherever they are standing, repeatedly (`resolveNodeCandidates`,
 * and `tutorialNodeFor` for the guide). Each T1 biome therefore puts its two MIXED
 * blends on the first two arrivals and its three 70/20/10 pures on the rest, mildest
 * first, so no sanctuary-adjacent node opens with a biome's worst concentration. Each
 * list below records its own arrival order.
 *
 * Arrival orders are the bot's (nearest uncleared by BFS over `worldNodeExits`, ties
 * N > S > E > W), from where the T1 routes and the guide ENTER the biome: they walk
 * Plains > Forest > Swamp > Mountain > Cave (`T1_PROGRESSION_ORDER`, `T1_BIOME_ORDER`).
 * For Plains, Forest and Mountain that order is the same from the Clearing. The guide
 * breaks hop ties alphabetically instead (`tutorialNodeFor`), which differs only at
 * Forest's second arrival (03, not 05) and for a Swamp entered from the Clearing.
 * Cave's order is not curated yet (it is entered from the Mountain, and its two
 * mixed blends happen to arrive first by the bot's rule).
 *
 * The order also decides each node's SHARD (design §24.3: a node pays its dominant
 * family's shard), so a reorder is a currency move — re-run every test that reads
 * blends, families or spawns (review B5), not only this region's.
 *
 * ⚠ KNOWN GAP (Phase 2a): the T1 monster pools field only one or two of each
 * biome's three families — the rest of each family's mobs are authored into the
 * T2/T3 pools of the same biome. Spawning therefore resolves a blend against the
 * node's own tier pool and re-scales the shares over what it can actually field
 * (`resolveNodeBlend`). These authored blends are the design target; they become
 * fully visible once the T1 pools grow a mob for the missing family.
 */
// Arrives 05 > 02 > 01 > 03 > 04. Pures outward: herd (a charge you can walk out
// of), sky, then swarm — the most bodies at once — last.
const PLAINS_BLENDS: readonly NodeBlend[] = [
  { 'plains-herd': 0.70, 'plains-swarm': 0.20, 'plains-sky': 0.10 },  // 01, 3rd
  { 'plains-herd': 0.45, 'plains-swarm': 0.45, 'plains-sky': 0.10 },  // 02, 2nd
  { 'plains-sky': 0.70, 'plains-herd': 0.20, 'plains-swarm': 0.10 },  // 03, 4th
  { 'plains-swarm': 0.70, 'plains-sky': 0.20, 'plains-herd': 0.10 },  // 04, 5th
  { 'plains-herd': 0.34, 'plains-swarm': 0.33, 'plains-sky': 0.33 },  // 05, 1st
];

// Arrives 04 > 05 > 03 > 02 > 01. Pures outward: canopy (a rooted ranged lobber),
// grove, then pack last — a Pack pick fields three bodies, so a 70% pack node is the
// heaviest concurrency in T1.
const FOREST_BLENDS: readonly NodeBlend[] = [
  { 'forest-pack': 0.70, 'forest-grove': 0.20, 'forest-canopy': 0.10 },   // 01, 5th
  { 'forest-grove': 0.70, 'forest-canopy': 0.20, 'forest-pack': 0.10 },   // 02, 4th
  { 'forest-canopy': 0.70, 'forest-pack': 0.20, 'forest-grove': 0.10 },   // 03, 3rd
  { 'forest-pack': 0.34, 'forest-grove': 0.33, 'forest-canopy': 0.33 },   // 04, 1st
  { 'forest-pack': 0.45, 'forest-grove': 0.45, 'forest-canopy': 0.10 },   // 05, 2nd
];

// Arrives 05 > 02 > 03 > 04 > 01. Pures outward: crag (slow, plated, walk-away-able),
// hopper, then ridge last — Power Shot is the scariest single hit in T1 and the
// archer/hopper pair is this biome's documented entry wall.
const MOUNTAIN_BLENDS: readonly NodeBlend[] = [
  { 'mountain-ridge': 0.70, 'mountain-hopper': 0.20, 'mountain-crag': 0.10 }, // 01, 5th
  { 'mountain-crag': 0.45, 'mountain-ridge': 0.45, 'mountain-hopper': 0.10 }, // 02, 2nd
  { 'mountain-crag': 0.70, 'mountain-ridge': 0.20, 'mountain-hopper': 0.10 }, // 03, 3rd
  { 'mountain-hopper': 0.70, 'mountain-crag': 0.20, 'mountain-ridge': 0.10 }, // 04, 4th
  { 'mountain-crag': 0.34, 'mountain-ridge': 0.33, 'mountain-hopper': 0.33 }, // 05, 1st
];

const CAVE_BLENDS: readonly NodeBlend[] = [
  { 'cave-brood': 0.70, 'cave-brute': 0.20, 'cave-deep': 0.10 },
  { 'cave-brute': 0.70, 'cave-deep': 0.20, 'cave-brood': 0.10 },
  { 'cave-deep': 0.70, 'cave-brood': 0.20, 'cave-brute': 0.10 },
  { 'cave-brood': 0.45, 'cave-brute': 0.45, 'cave-deep': 0.10 },
  { 'cave-brood': 0.34, 'cave-brute': 0.33, 'cave-deep': 0.33 },
];

// Arrives 02 > 01 > 04 > 03 > 05, entered from the Forest (the guide and the T1
// routes come here straight from the Forest leg; bot and guide agree on this order).
// Re-ordered for review P17, which found the first arrival a pure. Pures outward by
// pull radius, the T1 entry-pressure pass's lever: mire (Ooze, 165, slow, the
// baseline poison), stalker (Toad, 180), then coven last — the Hexer is ranged with
// the widest pull (210) and a telegraphed slow. From the CLEARING (a respawn) the
// order is 03 > 04 > 05 > 01 > 02 (guide: 03 > 02 > 01 > 04 > 05), so a walk back
// from a death meets the pures first; 03 is the mildest-but-one of them.
const SWAMP_BLENDS: readonly NodeBlend[] = [
  { 'swamp-mire': 0.45, 'swamp-coven': 0.45, 'swamp-stalker': 0.10 },     // 01, 2nd
  { 'swamp-mire': 0.34, 'swamp-coven': 0.33, 'swamp-stalker': 0.33 },     // 02, 1st
  { 'swamp-stalker': 0.70, 'swamp-mire': 0.20, 'swamp-coven': 0.10 },     // 03, 4th
  { 'swamp-mire': 0.70, 'swamp-coven': 0.20, 'swamp-stalker': 0.10 },     // 04, 3rd
  { 'swamp-coven': 0.70, 'swamp-stalker': 0.20, 'swamp-mire': 0.10 },     // 05, 5th
];

export const REGION_T1_NODES = buildRegionNodes({
  regionId: 't1',
  tier: 1,
  origin: { row: 2, col: 2 },
  mask: [
    '.####.',
    '######',
    '####.#',
    '######',
    '####..',
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
  // Phase 2b (2026-10-01): T1 is the one region whose blended nodes drop the
  // vestigial `modifier` field outright. T2's own blends (regionT2.ts) stay
  // dual-authored for now -- see `RegionAuthoringInput.dropsModifier`.
  dropsModifier: true,
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
