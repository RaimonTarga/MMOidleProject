import type { NodeBlend } from '../../data/families';
import { buildRegionNodes } from './authoring';

/**
 * T1 node blends (design §12, Phase 2a; re-cut in Phase 2b, 2026-10-01; ROSTERS
 * since the legibility run, design §26.3, 2026-10-05).
 *
 * Each normal node is a share vector over its biome's families, and the LIST IS THE
 * NODE COUNT for that biome — it took that job from the modifier list, so a list's
 * length is welded to the hand-cut mask below. See the warning on
 * `RegionAuthoringInput.blends`. Five per biome, 25 in all; the roster pass changed
 * shares only, never the count or an id.
 *
 * NODES ARE ROSTERS, NOT PROPORTIONS (design §26.3). A 70/20/10 node and a 45/45/10
 * node were indistinguishable by eye, so every T1 normal node fields its dominant
 * family and AT MOST ONE guest family, and reads as the bodies in front of the
 * player. Three shapes, nothing else:
 *
 *   pure        { A: 1 }                    one family — the cleanest territory.
 *   pair        { A: 0.7, B: 0.3 }          the dominant and one guest: seven and
 *                                           three per ten spawns (spawning cycles
 *                                           exact tenths, `blendSpawnCycle`).
 *               { A: 0.6, B: 0.4 }          a DOOR pair (the first two arrivals).
 *   crossroads  { A: .34, B: .33, C: .33 }  all three families, one per biome.
 *
 * Every node is its dominant family's territory (design §24.3, `nodeFamily`), so a
 * reshape is a territory move. The roster pass kept every node's dominant except
 * `node-t1-mountain-03` (Crag → Ridge): Ridge's only territory became the
 * crossroads, and every family of a biome leads at least one node that is not the
 * crossroads (`nodeRosters.test.ts`), so each family keeps a home of its own.
 *
 * THE CROSSROADS is the cell the dungeon is entered from, the last normal node
 * before the boss: in every biome the -01 cell (Mountain and Cave each have two
 * cells on their dungeon; the crossroads is the one met last). It fields all three
 * families at near-equal shares, so a player meets the whole biome once before the
 * fight. PROVISIONAL (legibility run, §26.3 open): it is the territory of the
 * family that leads it by a hair (0.34), chosen as the family the cell led before
 * the roster pass so no crossroads changed territory.
 *
 * ORDER IS DISTANCE (T1 entry pressure, 2026-10-02). Index N is cell -0(N+1), and a
 * cell's id comes from the procedural territory growth, so it carries no position at
 * all. The order that matters is the one a player meets the cells in: the nearest
 * UNCLEARED node from wherever they are standing, repeatedly (`resolveNodeCandidates`,
 * and `tutorialNodeFor` for the guide). The entry-pressure pass put each biome's
 * MIXED blends on the first two arrivals (its DOORS) and its pures outward, mildest
 * first, so no sanctuary-adjacent node opens with a biome's worst concentration. In
 * roster form a door is a pair or the crossroads, never a pure, and no door's leader
 * takes more than six spawns in ten. PROVISIONAL (legibility run): the 60/40 door
 * split is what keeps "no door is concentrated" without a near-even split. Outward
 * nodes are pures and 70/30 pairs, and a biome's heaviest family is never a pure.
 * Each list below records its own arrival order.
 *
 * Arrival orders are the bot's (nearest uncleared by BFS over `worldNodeExits`, ties
 * N > S > E > W), from where the T1 routes and the guide ENTER the biome: they walk
 * Plains > Forest > Swamp > Mountain > Cave (`T1_PROGRESSION_ORDER`, `T1_BIOME_ORDER`).
 * For Plains, Forest and Mountain that order is the same from the Clearing. The guide
 * breaks hop ties alphabetically instead (`tutorialNodeFor`), which differs only at
 * Forest's second arrival (03, not 05) and for a Swamp entered from the Clearing.
 *
 * The order also decides each node's TERRITORY (design §24.3: a node is its
 * dominant family's), so a reorder is a territory move — re-run every test that
 * reads blends, families or spawns (review B5), not only this region's.
 *
 * Every family named here has a body in its biome's T1 pool (the third-mob close-out,
 * 2026-10-01), so every T1 blend resolves exactly as authored (`resolveNodeBlend`).
 * Each family fields exactly one T1 mob, so a pure node is one kind of body.
 */
