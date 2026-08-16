import type { DungeonBiomeGroup, PlayerView } from "@mmo-idle/shared";
import { PLAINS_GROUND_TEXTURE_KEY } from './render/proceduralGround';
import {
  MONSTER_FRAMES,
  PLAYER_FRAMES,
  resolveMonsterFrame,
  resolvePlayerFrame,
  resolvePlayerAccent,
  type PlayerAccent,
} from "@mmo-idle/shared";

export const ATLAS_KEY = "game-atlas";
export const GRAVES_KEY = "graves";
export const GRAVE_FRAME_SIZE = 250;
export const GRAVE_DISPLAY_W = 80;
export const GRAVE_DISPLAY_H = 96;
/** Label offset above grave crown (used by drawLabels). */
export const GRAVE_LABEL_OFFSET_Y = GRAVE_DISPLAY_H * 0.55 + 8;
export const VOID_TOMB_TEXTURE_KEY = "void_tomb";
export const VOID_TOMB_FILE = "/assets/ultimate_bosses/void_tomb.png";
export const VOID_TOMB_DISPLAY_W = 280;
export const VOID_TOMB_DISPLAY_H = 280;

// ── Scattered forest trees (2×2 sheet, one tree variant per 1024px cell) ──────
export const TREES_KEY = "env_trees";
export const TREES_FILE = "/assets/environment/trees/trees.png";
/** Trunk/root-only sheet, drawn under the player so they appear to step on roots. */
export const TREES_HITBOX_KEY = "env_trees_hitbox";
export const TREES_HITBOX_FILE = "/assets/environment/trees/trees_hitbox.png";

// Large individual jungle tree variants: kapok, strangler fig, palm cluster,
// and liana-draped emergent. Their array order matches the shared tree variants.
export const JUNGLE_TREE_KEYS = [
  "env_jungle_tree_kapok",
  "env_jungle_tree_strangler_fig",
  "env_jungle_tree_palm_cluster",
  "env_jungle_tree_liana_draped",
] as const;

export const JUNGLE_TREE_FILES = [
  "/assets/environment/trees/jungle/kapok.png",
  "/assets/environment/trees/jungle/strangler-fig.png",
  "/assets/environment/trees/jungle/palm-cluster.png",
  "/assets/environment/trees/jungle/liana-draped-emergent.png",
] as const;

// Large individual plains tree variants. Their array order matches the shared
// windswept elm, pasture oak, twin aspen, and field hawthorn variants.
export const PLAINS_TREE_KEYS = [
  "env_plains_tree_windswept_elm",
  "env_plains_tree_pasture_oak",
  "env_plains_tree_twin_aspen",
  "env_plains_tree_field_hawthorn",
] as const;

export const PLAINS_TREE_FILES = [
  "/assets/environment/trees/plains/windswept-elm.png",
  "/assets/environment/trees/plains/pasture-oak.png",
  "/assets/environment/trees/plains/twin-aspen.png",
  "/assets/environment/trees/plains/field-hawthorn.png",
] as const;

// Large individual swamp dead-tree variants. Their array order matches the
// shared cypress, mangrove, split-oak, and leaning-snag variants.
export const SWAMP_TREE_KEYS = [
  "env_swamp_tree_hollow_cypress",
  "env_swamp_tree_twisted_mangrove",
  "env_swamp_tree_split_oak",
  "env_swamp_tree_leaning_snag",
] as const;

export const SWAMP_TREE_FILES = [
  "/assets/environment/trees/swamp/hollow-cypress-snag.png",
  "/assets/environment/trees/swamp/twisted-mangrove.png",
  "/assets/environment/trees/swamp/split-swamp-oak.png",
  "/assets/environment/trees/swamp/leaning-drowned-snag.png",
] as const;

export const TUNDRA_TREE_KEYS = [
  "env_tundra_tree_forked_birch",
  "env_tundra_tree_dead_snow_pine",
  "env_tundra_tree_wind_bent_willow",
] as const;
export const TUNDRA_TREE_FILES = [
  "/assets/environment/tall-props/tundra/forked-birch-snag.png",
  "/assets/environment/tall-props/tundra/dead-snow-pine.png",
  "/assets/environment/tall-props/tundra/wind-bent-willow.png",
] as const;

export const WASTELAND_TREE_KEYS = [
  "env_wasteland_tree_charred_hollow",
  "env_wasteland_tree_skeletal_oak",
  "env_wasteland_tree_twisted_blight",
] as const;
export const WASTELAND_TREE_FILES = [
  "/assets/environment/tall-props/wasteland/charred-hollow-snag.png",
  "/assets/environment/tall-props/wasteland/skeletal-dead-oak.png",
  "/assets/environment/tall-props/wasteland/twisted-blight-tree.png",
] as const;

export const CAVE_ROCK_KEYS = [
  "env_cave_rock_stalagmite_needles",
  "env_cave_rock_split_cathedral",
  "env_cave_rock_crooked_column",
] as const;
export const CAVE_ROCK_FILES = [
  "/assets/environment/tall-props/cave/stalagmite-needles.png",
  "/assets/environment/tall-props/cave/split-cathedral-spire.png",
  "/assets/environment/tall-props/cave/crooked-mineral-column.png",
] as const;

export const DESERT_ROCK_KEYS = [
  "env_desert_rock_hoodoo",
  "env_desert_rock_balancing_spire",
  "env_desert_rock_forked_pinnacle",
] as const;
export const DESERT_ROCK_FILES = [
  "/assets/environment/tall-props/desert/hoodoo-pillar.png",
  "/assets/environment/tall-props/desert/balancing-slab-spire.png",
  "/assets/environment/tall-props/desert/forked-sandstone-pinnacle.png",
] as const;

export const VOLCANIC_ROCK_KEYS = [
  "env_volcanic_rock_basalt_columns",
  "env_volcanic_rock_obsidian_blade",
  "env_volcanic_rock_scoria_chimney",
] as const;
export const VOLCANIC_ROCK_FILES = [
  "/assets/environment/tall-props/volcano/basalt-column-cluster.png",
  "/assets/environment/tall-props/volcano/obsidian-blade.png",
  "/assets/environment/tall-props/volcano/scoria-chimney.png",
] as const;

export const TRENCH_ROCK_KEYS = [
  "env_trench_rock_eroded_monolith",
  "env_trench_rock_abyssal_needles",
  "env_trench_rock_windowed_pinnacle",
] as const;
export const TRENCH_ROCK_FILES = [
  "/assets/environment/tall-props/trench/eroded-monolith.png",
  "/assets/environment/tall-props/trench/abyssal-needle-cluster.png",
  "/assets/environment/tall-props/trench/windowed-pinnacle.png",
] as const;

