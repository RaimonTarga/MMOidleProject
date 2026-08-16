import { NODE_BIOMES } from '@mmo-idle/shared';
import { DEPTH } from './depth';

/**
 * Per-node atmosphere wash: a flat colour laid over a node's ground and its
 * dressing, but UNDER every creature.
 *
 * Why an overlay rather than tinting the ground itself: Phaser's `TilemapLayer`
 * does not implement the Tint component (checked against 3.90), and individual
 * `Tile`s expose no tint either — so the ground material cannot be recoloured
 * directly. A depth-banded rectangle is the one approach that works, and it has the
 * side benefit that a single depth value decides exactly what gets washed.
 *
 * It sits above {@link DEPTH.BG_DECOR}, where the ground tilemap, the scattered
 * decor and the feature art (including the rune altar) all render, and far below
 * {@link DEPTH.SPRITE}. So the PLACE shifts colour while players, minions and
 * monsters keep their true palette — which matters in a sanctuary specifically,
 * because that is the node where you stand around inspecting your own gear.
 */
export interface BiomeTint {
  /** Wash colour. */
  color: number;
  /**
   * 0–1, straight alpha blend.
   *
   * Calibration history, because this took three passes to get right:
   *  - 0.13–0.30 read as no effect at all. That turned out to be a WIRING bug (the
   *    active node was never painted), not a value problem — see updateNodeTintForNode.
   *  - Once actually rendering, 0.20–0.34 was still judged too subtle.
   *  - Current values start at 0.32. Treat ~0.30 as the floor for a wash that reads
   *    as deliberate; below that it looks like a rendering artefact rather than mood.
   */
  alpha: number;
}

/** Depth for the wash: over ground + decor + feature art, under all creatures. */
export const TINT_DEPTH = DEPTH.BG_DECOR + 0.5;

/**
 * Tint ramps, keyed `biomeGroup -> biomeTier`.
 *
 * Deliberately tier-indexed rather than node-indexed. The world runs to **eight
 * tiers**, so any progression has to be a gradual ramp with room above the tiers
 * that exist today — T4 is the middle of the arc, not the end of it. Tiers with no
 * entry render untinted, which is how a biome opts out at its base tier.
 *
 * This is also the general mechanism for "a biome shifts as you climb": a T2 plains
 * could take a warm sunset wash while T1 plains stays untouched. Add a biome group
 * here and it works; nothing about this is sanctuary-specific.
 */
export const BIOME_TIER_TINTS: Readonly<
  Record<string, Readonly<Record<number, BiomeTint>>>
