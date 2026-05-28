import type { EquipmentSlot, EssenceType, ItemDefinition } from '../items';
import { BIOME_PRIMARY_ESSENCE } from '../items';

/** Highest upgrade level an item can reach (+0 → +MAX_UPGRADE). */
export const MAX_UPGRADE = 3;

/** Primary stat each slot's upgrade buffs. Keys map to player stat fields. */
export const UPGRADE_STAT_BY_SLOT: Record<EquipmentSlot, string> = {
  weapon:   'attack',
  armor:    'damageReduction',
  mobility: 'speed',
  recovery: 'hpRegen',
};

// ─── Tunable balance values ─────────────────────────────────────────────────
// EDIT THESE to tune upgrade strength + cost. All formulas below scale linearly
// with item tier and upgrade level so a single +N table covers every tier.

/** Flat primary-stat bonus granted per +1 level, multiplied by item tier. */
const BONUS_PER_LEVEL: Record<EquipmentSlot, number> = {
  weapon:   2,     // +2 attack × tier per level
  armor:    0.02,  // +2% damage reduction × tier per level
  mobility: 5,     // +5 speed × tier per level
  recovery: 1,     // +1 hp regen × tier per level
};

/** Essence cost of reaching a given +level, multiplied by tier × targetLevel. */
const COST_PER_LEVEL = 20;
// ────────────────────────────────────────────────────────────────────────────

/** Biome level needed to push an item of `tier` to `targetPlus` (+1..+MAX). */
export function requiredBiomeLevelForUpgrade(tier: number, targetPlus: number): number {
  return (tier - 1) * 4 + 1 + targetPlus;
}

/** Cumulative primary-stat bonus for an item sitting at `plus`. */
export function upgradeStatBonusTotal(slot: EquipmentSlot, tier: number, plus: number): number {
  if (plus <= 0) return 0;
  return BONUS_PER_LEVEL[slot] * tier * plus;
}

/** Essence type + amount to take an item from (targetPlus-1) → targetPlus. */
export function upgradeCostFor(
  item: ItemDefinition,
  targetPlus: number,
): { type: EssenceType; amount: number } | null {
  if (!item.biomeGroup) return null;
  const type = BIOME_PRIMARY_ESSENCE[item.biomeGroup];
  if (!type) return null;
  return { type, amount: COST_PER_LEVEL * item.tier * targetPlus };
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
  if (currentPlus >= MAX_UPGRADE) return { ok: false, reason: 'Already at maximum upgrade.' };

  const targetPlus = currentPlus + 1;
  const reqLevel = requiredBiomeLevelForUpgrade(item.tier, targetPlus);
  if (biomeLevel < reqLevel) {
    return { ok: false, reason: `Requires ${item.biomeGroup} level ${reqLevel}.` };
  }

  const cost = upgradeCostFor(item, targetPlus);
  if (!cost) return { ok: false, reason: 'This item cannot be upgraded.' };
  if ((essences[cost.type] ?? 0) < cost.amount) {
    return { ok: false, reason: `Not enough ${cost.type} essence (need ${cost.amount}).` };
  }
  return { ok: true };
}
