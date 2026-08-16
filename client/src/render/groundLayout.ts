import {
  GAME_CONFIG,
  NODE_BIOMES,
  getForestPaths,
  getMountainPasses,
  getCavePatrols,
  getCaveRitualSite,
  caveRitualPoint,
  getDesertTracks,
  JUNGLE_CLEARING_R,
  getTundraLakes,
  RESOLVED_NODE_FEATURES,
  getNodeTrees,
  type NodeFeatureShape,
} from '@mmo-idle/shared';

/**
 * Deterministic per-node ground layout: which parts of a node are "dirt"
 * (the upper Wang material) versus base ground. This is the single source of
 * truth for that shape — the Wang autotiler renders it, and the biome-decor
 * scatter reads it so props can react to it (e.g. grass tufts avoiding bare
 * dirt). Everything here is pure and world-space (node pixels), so it stays
 * renderer-agnostic and stable across sessions.
 *
 * The system is biome-agnostic: a layout is a weighted set of named PATTERNS
 * (loose path to center, off-center patch, ring path, plain scatter), and each
 * biome config just picks its own mix and size parameters. Adding a biome is a
 * config entry; adding a new shape is one generator function.
 */

export interface DirtDisc {
  x: number;
  y: number;
  r: number;
  /**
   * Per-disc multiplier on the biome's `edgeJitter`, default 1.
   *
   * The autotiler wobbles every corner test by up to `edgeJitter` CELLS, which is what
   * keeps a patch of dirt from reading as a stamped circle. On a blob that is free
   * character; on a thin line it is destruction. Desert's jitter is 1.4 cells (90 world
   * px) against a road barely 2 cells wide, so the road painted as a smudge with a
   * speckled fringe instead of a line.
   *
   * A LINE needs a crisp edge to read as deliberate, and a BLOB needs a ragged one to
   * read as natural. Both live in the same layout, so the scale is per disc rather than
   * per biome — a desert node keeps organically-edged wind pockets and a legible road at
   * the same time, and no already-reviewed biome changes, because absent means 1.
   */
  jitter?: number;
}

export interface GroundLayout {
  /** Which upper material this node paints (selects the Wang sheet). */
  material: string;
  discs: DirtDisc[];
  /**
   * Inverted layouts paint the UPPER material as the dominant ground and the
   * discs as pockets of the lower/base material (e.g. jungle: overgrowth
   * everywhere, discs = open floor clearings).
   */
  invert: boolean;
  /** Coarse world-space upper-material test (no per-tile edge wobble). */
  isDirt: (x: number, y: number) => boolean;
  /**
   * Whether a point is inside one of the layout's discs, IGNORING `invert`.
   *
   * `isDirt` answers "which material paints here", which flips under inversion. Callers
   * that care about the SHAPE rather than the material need this instead — the dungeon
   * court is the disc whether the node paints it as the upper material or as a pocket of
   * the base one. Asking `isDirt` there meant that on an inverted dungeon (jungle, and
   * now scree mountain) every point outside the court read as "arena floor", and the
   * decor scatter rejected the entire node.
   */
  inDisc: (x: number, y: number) => boolean;
}

export type DirtPatternName =
  | 'loose-center-path'
  | 'off-center-patch'
  | 'ring-path'
  | 'scatter'
  | 'sparse-scatter'
  | 'hub-plaza'
  | 'dungeon-court'
  | 'forest-paths'
  | 'mountain-pass'
  | 'cave-patrol'
  | 'cave-ritual'
  | 'desert-track'
  | 'desert-dungeon-road'
  | 'jungle-clearing'
  | 'tundra-lakes'
  | 'ash-drift'
  | 'tree-canopy'
  | 'plain';

/**
 * A ground STYLE pairs an upper material (one Wang sheet, see render/wangGround.ts)
 * with the dirt patterns that suit it. One style is picked per node, weighted-
 * deterministically by nodeId — a node never mixes two sheets, because each
 * sheet's base tile is an independent generation and mixing them would leave
 * visible square seams around every patch.
 */
export interface GroundStyleConfig {
  material: string;
  weight: number;
  /** One pattern is picked per node, weighted-deterministically by nodeId. */
  patterns: Array<{ pattern: DirtPatternName; weight: number }>;
  /** See GroundLayout.invert: discs become pockets of the BASE material. */
  invert?: boolean;
  /**
   * Route the discs AROUND this node's authored features instead of letting them
   * land on top.
   *
   * Only meaningful where a feature is dressed by its own art and the ground is
   * supposed to stay out of its way — jungle, where the discs are open floor and
   * the features are bush thickets, so an overlap paints walkable-looking ground
   * inside a slow/conceal/ambush zone. Deliberately OFF elsewhere: swamp rot
   * pools are painted BY the functional Wang sheet and need the ground to cover
   * them, not dodge them.
   */
  avoidsFeatures?: boolean;
}

