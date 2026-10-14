import type { EssenceType, ItemDefinition } from '../items';
import { BIOME_PRIMARY_ESSENCE } from '../items';
import { BIOME_LEVELS_PER_TIER, maxGlobalMasteryAtTier } from '../config/gameConfig';
import { t1ExperimentUpgradeCost } from './t1EconomyExperiment';

/**
 * The item +N ladder — RETIRED on every slot (design §24.5).
 *
 * Weapons left it in progression rework Phase 2b; armour, charm and boots left it
 * in the course correction, where each item's +1..+5 total folded into its base
 * stats (design §23's rule for weapons, applied to every slot: an item is crafted
 * at its old +5 power). One rule for four slots now: `getMaxUpgrade` is 0,
 * `checkUpgrade` refuses, `inventory:upgradeItem` answers with that refusal, the
 * stat rebuild never reads `itemUpgrades`, and hydration refunds any level a save
 * still holds (`server/src/db/{weapon,gear}UpgradeRefund.ts`).
 *
 * What survives here is not the ladder:
 *  - The Global Mastery band below (`MAX_UPGRADE`, `globalMasteryRequiredForUpgrade`,
 *    `upgradeCeilingFromGlobalMastery`) still prices the bot's GM milestones.
 *  - The step readers (`upgradeStatBonusTotal`, `upgradeMechanicEffectsTotal`,
 *    `upgradeCostFor`, `requiredBiomeLevelForUpgrade`) read whatever `upgrades`
 *    steps a recipe still authors, for the legacy bot routes, the balance tools and
 *    economy tests. Nothing in the game applies them.
 */

/** The five-step width of the Global Mastery band per item tier (see above). */
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

// ─── Generic cost formula (legacy readers of items without explicit steps) ────

const COST_PER_LEVEL = 20;

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Per-item max upgrade level: 0 for every item. The ladder is retired on every
 * slot (design §24.5; weapons since Phase 2b, cores and relics never had one).
 */
export function getMaxUpgrade(_item: ItemDefinition): number {
  return 0;
}

/** Biome level required to push an item to `targetPlus`. */
export function requiredBiomeLevelForUpgrade(item: ItemDefinition, targetPlus: number): number {
  if (item.slot === 'weapon') return 999;
  if (item.upgrades) {
    return item.upgrades[targetPlus - 1]?.requiredBiomeLevel ?? 999;
  }
  return (item.tier - 1) * BIOME_LEVELS_PER_TIER + 1 + targetPlus;
}

/**
 * Cumulative stat deltas the item's AUTHORED steps carry up to `plus` — a reader
 * of historical ladder data, applied by nothing in the game (see the header).
 *
 * An item with no authored steps reads as no bonus. The generic per-slot formula
 * that used to answer for it is gone with the ladder: once the recipe ladders are
 * folded into base stats, it would have handed a stale `+N` a second bonus.
 */
export function upgradeStatBonusTotal(item: ItemDefinition, plus: number): Record<string, number> {
  if (plus <= 0 || !item.upgrades) return {};
  const totals: Record<string, number> = {};
  for (let i = 0; i < plus && i < item.upgrades.length; i++) {
    for (const [k, v] of Object.entries(item.upgrades[i].stats ?? {})) {
      if (v !== undefined) totals[k] = (totals[k] ?? 0) + v;
    }
  }
  return totals;
}

/** Authored mechanics plus all earned upgrade steps, for equipment feedback. */
export function itemMechanicEffectsAt(item: ItemDefinition, plus: number): Record<string, number> {
  const effects: Record<string, number> = { ...item.mechanicEffects };
  for (const [key, value] of Object.entries(upgradeMechanicEffectsTotal(item, plus))) effects[key] = (effects[key] ?? 0) + value;
  return effects;
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
 * Cumulative `attacksPerSecond` delta for an item at `plus` (0 when the item
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

/**
 * Essence cost for going from (targetPlus-1) → targetPlus. RETIRED with the
 * ladder: no live server, client or tutorial path calls it. Kept for the legacy
 * bot routes (`bot/src/route/*`, `bot/src/reference.ts`) and economy tests; the
 * refund tables freeze their own copies of these numbers.
 */
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

export interface UpgradeCheck {
  ok: boolean;
  reason?: string;
}

/** Why `checkUpgrade` refuses, for every item. */
export const UPGRADES_RETIRED_REASON =
  'Upgrades are retired: every item is crafted at full power.';

/**
 * Shared authority check — the server applies it and the bot gates on it. One
 * rule for every slot: refused (design §24.5). The parameters are kept so the
 * legacy callers type-check unchanged.
 */
export function checkUpgrade(_params: {
  item: ItemDefinition;
  currentPlus: number;
  biomeLevel: number;
  essences: Record<EssenceType, number>;
  /** Global Mastery — opens the upgrade ceiling. Absent → ceiling non-binding. */
  globalMastery?: number;
  /** Optional per-player dev experiment overlay for T1 +5 essence pricing. */
  t1Plus5EssenceCostMultiplier?: number;
}): UpgradeCheck {
  return { ok: false, reason: UPGRADES_RETIRED_REASON };
}
