import type { Recipe } from './types';
import { priceRecipeForEconomy } from '../../config/economy';
import { clearingRecipeEntries } from './clearing.recipes';
import { caveRecipeEntries } from './cave.recipes';
import { desertRecipeEntries } from './desert.recipes';
import { forestRecipeEntries } from './forest.recipes';
import { jungleRecipeEntries } from './jungle.recipes';
import { mountainRecipeEntries } from './mountain.recipes';
import { plainsRecipeEntries } from './plains.recipes';
import { swampRecipeEntries } from './swamp.recipes';
import { tundraRecipeEntries } from './tundra.recipes';
import { volcanicRecipeEntries } from './volcanic.recipes';
import { graveyardRecipeEntries } from './graveyard.recipes';
import { trenchRecipeEntries } from './trench.recipes';

const recipeEntries: [string, Recipe][] = [
  ...clearingRecipeEntries,
  ...caveRecipeEntries,
  ...forestRecipeEntries,
  ...jungleRecipeEntries,
  ...mountainRecipeEntries,
  ...plainsRecipeEntries,
  ...swampRecipeEntries,
  ...tundraRecipeEntries,
  ...desertRecipeEntries,
  ...volcanicRecipeEntries,
  ...graveyardRecipeEntries,
  ...trenchRecipeEntries,
  // ...trenchRecipeEntries,
];

export const RECIPE_DATABASE: Map<string, Recipe> = new Map<string, Recipe>(
  recipeEntries.map(([id, recipe]) => [id, priceRecipeForEconomy(recipe)]),
);
export type { Recipe } from './types';