export const GROUND_LAYOUTS: Partial<Record<string, GroundStyleConfig[]>> = {
  plains: [
    {
      material: 'dirt',
      weight: 1,
      patterns: [
        { pattern: 'loose-center-path', weight: 4 },
        { pattern: 'off-center-patch', weight: 3 },
        { pattern: 'ring-path', weight: 2 },
        { pattern: 'scatter', weight: 1 },
      ],
    },
  ],
  // The Clearing is the single T0 hub node: worn paving reinforces the
  // civilized/sanctuary read, laid out as a fixed plaza under the rune altar.
  clearing: [
    {
      material: 'paving',
      weight: 1,
      patterns: [{ pattern: 'hub-plaza', weight: 1 }],
    },
  ],
  // Regional sanctuaries deliberately reuse the Clearing's calm paved plaza.
  sanctuary: [
    {
      material: 'paving',
      weight: 1,
      patterns: [{ pattern: 'hub-plaza', weight: 1 }],
    },
  ],
  // Forest undergrowth pools under the tree clusters (the trees are the
  // authoritative shared layout; the ground follows them, not the other way
  // around). The light-undergrowth sheet stays a bake-off alternate.
  forest: [
    {
      material: 'heavy-foliage',
      weight: 1,
      patterns: [{ pattern: 'tree-canopy', weight: 1 }],
    },
  ],
  // Caverns is the first biome to carry MORE THAN ONE ground style, so the floor
  // material itself changes from node to node rather than only the patch layout.
  // Both sheets were generated and accepted long ago; rubble was simply never wired
  // past the developer bake-off. Patrol path stays dominant — it is the canonical
  // cavern read — with rubble as the rougher, less-travelled minority.
  // Cave has ONE sheet, and it is the patrol path: its base is dark cave stone and its
  // upper is brown worn earth, so the upper material literally IS the route. That is why
  // the pattern, not the material, carries the patrolled/wild distinction here — a
  // patrolled cave has the beat worn into its floor and a wild one is unbroken stone.
  //
  // The `rubble` sheet was wired as a second material in the caverns pass and is REMOVED
  // again: both of its halves are near-black, so the autotiling between them is invisible
  // and it renders as a flat dark slab. It stays in the bake-off list marked broken.
  cave: [
    {
      material: 'patrol-path',
      weight: 1,
      patterns: [{ pattern: 'cave-patrol', weight: 1 }],
    },
  ],
  // Mountain paints the ROUTE. Both styles use the same generated pass layout — the
  // ground worn through the gaps in the ledge rings — so the floor tells you where the
  // way up is before you have found it. The two sheets read it in opposite directions,
  // because their upper materials mean opposite things:
  //
  //  - `stone`'s upper is pale cracked flagstone, which IS a trodden surface, so the
  //    passes paint it over the dark mottled base.
  //  - `scree`'s upper is loose pebble wash, which is the opposite of a path. That style
  //    inverts: scree covers the node and the passes wear back down to smooth bedrock.
  //
  // The blocking ledges themselves stay independent overlays, never a Wang material.
  mountain: [
    {
      material: 'stone',
      weight: 3,
      patterns: [{ pattern: 'mountain-pass', weight: 1 }],
    },
    {
      material: 'scree',
      weight: 2,
      patterns: [{ pattern: 'mountain-pass', weight: 1 }],
      invert: true,
    },
  ],
  swamp: [
    {
      material: 'reeds',
      weight: 1,
      patterns: [
        { pattern: 'scatter', weight: 3 },
        { pattern: 'off-center-patch', weight: 2 },
        { pattern: 'ring-path', weight: 1 },
      ],
    },
  ],
  // Open standoff biome: broad unbroken sand, hardpan only shows in rare
  // wind-stripped pockets.
  //
  // A minority of nodes additionally carry a caravan TRACK, decided in
  // `shared/world/desertTracks.ts` (the rock formations there are collision, so the
  // route cannot be a renderer-local decision). When a node has one it overrides the
  // pattern roll below; the rest keep the sparse pockets exactly as before. Hardpan is
  // the scoured material either way, so the same sheet reads as "wind stripped the sand
  // off here" for both a pocket and a road.
  desert: [
    {
      material: 'hardpan',
      weight: 1,
      patterns: [
        { pattern: 'sparse-scatter', weight: 4 },
        { pattern: 'off-center-patch', weight: 1 },
      ],
    },
  ],
  // Ambush biome, INVERTED: overgrowth is the dominant ground and the discs
  // are the open-floor clearings and trails cut through it.
  jungle: [
    {
      material: 'overgrowth',
      weight: 1,
      invert: true,
      // The open floor is the SAFE LANE the ambush ecology is read against, so
      // it has to thread between the thickets rather than through them.
      avoidsFeatures: true,
      patterns: [
        { pattern: 'off-center-patch', weight: 3 },
        { pattern: 'loose-center-path', weight: 2 },
        { pattern: 'scatter', weight: 2 },
      ],
    },
  ],
  // The ice is a FROZEN LAKE, not a rash of patches. One or two big sheets, generated in
  // `shared/world/tundraLakes.ts` because the trees (collision, server-side) and the props
  // both have to keep off them — a tree growing out of a lake was the tell that the ice was
  // renderer-only state nothing else could see.
  tundra: [
    {
      material: 'ice',
      weight: 1,
      patterns: [{ pattern: 'tundra-lakes', weight: 1 }],
    },
  ],
  // Ventless volcanic nodes render plain basalt: the sheet's lava upper is a
  // FUNCTIONAL hazard material reserved for the lava-vent nodes (see the
  // functional config in wangGround.ts) — decorative lava would telegraph a
  // hazard that isn't there.
  volcanic: [
    {
      material: 'lava',
      weight: 1,
      patterns: [{ pattern: 'plain', weight: 1 }],
    },
  ],
  trench: [
    {
      material: 'biolume',
      weight: 1,
      patterns: [
        { pattern: 'scatter', weight: 3 },
        { pattern: 'off-center-patch', weight: 2 },
        { pattern: 'ring-path', weight: 1 },
      ],
    },
  ],
  // Wasteland art (biomeGroup id is still 'graveyard'): drifted ash banks over dead earth.
  //
  // NO path pattern. `loose-center-path` used to take 2/7 of the roll, and on this art it
  // did not read as a road — the ash has no worn-track character, so a trail through it
  // just looked like a patch that happened to be long. The user's call: these are drifts,
  // not routes. `ash-drift` replaces the generic patterns with lobed banks that vary in
  // size and count per node, which is where the variation went instead.
  graveyard: [
    {
      material: 'ash',
      weight: 1,
      patterns: [{ pattern: 'ash-drift', weight: 1 }],
    },
  ],
};

