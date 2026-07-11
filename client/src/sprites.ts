import type { PlayerView } from "@mmo-idle/shared";
import { PLAINS_GROUND_TEXTURE_KEY } from './render/proceduralGround';
import {
  MONSTER_FRAMES,
  PLAYER_FRAMES,
  resolveMonsterFrame,
  resolvePlayerFrame,
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
  return resolveMonsterFrame(monsterTypeId);
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
}

/**
 * Biome dressing is populated only after its source art passes review. The
 * renderer and preload path are data-driven, so adding the Plains kit later
 * remains a data change rather than another scene-system change.
 */
export const BIOME_DECOR: Partial<Record<string, BiomeDecorArt[]>> = {
  plains: [
    {
      key: 'plains_grass_tuft',
      file: '/assets/environment/plains/grass-tuft.png',
      count: 14,
      displayW: 52,
      displayH: 52,
      flipX: true,
      alpha: 0.9,
    },
    {
      key: 'plains_grass_tuft_variant_2',
      file: '/assets/environment/plains/grass-tuft-variant-2.png',
      count: 12,
      displayW: 52,
      displayH: 52,
      flipX: true,
      alpha: 0.9,
    },
    {
      key: 'plains_grass_tuft_variant_3',
      file: '/assets/environment/plains/grass-tuft-variant-3.png',
      count: 12,
      displayW: 52,
      displayH: 52,
      flipX: true,
      alpha: 0.9,
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
    },
    {
      key: 'plains_wildflower_patch_variant_2',
      file: '/assets/environment/plains/wildflower-patch-variant-2.png',
      count: 4,
      displayW: 50,
      displayH: 50,
      flipX: true,
      alpha: 0.8,
    },
    {
      key: 'plains_wildflower_patch_variant_3',
      file: '/assets/environment/plains/wildflower-patch-variant-3.png',
      count: 4,
      displayW: 50,
      displayH: 50,
      flipX: true,
      alpha: 0.8,
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
  "node-5-5": [
    {
      featureId: "rune_altar",
      key: "rune_altar",
      file: "/assets/environment/rune_altar.png",
    },
  ],
  "node-10-0": [
    {
      featureId: "abyssal_throne",
      key: "abyssal_throne",
      file: "/assets/environment/abyssal_throne.png",
      openKey: "abyssal_throne_open",
      openFile: "/assets/environment/void_throne_open.png",
    },
  ],
};
