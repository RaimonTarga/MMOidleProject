import type { PlayerView } from "@mmo-idle/shared";
import { PLAINS_GROUND_TEXTURE_KEY } from './render/proceduralGround';
import { activeSummonFrame } from './render/summonSkins';
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
  // DEV: the Conduit summon skin switcher (Shift+[ / Shift+]) overrides the
  // authored frame so accepted candidates can be compared live in-game.
  if (import.meta.env.DEV && monsterTypeId.startsWith('conduit-summon')) {
    return activeSummonFrame();
  }
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
export interface BiomeDecorArt {
  key: string;
  file: string;
  /** Number of instances to place in every node of this biome. */
  count: number;
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
export const BIOME_DECOR: Partial<Record<string, BiomeDecorArt[]>> = {
  // Clearing kit: tended, calm, restrained counts (single T0 hub node). The
  // greenery avoids "dirt", which in the clearing layout is the paved plaza —
  // plants must not sprout from pavement; garden stones may sit anywhere.
  clearing: [
    {
      key: 'clearing_small_flower_patch',
      file: '/assets/environment/clearing/small-flower-patch.png',
      count: 4,
      displayW: 50,
      displayH: 50,
      flipX: true,
      alpha: 0.85,
      avoidsDirt: true,
    },
    {
      key: 'clearing_small_flower_patch_variant_2',
      file: '/assets/environment/clearing/small-flower-patch-variant-2.png',
      count: 3,
      displayW: 50,
      displayH: 50,
      flipX: true,
      alpha: 0.85,
      avoidsDirt: true,
    },
    {
      key: 'clearing_low_leaf_clump',
      file: '/assets/environment/clearing/low-leaf-clump.png',
      count: 5,
      displayW: 48,
      displayH: 48,
      flipX: true,
      alpha: 0.9,
      avoidsDirt: true,
    },
    {
      key: 'clearing_low_leaf_clump_variant_2',
      file: '/assets/environment/clearing/low-leaf-clump-variant-2.png',
      count: 4,
      displayW: 48,
      displayH: 48,
      flipX: true,
      alpha: 0.9,
      avoidsDirt: true,
    },
    {
      key: 'clearing_smooth_stones',
      file: '/assets/environment/clearing/smooth-stones.png',
      count: 4,
      displayW: 44,
      displayH: 44,
      flipX: true,
      alpha: 0.85,
    },
    {
      key: 'clearing_smooth_stones_variant_2',
      file: '/assets/environment/clearing/smooth-stones-variant-2.png',
      count: 3,
      displayW: 44,
      displayH: 44,
      flipX: true,
      alpha: 0.85,
    },
    {
      key: 'clearing_trim_grass_tuft',
      file: '/assets/environment/clearing/trim-grass-tuft.png',
      count: 6,
      displayW: 48,
      displayH: 48,
      flipX: true,
      alpha: 0.9,
      avoidsDirt: true,
    },
  ],
  // Forest kit: freestanding plants keep off the heavy-foliage groves
  // (avoidsDirt) so they dot the open floor instead of hiding under canopies;
  // leaf litter falls anywhere.
  forest: [
    {
      key: 'forest_fern_clump',
      file: '/assets/environment/forest/fern-clump.png',
      count: 6,
      displayW: 54,
      displayH: 54,
      flipX: true,
      alpha: 0.95,
      avoidsDirt: true,
    },
    {
      key: 'forest_fern_clump_variant_2',
      file: '/assets/environment/forest/fern-clump-variant-2.png',
      count: 5,
      displayW: 54,
      displayH: 54,
      flipX: true,
      alpha: 0.95,
      avoidsDirt: true,
    },
    {
      key: 'forest_broadleaf_cover',
      file: '/assets/environment/forest/broadleaf-cover.png',
      count: 5,
      displayW: 52,
      displayH: 52,
      flipX: true,
      alpha: 0.9,
      avoidsDirt: true,
    },
    {
      key: 'forest_broadleaf_cover_variant_2',
      file: '/assets/environment/forest/broadleaf-cover-variant-2.png',
      count: 4,
      displayW: 52,
      displayH: 52,
      flipX: true,
      alpha: 0.9,
      avoidsDirt: true,
    },
    {
      key: 'forest_mushroom_cluster',
      file: '/assets/environment/forest/mushroom-cluster.png',
      count: 4,
      displayW: 40,
      displayH: 40,
      flipX: true,
      alpha: 0.95,
      avoidsDirt: true,
    },
    {
      key: 'forest_mushroom_cluster_variant_2',
      file: '/assets/environment/forest/mushroom-cluster-variant-2.png',
      count: 3,
      displayW: 40,
      displayH: 40,
      flipX: true,
      alpha: 0.95,
      avoidsDirt: true,
    },
    {
      key: 'forest_leaf_litter',
      file: '/assets/environment/forest/leaf-litter.png',
      count: 7,
      displayW: 56,
      displayH: 56,
      flipX: true,
      alpha: 0.8,
    },
    {
      key: 'forest_leaf_litter_variant_2',
      file: '/assets/environment/forest/leaf-litter-variant-2.png',
      count: 6,
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
      count: 7,
      displayW: 48,
      displayH: 48,
      flipX: true,
      alpha: 0.85,
    },
    {
      key: 'mountain_scree_cluster_variant_2',
      file: '/assets/environment/mountain/scree-cluster-variant-2.png',
      count: 6,
      displayW: 48,
      displayH: 48,
      flipX: true,
      alpha: 0.85,
    },
    {
      key: 'mountain_flat_rock_shards',
      file: '/assets/environment/mountain/flat-rock-shards.png',
      count: 6,
      displayW: 46,
      displayH: 46,
      flipX: true,
      alpha: 0.85,
    },
    {
      key: 'mountain_hardy_grass',
      file: '/assets/environment/mountain/hardy-grass.png',
      count: 6,
      displayW: 44,
      displayH: 44,
      flipX: true,
      alpha: 0.9,
    },
    {
      key: 'mountain_hardy_grass_variant_2',
      file: '/assets/environment/mountain/hardy-grass-variant-2.png',
      count: 5,
      displayW: 44,
      displayH: 44,
      flipX: true,
      alpha: 0.9,
    },
    {
      key: 'mountain_lichen_stone',
      file: '/assets/environment/mountain/lichen-stone.png',
      count: 5,
      displayW: 42,
      displayH: 42,
      flipX: true,
      alpha: 0.85,
    },
    {
      key: 'mountain_lichen_stone_variant_2',
      file: '/assets/environment/mountain/lichen-stone-variant-2.png',
      count: 4,
      displayW: 42,
      displayH: 42,
      flipX: true,
      alpha: 0.85,
    },
    {
      key: 'mountain_split_stone',
      file: '/assets/environment/mountain/split-stone.png',
      count: 2,
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
      count: 7,
      displayW: 50,
      displayH: 50,
      flipX: true,
      alpha: 0.9,
    },
    {
      key: 'swamp_sedge_tuft_variant_2',
      file: '/assets/environment/swamp/sedge-tuft-variant-2.png',
      count: 6,
      displayW: 50,
      displayH: 50,
      flipX: true,
      alpha: 0.9,
    },
    {
      key: 'swamp_bogleaf_clump',
      file: '/assets/environment/swamp/bogleaf-clump.png',
      count: 5,
      displayW: 50,
      displayH: 50,
      flipX: true,
      alpha: 0.9,
    },
    {
      key: 'swamp_bogleaf_clump_variant_2',
      file: '/assets/environment/swamp/bogleaf-clump-variant-2.png',
      count: 4,
      displayW: 50,
      displayH: 50,
      flipX: true,
      alpha: 0.9,
    },
    {
      key: 'swamp_dead_reed_scatter',
      file: '/assets/environment/swamp/dead-reed-scatter.png',
      count: 6,
      displayW: 54,
      displayH: 54,
      flipX: true,
      alpha: 0.8,
    },
    {
      key: 'swamp_dead_reed_scatter_variant_2',
      file: '/assets/environment/swamp/dead-reed-scatter-variant-2.png',
      count: 5,
      displayW: 54,
      displayH: 54,
      flipX: true,
      alpha: 0.8,
    },
    {
      key: 'swamp_moss_clumps',
      file: '/assets/environment/swamp/moss-clumps.png',
      count: 6,
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
      count: 7,
      displayW: 46,
      displayH: 46,
      flipX: true,
      alpha: 0.85,
    },
    {
      key: 'cave_loose_rubble_variant_2',
      file: '/assets/environment/cave/loose-rubble-variant-2.png',
      count: 6,
      displayW: 46,
      displayH: 46,
      flipX: true,
      alpha: 0.85,
    },
    {
      key: 'cave_flat_rock_shards',
      file: '/assets/environment/cave/flat-rock-shards.png',
      count: 5,
      displayW: 46,
      displayH: 46,
      flipX: true,
      alpha: 0.85,
    },
    {
      key: 'cave_flat_rock_shards_variant_2',
      file: '/assets/environment/cave/flat-rock-shards-variant-2.png',
      count: 4,
      displayW: 46,
      displayH: 46,
      flipX: true,
      alpha: 0.85,
    },
    {
      key: 'cave_animal_bone_scatter',
      file: '/assets/environment/cave/animal-bone-scatter.png',
      count: 2,
      displayW: 46,
      displayH: 46,
      flipX: true,
      alpha: 0.9,
    },
    {
      key: 'cave_humanoid_bone_scatter',
      file: '/assets/environment/cave/humanoid-bone-scatter.png',
      count: 2,
      displayW: 46,
      displayH: 46,
      flipX: true,
      alpha: 0.9,
    },
    {
      key: 'cave_partial_ribcage',
      file: '/assets/environment/cave/partial-ribcage.png',
      count: 1,
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
      count: 14,
      displayW: 52,
      displayH: 52,
      flipX: true,
      alpha: 0.9,
      avoidsDirt: true,
    },
    {
      key: 'plains_grass_tuft_variant_2',
      file: '/assets/environment/plains/grass-tuft-variant-2.png',
      count: 12,
      displayW: 52,
      displayH: 52,
      flipX: true,
      alpha: 0.9,
      avoidsDirt: true,
    },
    {
      key: 'plains_grass_tuft_variant_3',
      file: '/assets/environment/plains/grass-tuft-variant-3.png',
      count: 12,
      displayW: 52,
      displayH: 52,
      flipX: true,
      alpha: 0.9,
      avoidsDirt: true,
    },
    {
      key: 'plains_pebble_cluster',
      file: '/assets/environment/plains/pebble-cluster.png',
      count: 7,
      displayW: 42,
      displayH: 42,
      flipX: true,
      alpha: 0.82,
    },
    {
      key: 'plains_pebble_cluster_variant_2',
      file: '/assets/environment/plains/pebble-cluster-variant-2.png',
      count: 6,
      displayW: 42,
      displayH: 42,
      flipX: true,
      alpha: 0.82,
    },
    {
      key: 'plains_pebble_cluster_variant_3',
      file: '/assets/environment/plains/pebble-cluster-variant-3.png',
      count: 6,
      displayW: 42,
      displayH: 42,
      flipX: true,
      alpha: 0.82,
    },
    {
      key: 'plains_wildflower_patch',
      file: '/assets/environment/plains/wildflower-patch.png',
      count: 5,
      displayW: 50,
      displayH: 50,
      flipX: true,
      alpha: 0.8,
      avoidsDirt: true,
    },
    {
      key: 'plains_wildflower_patch_variant_2',
      file: '/assets/environment/plains/wildflower-patch-variant-2.png',
      count: 4,
      displayW: 50,
      displayH: 50,
      flipX: true,
      alpha: 0.8,
      avoidsDirt: true,
    },
    {
      key: 'plains_wildflower_patch_variant_3',
      file: '/assets/environment/plains/wildflower-patch-variant-3.png',
      count: 4,
      displayW: 50,
      displayH: 50,
      flipX: true,
      alpha: 0.8,
      avoidsDirt: true,
    },
    {
      key: 'plains_low_shrub',
      file: '/assets/environment/plains/low-shrub.png',
      count: 2,
      displayW: 88,
      displayH: 88,
      ySort: true,
      flipX: true,
    },
    {
      key: 'plains_low_shrub_variant_2',
      file: '/assets/environment/plains/low-shrub-variant-2.png',
      count: 2,
      displayW: 88,
      displayH: 88,
      ySort: true,
      flipX: true,
    },
    {
      key: 'plains_low_shrub_variant_3',
      file: '/assets/environment/plains/low-shrub-variant-3.png',
      count: 2,
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
      count: 4,
      displayW: 48,
      displayH: 48,
      flipX: true,
      alpha: 0.85,
    },
    {
      key: 'desert_stone_cluster_variant_2',
      file: '/assets/environment/desert/stone-cluster-variant-2.png',
      count: 3,
      displayW: 48,
      displayH: 48,
      flipX: true,
      alpha: 0.85,
    },
    {
      key: 'desert_stone_cluster_variant_3',
      file: '/assets/environment/desert/stone-cluster-variant-3.png',
      count: 3,
      displayW: 48,
      displayH: 48,
      flipX: true,
      alpha: 0.85,
    },
    {
      key: 'desert_dry_shrub',
      file: '/assets/environment/desert/dry-shrub.png',
      count: 3,
      displayW: 50,
      displayH: 50,
      flipX: true,
      alpha: 0.9,
      avoidsDirt: true,
    },
    {
      key: 'desert_dry_shrub_variant_2',
      file: '/assets/environment/desert/dry-shrub-variant-2.png',
      count: 2,
      displayW: 50,
      displayH: 50,
      flipX: true,
      alpha: 0.9,
      avoidsDirt: true,
    },
    {
      key: 'desert_cracked_slab',
      file: '/assets/environment/desert/cracked-slab.png',
      count: 2,
      displayW: 52,
      displayH: 52,
      flipX: true,
      alpha: 0.85,
    },
    {
      key: 'desert_cracked_slab_variant_2',
      file: '/assets/environment/desert/cracked-slab-variant-2.png',
      count: 2,
      displayW: 52,
      displayH: 52,
      flipX: true,
      alpha: 0.85,
    },
    {
      key: 'desert_pebble_drift',
      file: '/assets/environment/desert/pebble-drift.png',
      count: 4,
      displayW: 46,
      displayH: 46,
      flipX: true,
      alpha: 0.8,
    },
    {
      key: 'desert_pebble_drift_variant_2',
      file: '/assets/environment/desert/pebble-drift-variant-2.png',
      count: 3,
      displayW: 46,
      displayH: 46,
      flipX: true,
      alpha: 0.8,
    },
    {
      key: 'desert_stone_pile',
      file: '/assets/environment/desert/stone-pile.png',
      count: 1,
      displayW: 74,
      displayH: 74,
      flipX: true,
      alpha: 0.95,
    },
    {
      key: 'desert_stone_pile_variant_2',
      file: '/assets/environment/desert/stone-pile-variant-2.png',
      count: 1,
      displayW: 74,
      displayH: 74,
      flipX: true,
      alpha: 0.95,
    },
    {
      key: 'desert_stone_pile_variant_3',
      file: '/assets/environment/desert/stone-pile-variant-3.png',
      count: 1,
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
      count: 8,
      displayW: 54,
      displayH: 54,
      flipX: true,
      alpha: 0.95,
    },
    {
      key: 'jungle_fern_clump_variant_2',
      file: '/assets/environment/jungle/fern-clump-variant-2.png',
      count: 7,
      displayW: 54,
      displayH: 54,
      flipX: true,
      alpha: 0.95,
    },
    {
      key: 'jungle_fern_clump_variant_3',
      file: '/assets/environment/jungle/fern-clump-variant-3.png',
      count: 6,
      displayW: 54,
      displayH: 54,
      flipX: true,
      alpha: 0.95,
    },
    {
      key: 'jungle_broadleaf_plant',
      file: '/assets/environment/jungle/broadleaf-plant.png',
      count: 6,
      displayW: 52,
      displayH: 52,
      flipX: true,
      alpha: 0.9,
    },
    {
      key: 'jungle_broadleaf_plant_variant_2',
      file: '/assets/environment/jungle/broadleaf-plant-variant-2.png',
      count: 5,
      displayW: 52,
      displayH: 52,
      flipX: true,
      alpha: 0.9,
    },
    {
      key: 'jungle_broadleaf_plant_variant_3',
      file: '/assets/environment/jungle/broadleaf-plant-variant-3.png',
      count: 5,
      displayW: 52,
      displayH: 52,
      flipX: true,
      alpha: 0.9,
    },
    {
      key: 'jungle_vine_tangle',
      file: '/assets/environment/jungle/vine-tangle.png',
      count: 6,
      displayW: 56,
      displayH: 56,
      flipX: true,
      alpha: 0.85,
    },
    {
      key: 'jungle_vine_tangle_variant_2',
      file: '/assets/environment/jungle/vine-tangle-variant-2.png',
      count: 5,
      displayW: 56,
      displayH: 56,
      flipX: true,
      alpha: 0.85,
    },
    {
      key: 'jungle_flower_accent',
      file: '/assets/environment/jungle/flower-accent.png',
      count: 4,
      displayW: 48,
      displayH: 48,
      flipX: true,
      alpha: 0.95,
    },
    {
      key: 'jungle_flower_accent_variant_2',
      file: '/assets/environment/jungle/flower-accent-variant-2.png',
      count: 3,
      displayW: 48,
      displayH: 48,
      flipX: true,
      alpha: 0.95,
    },
    {
      key: 'jungle_flower_accent_variant_3',
      file: '/assets/environment/jungle/flower-accent-variant-3.png',
      count: 3,
      displayW: 48,
      displayH: 48,
      flipX: true,
      alpha: 0.95,
    },
    {
      key: 'jungle_mossy_stone',
      file: '/assets/environment/jungle/mossy-stone.png',
      count: 1,
      displayW: 76,
      displayH: 76,
      flipX: true,
      alpha: 0.95,
    },
    {
      key: 'jungle_mossy_stone_variant_2',
      file: '/assets/environment/jungle/mossy-stone-variant-2.png',
      count: 1,
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
      count: 6,
      displayW: 50,
      displayH: 50,
      flipX: true,
      alpha: 0.9,
      avoidsDirt: true,
    },
    {
      key: 'tundra_frost_grass_tuft_variant_2',
      file: '/assets/environment/tundra/frost-grass-tuft-variant-2.png',
      count: 5,
      displayW: 50,
      displayH: 50,
      flipX: true,
      alpha: 0.9,
      avoidsDirt: true,
    },
    {
      key: 'tundra_frost_grass_tuft_variant_3',
      file: '/assets/environment/tundra/frost-grass-tuft-variant-3.png',
      count: 5,
      displayW: 50,
      displayH: 50,
      flipX: true,
      alpha: 0.9,
      avoidsDirt: true,
    },
    {
      key: 'tundra_snowcapped_rock',
      file: '/assets/environment/tundra/snowcapped-rock.png',
      count: 5,
      displayW: 46,
      displayH: 46,
      flipX: true,
      alpha: 0.9,
    },
    {
      key: 'tundra_snowcapped_rock_variant_2',
      file: '/assets/environment/tundra/snowcapped-rock-variant-2.png',
      count: 4,
      displayW: 46,
      displayH: 46,
      flipX: true,
      alpha: 0.9,
    },
    {
      key: 'tundra_snowcapped_rock_variant_3',
      file: '/assets/environment/tundra/snowcapped-rock-variant-3.png',
      count: 4,
      displayW: 46,
      displayH: 46,
      flipX: true,
      alpha: 0.9,
    },
    {
      key: 'tundra_snow_mound',
      file: '/assets/environment/tundra/snow-mound.png',
      count: 4,
      displayW: 54,
      displayH: 54,
      flipX: true,
      alpha: 0.85,
    },
    {
      key: 'tundra_snow_mound_variant_2',
      file: '/assets/environment/tundra/snow-mound-variant-2.png',
      count: 3,
      displayW: 54,
      displayH: 54,
      flipX: true,
      alpha: 0.85,
    },
    {
      key: 'tundra_snow_mound_variant_3',
      file: '/assets/environment/tundra/snow-mound-variant-3.png',
      count: 3,
      displayW: 54,
      displayH: 54,
      flipX: true,
      alpha: 0.85,
    },
    {
      key: 'tundra_dead_shrub',
      file: '/assets/environment/tundra/dead-shrub.png',
      count: 4,
      displayW: 50,
      displayH: 50,
      flipX: true,
      alpha: 0.95,
      avoidsDirt: true,
    },
    {
      key: 'tundra_dead_shrub_variant_2',
      file: '/assets/environment/tundra/dead-shrub-variant-2.png',
      count: 3,
      displayW: 50,
      displayH: 50,
      flipX: true,
      alpha: 0.95,
      avoidsDirt: true,
    },
    {
      key: 'tundra_dead_shrub_variant_3',
      file: '/assets/environment/tundra/dead-shrub-variant-3.png',
      count: 3,
      displayW: 50,
      displayH: 50,
      flipX: true,
      alpha: 0.95,
      avoidsDirt: true,
    },
    {
      key: 'tundra_split_boulder',
      file: '/assets/environment/tundra/split-boulder.png',
      count: 1,
      displayW: 76,
      displayH: 76,
      flipX: true,
      alpha: 0.95,
    },
    {
      key: 'tundra_split_boulder_variant_2',
      file: '/assets/environment/tundra/split-boulder-variant-2.png',
      count: 1,
      displayW: 76,
      displayH: 76,
      flipX: true,
      alpha: 0.95,
    },
    {
      key: 'tundra_split_boulder_variant_3',
      file: '/assets/environment/tundra/split-boulder-variant-3.png',
      count: 1,
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
      count: 6,
      displayW: 46,
      displayH: 46,
      flipX: true,
      alpha: 0.85,
    },
    {
      key: 'volcano_basalt_shards_variant_2',
      file: '/assets/environment/volcano/basalt-shards-variant-2.png',
      count: 5,
      displayW: 46,
      displayH: 46,
      flipX: true,
      alpha: 0.85,
    },
    {
      key: 'volcano_ember_patch',
      file: '/assets/environment/volcano/ember-patch.png',
      count: 3,
      displayW: 48,
      displayH: 48,
      flipX: true,
      alpha: 0.9,
    },
    {
      key: 'volcano_ember_patch_variant_2',
      file: '/assets/environment/volcano/ember-patch-variant-2.png',
      count: 3,
      displayW: 48,
      displayH: 48,
      flipX: true,
      alpha: 0.9,
    },
    {
      key: 'volcano_fumarole_crack',
      file: '/assets/environment/volcano/fumarole-crack.png',
      count: 3,
      displayW: 50,
      displayH: 50,
      flipX: true,
      alpha: 0.85,
    },
    {
      key: 'volcano_fumarole_crack_variant_2',
      file: '/assets/environment/volcano/fumarole-crack-variant-2.png',
      count: 2,
      displayW: 50,
      displayH: 50,
      flipX: true,
      alpha: 0.85,
    },
    {
      key: 'volcano_cinder_scatter',
      file: '/assets/environment/volcano/cinder-scatter.png',
      count: 6,
      displayW: 52,
      displayH: 52,
      flipX: true,
      alpha: 0.8,
    },
    {
      key: 'volcano_cinder_scatter_variant_2',
      file: '/assets/environment/volcano/cinder-scatter-variant-2.png',
      count: 5,
      displayW: 52,
      displayH: 52,
      flipX: true,
      alpha: 0.8,
    },
    {
      key: 'volcano_cracked_slab',
      file: '/assets/environment/volcano/cracked-slab.png',
      count: 1,
      displayW: 76,
      displayH: 76,
      flipX: true,
      alpha: 0.95,
    },
    {
      key: 'volcano_cracked_slab_variant_2',
      file: '/assets/environment/volcano/cracked-slab-variant-2.png',
      count: 1,
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
      count: 4,
      displayW: 48,
      displayH: 48,
      flipX: true,
      alpha: 0.95,
    },
    {
      key: 'trench_coral_fan_variant_2',
      file: '/assets/environment/trench/coral-fan-variant-2.png',
      count: 3,
      displayW: 48,
      displayH: 48,
      flipX: true,
      alpha: 0.95,
    },
    {
      key: 'trench_tubeworm_cluster',
      file: '/assets/environment/trench/tubeworm-cluster.png',
      count: 4,
      displayW: 44,
      displayH: 44,
      flipX: true,
      alpha: 0.95,
    },
    {
      key: 'trench_tubeworm_cluster_variant_2',
      file: '/assets/environment/trench/tubeworm-cluster-variant-2.png',
      count: 3,
      displayW: 44,
      displayH: 44,
      flipX: true,
      alpha: 0.95,
    },
    {
      key: 'trench_tubeworm_cluster_variant_3',
      file: '/assets/environment/trench/tubeworm-cluster-variant-3.png',
      count: 3,
      displayW: 44,
      displayH: 44,
      flipX: true,
      alpha: 0.95,
    },
    {
      key: 'trench_anemone_patch',
      file: '/assets/environment/trench/anemone-patch.png',
      count: 3,
      displayW: 46,
      displayH: 46,
      flipX: true,
      alpha: 0.95,
    },
    {
      key: 'trench_anemone_patch_variant_2',
      file: '/assets/environment/trench/anemone-patch-variant-2.png',
      count: 3,
      displayW: 46,
      displayH: 46,
      flipX: true,
      alpha: 0.95,
    },
    {
      key: 'trench_anemone_patch_variant_3',
      file: '/assets/environment/trench/anemone-patch-variant-3.png',
      count: 2,
      displayW: 46,
      displayH: 46,
      flipX: true,
      alpha: 0.95,
    },
    {
      key: 'trench_silt_stones',
      file: '/assets/environment/trench/silt-stones.png',
      count: 5,
      displayW: 48,
      displayH: 48,
      flipX: true,
      alpha: 0.85,
    },
    {
      key: 'trench_silt_stones_variant_2',
      file: '/assets/environment/trench/silt-stones-variant-2.png',
      count: 4,
      displayW: 48,
      displayH: 48,
      flipX: true,
      alpha: 0.85,
    },
    {
      key: 'trench_whale_vertebra',
      file: '/assets/environment/trench/whale-vertebra.png',
      count: 1,
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
      count: 6,
      displayW: 56,
      displayH: 56,
      flipX: true,
      alpha: 0.8,
    },
    {
      key: 'wasteland_ash_drift_variant_2',
      file: '/assets/environment/wasteland/ash-drift-variant-2.png',
      count: 5,
      displayW: 56,
      displayH: 56,
      flipX: true,
      alpha: 0.8,
    },
    {
      key: 'wasteland_thorn_shrub',
      file: '/assets/environment/wasteland/thorn-shrub.png',
      count: 4,
      displayW: 52,
      displayH: 52,
      flipX: true,
      alpha: 0.95,
    },
    {
      key: 'wasteland_thorn_shrub_variant_2',
      file: '/assets/environment/wasteland/thorn-shrub-variant-2.png',
      count: 3,
      displayW: 52,
      displayH: 52,
      flipX: true,
      alpha: 0.95,
    },
    {
      key: 'wasteland_thorn_shrub_variant_3',
      file: '/assets/environment/wasteland/thorn-shrub-variant-3.png',
      count: 3,
      displayW: 52,
      displayH: 52,
      flipX: true,
      alpha: 0.95,
    },
    {
      key: 'wasteland_long_bone',
      file: '/assets/environment/wasteland/long-bone.png',
      count: 3,
      displayW: 46,
      displayH: 46,
      flipX: true,
      alpha: 0.9,
    },
    {
      key: 'wasteland_long_bone_variant_2',
      file: '/assets/environment/wasteland/long-bone-variant-2.png',
      count: 2,
      displayW: 46,
      displayH: 46,
      flipX: true,
      alpha: 0.9,
    },
    {
      key: 'wasteland_buried_skull',
      file: '/assets/environment/wasteland/buried-skull.png',
      count: 2,
      displayW: 44,
      displayH: 44,
      flipX: true,
      alpha: 0.9,
    },
    {
      key: 'wasteland_buried_skull_variant_2',
      file: '/assets/environment/wasteland/buried-skull-variant-2.png',
      count: 2,
      displayW: 44,
      displayH: 44,
      flipX: true,
      alpha: 0.9,
    },
    {
      key: 'wasteland_buried_skull_variant_3',
      file: '/assets/environment/wasteland/buried-skull-variant-3.png',
      count: 1,
      displayW: 44,
      displayH: 44,
      flipX: true,
      alpha: 0.9,
    },
    {
      key: 'wasteland_collapsed_ribcage',
      file: '/assets/environment/wasteland/collapsed-ribcage.png',
      count: 1,
      displayW: 74,
      displayH: 74,
      flipX: true,
      alpha: 0.9,
    },
    {
      key: 'wasteland_collapsed_ribcage_variant_2',
      file: '/assets/environment/wasteland/collapsed-ribcage-variant-2.png',
      count: 1,
      displayW: 74,
      displayH: 74,
      flipX: true,
      alpha: 0.9,
    },
  ],
};

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

export const NODE_DECOR: Record<string, NodeDecorArt[]> = {
  "node-clearing": [
    {
      featureId: "rune_altar",
      key: "rune_altar",
      file: "/assets/environment/rune_altar.png",
    },
  ],
};
