import type { EquipmentSlot } from '@mmo-idle/shared';
import { BIOME_DATABASE } from '@mmo-idle/shared';

export const SLOT_LABELS: Record<EquipmentSlot, string> = {
  weapon:   'Weapon',
  armor:    'Armor',
  recovery: 'Recovery',
  mobility: 'Boots',
  core:     'Core',
  relic:    'Relic',
};

export const STAT_LABELS: Record<string, string> = {
  attack:          'ATK',
  defense:         'DEF',
  maxHp:           'HP',
  hpRegen:         'REGEN',
  speed:           'SPD',
  attackRange:     'RNG',
  attackCooldown:  'CD',
  plating:         'PLT',
  damageReduction: 'DR',
};

// Matches PLAYER_SHADOW_RAMP in sprites.ts
const TIER_COLORS: Record<number, string> = {
  0: '#444444',
  1: '#ff4444',
  2: '#ff8800',
  3: '#ffee00',
  4: '#44ff88',
  5: '#00ddcc',
  6: '#4488ff',
};

export function tierColor(tier: number): string {
  return TIER_COLORS[tier] ?? '#444444';
}

export function biomeName(group: string): string {
  const biome = BIOME_DATABASE.get(group);
  return biome ? biome.name : group.charAt(0).toUpperCase() + group.slice(1);
}