// ── Auto-combat thought bubble (telegraphs a player's next action) ────────────
export const THOUGHT_BUBBLE_KEY = "thought_bubble";
export const THOUGHT_MASK_KEY = "thought_bubble_mask";
export const THOUGHT_BUBBLE_FILE = "/assets/emotes/thoughts/thought.png";
export const THOUGHT_MASK_FILE = "/assets/emotes/thoughts/thought_mask.png";

/** Texture key for a player emote spritesheet (rendered inside the thought bubble). */
export function emoteTextureKey(emoteId: string): string {
  return `emote_${emoteId}`;
}

/** Phaser animation key for a player emote loop. */
export function emoteAnimKey(emoteId: string): string {
  return `emote-anim-${emoteId}`;
}

export {
  MONSTER_FRAMES,
  PLAYER_FRAMES,
  resolveMonsterFrame,
  resolvePlayerFrame,
};

export {
  VOID_OVERLORD_TEXTURE_KEY,
  VOID_OVERLORD_FILE,
  initVoidOverlordSheet,
} from "./sprites/voidOverlordSheet";

/**
 * Returns the atlas frame name for a player.
 * Resolution order: '{archetype}-{variant}' → '{archetype}' → 'default' → null.
 */
export function getPlayerFrame(player: PlayerView): string | null {
  return resolvePlayerFrame({
    combatArchetype: player.combatArchetype,
    unlockedSkills: player.unlockedSkills,
  });
}

/** Returns the atlas frame name for a monster type, or null if no sprite exists. */
export function getMonsterFrame(monsterTypeId: string): string | null {
  return resolveMonsterFrame(monsterTypeId);
}

/**
 * Identity accent (persistent halo/glyph overlay from range/path/tier choices),
 * or null. Rendered by fx/identityAccent.ts alongside the body sprite.
 */
export function getPlayerAccent(player: PlayerView): PlayerAccent | null {
  return resolvePlayerAccent({
    combatArchetype: player.combatArchetype,
    unlockedSkills: player.unlockedSkills,
  });
}

// ── Player shadow color ramp ──────────────────────────────────────────────────
const PLAYER_SHADOW_RAMP: Array<{ minLevel: number; color: number }> = [
  { minLevel: 0, color: 0x000000 },
  { minLevel: 1, color: 0xff4444 },
  { minLevel: 2, color: 0xff8800 },
  { minLevel: 3, color: 0xffee00 },
  { minLevel: 4, color: 0x44ff88 },
  { minLevel: 5, color: 0x00ddcc },
  { minLevel: 6, color: 0x4488ff },
];

export function getPlayerShadowColor(progressionLevel: number): number {
  let color = PLAYER_SHADOW_RAMP[0].color;
  for (const entry of PLAYER_SHADOW_RAMP) {
    if (progressionLevel >= entry.minLevel) color = entry.color;
    else break;
  }
  return color;
}

export const BIOME_TEXTURES: Record<string, string> = {
  clearing: "biome_clearing",
  sanctuary: "biome_clearing",
  forest: "biome_forest",
  mountain: "biome_mountain",
  plains: PLAINS_GROUND_TEXTURE_KEY,
  swamp: "biome_swamp",
  cave: "biome_cave",
  jungle: "biome_jungle",
  tundra: "biome_tundra",
  desert: "biome_desert",
  volcanic: "biome_volcano",
  graveyard: "biome_graveyard",
  trench: "biome_trench",
  abyss: "biome_abyss",
};

/**
 * Reusable, non-gameplay decoration for a biome. Unlike NODE_DECOR, these
 * assets never describe collision, hazards, or an interactable.
 */
/**
 * Per-node multiplier range on a decor spec's `count`, drawn from the node seed.
 *
 * This is what stops every node in a biome carrying an identical dressing. It does
 * double duty: a range like `[0.6, 1.5]` varies how thickly a backbone prop is
 * strewn, while a range whose floor is 0 lets a *character* prop vanish from some
 * nodes entirely — which is the kit-subset lever. One cave is an ossuary, the next
 * has no bones at all, from the same kit.
 *
 * Absent means no variance: the spec places exactly `count` on every node, which is
 * how every biome behaved before this existed. Opting a biome in is a per-spec
 * decision, so biomes we have not designed yet are untouched.
 */
export interface BiomeDecorVariance {
  /** Multiplier floor. 0 lets the spec drop out of a node completely. */
  min: number;
  /** Multiplier ceiling. */
  max: number;
  /**
   * Specs sharing a group draw ONE multiplier per node instead of rolling
   * independently.
   *
   * Independent rolls average out and quietly defeat the point: three bone specs
   * each ranging `[0, 2.4]` almost never ALL land near zero, so "this cavern has
   * no bones in it" effectively never happens — measured at 0 nodes in 21. A
   * group makes a kit's character props move as one, which is what actually
   * produces an ossuary next door to bare stone.
   */
  group?: string;
}

export interface BiomeDecorArt {
  key: string;
  file: string;
  /** Baseline instances per node, before any {@link variance} roll. */
  count: number;
  /** Per-node count multiplier range. Absent = exactly `count` on every node. */
  variance?: BiomeDecorVariance;
  /** World-pixel display size before a small deterministic scale variation. */
  displayW: number;
  displayH: number;
  /** Keep large art y-sorted with entities; ground decals remain underneath. */
  ySort?: boolean;
  /** Small assets may flip horizontally to make repeat patterns less obvious. */
  flipX?: boolean;
  /** Optional opacity multiplier for subtle surface dressing. */
  alpha?: number;
  /**
   * Reject spawn points the ground layout marks as dirt (render/groundLayout.ts)
   * — greenery should not sprout out of a bare path or patch.
   */
  avoidsDirt?: boolean;
}

/**
 * Biome dressing is populated only after its source art passes review. The
 * renderer and preload path are data-driven, so adding the Plains kit later
 * remains a data change rather than another scene-system change.
 */
/**
 * The hub kit: tended, restrained ground dressing for the Clearing and all three
 * regional sanctuaries. Every spec sets `avoidsDirt`, which in the hub layouts means
 * "keep off the paving" — and the paving is the plaza and its four roads, so the
 * motif stays clean and nothing sprouts out of stone.
 *
 * Sanctuaries deliberately SHARE this kit rather than getting their own art: they
 * are the same kind of place, and what separates them is the per-node tint
 * (render/biomeTint.ts), not different props. Before this they had no kit at all
 * and rendered completely bare.
 */
