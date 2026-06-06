import { BIOME_DATABASE } from '@mmo-idle/shared';

export const SLOT_LABELS: Record<string, string> = {
  weapon: 'Weapon', armor: 'Armor', recovery: 'Recovery', mobility: 'Boots',
};

export const SLOT_ABBR: Record<string, string> = {
  weapon: 'WPN', armor: 'ARM', recovery: 'RCV', mobility: 'MOB',
};

// Stat labels/formatting live in ./itemDisplay (STAT_META) — the single source
// of truth shared by the Forge, Upgrade, Biome, and inventory stat panels.

export function biomeName(group: string): string {
  const biome = BIOME_DATABASE.get(group);
  if (biome) return biome.name;
  return group.charAt(0).toUpperCase() + group.slice(1);
}

const TIER_COLORS: Record<number, string> = {
  0: '#444444', 1: '#ff4444', 2: '#ff8800',
  3: '#ffee00', 4: '#44ff88', 5: '#00ddcc', 6: '#4488ff',
};

export function tierColor(tier: number): string {
  return TIER_COLORS[tier] ?? '#444444';
}
