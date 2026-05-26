import type { Recipe } from './types';
import { clearingForestMountainRecipeEntries } from './clearingForestMountain';
import { plainsSwampCaveRecipeEntries } from './plainsSwampCave';
import { jungleTundraDesertVolcanicRecipeEntries } from './jungleTundraDesertVolcanic';

const recipeEntries: [string, Recipe][] = [
  ...clearingForestMountainRecipeEntries,
  ...plainsSwampCaveRecipeEntries,
  ...jungleTundraDesertVolcanicRecipeEntries,
];

export const RECIPE_DATABASE: Map<string, Recipe> = new Map<string, Recipe>(recipeEntries);
export type { Recipe } from './types';