const HUB_DECOR: BiomeDecorArt[] = [
    {
      key: 'clearing_small_flower_patch',
      file: '/assets/environment/clearing/small-flower-patch.png',
      count: 11,
      displayW: 50,
      displayH: 50,
      flipX: true,
      alpha: 0.85,
      avoidsDirt: true,
    },
    {
      key: 'clearing_small_flower_patch_variant_2',
      file: '/assets/environment/clearing/small-flower-patch-variant-2.png',
      count: 9,
      displayW: 50,
      displayH: 50,
      flipX: true,
      alpha: 0.85,
      avoidsDirt: true,
    },
    {
      key: 'clearing_low_leaf_clump',
      file: '/assets/environment/clearing/low-leaf-clump.png',
      count: 16,
      displayW: 48,
      displayH: 48,
      flipX: true,
      alpha: 0.9,
      avoidsDirt: true,
    },
    {
      key: 'clearing_low_leaf_clump_variant_2',
      file: '/assets/environment/clearing/low-leaf-clump-variant-2.png',
      count: 11,
      displayW: 48,
      displayH: 48,
      flipX: true,
      alpha: 0.9,
      avoidsDirt: true,
    },
    {
      key: 'clearing_smooth_stones',
      file: '/assets/environment/clearing/smooth-stones.png',
      count: 11,
      displayW: 44,
      displayH: 44,
      flipX: true,
      alpha: 0.85,
      avoidsDirt: true,
    },
    {
      key: 'clearing_smooth_stones_variant_2',
      file: '/assets/environment/clearing/smooth-stones-variant-2.png',
      count: 9,
      displayW: 44,
      displayH: 44,
      flipX: true,
      alpha: 0.85,
      avoidsDirt: true,
    },
    {
      key: 'clearing_trim_grass_tuft',
      file: '/assets/environment/clearing/trim-grass-tuft.png',
      count: 18,
      displayW: 48,
      displayH: 48,
      flipX: true,
      alpha: 0.9,
      avoidsDirt: true,
    },
];