export function hashString(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Rng = () => number;

const range = (rng: Rng, min: number, max: number): number => min + rng() * (max - min);

/** A few unclustered small patches — background texture used by every pattern. */
function scatterDiscs(rng: Rng, W: number, H: number, count: number, rMin: number, rMax: number): DirtDisc[] {
  const out: DirtDisc[] = [];
  for (let i = 0; i < count; i++) {
    out.push({ x: rng() * W, y: rng() * H, r: range(rng, rMin, rMax) });
  }
  return out;
}

/**
 * Stamps of dirt along a straight line, deliberately broken: over-spaced steps,
 * perpendicular drift, and a skip chance keep the trail readable as a worn path
 * without ever becoming a continuous ribbon.
 */
function looseTrail(rng: Rng, x0: number, y0: number, x1: number, y1: number): DirtDisc[] {
  const out: DirtDisc[] = [];
  const dx = x1 - x0;
  const dy = y1 - y0;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return out;
  const nx = -dy / dist;
  const ny = dx / dist;
  let t = range(rng, 60, 160);
  while (t < dist) {
    if (rng() > 0.3) {
      const drift = range(rng, -85, 85);
      out.push({
        x: x0 + (dx * t) / dist + nx * drift,
        y: y0 + (dy * t) / dist + ny * drift,
        r: range(rng, 85, 150),
      });
    }
    t += range(rng, 150, 270);
  }
  return out;
}

/** Random point on the node border rectangle, a little inside the true edge. */
function edgePoint(rng: Rng, W: number, H: number): { x: number; y: number } {
  const along = range(rng, 0.15, 0.85);
  switch (Math.floor(rng() * 4)) {
    case 0: return { x: along * W, y: 0 };
    case 1: return { x: along * W, y: H };
    case 2: return { x: 0, y: along * H };
    default: return { x: W, y: along * H };
  }
}

/** Big central patch plus a loose, broken trail in from a random node edge. */
function looseCenterPath(rng: Rng, W: number, H: number): DirtDisc[] {
  const cx = W / 2 + range(rng, -90, 90);
  const cy = H / 2 + range(rng, -90, 90);
  const centerR = range(rng, 260, 380);
  const start = edgePoint(rng, W, H);
  return [
    { x: cx, y: cy, r: centerR },
    ...looseTrail(rng, start.x, start.y, cx, cy),
    ...scatterDiscs(rng, W, H, 2, 70, 120),
  ];
}

/**
 * The big patch pushed away from center, with satellite crumbs around its rim
 * so the edge reads as eroded rather than stamped.
 */
function offCenterPatch(rng: Rng, W: number, H: number): DirtDisc[] {
  const angle = rng() * Math.PI * 2;
  const mag = range(rng, 380, 620);
  const r = range(rng, 300, 420);
  const margin = r * 0.5;
  const x = Math.min(W - margin, Math.max(margin, W / 2 + Math.cos(angle) * mag));
  const y = Math.min(H - margin, Math.max(margin, H / 2 + Math.sin(angle) * mag));
  const out: DirtDisc[] = [{ x, y, r }];
  const satellites = 2 + Math.floor(rng() * 2);
  for (let i = 0; i < satellites; i++) {
    const a = rng() * Math.PI * 2;
    const d = r * range(rng, 1.1, 1.6);
    out.push({ x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, r: range(rng, 100, 160) });
  }
  out.push(...scatterDiscs(rng, W, H, 3, 80, 150));
  return out;
}

/** A broken circular trail around the node center, like a walked patrol loop. */
function ringPath(rng: Rng, W: number, H: number): DirtDisc[] {
  const cx = W / 2 + range(rng, -60, 60);
  const cy = H / 2 + range(rng, -60, 60);
  const R = range(rng, 620, 780);
  const spacing = range(rng, 210, 290);
  const steps = Math.max(6, Math.round((2 * Math.PI * R) / spacing));
  const phase = rng() * Math.PI * 2;
  const out: DirtDisc[] = [];
  for (let i = 0; i < steps; i++) {
    if (rng() < 0.25) continue;
    const a = phase + (i / steps) * Math.PI * 2;
    const rr = R + range(rng, -70, 70);
    out.push({ x: cx + Math.cos(a) * rr, y: cy + Math.sin(a) * rr, r: range(rng, 90, 150) });
  }
  if (rng() < 0.5) out.push({ x: cx, y: cy, r: range(rng, 140, 200) });
  return out;
}

/**
 * Fixed plaza for the Clearing and sanctuary hubs: a paved apron under the rune
 * altar (which NODE_FEATURES pins at (W/2, H/2 - 320)) flowing into the spawn
 * point at node center, plus a loose walked-in trail and a few crumbs.
 */
/**
 * One paved road from the plaza out to a node edge.
 *
 * Deliberately NOT `looseTrail`: that drops ~30% of its segments to read as an
 * organic game trail, which is right for a worn path through the wild and wrong
 * here. The hub's four roads are the motif the whole node is built around, and a
 * gap in one reads as a mistake rather than as character. Segments overlap, so the
 * road is continuous; the waver keeps it from looking CAD-drawn.
 */
function plazaRoad(
  rng: Rng,
  cx: number,
  cy: number,
  dirX: number,
  dirY: number,
  startAt: number,
  reach: number,
  width: number,
): DirtDisc[] {
  const out: DirtDisc[] = [];
  const nx = -dirY;
  const ny = dirX;
  const step = width * 0.7; // < 2r, so consecutive discs always overlap
  for (let t = startAt; t <= reach; t += step) {
    const waver =
      Math.sin(t / (width * 2.6)) * width * 0.3 + range(rng, -width * 0.1, width * 0.1);
    out.push({
      x: cx + dirX * t + nx * waver,
      y: cy + dirY * t + ny * waver,
      r: width * range(rng, 0.46, 0.56),
    });
  }
  return out;
}

/**
 * The hub motif: ONE central plaza holding the rune altar, with four paved roads
 * running to the four cardinal edges. Every hub node (Clearing and all three
 * sanctuaries) has all four cardinal exits, so the roads match real topology
 * rather than being decoration.
 *
 * Previously this was two detached discs plus a single southern trail and three
 * loose scatter blobs — it read as "some paving happened here", not as a plaza.
 * It is now a single round court centred on the altar and the player spawn, and
 * the stray scatter is gone: it diluted the very shape this node is supposed to
 * be legible as.
 *
 * All sizes are fractions of the node so the composition survives a resize.
 */
function hubPlaza(rng: Rng, W: number, H: number): DirtDisc[] {
  const cx = W / 2;
  const cy = H / 2;
  // ONE disc, not two. The altar used to sit north of centre so it would not
  // swallow the player spawn, which forced a second lobe of paving to sit under it
  // and made the court read as a dumbbell. The altar is centred now and the player
  // spawns standing on it, so plaza, altar and spawn share a single centre and the
  // shape can be the simple thing it always wanted to be.
  const plazaR = W * 0.16;
  const roadW = W * 0.055;
  // Start inside the plaza so road and court merge seamlessly; overshoot the edge
  // so the road visibly meets the border instead of stopping short of it.
  const startAt = plazaR * 0.8;
  return [
    { x: cx, y: cy, r: plazaR * range(rng, 0.95, 1.05) },
    ...plazaRoad(rng, cx, cy, 0, -1, startAt, H / 2 + roadW, roadW),
    ...plazaRoad(rng, cx, cy, 0, 1, startAt, H / 2 + roadW, roadW),
    ...plazaRoad(rng, cx, cy, -1, 0, startAt, W / 2 + roadW, roadW),
    ...plazaRoad(rng, cx, cy, 1, 0, startAt, W / 2 + roadW, roadW),
  ];
}

/**
 * Forest trails, read straight off the SHARED layout in `world/forestPaths.ts`.
 *
 * The geometry cannot be generated here: trees are collision and are placed
 * server-side, so the trail has to be decided somewhere both sides can see it. This
 * generator only paints what that module already decided, which is what keeps the
 * painted trail and the gap in the treeline describing the same shape.
 *
 * Used INVERTED — the discs are the bare forest floor of the trail and the heavy
 * foliage is everything else. Same trick jungle uses for its clearings.
 */
function forestPaths(_rng: Rng, _W: number, _H: number, nodeId: string): DirtDisc[] {
  return getForestPaths(nodeId).discs.map((d) => ({ x: d.x, y: d.y, r: d.r }));
}

/** The beat worn into the floor by a cave node's guards, from the shared route layout. */
function cavePatrol(_rng: Rng, _W: number, _H: number, nodeId: string): DirtDisc[] {
  return getCavePatrols(nodeId).discs.map((d) => ({ x: d.x, y: d.y, r: d.r }));
}

/**
 * A cave dungeon's ritual site: the altar court, with approach paths running out along the
 * gaps in the standing-stone ring.
 *
 * This is the one place the "a dungeon is a court and nothing else" rule is relaxed, and
 * deliberately — the spokes are what make the ring read as built rather than as a rockfall
 * that happens to be circular. They run from the court out through the ring, not to the
 * node edge, so the shape still resolves inward on the altar.
 */
function caveRitual(rng: Rng, W: number, H: number, nodeId: string): DirtDisc[] {
  const site = getCaveRitualSite(nodeId);
  const cx = W / 2;
  const cy = H / 2;
  const court = W * 0.115;
  const out: DirtDisc[] = [{ x: cx, y: cy, r: court * range(rng, 0.97, 1.03) }];
  if (!site) return out;
  const reach = site.radius * 1.24;
  const step = W * 0.02;
  for (const angle of site.spokes) {
    for (let t = court * 0.8; t <= reach; t += step) {
      const p = caveRitualPoint(site, angle, t - site.radius);
      out.push({ x: p.x, y: p.y, r: W * 0.019 * range(rng, 0.9, 1.1) });
    }
  }
  return out;
}

/**
 * The passes worn through a mountain node's ledge gaps, from the shared layout that also
 * places the blocking ledges themselves. Keeping both ends on one generator is the whole
 * point: a painted path that misses the gap it is supposed to run through reads worse
 * than no path at all.
 */
function mountainPass(_rng: Rng, _W: number, _H: number, nodeId: string): DirtDisc[] {
  return getMountainPasses(nodeId).map((d) => ({ x: d.x, y: d.y, r: d.r }));
}

/**
 * A desert node's caravan track, from the shared layout the rock formations also clear.
 *
 * The track is joined by one or two of the biome's usual wind-stripped pockets: a node
 * that traded ALL its scoured patches for a road would lose the texture that makes the
 * open pan read as desert rather than as a blank sheet with a line on it.
 */
function desertTrack(rng: Rng, W: number, H: number, nodeId: string): DirtDisc[] {
  const track = getDesertTracks(nodeId).discs.map((d) => ({ x: d.x, y: d.y, r: d.r }));
  return [...track, ...scatterDiscs(rng, W, H, 1 + Math.floor(rng() * 2), 100, 180)];
}

/**
 * Wind-drifted ash banks.
 *
 * Each bank is a CLUSTER of two to four overlapping discs rather than one circle, which is
 * the whole point: a single disc reads as a stamped blob, while overlapping lobes read as
 * something the wind piled up. Sizes run wide (a node may carry one broad bank and three
 * small ones, or five middling ones), because "more variation between nodes" was the entire
 * brief for this biome and the ash is the only ground element it has.
 *
 * No path pattern in the mix at all — see the biome config above.
 */
function ashDrift(rng: Rng, W: number, H: number): DirtDisc[] {
  const out: DirtDisc[] = [];
  const banks = 3 + Math.floor(rng() * 4);
  for (let i = 0; i < banks; i++) {
    const cx = range(rng, W * 0.12, W * 0.88);
    const cy = range(rng, H * 0.12, H * 0.88);
    // Bank scale is drawn per bank, not per node, so one node can hold a broad drift and a
    // couple of small ones at the same time.
    const scale = range(rng, 0.45, 1.35);
    const lobes = 2 + Math.floor(rng() * 3);
    // The lobes walk away from the bank centre rather than scattering around it, so the
    // drift has a direction — the wind came from somewhere.
    const drift = rng() * Math.PI * 2;
    let x = cx;
    let y = cy;
    for (let l = 0; l < lobes; l++) {
      const r = range(rng, 180, 430) * scale;
      out.push({ x, y, r });
      const step = r * range(rng, 0.55, 0.95);
      const wander = drift + range(rng, -0.7, 0.7);
      x += Math.cos(wander) * step;
      y += Math.sin(wander) * step;
    }
  }
  return out;
}

/**
 * A desert dungeon: the arena court, plus the road that arrives at it and stops.
 *
 * The "a dungeon is a court and nothing else" rule is relaxed here the same way it is for
 * a cave ritual site, and for the same kind of reason — the shape has to say what happened
 * on this node. Every other track in the desert is a road going somewhere else; this is
 * the one that arrives, and what it arrives at is the boss. End of the road.
 *
 * The court is generated by the same `dungeonCourt` call every other biome uses, so a
 * desert arena is exactly the size of all the others and the two cannot drift apart.
 */
/**
 * A jungle dungeon: overgrowth running right up to a clearing that was CUT, not found.
 *
 * The layout inverts (jungle always does), so the disc is a pocket of open floor in
 * dominant overgrowth — the shape is already right. What was missing is the EDGE. Every
 * other court gets the Wang autotiler's full `edgeJitter` so its outline reads as worn or
 * eroded, which is correct for an arena that was uncovered and wrong for one that was
 * hacked out with blades. Damping the jitter is what makes the boundary read as a cut
 * line, and it is the same lever the desert road uses for the opposite reason.
 *
 * Slightly larger than the standard court, because the trees ring it: at the standard
 * radius the ring closed in tight enough to read as a wall rather than as a treeline.
 */
function jungleDungeonClearing(rng: Rng, W: number, H: number): DirtDisc[] {
  return [
    {
      x: W / 2,
      y: H / 2,
      r: W * JUNGLE_CLEARING_R * range(rng, 0.98, 1.02),
      jitter: 0.3,
    },
  ];
}

/**
 * A tundra node's frozen lakes, from the shared layout the trees and props keep off.
 *
 * Jitter is damped: a lake freezes to a smooth edge, so the autotiler's full 1.2 cells of
 * per-corner wobble made the shoreline read as a torn patch rather than as ice. Not as hard
 * an edge as the jungle clearing (which was CUT) — a shore is still irregular, just not
 * ragged.
 */
function tundraLakes(_rng: Rng, _W: number, _H: number, nodeId: string): DirtDisc[] {
  return getTundraLakes(nodeId).map((lake) => ({
    x: lake.x,
    y: lake.y,
    r: lake.radius,
    jitter: 0.55,
  }));
}

function desertDungeonRoad(rng: Rng, W: number, H: number, nodeId: string): DirtDisc[] {
  const court = dungeonCourt(rng, W, H);
  const road = getDesertTracks(nodeId).discs.map((d) => ({ x: d.x, y: d.y, r: d.r }));
  return [...court, ...road];
}

/**
 * A dungeon's arena floor: ONE round court at the node centre, under the altar,
 * and nothing anywhere else.
 *
 * Dungeons previously drew whatever their biome's normal pattern rolled — a wandering
 * path, an off-centre patch — so a boss node looked like any other node of its biome.
 * A single centred court makes "this is the arena" legible the moment it is on screen,
 * and reads as constructed rather than worn: no trails, no satellite patches.
 *
 * Sized off the altar it has to seat, so the two cannot drift apart.
 */
function dungeonCourt(rng: Rng, W: number, _H: number): DirtDisc[] {
  const cx = W / 2;
  const cy = _H / 2;
  // Comfortably larger than the altar sprite so the court frames it rather than
  // being hidden under it. The Wang autotiler's edgeJitter ragged-edges this, so a
  // clean circle here still renders with a natural outline.
  const r = W * 0.115;
  return [{ x: cx, y: cy, r: r * range(rng, 0.97, 1.03) }];
}

/**
 * Foliage pooled under each tree of the shared per-node tree layout, so the
 * heavy-undergrowth material reads as the forest floor beneath the canopies
 * and overlapping trees merge into one grove-sized patch. Nodes without trees
 * (shouldn't happen in forest) fall back to plain scatter.
 */
function treeCanopy(rng: Rng, W: number, H: number, nodeId: string): DirtDisc[] {
  const trees = getNodeTrees(nodeId);
  if (trees.length === 0) return scatterDiscs(rng, W, H, 5, 128, 288);
  const out: DirtDisc[] = [];
  for (const tree of trees) {
    out.push({
      x: tree.spriteX + range(rng, -36, 36),
      y: tree.baseY + range(rng, -24, 48),
      r: tree.displaySize * range(rng, 0.34, 0.46),
    });
  }
  out.push(...scatterDiscs(rng, W, H, 2, 80, 140));
  return out;
}

const PATTERN_GENERATORS: Record<
  DirtPatternName,
  (rng: Rng, W: number, H: number, nodeId: string) => DirtDisc[]
> = {
  'loose-center-path': looseCenterPath,
  'off-center-patch': offCenterPatch,
  'ring-path': ringPath,
  scatter: (rng, W, H) => scatterDiscs(rng, W, H, 5, 128, 288),
  // A couple of small pockets — for biomes whose upper material should stay rare.
  'sparse-scatter': (rng, W, H) => scatterDiscs(rng, W, H, 2 + Math.floor(rng() * 2), 100, 180),
  'hub-plaza': hubPlaza,
  'dungeon-court': dungeonCourt,
  'forest-paths': forestPaths,
  'mountain-pass': mountainPass,
  'cave-patrol': cavePatrol,
  'cave-ritual': caveRitual,
  'desert-track': desertTrack,
  'desert-dungeon-road': desertDungeonRoad,
  'jungle-clearing': jungleDungeonClearing,
  'tundra-lakes': tundraLakes,
  'ash-drift': ashDrift,
  'tree-canopy': treeCanopy,
  // Base material only — the whole node stays the sheet's lower tile.
  plain: () => [],
};

function pickWeighted<T extends { weight: number }>(rng: Rng, options: T[]): T {
  let total = 0;
  for (const o of options) total += o.weight;
  let roll = rng() * total;
  for (const o of options) {
    roll -= o.weight;
    if (roll <= 0) return o;
  }
  return options[options.length - 1];
}

/**
 * The deterministic dirt layout for one node, or null when the biome has no
 * layered ground. Cheap enough to recompute on every node repaint.
 */

/** Distance from a point to a feature shape's edge (negative = inside). */
function shapeClearance(shape: NodeFeatureShape, x: number, y: number): number {
  switch (shape.kind) {
    case 'circle':
      return Math.hypot(x - shape.x, y - shape.y) - shape.radius;
    case 'ellipse': {
      // Cheap conservative read: treat it as its larger axis. Ground discs are
      // coarse, so over-avoiding by a few px is invisible and always safe.
      const r = Math.max(shape.halfW, shape.halfH);
      return Math.hypot(x - shape.x, y - shape.y) - r;
    }
    default: {
      const dx = Math.max(Math.abs(x - shape.x) - shape.halfW, 0);
      const dy = Math.max(Math.abs(y - shape.y) - shape.halfH, 0);
      return Math.hypot(dx, dy);
    }
  }
}

/** The centre a shape pushes away from. */
function shapeCentre(shape: NodeFeatureShape): { x: number; y: number } {
  return { x: shape.x, y: shape.y };
}

const FEATURE_CLEAR_PAD = 40;
const MIN_DISC_R = 60;
const RELAX_PASSES = 4;

/**
 * Push ground discs out of the node's authored feature footprints.
 *
 * A post-pass over whatever the pattern generated, rather than a constraint
 * threaded through every generator: the patterns stay pure shape-makers, and
 * there is exactly one place that reasons about features. Discs are PUSHED
 * first and only shrunk or dropped when they cannot be moved clear, so a
 * "path in from the edge" still arrives — it just bends around the thicket
 * instead of vanishing.
 */
function routeDiscsAroundFeatures(
  discs: DirtDisc[],
  nodeId: string,
  W: number,
  H: number,
): DirtDisc[] {
  const shapes = (RESOLVED_NODE_FEATURES[nodeId] ?? []).map((f) => f.shape);
  if (shapes.length === 0) return discs;

  const out: DirtDisc[] = [];
  for (const disc of discs) {
    let { x, y, r } = disc;

    for (let pass = 0; pass < RELAX_PASSES; pass++) {
      let worst: { shape: NodeFeatureShape; overlap: number } | null = null;
      for (const shape of shapes) {
        const overlap = r + FEATURE_CLEAR_PAD - shapeClearance(shape, x, y);
        if (overlap > 0 && (!worst || overlap > worst.overlap)) {
          worst = { shape, overlap };
        }
      }
      if (!worst) break;

      const c = shapeCentre(worst.shape);
      let vx = x - c.x;
      let vy = y - c.y;
      const len = Math.hypot(vx, vy);
      if (len < 1e-3) {
        // Concentric with the thicket — pick a stable direction from the disc's
        // own coordinates so the result stays deterministic across clients.
        vx = 1;
        vy = 0;
      } else {
        vx /= len;
        vy /= len;
      }
      x += vx * worst.overlap;
      y += vy * worst.overlap;

      // A disc shoved past the node edge is worse than a smaller one, so clamp
      // back inside and let the next pass trade radius for fit instead.
      const cx = Math.min(W, Math.max(0, x));
      const cy = Math.min(H, Math.max(0, y));
      if (cx !== x || cy !== y) {
        x = cx;
        y = cy;
        r = Math.max(MIN_DISC_R, r * 0.8);
      }
    }

    // Still buried after relaxing? Shrink to whatever actually fits, and drop it
    // only if even the floor size cannot clear the thicket.
    let clear = Math.min(...shapes.map((sh) => shapeClearance(sh, x, y)));
    if (clear < r + FEATURE_CLEAR_PAD) {
      r = clear - FEATURE_CLEAR_PAD;
    }
    if (r >= MIN_DISC_R) out.push({ x, y, r });
  }

  return out;
}

export function computeGroundLayout(biomeGroup: string, nodeId: string): GroundLayout | null {
  const styles = GROUND_LAYOUTS[biomeGroup];
  if (!styles || styles.length === 0) return null;
  const W = GAME_CONFIG.NODE_WIDTH;
  const H = GAME_CONFIG.NODE_HEIGHT;
  const rng = mulberry32(hashString(`${nodeId}:ground-layout:v1`));
  const style = pickWeighted(rng, styles);
  // A dungeon keeps its biome's ground MATERIAL — a cave dungeon still reads as cave —
  // but its layout is always the arena court, never the biome's wandering patterns.
  //
  // Note this has no effect on swamp or volcanic dungeons: their authored rot pools and
  // lava vents drive a FUNCTIONAL Wang sheet that takes over the whole node, and
  // buildWangGroundLayer discards the decorative layout entirely on those nodes. Their
  // hazard floor is the arena.
  const isDungeon = NODE_BIOMES[nodeId]?.isDungeon === true;
  // A forest node's shape is decided in shared (the trees have to avoid the trail),
  // so when a trail exists it overrides the weighted pattern roll. Nodes that rolled
  // no trail fall through to the canopy pattern exactly as before.
  const hasForestTrail =
    biomeGroup === 'forest' && !isDungeon && getForestPaths(nodeId).shape !== 'none';
  // Cave overrides the weighted STYLE roll, not just the pattern: whether the node is
  // patrolled is decided in shared, and the material reports that rather than choosing it.
  // Whether a cave is held territory is decided in shared (the server has to agree — it
  // assigns the brutes), so it overrides the pattern roll. A wild cave paints `plain`:
  // unbroken cave stone with no worn earth anywhere, which is what makes a beat read as a
  // beat on the nodes that have one.
  const cavePatrolled =
    biomeGroup === 'cave' && !isDungeon ? getCavePatrols(nodeId).patrolled : null;
  // Desert works the way forest does rather than the way cave does: only the MINORITY of
  // nodes that rolled a caravan track override the pattern, and every trackless node falls
  // through to the sparse-pocket roll it has always made. That is deliberate — the roll is
  // untouched, so a desert node without a track renders byte-identical to before this pass.
  const hasDesertTrack =
    biomeGroup === 'desert' && !isDungeon && getDesertTracks(nodeId).shape !== 'none';
  const pattern = isDungeon
    ? biomeGroup === 'cave'
      ? 'cave-ritual'
      : biomeGroup === 'desert'
        ? 'desert-dungeon-road'
        : biomeGroup === 'jungle'
          ? 'jungle-clearing'
          : biomeGroup === 'tundra'
            ? 'tundra-lakes'
            : 'dungeon-court'
    : cavePatrolled === true
      ? 'cave-patrol'
      : cavePatrolled === false
        ? 'plain'
        : hasForestTrail
          ? 'forest-paths'
          : hasDesertTrack
            ? 'desert-track'
            : pickWeighted(rng, style.patterns).pattern;
  const generated = PATTERN_GENERATORS[pattern](rng, W, H, nodeId);
  const discs = style.avoidsFeatures
    ? routeDiscsAroundFeatures(generated, nodeId, W, H)
    : generated;
  // Trails invert the material: foliage becomes the dominant ground and the discs
  // are the bare floor you walk on.
  const invert = hasForestTrail ? true : (style.invert ?? false);
  const inDisc = (x: number, y: number): boolean => {
    for (const d of discs) {
      const dx = x - d.x;
      const dy = y - d.y;
      if (dx * dx + dy * dy < d.r * d.r) return true;
    }
    return false;
  };
  const isDirt = (x: number, y: number): boolean =>
    inDisc(x, y) ? !invert : invert;
  return { material: style.material, discs, invert, isDirt, inDisc };
}