// Arrives 05 > 02 > 01 > 03 > 04 (from the Clearing). Herd (a charge you can walk out
// of) leads both doors, with a different guest at each; the crossroads is the dungeon
// cell; outward the pure sky, then swarm — the most bodies at once, so never a pure —
// last, at the seven in ten it had before.
const PLAINS_BLENDS: readonly NodeBlend[] = [
  { 'plains-herd': 0.34, 'plains-swarm': 0.33, 'plains-sky': 0.33 },  // 01, 3rd — crossroads
  { 'plains-herd': 0.60, 'plains-swarm': 0.40 },                      // 02, 2nd — door
  { 'plains-sky': 1 },                                                // 03, 4th
  { 'plains-swarm': 0.70, 'plains-sky': 0.30 },                       // 04, 5th
  { 'plains-herd': 0.60, 'plains-sky': 0.40 },                        // 05, 1st — door
];

// Arrives 04 > 05 > 03 > 02 > 01. Pack leads both doors (it led both before the
// roster pass), each with a milder guest: canopy (a rooted ranged lobber) at the
// first, grove at the second. A Pack pick fields three bodies, the heaviest
// concurrency in T1, so the Pack is never a pure; its old 70% cell is now the
// crossroads. Pures outward: canopy, then grove.
const FOREST_BLENDS: readonly NodeBlend[] = [
  { 'forest-pack': 0.34, 'forest-grove': 0.33, 'forest-canopy': 0.33 },   // 01, 5th — crossroads
  { 'forest-grove': 1 },                                                  // 02, 4th
  { 'forest-canopy': 1 },                                                 // 03, 3rd
  { 'forest-pack': 0.60, 'forest-canopy': 0.40 },                         // 04, 1st — door
  { 'forest-pack': 0.60, 'forest-grove': 0.40 },                          // 05, 2nd — door
];

// Arrives 05 > 02 > 03 > 04 > 01. Crag (slow, plated, walk-away-able) leads both
// doors, each with one half of the archer/hopper pair — the biome's documented entry
// wall — as its guest. Ridge (Power Shot, the scariest single hit in T1) is never a
// pure: its territory is 03, the old ridge-70 cell's composition (seven archers,
// three hoppers) moved off the dungeon cell, which became the crossroads. 03 moved
// Crag → Ridge for that, the roster pass's one change of currency (Anvil → Shackle).
const MOUNTAIN_BLENDS: readonly NodeBlend[] = [
  { 'mountain-ridge': 0.34, 'mountain-crag': 0.33, 'mountain-hopper': 0.33 }, // 01, 5th — crossroads
  { 'mountain-crag': 0.60, 'mountain-ridge': 0.40 },                         // 02, 2nd — door
  { 'mountain-ridge': 0.70, 'mountain-hopper': 0.30 },                       // 03, 3rd
  { 'mountain-hopper': 1 },                                                  // 04, 4th
  { 'mountain-crag': 0.60, 'mountain-hopper': 0.40 },                        // 05, 1st — door
];

// Arrives 05 > 04 > 03 > 02 > 01 (from mountain-04/05 and the Clearing; 04 > 05 from
// the other Mountain cells). Brood (the light spiderlings) leads both doors. The
// Brute, the patrolling heavy-hitter elite, is never a pure and is a guest at one
// door only, at the four in ten the old 45/45 door gave it.
const CAVE_BLENDS: readonly NodeBlend[] = [
  { 'cave-brood': 0.34, 'cave-brute': 0.33, 'cave-deep': 0.33 },  // 01, 5th — crossroads
  { 'cave-brute': 0.70, 'cave-deep': 0.30 },                      // 02, 4th
  { 'cave-deep': 1 },                                             // 03, 3rd
  { 'cave-brood': 0.60, 'cave-brute': 0.40 },                     // 04, 2nd — door
  { 'cave-brood': 0.60, 'cave-deep': 0.40 },                      // 05, 1st — door
];

// Arrives 02 > 01 > 04 > 03 > 05, entered from the Forest (the guide and the T1
// routes come here straight from the Forest leg; bot and guide agree on this order).
// The dungeon cell (01) is the second arrival, so here the crossroads is a door.
// Pures outward by pull radius, the T1 entry-pressure pass's lever: mire (Ooze, 165,
// slow, the baseline poison), stalker (Toad, 180), then coven last — the Hexer is
// ranged with the widest pull (210) and a telegraphed slow, so the Coven is never a
// pure. From the CLEARING (a respawn) the order is 03 > 04 > 05 > 01 > 02, so a walk
// back from a death meets the pure Stalker first, the mildest-but-one family.
const SWAMP_BLENDS: readonly NodeBlend[] = [
  { 'swamp-mire': 0.34, 'swamp-coven': 0.33, 'swamp-stalker': 0.33 },     // 01, 2nd — crossroads
  { 'swamp-mire': 0.60, 'swamp-stalker': 0.40 },                          // 02, 1st — door
  { 'swamp-stalker': 1 },                                                 // 03, 4th
  { 'swamp-mire': 0.70, 'swamp-coven': 0.30 },                            // 04, 3rd
  { 'swamp-coven': 0.70, 'swamp-stalker': 0.30 },                         // 05, 5th
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