export const BIOME_DECOR: Partial<Record<string, BiomeDecorArt[]>> = {
  // Clearing kit: tended, calm, restrained counts (single T0 hub node). The
  // greenery avoids "dirt", which in the clearing layout is the paved plaza —
  // plants must not sprout from pavement; garden stones may sit anywhere.
  clearing: HUB_DECOR,
  sanctuary: HUB_DECOR,
  // Forest kit: freestanding plants keep off the heavy-foliage groves
  // (avoidsDirt) so they dot the open floor instead of hiding under canopies;
  // leaf litter falls anywhere.
  forest: [
    {
      key: 'forest_fern_clump',
      file: '/assets/environment/forest/fern-clump.png',
      count: 18,
      displayW: 54,
      displayH: 54,
      flipX: true,
      alpha: 0.95,
      avoidsDirt: true,
    },
    {
      key: 'forest_fern_clump_variant_2',
      file: '/assets/environment/forest/fern-clump-variant-2.png',
      count: 16,
      displayW: 54,
      displayH: 54,
      flipX: true,
      alpha: 0.95,
      avoidsDirt: true,
    },
    {
      key: 'forest_broadleaf_cover',
      file: '/assets/environment/forest/broadleaf-cover.png',
      count: 16,
      displayW: 52,
      displayH: 52,
      flipX: true,
      alpha: 0.9,
      avoidsDirt: true,
    },
    {
      key: 'forest_broadleaf_cover_variant_2',
      file: '/assets/environment/forest/broadleaf-cover-variant-2.png',
      count: 11,
      displayW: 52,
      displayH: 52,
      flipX: true,
      alpha: 0.9,
      avoidsDirt: true,
    },
    {
      key: 'forest_mushroom_cluster',
      file: '/assets/environment/forest/mushroom-cluster.png',
      count: 11,
      displayW: 40,
      displayH: 40,
      flipX: true,
      alpha: 0.95,
      avoidsDirt: true,
    },
    {
      key: 'forest_mushroom_cluster_variant_2',
      file: '/assets/environment/forest/mushroom-cluster-variant-2.png',
      count: 9,
      displayW: 40,
      displayH: 40,
      flipX: true,
      alpha: 0.95,
      avoidsDirt: true,
    },
    {
      key: 'forest_leaf_litter',
      file: '/assets/environment/forest/leaf-litter.png',
      count: 20,
      displayW: 56,
      displayH: 56,
      flipX: true,
      alpha: 0.8,
    },
    {
      key: 'forest_leaf_litter_variant_2',
      file: '/assets/environment/forest/leaf-litter-variant-2.png',
      count: 18,
      displayW: 56,
      displayH: 56,
      flipX: true,
      alpha: 0.8,
    },
  ],
  // Mountain + swamp kits skip avoidsDirt: those biomes render FUNCTIONAL
  // ground (ledges/pools) so the decorative layout is phantom there — the
  // feature-footprint rejection is what keeps props off walls and out of pools.
  mountain: [
    {
      key: 'mountain_scree_cluster',
      file: '/assets/environment/mountain/scree-cluster.png',
      count: 20,
      displayW: 48,
      displayH: 48,
      flipX: true,
      alpha: 0.85,
    },
    {
      key: 'mountain_scree_cluster_variant_2',
      file: '/assets/environment/mountain/scree-cluster-variant-2.png',
      count: 18,
      displayW: 48,
      displayH: 48,
      flipX: true,
      alpha: 0.85,
    },
    {
      key: 'mountain_flat_rock_shards',
      file: '/assets/environment/mountain/flat-rock-shards.png',
      count: 18,
      displayW: 46,
      displayH: 46,
      flipX: true,
      alpha: 0.85,
    },
    {
      key: 'mountain_hardy_grass',
      file: '/assets/environment/mountain/hardy-grass.png',
      count: 18,
      displayW: 44,
      displayH: 44,
      flipX: true,
      alpha: 0.9,
    },
    {
      key: 'mountain_hardy_grass_variant_2',
      file: '/assets/environment/mountain/hardy-grass-variant-2.png',
      count: 16,
      displayW: 44,
      displayH: 44,
      flipX: true,
      alpha: 0.9,
    },
    {
      key: 'mountain_lichen_stone',
      file: '/assets/environment/mountain/lichen-stone.png',
      count: 16,
      displayW: 42,
      displayH: 42,
      flipX: true,
      alpha: 0.85,
    },
    {
      key: 'mountain_lichen_stone_variant_2',
      file: '/assets/environment/mountain/lichen-stone-variant-2.png',
      count: 11,
      displayW: 42,
      displayH: 42,
      flipX: true,
      alpha: 0.85,
    },
    {
      key: 'mountain_split_stone',
      file: '/assets/environment/mountain/split-stone.png',
      count: 7,
      displayW: 78,
      displayH: 78,
      flipX: true,
      alpha: 0.95,
    },
  ],
  swamp: [
    {
      key: 'swamp_sedge_tuft',
      file: '/assets/environment/swamp/sedge-tuft.png',
      count: 20,
      displayW: 50,
      displayH: 50,
      flipX: true,
      alpha: 0.9,
    },
    {
      key: 'swamp_sedge_tuft_variant_2',
      file: '/assets/environment/swamp/sedge-tuft-variant-2.png',
      count: 18,
      displayW: 50,
      displayH: 50,
      flipX: true,
      alpha: 0.9,
    },
    {
      key: 'swamp_bogleaf_clump',
      file: '/assets/environment/swamp/bogleaf-clump.png',
      count: 16,
      displayW: 50,
      displayH: 50,
      flipX: true,
      alpha: 0.9,
    },
    {
      key: 'swamp_bogleaf_clump_variant_2',
      file: '/assets/environment/swamp/bogleaf-clump-variant-2.png',
      count: 11,
      displayW: 50,
      displayH: 50,
      flipX: true,
      alpha: 0.9,
    },
    {
      key: 'swamp_dead_reed_scatter',
      file: '/assets/environment/swamp/dead-reed-scatter.png',
      count: 18,
      displayW: 54,
      displayH: 54,
      flipX: true,
      alpha: 0.8,
    },
    {
      key: 'swamp_dead_reed_scatter_variant_2',
      file: '/assets/environment/swamp/dead-reed-scatter-variant-2.png',
      count: 16,
      displayW: 54,
      displayH: 54,
      flipX: true,
      alpha: 0.8,
    },
    {
      key: 'swamp_moss_clumps',
      file: '/assets/environment/swamp/moss-clumps.png',
      count: 18,
      displayW: 52,
      displayH: 52,
      flipX: true,
      alpha: 0.8,
    },
  ],
  cave: [
    {
      key: 'cave_loose_rubble',
      file: '/assets/environment/cave/loose-rubble.png',
      count: 20,
      variance: { min: 0.5, max: 1.55, group: 'debris' },
      displayW: 46,
      displayH: 46,
      flipX: true,
      alpha: 0.85,
    },
    {
      key: 'cave_loose_rubble_variant_2',
      file: '/assets/environment/cave/loose-rubble-variant-2.png',
      count: 18,
      variance: { min: 0.5, max: 1.55, group: 'debris' },
      displayW: 46,
      displayH: 46,
      flipX: true,
      alpha: 0.85,
    },
    {
      key: 'cave_flat_rock_shards',
      file: '/assets/environment/cave/flat-rock-shards.png',
      count: 16,
      variance: { min: 0.5, max: 1.55, group: 'debris' },
      displayW: 46,
      displayH: 46,
      flipX: true,
      alpha: 0.85,
    },
    {
      key: 'cave_flat_rock_shards_variant_2',
      file: '/assets/environment/cave/flat-rock-shards-variant-2.png',
      count: 11,
      variance: { min: 0.5, max: 1.55, group: 'debris' },
      displayW: 46,
      displayH: 46,
      flipX: true,
      alpha: 0.85,
    },
    {
      key: 'cave_animal_bone_scatter',
      file: '/assets/environment/cave/animal-bone-scatter.png',
      count: 7,
      variance: { min: 0, max: 2.2, group: 'bones' },
      displayW: 46,
      displayH: 46,
      flipX: true,
      alpha: 0.9,
    },
    {
      key: 'cave_humanoid_bone_scatter',
      file: '/assets/environment/cave/humanoid-bone-scatter.png',
      count: 7,
      variance: { min: 0, max: 2.2, group: 'bones' },
      displayW: 46,
      displayH: 46,
      flipX: true,
      alpha: 0.9,
    },
    {
      key: 'cave_partial_ribcage',
      file: '/assets/environment/cave/partial-ribcage.png',
      count: 2,
      variance: { min: 0, max: 2.2, group: 'bones' },
      displayW: 72,
      displayH: 72,
      flipX: true,
      alpha: 0.9,
    },
  ],
  plains: [
    {
      key: 'plains_grass_tuft',
      file: '/assets/environment/plains/grass-tuft.png',
      count: 43,
      displayW: 52,
      displayH: 52,
      flipX: true,
      alpha: 0.9,
      avoidsDirt: true,
    },
    {
      key: 'plains_grass_tuft_variant_2',
      file: '/assets/environment/plains/grass-tuft-variant-2.png',
      count: 36,
      displayW: 52,
      displayH: 52,
      flipX: true,
      alpha: 0.9,
      avoidsDirt: true,
    },
    {
      key: 'plains_grass_tuft_variant_3',
      file: '/assets/environment/plains/grass-tuft-variant-3.png',
      count: 36,
      displayW: 52,
      displayH: 52,
      flipX: true,
      alpha: 0.9,
      avoidsDirt: true,
    },
    {
      key: 'plains_pebble_cluster',
      file: '/assets/environment/plains/pebble-cluster.png',
      count: 20,
      displayW: 42,
      displayH: 42,
      flipX: true,
      alpha: 0.82,
    },
    {
      key: 'plains_pebble_cluster_variant_2',
      file: '/assets/environment/plains/pebble-cluster-variant-2.png',
      count: 18,
      displayW: 42,
      displayH: 42,
      flipX: true,
      alpha: 0.82,
    },
    {
      key: 'plains_pebble_cluster_variant_3',
      file: '/assets/environment/plains/pebble-cluster-variant-3.png',
      count: 18,
      displayW: 42,
      displayH: 42,
      flipX: true,
      alpha: 0.82,
    },
    {
      key: 'plains_wildflower_patch',
      file: '/assets/environment/plains/wildflower-patch.png',
      count: 16,
      displayW: 50,
      displayH: 50,
      flipX: true,
      alpha: 0.8,
      avoidsDirt: true,
    },
    {
      key: 'plains_wildflower_patch_variant_2',
      file: '/assets/environment/plains/wildflower-patch-variant-2.png',
      count: 11,
      displayW: 50,
      displayH: 50,
      flipX: true,
      alpha: 0.8,
      avoidsDirt: true,
    },
    {
      key: 'plains_wildflower_patch_variant_3',
      file: '/assets/environment/plains/wildflower-patch-variant-3.png',
      count: 11,
      displayW: 50,
      displayH: 50,
      flipX: true,
      alpha: 0.8,
      avoidsDirt: true,
    },
    {
      key: 'plains_low_shrub',
      file: '/assets/environment/plains/low-shrub.png',
      count: 7,
      displayW: 88,
      displayH: 88,
      ySort: true,
      flipX: true,
    },
    {
      key: 'plains_low_shrub_variant_2',
      file: '/assets/environment/plains/low-shrub-variant-2.png',
      count: 7,
      displayW: 88,
      displayH: 88,
      ySort: true,
      flipX: true,
    },
    {
      key: 'plains_low_shrub_variant_3',
      file: '/assets/environment/plains/low-shrub-variant-3.png',
      count: 7,
      displayW: 88,
      displayH: 88,
      ySort: true,
      flipX: true,
    },
  ],
  // Desert kit: LOW-density standoff biome — deliberately sparse counts so the
  // open sand reads empty. Only the living shrub avoids the cracked hardpan.
  desert: [
    {
      key: 'desert_stone_cluster',
      file: '/assets/environment/desert/stone-cluster.png',
      count: 11,
      displayW: 48,
      displayH: 48,
      flipX: true,
      alpha: 0.85,
    },
    {
      key: 'desert_stone_cluster_variant_2',
      file: '/assets/environment/desert/stone-cluster-variant-2.png',
      count: 9,
      displayW: 48,
      displayH: 48,
      flipX: true,
      alpha: 0.85,
    },
    {
      key: 'desert_stone_cluster_variant_3',
      file: '/assets/environment/desert/stone-cluster-variant-3.png',
      count: 9,
      displayW: 48,
      displayH: 48,
      flipX: true,
      alpha: 0.85,
    },
    {
      key: 'desert_dry_shrub',
      file: '/assets/environment/desert/dry-shrub.png',
      count: 9,
      displayW: 50,
      displayH: 50,
      flipX: true,
      alpha: 0.9,
      avoidsDirt: true,
    },
    {
      key: 'desert_dry_shrub_variant_2',
      file: '/assets/environment/desert/dry-shrub-variant-2.png',
      count: 7,
      displayW: 50,
      displayH: 50,
      flipX: true,
      alpha: 0.9,
      avoidsDirt: true,
    },
    {
      key: 'desert_cracked_slab',
      file: '/assets/environment/desert/cracked-slab.png',
      count: 7,
      displayW: 52,
      displayH: 52,
      flipX: true,
      alpha: 0.85,
    },
    {
      key: 'desert_cracked_slab_variant_2',
      file: '/assets/environment/desert/cracked-slab-variant-2.png',
      count: 7,
      displayW: 52,
      displayH: 52,
      flipX: true,
      alpha: 0.85,
    },
    {
      key: 'desert_pebble_drift',
      file: '/assets/environment/desert/pebble-drift.png',
      count: 11,
      displayW: 46,
      displayH: 46,
      flipX: true,
      alpha: 0.8,
    },
    {
      key: 'desert_pebble_drift_variant_2',
      file: '/assets/environment/desert/pebble-drift-variant-2.png',
      count: 9,
      displayW: 46,
      displayH: 46,
      flipX: true,
      alpha: 0.8,
    },
    {
      key: 'desert_stone_pile',
      file: '/assets/environment/desert/stone-pile.png',
      count: 2,
      displayW: 74,
      displayH: 74,
      flipX: true,
      alpha: 0.95,
    },
    {
      key: 'desert_stone_pile_variant_2',
      file: '/assets/environment/desert/stone-pile-variant-2.png',
      count: 2,
      displayW: 74,
      displayH: 74,
      flipX: true,
      alpha: 0.95,
    },
    {
      key: 'desert_stone_pile_variant_3',
      file: '/assets/environment/desert/stone-pile-variant-3.png',
      count: 2,
      displayW: 74,
      displayH: 74,
      flipX: true,
      alpha: 0.95,
    },
  ],
  // Jungle kit: HIGH-density ambush biome — the heaviest counts of any kit.
  // No avoidsDirt: props layering on top of the dominant overgrowth is the
  // point, and the denseBush FEATURE footprints already reject spawn points,
  // so the functional thickets stay clean.
  jungle: [
    {
      key: 'jungle_fern_clump',
      file: '/assets/environment/jungle/fern-clump.png',
      count: 25,
      displayW: 54,
      displayH: 54,
      flipX: true,
      alpha: 0.95,
    },
    {
      key: 'jungle_fern_clump_variant_2',
      file: '/assets/environment/jungle/fern-clump-variant-2.png',
      count: 20,
      displayW: 54,
      displayH: 54,
      flipX: true,
      alpha: 0.95,
    },
    {
      key: 'jungle_fern_clump_variant_3',
      file: '/assets/environment/jungle/fern-clump-variant-3.png',
      count: 18,
      displayW: 54,
      displayH: 54,
      flipX: true,
      alpha: 0.95,
    },
    {
      key: 'jungle_broadleaf_plant',
      file: '/assets/environment/jungle/broadleaf-plant.png',
      count: 18,
      displayW: 52,
      displayH: 52,
      flipX: true,
      alpha: 0.9,
    },
    {
      key: 'jungle_broadleaf_plant_variant_2',
      file: '/assets/environment/jungle/broadleaf-plant-variant-2.png',
      count: 16,
      displayW: 52,
      displayH: 52,
      flipX: true,
      alpha: 0.9,
    },
    {
      key: 'jungle_broadleaf_plant_variant_3',
      file: '/assets/environment/jungle/broadleaf-plant-variant-3.png',
      count: 16,
      displayW: 52,
      displayH: 52,
      flipX: true,
      alpha: 0.9,
    },
    {
      key: 'jungle_vine_tangle',
      file: '/assets/environment/jungle/vine-tangle.png',
      count: 18,
      displayW: 56,
      displayH: 56,
      flipX: true,
      alpha: 0.85,
    },
    {
      key: 'jungle_vine_tangle_variant_2',
      file: '/assets/environment/jungle/vine-tangle-variant-2.png',
      count: 16,
      displayW: 56,
      displayH: 56,
      flipX: true,
      alpha: 0.85,
    },
    {
      key: 'jungle_flower_accent',
      file: '/assets/environment/jungle/flower-accent.png',
      count: 11,
      displayW: 48,
      displayH: 48,
      flipX: true,
      alpha: 0.95,
    },
    {
      key: 'jungle_flower_accent_variant_2',
      file: '/assets/environment/jungle/flower-accent-variant-2.png',
      count: 9,
      displayW: 48,
      displayH: 48,
      flipX: true,
      alpha: 0.95,
    },
    {
      key: 'jungle_flower_accent_variant_3',
      file: '/assets/environment/jungle/flower-accent-variant-3.png',
      count: 9,
      displayW: 48,
      displayH: 48,
      flipX: true,
      alpha: 0.95,
    },
    {
      key: 'jungle_mossy_stone',
      file: '/assets/environment/jungle/mossy-stone.png',
      count: 2,
      displayW: 76,
      displayH: 76,
      flipX: true,
      alpha: 0.95,
    },
    {
      key: 'jungle_mossy_stone_variant_2',
      file: '/assets/environment/jungle/mossy-stone-variant-2.png',
      count: 2,
      displayW: 76,
      displayH: 76,
      flipX: true,
      alpha: 0.95,
    },
  ],
  // Tundra kit: props carry the visual interest on the near-featureless snow.
  // Vegetation avoids the wind-polished ice patches (nothing grows from ice);
  // rocks and drifts may sit anywhere.
  tundra: [
    {
      key: 'tundra_frost_grass_tuft',
      file: '/assets/environment/tundra/frost-grass-tuft.png',
      count: 18,
      displayW: 50,
      displayH: 50,
      flipX: true,
      alpha: 0.9,
      avoidsDirt: true,
    },
    {
      key: 'tundra_frost_grass_tuft_variant_2',
      file: '/assets/environment/tundra/frost-grass-tuft-variant-2.png',
      count: 16,
      displayW: 50,
      displayH: 50,
      flipX: true,
      alpha: 0.9,
      avoidsDirt: true,
    },
    {
      key: 'tundra_frost_grass_tuft_variant_3',
      file: '/assets/environment/tundra/frost-grass-tuft-variant-3.png',
      count: 16,
      displayW: 50,
      displayH: 50,
      flipX: true,
      alpha: 0.9,
      avoidsDirt: true,
    },
    {
      key: 'tundra_snowcapped_rock',
      file: '/assets/environment/tundra/snowcapped-rock.png',
      count: 16,
      displayW: 46,
      displayH: 46,
      flipX: true,
      alpha: 0.9,
    },
    {
      key: 'tundra_snowcapped_rock_variant_2',
      file: '/assets/environment/tundra/snowcapped-rock-variant-2.png',
      count: 11,
      displayW: 46,
      displayH: 46,
      flipX: true,
      alpha: 0.9,
    },
    {
      key: 'tundra_snowcapped_rock_variant_3',
      file: '/assets/environment/tundra/snowcapped-rock-variant-3.png',
      count: 11,
      displayW: 46,
      displayH: 46,
      flipX: true,
      alpha: 0.9,
    },
    {
      key: 'tundra_snow_mound',
      file: '/assets/environment/tundra/snow-mound.png',
      count: 11,
      displayW: 54,
      displayH: 54,
      flipX: true,
      alpha: 0.85,
    },
    {
      key: 'tundra_snow_mound_variant_2',
      file: '/assets/environment/tundra/snow-mound-variant-2.png',
      count: 9,
      displayW: 54,
      displayH: 54,
      flipX: true,
      alpha: 0.85,
    },
    {
      key: 'tundra_snow_mound_variant_3',
      file: '/assets/environment/tundra/snow-mound-variant-3.png',
      count: 9,
      displayW: 54,
      displayH: 54,
      flipX: true,
      alpha: 0.85,
    },
    {
      key: 'tundra_dead_shrub',
      file: '/assets/environment/tundra/dead-shrub.png',
      count: 11,
      displayW: 50,
      displayH: 50,
      flipX: true,
      alpha: 0.95,
      avoidsDirt: true,
    },
    {
      key: 'tundra_dead_shrub_variant_2',
      file: '/assets/environment/tundra/dead-shrub-variant-2.png',
      count: 9,
      displayW: 50,
      displayH: 50,
      flipX: true,
      alpha: 0.95,
      avoidsDirt: true,
    },
    {
      key: 'tundra_dead_shrub_variant_3',
      file: '/assets/environment/tundra/dead-shrub-variant-3.png',
      count: 9,
      displayW: 50,
      displayH: 50,
      flipX: true,
      alpha: 0.95,
      avoidsDirt: true,
    },
    {
      key: 'tundra_split_boulder',
      file: '/assets/environment/tundra/split-boulder.png',
      count: 2,
      displayW: 76,
      displayH: 76,
      flipX: true,
      alpha: 0.95,
    },
    {
      key: 'tundra_split_boulder_variant_2',
      file: '/assets/environment/tundra/split-boulder-variant-2.png',
      count: 2,
      displayW: 76,
      displayH: 76,
      flipX: true,
      alpha: 0.95,
    },
    {
      key: 'tundra_split_boulder_variant_3',
      file: '/assets/environment/tundra/split-boulder-variant-3.png',
      count: 2,
      displayW: 76,
      displayH: 76,
      flipX: true,
      alpha: 0.95,
    },
  ],
  // Volcano kit (biomeGroup 'volcanic'): mid-sparse burnt-ground dressing. No
  // avoidsDirt — ventless nodes render plain basalt, and on the lava-vent
  // nodes the feature-footprint rejection keeps props out of the lava.
  volcanic: [
    {
      key: 'volcano_basalt_shards',
      file: '/assets/environment/volcano/basalt-shards.png',
      count: 18,
      displayW: 46,
      displayH: 46,
      flipX: true,
      alpha: 0.85,
    },
    {
      key: 'volcano_basalt_shards_variant_2',
      file: '/assets/environment/volcano/basalt-shards-variant-2.png',
      count: 16,
      displayW: 46,
      displayH: 46,
      flipX: true,
      alpha: 0.85,
    },
    {
      key: 'volcano_ember_patch',
      file: '/assets/environment/volcano/ember-patch.png',
      count: 9,
      displayW: 48,
      displayH: 48,
      flipX: true,
      alpha: 0.9,
    },
    {
      key: 'volcano_ember_patch_variant_2',
      file: '/assets/environment/volcano/ember-patch-variant-2.png',
      count: 9,
      displayW: 48,
      displayH: 48,
      flipX: true,
      alpha: 0.9,
    },
    {
      key: 'volcano_fumarole_crack',
      file: '/assets/environment/volcano/fumarole-crack.png',
      count: 9,
      displayW: 50,
      displayH: 50,
      flipX: true,
      alpha: 0.85,
    },
    {
      key: 'volcano_fumarole_crack_variant_2',
      file: '/assets/environment/volcano/fumarole-crack-variant-2.png',
      count: 7,
      displayW: 50,
      displayH: 50,
      flipX: true,
      alpha: 0.85,
    },
    {
      key: 'volcano_cinder_scatter',
      file: '/assets/environment/volcano/cinder-scatter.png',
      count: 18,
      displayW: 52,
      displayH: 52,
      flipX: true,
      alpha: 0.8,
    },
    {
      key: 'volcano_cinder_scatter_variant_2',
      file: '/assets/environment/volcano/cinder-scatter-variant-2.png',
      count: 16,
      displayW: 52,
      displayH: 52,
      flipX: true,
      alpha: 0.8,
    },
    {
      key: 'volcano_cracked_slab',
      file: '/assets/environment/volcano/cracked-slab.png',
      count: 2,
      displayW: 76,
      displayH: 76,
      flipX: true,
      alpha: 0.95,
    },
    {
      key: 'volcano_cracked_slab_variant_2',
      file: '/assets/environment/volcano/cracked-slab-variant-2.png',
      count: 2,
      displayW: 76,
      displayH: 76,
      flipX: true,
      alpha: 0.95,
    },
  ],
  // Trench kit: sparse hadal emptiness — life clusters are rare finds, and the
  // biolume patches stay unobstructed (no avoidsDirt needed; counts are low
  // enough that overlap is uncommon).
  trench: [
    {
      key: 'trench_coral_fan',
      file: '/assets/environment/trench/coral-fan.png',
      count: 11,
      displayW: 48,
      displayH: 48,
      flipX: true,
      alpha: 0.95,
    },
    {
      key: 'trench_coral_fan_variant_2',
      file: '/assets/environment/trench/coral-fan-variant-2.png',
      count: 9,
      displayW: 48,
      displayH: 48,
      flipX: true,
      alpha: 0.95,
    },
    {
      key: 'trench_tubeworm_cluster',
      file: '/assets/environment/trench/tubeworm-cluster.png',
      count: 11,
      displayW: 44,
      displayH: 44,
      flipX: true,
      alpha: 0.95,
    },
    {
      key: 'trench_tubeworm_cluster_variant_2',
      file: '/assets/environment/trench/tubeworm-cluster-variant-2.png',
      count: 9,
      displayW: 44,
      displayH: 44,
      flipX: true,
      alpha: 0.95,
    },
    {
      key: 'trench_tubeworm_cluster_variant_3',
      file: '/assets/environment/trench/tubeworm-cluster-variant-3.png',
      count: 9,
      displayW: 44,
      displayH: 44,
      flipX: true,
      alpha: 0.95,
    },
    {
      key: 'trench_anemone_patch',
      file: '/assets/environment/trench/anemone-patch.png',
      count: 9,
      displayW: 46,
      displayH: 46,
      flipX: true,
      alpha: 0.95,
    },
    {
      key: 'trench_anemone_patch_variant_2',
      file: '/assets/environment/trench/anemone-patch-variant-2.png',
      count: 9,
      displayW: 46,
      displayH: 46,
      flipX: true,
      alpha: 0.95,
    },
    {
      key: 'trench_anemone_patch_variant_3',
      file: '/assets/environment/trench/anemone-patch-variant-3.png',
      count: 7,
      displayW: 46,
      displayH: 46,
      flipX: true,
      alpha: 0.95,
    },
    {
      key: 'trench_silt_stones',
      file: '/assets/environment/trench/silt-stones.png',
      count: 16,
      displayW: 48,
      displayH: 48,
      flipX: true,
      alpha: 0.85,
    },
    {
      key: 'trench_silt_stones_variant_2',
      file: '/assets/environment/trench/silt-stones-variant-2.png',
      count: 11,
      displayW: 48,
      displayH: 48,
      flipX: true,
      alpha: 0.85,
    },
    {
      key: 'trench_whale_vertebra',
      file: '/assets/environment/trench/whale-vertebra.png',
      count: 2,
      displayW: 78,
      displayH: 78,
      flipX: true,
      alpha: 0.95,
    },
  ],
  // Wasteland kit (biomeGroup id still 'graveyard'): bones settle ON the ash
  // drifts by design, so nothing avoids the upper material. Skull counts stay
  // low so remains read as finds, not carpet.
  graveyard: [
    {
      key: 'wasteland_ash_drift',
      file: '/assets/environment/wasteland/ash-drift.png',
      count: 18,
      displayW: 56,
      displayH: 56,
      flipX: true,
      alpha: 0.8,
    },
    {
      key: 'wasteland_ash_drift_variant_2',
      file: '/assets/environment/wasteland/ash-drift-variant-2.png',
      count: 16,
      displayW: 56,
      displayH: 56,
      flipX: true,
      alpha: 0.8,
    },
    {
      key: 'wasteland_thorn_shrub',
      file: '/assets/environment/wasteland/thorn-shrub.png',
      count: 11,
      displayW: 52,
      displayH: 52,
      flipX: true,
      alpha: 0.95,
    },
    {
      key: 'wasteland_thorn_shrub_variant_2',
      file: '/assets/environment/wasteland/thorn-shrub-variant-2.png',
      count: 9,
      displayW: 52,
      displayH: 52,
      flipX: true,
      alpha: 0.95,
    },
    {
      key: 'wasteland_thorn_shrub_variant_3',
      file: '/assets/environment/wasteland/thorn-shrub-variant-3.png',
      count: 9,
      displayW: 52,
      displayH: 52,
      flipX: true,
      alpha: 0.95,
    },
    {
      key: 'wasteland_long_bone',
      file: '/assets/environment/wasteland/long-bone.png',
      count: 9,
      displayW: 46,
      displayH: 46,
      flipX: true,
      alpha: 0.9,
    },
    {
      key: 'wasteland_long_bone_variant_2',
      file: '/assets/environment/wasteland/long-bone-variant-2.png',
      count: 7,
      displayW: 46,
      displayH: 46,
      flipX: true,
      alpha: 0.9,
    },
    {
      key: 'wasteland_buried_skull',
      file: '/assets/environment/wasteland/buried-skull.png',
      count: 7,
      displayW: 44,
      displayH: 44,
      flipX: true,
      alpha: 0.9,
    },
    {
      key: 'wasteland_buried_skull_variant_2',
      file: '/assets/environment/wasteland/buried-skull-variant-2.png',
      count: 7,
      displayW: 44,
      displayH: 44,
      flipX: true,
      alpha: 0.9,
    },
    {
      key: 'wasteland_buried_skull_variant_3',
      file: '/assets/environment/wasteland/buried-skull-variant-3.png',
      count: 2,
      displayW: 44,
      displayH: 44,
      flipX: true,
      alpha: 0.9,
    },
    {
      key: 'wasteland_collapsed_ribcage',
      file: '/assets/environment/wasteland/collapsed-ribcage.png',
      count: 2,
      displayW: 74,
      displayH: 74,
      flipX: true,
      alpha: 0.9,
    },
    {
      key: 'wasteland_collapsed_ribcage_variant_2',
      file: '/assets/environment/wasteland/collapsed-ribcage-variant-2.png',
      count: 2,
      displayW: 74,
      displayH: 74,
      flipX: true,
      alpha: 0.9,
    },
  ],
};

