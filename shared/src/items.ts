// ─── Essence types ────────────────────────────────────────────────────────────

export type EssenceType = 'red' | 'blue' | 'green' | 'yellow' | 'purple';
export const ESSENCE_TYPES: readonly EssenceType[] = ['red', 'blue', 'green', 'yellow', 'purple'] as const;

export const ESSENCE_COLORS: Record<EssenceType, string> = {
  red:    '#ff5544',
  blue:   '#4488ff',
  green:  '#44dd88',
  yellow: '#ffdd44',
  purple: '#bb55ff',
};

/** Primary essence produced by each biome — used by recipes for their main cost. */
export const BIOME_PRIMARY_ESSENCE: Record<string, EssenceType> = {
  clearing: 'green',
  forest:   'green',
  mountain: 'blue',
  plains:   'yellow',
  swamp:    'purple',
  cave:     'blue',
  jungle:   'green',
  tundra:   'blue',
  desert:   'yellow',
  volcanic: 'red',
};

// ─── Equipment slots ──────────────────────────────────────────────────────────

export type EquipmentSlot = 'weapon' | 'armor' | 'recovery' | 'mobility' | 'ring1' | 'ring2';

export const EQUIPMENT_SLOTS: EquipmentSlot[] = [
  'weapon', 'armor', 'recovery', 'mobility', 'ring1', 'ring2',
];

/** Null in a slot means nothing is equipped there. */
export type EquipmentMap = Record<EquipmentSlot, string | null>;

export function emptyEquipment(): EquipmentMap {
  return { weapon: null, armor: null, recovery: null, mobility: null, ring1: null, ring2: null };
}

// ─── Item stat modifiers ──────────────────────────────────────────────────────

/** Typed stat keys that items can modify. Mirrors relevant PlayerState fields. */
export interface ItemStats {
  attack?: number;
  defense?: number;
  maxHp?: number;
  hpRegen?: number;
  speed?: number;
  attackRange?: number;
  attackCooldown?: number;
}

// ─── Item definition ──────────────────────────────────────────────────────────

/**
 * A static item template shared by all instances of that item.
 * statModifiers keys map directly to PlayerState stat field names:
 *   attack | defense | attackRange | attackCooldown | maxHp | hpRegen | speed
 */
export interface ItemDefinition {
  id: string;
  name: string;
  slot: EquipmentSlot;
  tier: number;
  statModifiers: Record<string, number>;
  /**
   * Weapons only. Sets the player's base attack cooldown to `round(1000 / aps)` ms
   * when this weapon is equipped. Skills and other equipment still modify the result
   * as additive deltas. Omit on non-weapon items.
   */
  attacksPerSecond?: number;
  description?: string;
}
