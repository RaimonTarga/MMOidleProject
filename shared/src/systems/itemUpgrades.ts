import type { EquipmentSlot, EssenceType, ItemDefinition } from '../items';
import { BIOME_PRIMARY_ESSENCE, ESSENCE_LABELS } from '../items';
import { BIOME_LEVELS_PER_TIER } from '../config/gameConfig';

/**
 * Highest upgrade level for items without explicit upgrade definitions. Raised
 * 3 → 5 (system rework Step 6): +3 = evolution-ready, +4 = comfort, +5 = premium.
 * Items with explicit `upgrades[]` are bound by their array length; the GM ceiling
 * (`upgradeCeilingFromGlobalMastery`) gates the effective max on top of this.
 */
export const MAX_UPGRADE = 5;

export const GLOBAL_MASTERY_PER_ITEM_UPGRADE = 6;

export function globalMasteryRequiredForUpgrade(targetPlus: number): number {
  return Math.max(0, targetPlus) * GLOBAL_MASTERY_PER_ITEM_UPGRADE;
}

/**
 * Global-Mastery-derived ceiling on item upgrade level.
 * Every 6 GM opens the next +N state: 0 = +0, 6 = +1, 12 = +2,
 * 18 = +3, and so on. Structural item caps still apply on top.
 */
export function upgradeCeilingFromGlobalMastery(globalMastery: number): number {
  return Math.floor(Math.max(0, globalMastery) / GLOBAL_MASTERY_PER_ITEM_UPGRADE);
}

/** Primary stat each slot's generic upgrade buffs. (Cores never upgrade — see getMaxUpgrade.) */
export const UPGRADE_STAT_BY_SLOT: Record<EquipmentSlot, string> = {
  weapon:   'attack',
  armor:    'damageReduction',
  mobility: 'speed',
  recovery: 'hpRegen',
  core:     'attack',
};

// ─── Generic formula tuning (fallback for items without explicit upgrades) ────

const BONUS_PER_LEVEL: Record<EquipmentSlot, number> = {
  weapon:   2,
  armor:    0.02,
  mobility: 5,
  recovery: 1,
  core:     0,
};

const COST_PER_LEVEL = 20;

// ─────────────────────────────────────────────────────────────────────────────

/** Per-item max upgrade level — upgrades[].length or MAX_UPGRADE for generic items.
 *  Cores (Step 9) are off the +N track entirely — they rank up via the evolution chain. */
export function getMaxUpgrade(item: ItemDefinition): number {
  if (item.slot === 'core') return 0;
  return item.upgrades ? item.upgrades.length : MAX_UPGRADE;
}

/** Biome level required to push an item to `targetPlus`. */
export function requiredBiomeLevelForUpgrade(item: ItemDefinition, targetPlus: number): number {
  if (item.upgrades) {
    return item.upgrades[targetPlus - 1]?.requiredBiomeLevel ?? 999;
  }
  return (item.tier - 1) * BIOME_LEVELS_PER_TIER + 1 + targetPlus;
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

/** Biome-catalyst cost for going from (targetPlus-1) → targetPlus. Null = none. */
export function upgradeCatalystCostFor(
  item: ItemDefinition,
  targetPlus: number,
): Partial<Record<string, number>> | null {
  if (!item.upgrades) return null;
  return item.upgrades[targetPlus - 1]?.catalystCost ?? null;
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
  /** Player's catalyst wallet, keyed by biome group. Absent treated as empty. */
  catalysts?: Record<string, number>;
  /** Global Mastery — opens the upgrade ceiling. Absent → ceiling non-binding. */
  globalMastery?: number;
}): UpgradeCheck {
  const { item, currentPlus, biomeLevel, essences, catalysts, globalMastery } = params;
  const targetPlus = currentPlus + 1;
  if (!item.biomeGroup) return { ok: false, reason: 'This item cannot be upgraded.' };
  if (currentPlus >= getMaxUpgrade(item)) return { ok: false, reason: 'Already at maximum upgrade.' };
  if (globalMastery !== undefined && targetPlus > upgradeCeilingFromGlobalMastery(globalMastery)) {
    return {
      ok: false,
      reason: `Requires Global Mastery ${globalMasteryRequiredForUpgrade(targetPlus)}.`,
    };
  }

  const reqLevel = requiredBiomeLevelForUpgrade(item, targetPlus);
  if (biomeLevel < reqLevel) {
    return { ok: false, reason: `Requires ${item.biomeGroup} level ${reqLevel}.` };
  }

  const cost = upgradeCostFor(item, targetPlus);
  if (!cost) return { ok: false, reason: 'This item cannot be upgraded.' };
  for (const [type, amount] of Object.entries(cost)) {
    if ((essences[type as EssenceType] ?? 0) < (amount ?? 0)) {
      return { ok: false, reason: `Not enough ${ESSENCE_LABELS[type as EssenceType]} essence (need ${amount}).` };
    }
  }

  const catalystCost = upgradeCatalystCostFor(item, targetPlus);
  if (catalystCost) {
    for (const [group, amount] of Object.entries(catalystCost)) {
      if ((catalysts?.[group] ?? 0) < (amount ?? 0)) {
        return { ok: false, reason: `Not enough ${group} catalysts (need ${amount}).` };
      }
    }
  }
  return { ok: true };
}