/**
 * Client-only fill for a node feature whose footprint is dressed by MANY scattered
 * props instead of one stretched sprite. `NODE_DECOR` stretches a single image to
 * `displayW x displayH`, which is right for an altar and wrong for a 600px-wide
 * thicket — a 96px bush blown up 6x is mush. This scatters instead, so the region
 * reads as dense undergrowth and its edge stays ragged rather than a clean circle.
 *
 * Purely visual: the authoritative slow/conceal geometry is the shared
 * `NODE_FEATURES` shape and is untouched by anything here.
 */
export interface FeatureScatterArt {
  /** Every feature whose id starts with this gets this scatter. */
  featureIdPrefix: string;
  /** Cycled per-prop; more variants means less obvious repetition. */
  variants: Array<{ key: string; file: string }>;
  /** World-pixel size before a deterministic per-prop scale jitter. */
  displayW: number;
  displayH: number;
  /**
   * Grid step as a fraction of `displayW`. Below 1 the props overlap, which is
   * what turns discrete sprites into a continuous mass. ~0.6 is a dense thicket.
   */
  spacing: number;
  /** Keep props y-sorted with entities so the player is occluded inside them. */
  ySort?: boolean;
  alpha?: number;
}

/**
 * Jungle ambush bush — the concealment region the Jungle identity is built on.
 * Four accepted variants, flipped and scale-jittered, because the generated art
 * is radially symmetric and a single stamp repeated would read as a grid.
 */
