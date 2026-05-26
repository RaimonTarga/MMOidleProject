import type { ItemStats } from '@mmo-idle/shared';

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
  necropolis: '#1e0e2a',
  abyss:      '#0a0612',
};

export function tileColor(biomeGroup: string): string {
  return BIOME_TILE_COLORS[biomeGroup] ?? '#1a1a2e';
}
export function hexDot(hex: number): string {
  return `#${hex.toString(16).padStart(6, '0')}`;
}
const STAT_LABELS: Record<string, string> = {
  attack: 'ATK', defense: 'DEF', maxHp: 'HP',
  hpRegen: 'REGEN', speed: 'SPD', attackRange: 'RNG', attackCooldown: 'CD',
};
export function formatStat(stats: Partial<ItemStats>): string {
  return Object.entries(stats)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `+${v} ${STAT_LABELS[k] ?? k}`)
    .join(' · ');
}
