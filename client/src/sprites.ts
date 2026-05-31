import type { PlayerView } from "@mmo-idle/shared";
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

// ── Auto-combat thought bubble (telegraphs a player's next action) ────────────
export const THOUGHT_BUBBLE_KEY = "thought_bubble";
export const THOUGHT_MASK_KEY = "thought_bubble_mask";
export const THOUGHT_BUBBLE_FILE = "/assets/emotes/thoughts/thought.png";
export const THOUGHT_MASK_FILE = "/assets/emotes/thoughts/thought_mask.png";

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
  plains: "biome_plains",
  swamp: "biome_swamp",
  cave: "biome_cave",
  jungle: "biome_jungle",
  tundra: "biome_tundra",
  desert: "biome_desert",
  volcanic: "biome_volcano",
  necropolis: "biome_necropolis",
  abyss: "biome_abyss",
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
  "node-9-0": [
    {
      featureId: "abyssal_throne",
      key: "abyssal_throne",
      file: "/assets/environment/abyssal_throne.png",
      openKey: "abyssal_throne_open",
      openFile: "/assets/environment/void_throne_open.png",
    },
  ],
};
