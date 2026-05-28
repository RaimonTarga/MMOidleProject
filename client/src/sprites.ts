import type { PlayerView } from '@mmo-idle/shared';
import {
  MONSTER_FRAMES,
  PLAYER_FRAMES,
  resolveMonsterFrame,
  resolvePlayerFrame,
} from '@mmo-idle/shared';

export const ATLAS_KEY = 'game-atlas';

export { MONSTER_FRAMES, PLAYER_FRAMES, resolveMonsterFrame, resolvePlayerFrame };

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
  { minLevel:  0, color: 0x000000 },
  { minLevel:  1, color: 0xff4444 },
  { minLevel:  2, color: 0xff8800 },
  { minLevel:  3, color: 0xffee00 },
  { minLevel:  4, color: 0x44ff88 },
  { minLevel:  5, color: 0x00ddcc },
  { minLevel:  6, color: 0x4488ff },
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
  'clearing': 'biome_clearing',
  'forest':   'biome_forest',
  'mountain': 'biome_mountain',
  'plains':   'biome_plains',
  'swamp':    'biome_swamp',
  'cave':     'biome_cave',
  'jungle':   'biome_jungle',
  'tundra':   'biome_tundra',
  'desert':   'biome_desert',
  'volcanic': 'biome_volcano',
  'necropolis': 'biome_necropolis',
  'abyss':    'biome_abyss',
};
