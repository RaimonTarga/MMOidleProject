import type { EquipmentSlot, EssenceType, ItemDefinition } from '../items';
import { BIOME_PRIMARY_ESSENCE, ESSENCE_LABELS } from '../items';
import { BIOME_LEVELS_PER_TIER, maxGlobalMasteryAtTier } from '../config/gameConfig';
import { t1ExperimentUpgradeCost } from './t1EconomyExperiment';

/**
 * Highest upgrade level for items without explicit upgrade definitions. Raised
 * 3 → 5 (system rework Step 6): +3 = evolution-ready, +4 = comfort, +5 = premium.
 * Items with explicit `upgrades[]` are bound by their array length; the GM ceiling
 * (`upgradeCeilingFromGlobalMastery`) gates the effective max on top of this.
 */
export const MAX_UPGRADE = 5;

/** Highest item tier the GM ceiling distinguishes; tier-0 starter gear shares tier 1's band. */
export const MAX_ITEM_TIER = 4;

/**
 * Global Mastery required to push a tier-`itemTier` item to `targetPlus`.
 *
 * Each item tier owns a GM band: (max GM attainable at tier-1, max GM at tier],
 * derived from {@link maxGlobalMasteryAtTier}. The +1…+5 unlocks are spread
 * evenly across the band, so a tier's +5 opens exactly when every biome
 * available at that tier is fully mastered. Tier 1 (band 0–30): +1@6 … +5@30.
 * Tier 2 (band 31–72): +1@38 … +5@72. Intermediate steps round to integers.
 *
 * Since the T3 economy pass (2026-08-30) `biomeLevelCap` clamps retired biomes, so the
 * higher bands finally describe reachable content: tier 3 (band 73–114): +1@80 … +5@114;
 * tier 4 (band 115–156): +1@122 … +5@156. Every tier's +5 is attainable from the biomes
 * that tier can actually be played in — no retired-biome debt.
 */
export function globalMasteryRequiredForUpgrade(itemTier: number, targetPlus: number): number {
  const tier = Math.max(1, itemTier);
  const base = maxGlobalMasteryAtTier(tier - 1);
  const band = maxGlobalMasteryAtTier(tier) - base;
  const plus = Math.min(Math.max(0, targetPlus), MAX_UPGRADE);
  return base + Math.round((band * plus) / MAX_UPGRADE);
}

/**
 * Global-Mastery-derived ceiling on upgrade level for items of `itemTier`.
 * Structural item caps still apply on top.
 */
export function upgradeCeilingFromGlobalMastery(globalMastery: number, itemTier: number): number {
  let ceiling = 0;
  for (let plus = 1; plus <= MAX_UPGRADE; plus++) {
    if (globalMastery < globalMasteryRequiredForUpgrade(itemTier, plus)) break;
    ceiling = plus;
  }
  return ceiling;
}

/** Primary stat each slot's generic upgrade buffs. (Cores never upgrade — see getMaxUpgrade.) */
export const UPGRADE_STAT_BY_SLOT: Record<EquipmentSlot, string> = {
  weapon:   'attack',
  armor:    'damageReduction',
  mobility: 'speed',
  recovery: 'recovery',
  core:     'attack',
  relic:    'attack',
};

// ─── Generic formula tuning (fallback for items without explicit upgrades) ────

const BONUS_PER_LEVEL: Record<EquipmentSlot, number> = {
  weapon:   2,
  armor:    0.02,
  mobility: 5,
  recovery: 1,
  core:     0,
  relic:    0,
};

const COST_PER_LEVEL = 20;

// ─────────────────────────────────────────────────────────────────────────────

/** Per-item max upgrade level — upgrades[].length or MAX_UPGRADE for generic items.
 *  Cores (Step 9) are off the +N track entirely — they rank up via the evolution chain. */
export function getMaxUpgrade(item: ItemDefinition): number {
  if (item.slot === 'core' || item.slot === 'relic') return 0;
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

/**
 * Cumulative `attacksPerSecond` delta for an item at `plus` (0 when the lineage
 * spends nothing on cadence). Weapons only; summed like every other upgrade delta.
 */
export function upgradeApsBonusTotal(item: ItemDefinition, plus: number): number {
  if (plus <= 0 || !item.upgrades) return 0;
  let total = 0;
  for (let i = 0; i < plus && i < item.upgrades.length; i++) {
    total += item.upgrades[i].attacksPerSecond ?? 0;
  }
  return total;
}

/**
 * The weapon's effective attacks-per-second at `plus`, or undefined when it
 * authors no cadence at all (unarmed keeps GAME_CONFIG.PLAYER_ATTACK_COOLDOWN).
 */
export function effectiveAttacksPerSecond(
  item: ItemDefinition,
  plus: number,
): number | undefined {
  if (!item.attacksPerSecond) return undefined;
  return Math.max(0.05, item.attacksPerSecond + upgradeApsBonusTotal(item, plus));
}

/** Essence cost for going from (targetPlus-1) → targetPlus. */
export function upgradeCostFor(
  item: ItemDefinition,
  targetPlus: number,
  t1Plus5EssenceCostMultiplier?: number,
): Partial<Record<EssenceType, number>> | null {
  const experimentCost = t1ExperimentUpgradeCost(
    item,
    targetPlus,
    t1Plus5EssenceCostMultiplier,
  );
  if (experimentCost) return experimentCost;
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
  /** Optional per-player dev experiment overlay for T1 +5 essence pricing. */
  t1Plus5EssenceCostMultiplier?: number;
}): UpgradeCheck {
  const {
    item,
    currentPlus,
    biomeLevel,
    essences,
    catalysts,
    globalMastery,
    t1Plus5EssenceCostMultiplier,
  } = params;
  const targetPlus = currentPlus + 1;
  if (!item.biomeGroup) return { ok: false, reason: 'This item cannot be upgraded.' };
  if (currentPlus >= getMaxUpgrade(item)) return { ok: false, reason: 'Already at maximum upgrade.' };
  if (globalMastery !== undefined && targetPlus > upgradeCeilingFromGlobalMastery(globalMastery, item.tier)) {
    return {
      ok: false,
      reason: `Requires Global Mastery ${globalMasteryRequiredForUpgrade(item.tier, targetPlus)}.`,
    };
  }

  const reqLevel = requiredBiomeLevelForUpgrade(item, targetPlus);
  if (biomeLevel < reqLevel) {
    return { ok: false, reason: `Requires ${item.biomeGroup} level ${reqLevel}.` };
  }

  const cost = upgradeCostFor(item, targetPlus, t1Plus5EssenceCostMultiplier);
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