> = {
  /**
   * Sanctuaries drift toward the Void as you climb — the last safe ground looking
   * progressively touched by what you are walking toward. The ramp walks hue from
   * cold blue to void violet, ending near the Abyss palette (`0x0a0014`) and the
   * Overlord's signature violet (`0xc44dff`), while alpha climbs in even steps so
   * no single tier is a jump.
   *
   * The Clearing is absent by design: it is tier 0, the mundane world, and the
   * baseline every sanctuary is read against.
   */
  /**
   * Plains stays plain — T1 is untouched, and deliberately so: it is the floor biome
   * and the baseline the rest of the world is read against. T2 takes a low warm wash
   * so the same fields read as late-afternoon rather than as a different place. Kept
   * at the perceptible floor, not above it: this should register as light, not as a
   * colour filter.
   */
  plains: {
    2: { color: 0xc4622a, alpha: 0.32 }, // low sun
  },

  /**
   * Deeper forest as you climb: T1 is ordinary woodland, T2 takes a cool green-blue
   * so the same trees read as older and further in — light filtered through a
   * heavier canopy rather than a different place.
   */
  forest: {
    2: { color: 0x1f6b70, alpha: 0.34 }, // deep canopy teal
  },

  /**
   * Swamp gets DARKER as you descend, rather than shifting hue for its own sake: the
   * water goes from murky green to dead and cold. Unlike plains and forest, tier 1 is
   * tinted too — swamp is meant to read as gloomier than its T1 peers from the first
   * visit, so the wash is biome identity here, not only tier progression.
   */
  swamp: {
    1: { color: 0x24301f, alpha: 0.26 }, // murky green
    2: { color: 0x1b2a28, alpha: 0.36 }, // colder, deeper
    3: { color: 0x131f26, alpha: 0.46 }, // dead water
  },

  /**
   * Mountain climbs into thin air. T1 is untinted bare rock — the same convention plains
   * and forest keep, where the base tier is the honest baseline the ramp is read against
   * — and T2-T4 wash progressively colder and paler, as light thinning out with altitude
   * rather than as a different place.
   *
   * Mountain spans FOUR tiers, more than any biome tinted so far, so the steps are
   * smaller than swamp's three: the arc has to stay gradual across twice the ground and
   * still leave headroom above T4, which is the middle of an eight-tier world.
   */
  mountain: {
    2: { color: 0x7d8f9e, alpha: 0.30 }, // pale cold grey — the air starts to thin
    3: { color: 0x6d8499, alpha: 0.38 }, // colder, bluer
    4: { color: 0x5c7794, alpha: 0.46 }, // high and exposed
  },

  sanctuary: {
    2: { color: 0x2f4f9e, alpha: 0.36 }, // cold blue — barely touched
    3: { color: 0x3d43a4, alpha: 0.41 },
    4: { color: 0x4a2f9e, alpha: 0.46 }, // indigo — unmistakable
    5: { color: 0x5c2fae, alpha: 0.51 },
    6: { color: 0x7132bd, alpha: 0.56 },
    7: { color: 0x8a34c4, alpha: 0.61 }, // violet
    8: { color: 0xa63ad6, alpha: 0.66 }, // the last sanctuary, and it looks it
  },
};

/** Atmosphere wash for a node, or null when the node renders untinted. */
export function nodeTint(nodeId: string): BiomeTint | null {
  const info = NODE_BIOMES[nodeId];
  if (!info) return null;
  return BIOME_TIER_TINTS[info.biomeGroup]?.[info.biomeTier] ?? null;
}

/**
 * The wash expressed as a multiply-tint colour, for objects the overlay cannot reach.
 *
 * The depth-banded rectangle only covers what renders BELOW it — ground and ground
 * decor. Trees do not qualify: their roots draw just under the entities and their
 * canopies draw above them (y-sorted, so the player walks behind a trunk), which puts
 * them either side of any band that excludes creatures. On a forest node the trees are
 * the dominant visual, so leaving them untouched reads as a bug rather than as
 * atmosphere.
 *
 * Phaser Images DO support tint (it is only `TilemapLayer` that does not), so those get
 * tinted directly. `setTint` multiplies rather than alpha-blends, so the colour is
 * pre-mixed from white toward the wash by its alpha — the multiplicative equivalent of
 * laying the same rectangle over them.
 *
 * Returns null when the node is untinted, so callers can skip the work entirely.
 */
const IMAGE_TINT_BOOST = 1.35;

export function nodeTintMultiply(nodeId: string): number | null {
  const tint = nodeTint(nodeId);
  if (!tint) return null;
  // The two paths are not equivalent, and matching their ALPHAS does not match their
  // LOOK. Compositing the overlay gives `base*(1-a) + tint*a`; a multiply tint gives
  // `base * mix/255`. Those agree only where the base is white — on a mid or dark pixel
  // (tree bark, deep foliage) multiply shifts the colour far less, so trees come out
  // visibly under-tinted against ground washed at the same alpha.
  //
  // This boost pulls the multiply path back toward parity. It is an empirical
  // correction, not a derivation: exact parity is impossible because multiply cannot
  // lighten and compositing can.
  const a = Math.min(1, tint.alpha * IMAGE_TINT_BOOST);
  const mix = (channel: number): number =>
    Math.round(255 * (1 - a) + channel * a);
  const r = mix((tint.color >> 16) & 0xff);
  const g = mix((tint.color >> 8) & 0xff);
  const b = mix(tint.color & 0xff);
  return (r << 16) | (g << 8) | b;
}
