import { RECIPE_DATABASE } from '../data/recipes';
import { ITEM_DATABASE } from '../itemDatabase';
import { ESSENCE_LABELS, type EssenceType } from '../items';
import type { PlayerView } from '../protocol/views';
import { QUEST_DATABASE } from '../quests/questDatabase';
import { bossClearKey } from '../systems/biomeProgress';
import {
  getMaxUpgrade,
  requiredBiomeLevelForUpgrade,
  upgradeCatalystCostFor,
  upgradeCeilingFromGlobalMastery,
  upgradeCostFor,
} from '../systems/itemUpgrades';
import { catalystFamilyLabel } from '../world/nodeModifiers';
import type { TutorialCondition, TutorialProgressRef, TutorialUpgradeTarget } from './types';

/** The slice of the local player's view the guide reads. Both the client and the bot compose a full `PlayerView`. */
export type TutorialView = Pick<
  PlayerView,
  | 'nodeId'
  | 'hp'
  | 'maxHp'
  | 'isDead'
  | 'playerTier'
  | 'selectedClass'
  | 'biomeLevel'
  | 'globalMastery'
  | 'unlockedRecipes'
  | 'essences'
  | 'catalysts'
  | 'inventory'
  | 'equipment'
  | 'itemUpgrades'
  | 'questProgress'
  | 'runesEquipped'
  | 'runeRecipesCrafted'
  | 'knownAbilities'
  | 'attunedAbilities'
  | 'bossesCleared'
  | 'clearedNodes'
>;

export function viewHasItem(view: Pick<TutorialView, 'inventory' | 'equipment'>, definitionId: string): boolean {
  return view.inventory.includes(definitionId)
    || Object.values(view.equipment).some((id) => id === definitionId);
}

export function viewCanAffordRecipe(view: TutorialView, recipeId: string): boolean {
  const recipe = RECIPE_DATABASE.get(recipeId);
  if (!recipe) return false;
  for (const [type, amount] of Object.entries(recipe.cost)) {
    if ((view.essences[type as EssenceType] ?? 0) < (amount ?? 0)) return false;
  }
  for (const [family, amount] of Object.entries(recipe.catalystCost ?? {})) {
    if ((view.catalysts[family] ?? 0) < (amount ?? 0)) return false;
  }
  return true;
}

export interface RemainingUpgradeCost {
  /** Every remaining level is open (owned item, Global Mastery, biome level, not past max). */
  gatesOpen: boolean;
  essence: Partial<Record<EssenceType, number>>;
  catalysts: Record<string, number>;
}

/** What is still to pay to take every item from its current level to its target. */
export function remainingUpgradeCost(
  view: Pick<TutorialView, 'inventory' | 'equipment' | 'itemUpgrades' | 'globalMastery' | 'biomeLevel'>,
  items: readonly TutorialUpgradeTarget[],
): RemainingUpgradeCost {
  const out: RemainingUpgradeCost = { gatesOpen: true, essence: {}, catalysts: {} };
  for (const target of items) {
    const item = ITEM_DATABASE.get(target.definitionId);
    const current = view.itemUpgrades[target.definitionId] ?? 0;
    if (current >= target.toPlus) continue;
    if (!item || !item.biomeGroup || !viewHasItem(view, target.definitionId)) {
      out.gatesOpen = false;
      continue;
    }
    if (target.toPlus > getMaxUpgrade(item)
      || target.toPlus > upgradeCeilingFromGlobalMastery(view.globalMastery, item.tier)) {
      out.gatesOpen = false;
    }
    for (let plus = current + 1; plus <= target.toPlus; plus += 1) {
      if ((view.biomeLevel[item.biomeGroup] ?? 0) < requiredBiomeLevelForUpgrade(item, plus)) out.gatesOpen = false;
      for (const [type, amount] of Object.entries(upgradeCostFor(item, plus) ?? {})) {
        const key = type as EssenceType;
        out.essence[key] = (out.essence[key] ?? 0) + (amount ?? 0);
      }
      for (const [family, amount] of Object.entries(upgradeCatalystCostFor(item, plus) ?? {})) {
        out.catalysts[family] = (out.catalysts[family] ?? 0) + (amount ?? 0);
      }
    }
  }
  return out;
}

export function viewCanAffordUpgrades(view: TutorialView, items: readonly TutorialUpgradeTarget[]): boolean {
  const remaining = remainingUpgradeCost(view, items);
  if (!remaining.gatesOpen) return false;
  for (const [type, amount] of Object.entries(remaining.essence)) {
    if ((view.essences[type as EssenceType] ?? 0) < (amount ?? 0)) return false;
  }
  for (const [family, amount] of Object.entries(remaining.catalysts)) {
    if ((view.catalysts[family] ?? 0) < amount) return false;
  }
  return true;
}

