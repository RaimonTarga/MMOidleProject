import { BIOME_DATABASE, type ItemStats } from '@mmo-idle/shared';

export const SLOT_LABELS: Record<string, string> = {
  weapon: 'Weapon', armor: 'Armor', recovery: 'Recovery', mobility: 'Boots',
};

export const SLOT_ABBR: Record<string, string> = {
  weapon: 'WPN', armor: 'ARM', recovery: 'RCV', mobility: 'MOB',
};

const STAT_LABELS: Record<string, string> = {
  attack: 'ATK', defense: 'DEF', maxHp: 'HP',
  hpRegen: 'REGEN', speed: 'SPD', attackRange: 'RNG', attackCooldown: 'CD ms',
};

export function getStatEntries(stats: Partial<ItemStats>, aps?: number): { value: string; label: string }[] {
  const entries: { value: string; label: string }[] = [];
  if (aps !== undefined) entries.push({ value: String(aps), label: 'APS' });
  for (const [k, v] of Object.entries(stats)) {
    if (v !== undefined) {
      entries.push({ value: `${(v as number) >= 0 ? '+' : ''}${v}`, label: STAT_LABELS[k] ?? k });
    }
  }
  return entries;
}

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