export const FEATURE_SCATTER: FeatureScatterArt[] = [
  {
    featureIdPrefix: 'jungle_bush',
    variants: [
      { key: 'jungle_ambush_bush', file: '/assets/environment/jungle/ambush-bush.png' },
      { key: 'jungle_ambush_bush_2', file: '/assets/environment/jungle/ambush-bush-variant-2.png' },
      { key: 'jungle_ambush_bush_3', file: '/assets/environment/jungle/ambush-bush-variant-3.png' },
      { key: 'jungle_ambush_bush_4', file: '/assets/environment/jungle/ambush-bush-variant-4.png' },
    ],
    displayW: 150,
    displayH: 150,
    spacing: 0.7,
    ySort: true,
    alpha: 0.95,
  },
];

/** Client-only visual art for a shared NODE_FEATURES entry. */
export interface NodeDecorArt {
  featureId: string;
  key: string;
  file: string;
  openKey?: string;
  openFile?: string;
  alpha?: number;
  depth?: number;
  /** Render scale relative to shared displayW/H (default 1). */
  artScale?: number;
}

export interface DungeonAltarArt {
  key: string;
  file: string;
}

export interface HazardPoolArt {
  key: string;
  file: string;
}

/** Runtime ground-effect art. Magma is preloaded for a future volcano boss pass. */
export const HAZARD_POOL_ART: Readonly<
  Record<"poison" | "magma", HazardPoolArt>
