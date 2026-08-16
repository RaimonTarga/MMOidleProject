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
   * Calibration note: the first attempt at this ran 0.13–0.30 and was reported as
   * having no visible effect at all. The scene is dark, so a low-alpha wash simply
   * vanishes into it. Treat ~0.20 as the floor for "subtle but perceptible" rather
   * than as a moderate value.
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
    2: { color: 0xc4622a, alpha: 0.20 }, // low sun
  },

  sanctuary: {
    2: { color: 0x2f4f9e, alpha: 0.24 }, // cold blue — barely touched
    3: { color: 0x3d43a4, alpha: 0.29 },
    4: { color: 0x4a2f9e, alpha: 0.34 }, // indigo — unmistakable
    5: { color: 0x5c2fae, alpha: 0.39 },
    6: { color: 0x7132bd, alpha: 0.44 },
    7: { color: 0x8a34c4, alpha: 0.49 }, // violet
    8: { color: 0xa63ad6, alpha: 0.54 }, // the last sanctuary, and it looks it
  },
};

/** Atmosphere wash for a node, or null when the node renders untinted. */
export function nodeTint(nodeId: string): BiomeTint | null {
  const info = NODE_BIOMES[nodeId];
  if (!info) return null;
  return BIOME_TIER_TINTS[info.biomeGroup]?.[info.biomeTier] ?? null;
}
