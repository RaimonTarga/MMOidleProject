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

import type { MechanicEffects } from './passives';

// ─── Equipment slots ──────────────────────────────────────────────────────────

export type EquipmentSlot = 'weapon' | 'armor' | 'recovery' | 'mobility';

export const EQUIPMENT_SLOTS: EquipmentSlot[] = [
  'weapon', 'armor', 'recovery', 'mobility',
];

/** Null in a slot means nothing is equipped there. */
export type EquipmentMap = Record<EquipmentSlot, string | null>;

export function emptyEquipment(): EquipmentMap {
  return { weapon: null, armor: null, recovery: null, mobility: null };
}

// ─── Item stat modifiers ──────────────────────────────────────────────────────

/** Typed stat keys that items can modify. Mirrors relevant PlayerSnapshot fields. */
export interface ItemStats {
  attack?: number;
  plating?: number;
  /** Percentage reduction added (0.0–1.0 range; items should use small values like 0.05). */
  damageReduction?: number;
  /** Hit threshold for evasion. Lower = more frequent dodge. */
  evasion?: number;
  maxHp?: number;
  hpRegen?: number;
  speed?: number;
  attackRange?: number;
  attackCooldown?: number;
}

// ─── Item definition ──────────────────────────────────────────────────────────

/**
 * A static item template shared by all instances of that item.
 * statModifiers keys map directly to PlayerSnapshot stat field names:
 *   attack | plating | damageReduction | evasion | attackRange | attackCooldown | maxHp | hpRegen | speed
 */
export interface ItemDefinition {
  id: string;
  name: string;
  slot: EquipmentSlot;
  tier: number;
  statModifiers: Record<string, number>;
  /**
   * Named mechanic modifiers accumulated into player.passives during stat rebuild,
   * exactly like skill node mechanicEffects. Use for defensive / recovery stats that
   * don't map to a direct PlayerSnapshot field:
   *   defense.max-hit-pct          — clamp single hit to X% of maxHp
   *   defense.hit-to-dot-pct       — redirect X% of hit damage to 4s debt
   *   defense.dot-resistance        — mitigate incoming DoT damage by X (0–1)
   *   defense.debuff-resistance     — reduce non-DoT debuff magnitude by X (0–1)
   *   defense.in-combat-regen-pct  — fraction of OOC regen applied while in combat
   *   defense.regen-burst-pct      — % maxHp healed per burst (needs interval)
   *   defense.regen-burst-interval-ms — ms between regen bursts
   *   defense.absorb-pct           — fraction of damage taken converted to HoT pool
   *   defense.shield-pct           — % maxHp shield applied on combat entry/cooldown
   *   defense.shield-interval-ms   — ms between shield applications (needs shield-pct)
   *   defense.shield-duration-ms   — ms before a shield expires even if not depleted; omit for permanent shields
   *   defense.cleanse-stacks       — stacks removed per cleanse trigger
   *   defense.cleanse-interval-ms  — ms between cleanse triggers
   */
  mechanicEffects?: MechanicEffects;
  /**
   * Weapons only. Sets the player's base attack cooldown to `round(1000 / aps)` ms
   * when this weapon is equipped. Skills and other equipment still modify the result
   * as additive deltas. Omit on non-weapon items.
   */
  attacksPerSecond?: number;
  description?: string;
}
