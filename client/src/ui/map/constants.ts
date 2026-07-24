import type { NodeBiomeInfo } from '@mmo-idle/shared';

export const BIOME_TILE_COLORS: Record<string, string> = {
  clearing:   '#2e5e2e',
  sanctuary:  '#24504a',
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
  abyss:      '#0a0014',
};

export function tileColor(biomeGroup: string): string {
  return BIOME_TILE_COLORS[biomeGroup] ?? '#1a1a2e';
}

/** Maps a biomeGroup to its frame name in /assets/UI_icons.png. */
export const BIOME_ICONS: Record<string, string> = {
  clearing:  'UI_icons/clearing_icon.png',
  sanctuary: 'UI_icons/sanctuary-icon.png',
  forest:    'UI_icons/forest-icon.png',
  mountain:  'UI_icons/mountain-icon.png',
  plains:    'UI_icons/plains-icon.png',
  swamp:     'UI_icons/swamp-icon.png',
  cave:      'UI_icons/cave-icon.png',
  jungle:    'UI_icons/jungle-icon.png',
  tundra:    'UI_icons/tundra-icon.png',
  desert:    'UI_icons/desert-icon.png',
  volcanic:  'UI_icons/volcano-icon.png',
  graveyard: 'UI_icons/graveyard-icon.png',
  trench:    'UI_icons/trench-icon.png',
  abyss:     'UI_icons/abyss-icon.png',
};

export const DUNGEON_ICON = 'UI_icons/map/dungeon-skull-icon.png';

const MAP_TIER_COLORS: Record<number, string> = {
  0: '#6c6c78',
  1: '#ff5656',
  2: '#ff941f',
  3: '#f3d83b',
  4: '#4dde83',
  5: '#25cfc2',
  6: '#5b91ff',
  7: '#a66cff',
  8: '#ef62d6',
};

export function mapTierColor(tier: number): string {
  return MAP_TIER_COLORS[tier] ?? MAP_TIER_COLORS[0];
}

/** Map badge for static dungeon exam nodes. */
export function dungeonBadgeLabel(info: NodeBiomeInfo | undefined): string | null {
  if (!info?.isDungeon) return null;
  return 'DUNGEON';
}
export function hexDot(hex: number): string {
  return `#${hex.toString(16).padStart(6, '0')}`;
}
