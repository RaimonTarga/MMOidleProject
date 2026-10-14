import { RECIPE_DATABASE } from '../data/recipes';
import { ITEM_DATABASE } from '../itemDatabase';
import { ESSENCE_LABELS, type EssenceType } from '../items';
import type { PlayerView } from '../protocol/views';
import { QUEST_DATABASE } from '../quests/questDatabase';
import { bossClearKey } from '../systems/biomeProgress';
import type { TutorialCondition, TutorialProgressRef } from './types';

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
    case 'recipeUnlocked':
      return view.unlockedRecipes.includes(condition.recipeId);
    case 'canCraft': {
      const recipe = RECIPE_DATABASE.get(condition.recipeId);
      return !!recipe
        && view.unlockedRecipes.includes(condition.recipeId)
        && viewCanAffordRecipe(view, condition.recipeId);
    }
    case 'hasItem':
      return viewHasItem(view, condition.definitionId);
    case 'equipped':
      return Object.values(view.equipment).includes(condition.definitionId);
    case 'abilityKnown':
      return view.knownAbilities.includes(condition.abilityId);
    case 'runeRecipeCrafted':
      return view.runeRecipesCrafted.includes(condition.recipeId);
    case 'bossCleared':
      return view.bossesCleared.includes(bossClearKey(condition.biomeGroup, condition.tier));
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
  }
}
