import type { EquipmentSlot, EssenceType, ItemDefinition } from '../items';
import { BIOME_PRIMARY_ESSENCE } from '../items';

/** Highest upgrade level for items without explicit upgrade definitions. */
export const MAX_UPGRADE = 3;

/** Primary stat each slot's generic upgrade buffs. */
export const UPGRADE_STAT_BY_SLOT: Record<EquipmentSlot, string> = {
  weapon:   'attack',
  armor:    'damageReduction',
  mobility: 'speed',
  recovery: 'hpRegen',
};

// ─── Generic formula tuning (fallback for items without explicit upgrades) ────

const BONUS_PER_LEVEL: Record<EquipmentSlot, number> = {
  weapon:   2,
  armor:    0.02,
  mobility: 5,
  recovery: 1,
};

const COST_PER_LEVEL = 20;

// ─────────────────────────────────────────────────────────────────────────────

/** Per-item max upgrade level — upgrades[].length or MAX_UPGRADE for generic items. */
export function getMaxUpgrade(item: ItemDefinition): number {
  return item.upgrades ? item.upgrades.length : MAX_UPGRADE;
}

/** Biome level required to push an item to `targetPlus`. */
export function requiredBiomeLevelForUpgrade(item: ItemDefinition, targetPlus: number): number {
  if (item.upgrades) {
    return item.upgrades[targetPlus - 1]?.requiredBiomeLevel ?? 999;
  }
  return (item.tier - 1) * 4 + 1 + targetPlus;
}

/**
 * Cumulative stat bonuses (additive deltas on base stats) for an item at `plus`.
 * Returns a record of stat key → total bonus across all steps up to and including `plus`.
 */
export function upgradeStatBonusTotal(item: ItemDefinition, plus: number): Record<string, number> {
  if (plus <= 0) return {};
  if (item.upgrades) {
    const totals: Record<string, number> = {};
    for (let i = 0; i < plus && i < item.upgrades.length; i++) {
      for (const [k, v] of Object.entries(item.upgrades[i].stats ?? {})) {
        if (v !== undefined) totals[k] = (totals[k] ?? 0) + v;
      }
    }
    return totals;
  }
  // Generic fallback: single primary stat for the slot.
  const slot = item.slot;
  return { [UPGRADE_STAT_BY_SLOT[slot]]: BONUS_PER_LEVEL[slot] * item.tier * plus };
}

/**
 * Cumulative mechanic effect bonuses for an item at `plus`.
 * Only applies to items with explicit upgrade definitions.
 */
export function upgradeMechanicEffectsTotal(item: ItemDefinition, plus: number): Record<string, number> {
  if (plus <= 0 || !item.upgrades) return {};
  const totals: Record<string, number> = {};
  for (let i = 0; i < plus && i < item.upgrades.length; i++) {
    for (const [k, v] of Object.entries(item.upgrades[i].mechanicEffects ?? {})) {
      totals[k] = (totals[k] ?? 0) + v;
    }
  }
  return totals;
}

/** Essence cost for going from (targetPlus-1) → targetPlus. */
export function upgradeCostFor(
  item: ItemDefinition,
  targetPlus: number,
): Partial<Record<EssenceType, number>> | null {
  if (item.upgrades) {
    const step = item.upgrades[targetPlus - 1];
    return step ? step.cost : null;
  }
  if (!item.biomeGroup) return null;
  const type = BIOME_PRIMARY_ESSENCE[item.biomeGroup];
  if (!type) return null;
  return { [type]: COST_PER_LEVEL * item.tier * targetPlus };
}

export interface UpgradeCheck {
  ok: boolean;
  reason?: string;
}

/** Shared authority check — used by both server (to apply) and client (to gate the button). */
export function checkUpgrade(params: {
  item: ItemDefinition;
  currentPlus: number;
  biomeLevel: number;
  essences: Record<EssenceType, number>;
}): UpgradeCheck {
  const { item, currentPlus, biomeLevel, essences } = params;
  if (!item.biomeGroup) return { ok: false, reason: 'This item cannot be upgraded.' };
  if (currentPlus >= getMaxUpgrade(item)) return { ok: false, reason: 'Already at maximum upgrade.' };

  const targetPlus = currentPlus + 1;
  const reqLevel = requiredBiomeLevelForUpgrade(item, targetPlus);
  if (biomeLevel < reqLevel) {
    return { ok: false, reason: `Requires ${item.biomeGroup} level ${reqLevel}.` };
  }

  const cost = upgradeCostFor(item, targetPlus);
  if (!cost) return { ok: false, reason: 'This item cannot be upgraded.' };
  for (const [type, amount] of Object.entries(cost)) {
    if ((essences[type as EssenceType] ?? 0) < (amount ?? 0)) {
      return { ok: false, reason: `Not enough ${type} essence (need ${amount}).` };
    }
  }
  return { ok: true };
}
