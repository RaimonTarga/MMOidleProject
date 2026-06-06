import type { NodeBiomeInfo } from '@mmo-idle/shared';

export const GRID_ROWS = 11;
export const GRID_COLS = 11;
export const VIEWPORT = 5;
export const MAX_VIEW_R = GRID_ROWS - VIEWPORT;
export const MAX_VIEW_C = GRID_COLS - VIEWPORT;

export const BIOME_TILE_COLORS: Record<string, string> = {
  clearing:   '#2e5e2e',
  forest:     '#1a4018',
  mountain:   '#3e3e50',
  plains:     '#4e5e1a',
  swamp:      '#1a3a0c',
  cave:       '#1a1a24',
  jungle:     '#0c3014',
  tundra:     '#222e48',
  desert:     '#5a4010',
  volcanic:   '#4a1010',
  graveyard: '#1e0e2a',
  trench:     '#001a4d',
};

export function tileColor(biomeGroup: string): string {
  return BIOME_TILE_COLORS[biomeGroup] ?? '#1a1a2e';
}

/**
 * Maps a biomeGroup to its frame name in the biome atlas (/assets/biomes.png).
 * Frame names default to the group id; edit here if the packed names differ.
 * Until the atlas ships, BiomeIcon resolves these to nothing and the colored
 * tile + name fallback renders instead.
 */
export const BIOME_ICONS: Record<string, string> = {
  clearing:  'clearing',
  forest:    'forest',
  mountain:  'mountain',
  plains:    'plains',
  swamp:     'swamp',
  cave:      'cave',
  jungle:    'jungle',
  tundra:    'tundra',
  desert:    'desert',
  volcanic:  'volcanic',
  graveyard: 'graveyard',
  trench:    'trench',
};

/** Map badge for dungeon nodes — Void Overlord throne uses a distinct label. */
export function dungeonBadgeLabel(info: NodeBiomeInfo | undefined): string | null {
  if (!info?.isDungeon) return null;
  return info.bossTypeId === 'void-overlord' ? 'THRONE' : 'DUNGEON';
}
export function hexDot(hex: number): string {
  return `#${hex.toString(16).padStart(6, '0')}`;
}