export function evaluateTutorialCondition(condition: TutorialCondition, view: TutorialView): boolean {
  switch (condition.type) {
    case 'playerTierAtLeast':
      return view.playerTier >= condition.tier;
    case 'classSelected':
      return view.selectedClass !== null;
    case 'biomeLevelAtLeast':
      return (view.biomeLevel[condition.biomeGroup] ?? 0) >= condition.level;
    case 'globalMasteryAtLeast':
      return view.globalMastery >= condition.value;
    case 'essenceAtLeast':
      return (view.essences[condition.essence] ?? 0) >= condition.amount;
    case 'catalystAtLeast':
      return (view.catalysts[condition.family] ?? 0) >= condition.amount;
    case 'recipeUnlocked':
      return view.unlockedRecipes.includes(condition.recipeId);
    case 'canCraft': {
      const recipe = RECIPE_DATABASE.get(condition.recipeId);
      return !!recipe
        && !recipe.evolvesFrom
        && view.unlockedRecipes.includes(condition.recipeId)
        && viewCanAffordRecipe(view, condition.recipeId);
    }
    case 'hasItem':
      return viewHasItem(view, condition.definitionId);
    case 'equipped':
      return Object.values(view.equipment).includes(condition.definitionId);
    case 'itemAtLeastPlus':
      return viewHasItem(view, condition.definitionId)
        && (view.itemUpgrades[condition.definitionId] ?? 0) >= condition.plus;
    case 'abilityKnown':
      return view.knownAbilities.includes(condition.abilityId);
    case 'runeRecipeCrafted':
      return view.runeRecipesCrafted.includes(condition.recipeId);
    case 'bossCleared':
      return view.bossesCleared.includes(bossClearKey(condition.biomeGroup, condition.tier));
    case 'canAffordUpgrades':
      return viewCanAffordUpgrades(view, condition.items);
    case 'allOf':
      return condition.of.every((c) => evaluateTutorialCondition(c, view));
    case 'anyOf':
      return condition.of.some((c) => evaluateTutorialCondition(c, view));
    case 'not':
      return !evaluateTutorialCondition(condition.of, view);
  }
}

export interface TutorialProgress {
  current: number;
  target: number;
  label: string;
}

function essenceProgress(view: TutorialView, type: EssenceType, target: number): TutorialProgress {
  return {
    current: Math.min(view.essences[type] ?? 0, target),
    target,
    label: `${ESSENCE_LABELS[type]} essence`,
  };
}

/** "current / target" rows for a waiting beat. Rows that are already met are kept, so the bar reads full. */
export function tutorialProgress(ref: TutorialProgressRef, view: TutorialView): TutorialProgress[] {
  switch (ref.type) {
    case 'questKills': {
      const quest = QUEST_DATABASE.get(ref.questId);
      if (!quest) return [];
      return [{
        current: Math.min(view.questProgress[ref.questId] ?? 0, quest.killsRequired),
        target: quest.killsRequired,
        label: quest.name,
      }];
    }
    case 'biomeLevel':
      return [{
        current: Math.min(view.biomeLevel[ref.biomeGroup] ?? 0, ref.level),
        target: ref.level,
        label: 'Mastery level',
      }];
    case 'essenceFor': {
      const recipe = RECIPE_DATABASE.get(ref.recipeId);
      if (!recipe) return [];
      return Object.entries(recipe.cost)
        .map(([type, amount]) => essenceProgress(view, type as EssenceType, amount ?? 0));
    }
    case 'essence':
      return [essenceProgress(view, ref.essence, ref.amount)];
    case 'catalyst':
      return [{
        current: Math.min(view.catalysts[ref.family] ?? 0, ref.amount),
        target: ref.amount,
        label: catalystFamilyLabel(ref.family),
      }];
    case 'upgradeCost': {
      const remaining = remainingUpgradeCost(view, ref.items);
      return [
        ...Object.entries(remaining.essence)
          .filter(([, amount]) => (amount ?? 0) > 0)
          .map(([type, amount]) => essenceProgress(view, type as EssenceType, amount ?? 0)),
        ...Object.entries(remaining.catalysts)
          .filter(([, amount]) => amount > 0)
          .map(([family, amount]) => ({
            current: Math.min(view.catalysts[family] ?? 0, amount),
            target: amount,
            label: catalystFamilyLabel(family),
          })),
      ];
    }
  }
}
