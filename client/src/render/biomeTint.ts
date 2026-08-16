import Phaser from 'phaser';
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
  /**
   * How the tint is applied. Default `wash`.
   *
   * - **`wash`** blends toward `color`. It is atmosphere: haze, failing light, cold air.
   *   It also, unavoidably, REDUCES contrast — every pixel moves toward one colour — and
   *   with a dark `color` it darkens everything it touches.
   * - **`saturate`** multiplies by a colour derived from `color`'s HUE, with the hue's
   *   brightest channel left at full. Greens stay green and the competing channels are
   *   cut, so the node reads as more VIVID rather than as shaded. Deeper in the jungle is
   *   not dimmer jungle, it is greener jungle.
   *
   * Modes are per biome so no already-reviewed ramp moves: absent means `wash`.
   */
  mode?: "wash" | "saturate";
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

  /**
   * Cave goes down, not up, and the colour says the ROCK changed rather than only the
   * light. T1 is untinted honest cave stone — the same baseline convention plains, forest
   * and mountain keep — T2 takes a mineral teal that reads as wet stone, and T3 a crystal
   * violet the roster already backs on screen: `deep-spider`, `cavern-troll` and
   * `crystal-gargoyle` all live down there.
   *
   * Three tiers exist today and the ramp leaves headroom, so a T4+ cave can go further
   * violet toward the Abyss palette without rewriting these.
   */
  cave: {
    2: { color: 0x2f6b6b, alpha: 0.32 }, // mineral teal — wet stone
    3: { color: 0x5a3f8c, alpha: 0.44 }, // crystal violet — the deep
  },

  /**
   * Desert has no T1 — it starts at tier 2 — so T2 IS its honest baseline and stays
   * untouched, exactly as plains T1 does. The ramp above it goes hotter and deader: a
   * bleached ochre haze at T3, then dust-red at T4, so the pan reads as somewhere that has
   * been burning for longer rather than as a different desert.
   *
   * Deliberately not cooling toward night: volcanic owns "hotter still", and desert's
   * identity is exposure — long sightlines under a sun that never lets up.
   */
  desert: {
    3: { color: 0xc79a4e, alpha: 0.32 }, // bleached ochre haze
    4: { color: 0xa8542e, alpha: 0.42 }, // dead dust-red
  },

  /**
   * Jungle thickens as you climb — and it is the one biome that gets MORE VIVID rather
   * than dimmer, using `saturate` mode. T2 stays untinted (jungle's base tier; there is no
   * T1 jungle), the same honest-baseline convention plains T1, mountain T1 and desert T2
   * keep.
   *
   * The first attempt was a `wash` toward deep green, and it failed for a structural
   * reason worth recording: a wash pulls every pixel toward one colour, so on a biome
   * whose art is ALREADY dark green it removes the contrast that made the foliage read as
   * foliage. Trees came out muddy — a multiply of roughly 0.5 on every channel.
   *
   * Saturating instead keeps green at full and cuts the red and blue that were greying the
   * canopy out. Deeper jungle is not dimmer jungle, it is ranker jungle. It also sidesteps
   * swamp, which already owns "dead and cold" three tiers deep; two biomes converging on
   * one dark green wash made both weaker.
   */
  jungle: {
    3: { color: 0x1f5a2e, alpha: 0.30, mode: "saturate" }, // greener
    4: { color: 0x0f7a33, alpha: 0.46, mode: "saturate" }, // rank, saturated growth
  },

  /**
   * Volcano gets HOTTER, using `saturate` — the second biome on that mode and the clearest
   * case for it. Basalt and ash are mid-grey, so a warm multiply reads as firelight thrown
   * across the rock and makes the lava lakes pop, where a wash toward orange would have
   * flattened the ash and the lava into one another.
   *
   * Volcanic starts at T3 and both its tiers are tinted, the same call swamp makes: there
   * is no "ordinary volcano" tier to hold as a baseline, so the wash is biome identity
   * rather than only tier progression. T4 is the same hue pushed harder.
   */
  volcanic: {
    3: { color: 0xd4521a, alpha: 0.30, mode: "saturate" }, // warm — the rock holds heat
    4: { color: 0xd4521a, alpha: 0.46, mode: "saturate" }, // the caldera glows
  },

  /**
   * Tundra gets COLDER and DIMMER — a `wash`, and the one biome where a wash is clearly the
   * right operation rather than a compromise.
   *
   * The jungle failure was a dark wash over dark art: it deleted the very contrast that made
   * foliage read as foliage. Snow is the opposite case. It is near-white and high-luminance
   * with contrast to spare, so blending it toward blue produces the blue-hour read the biome
   * wants, and the dimming IS the effect rather than a cost. Saturating it would keep the
   * glare, which fights deep winter.
   *
   * Both tiers are tinted (tundra starts at T3; same reasoning as volcanic above), and the
   * pairing is deliberate: at T3-T4 these two biomes sit beside each other, one going hotter
   * and more vivid, the other colder and dimmer.
   *
   * Kept properly BLUE and dark, deliberately unlike mountain's pale desaturated grey-blue.
   * Mountain is thin air with the colour washing out of it; tundra is dusk on snow. Two
   * cold biomes that converge on one grey would make both weaker.
   */
  tundra: {
    3: { color: 0x3a5c8c, alpha: 0.30 }, // pale ice blue
    4: { color: 0x1e3559, alpha: 0.42 }, // deep cold dusk
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

/**
 * The multiply colour for `saturate` mode: `color`'s HUE with its brightest channel left
 * at full and the competing channels cut by `alpha`.
 *
 * Multiplying can only ever darken — that is the whole constraint. But WHICH channels it
 * darkens decides whether the result reads as shade or as saturation. Pull every channel
 * down and foliage goes muddy; pull only the channels that are not the hue, and the same
 * foliage reads as more intensely green at the same brightness.
 *
 * Worked example, jungle T4 (`0x143f26`, alpha 0.42): the hue peaks on green, so green
 * stays at 255 while red drops to 182 and blue to 212. A tree keeps its brightness and
 * loses the red and blue that were greying it out.
 */
function saturatingTint(color: number, alpha: number): number {
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
  const peak = Math.max(r, g, b, 1);
  const channel = (c: number): number =>
    Math.round(255 * (1 - alpha * (1 - c / peak)));
  return (channel(r) << 16) | (channel(g) << 8) | channel(b);
}

/**
 * How the overlay rectangle should be drawn for a node, or null when it is untinted.
 *
 * `saturate` mode returns a MULTIPLY rectangle at full alpha rather than an alpha-blended
 * one, because the strength already lives in the colour. That also makes the two paths
 * exact: the rectangle over the ground and the tint on the trees are then literally the
 * same multiply by the same colour, which is what `wash` mode can never quite manage (see
 * IMAGE_TINT_BOOST).
 *
 * Only MULTIPLY, ADD, SCREEN and ERASE are real under Phaser's WebGL renderer — every
 * other `BlendModes` constant is initialised to plain alpha blending there and silently
 * does nothing (checked in WebGLRenderer.js against 3.90). So OVERLAY / SOFT_LIGHT /
 * SATURATION are not available to us, and MULTIPLY-with-a-chosen-colour is how saturation
 * gets done.
 */
export interface TintOverlaySpec {
  color: number;
  alpha: number;
  blendMode: number;
}

export function nodeTintOverlay(nodeId: string): TintOverlaySpec | null {
  const tint = nodeTint(nodeId);
  if (!tint) return null;
  if (tint.mode === "saturate") {
    return {
      color: saturatingTint(tint.color, tint.alpha),
      alpha: 1,
      blendMode: Phaser.BlendModes.MULTIPLY,
    };
  }
  return { color: tint.color, alpha: tint.alpha, blendMode: Phaser.BlendModes.NORMAL };
}

export function nodeTintMultiply(nodeId: string): number | null {
  const tint = nodeTint(nodeId);
  if (!tint) return null;
  // In saturate mode the sprite path and the ground path are the SAME multiply, so there
  // is nothing to reconcile and no boost to apply.
  if (tint.mode === "saturate") return saturatingTint(tint.color, tint.alpha);
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