> = {
  poison: {
    key: "hazard_pool_poison",
    file: "/assets/environment/hazards/poison-pool.png",
  },
  magma: {
    key: "hazard_pool_magma",
    file: "/assets/environment/hazards/magma-pool.png",
  },
};

/** One encounter altar per canonical dungeon biome family. */
export const DUNGEON_ALTAR_ART: Readonly<
  Record<DungeonBiomeGroup, DungeonAltarArt>
> = {
  forest: {
    key: "dungeon_altar_forest",
    file: "/assets/environment/dungeon-altars/forest.png",
  },
  plains: {
    key: "dungeon_altar_plains",
    file: "/assets/environment/dungeon-altars/plains.png",
  },
  mountain: {
    key: "dungeon_altar_mountain",
    file: "/assets/environment/dungeon-altars/mountain.png",
  },
  cave: {
    key: "dungeon_altar_cave",
    file: "/assets/environment/dungeon-altars/cave.png",
  },
  swamp: {
    key: "dungeon_altar_swamp",
    file: "/assets/environment/dungeon-altars/swamp.png",
  },
  jungle: {
    key: "dungeon_altar_jungle",
    file: "/assets/environment/dungeon-altars/jungle.png",
  },
  desert: {
    key: "dungeon_altar_desert",
    file: "/assets/environment/dungeon-altars/desert.png",
  },
  tundra: {
    key: "dungeon_altar_tundra",
    file: "/assets/environment/dungeon-altars/tundra.png",
  },
  volcanic: {
    key: "dungeon_altar_volcanic",
    file: "/assets/environment/dungeon-altars/volcanic.png",
  },
  graveyard: {
    key: "dungeon_altar_wasteland",
    file: "/assets/environment/dungeon-altars/graveyard.png",
  },
  trench: {
    key: "dungeon_altar_trench",
    file: "/assets/environment/dungeon-altars/trench.png",
  },
};

export function dungeonAltarArtForBiome(
  biomeGroup: string,
): DungeonAltarArt | undefined {
  return (DUNGEON_ALTAR_ART as Readonly<Record<string, DungeonAltarArt>>)[
    biomeGroup
  ];
}

const RUNE_ALTAR_DECOR: NodeDecorArt[] = [{
  featureId: "rune_altar",
  key: "rune_altar",
  file: "/assets/environment/rune_altar.png",
}];

export const NODE_DECOR: Record<string, NodeDecorArt[]> = {
  "node-clearing": RUNE_ALTAR_DECOR,
  "node-t2-sanctuary": RUNE_ALTAR_DECOR,
  "node-t3-sanctuary": RUNE_ALTAR_DECOR,
  "node-t4-sanctuary": RUNE_ALTAR_DECOR,
};
