import type { Recipe } from './types';
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
import { CLASS_GEAR } from '../classGear';
import type { ClassArchetype } from '../../classKits/types';

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

export const RECIPE_DATABASE: Map<string, Recipe> = new Map<string, Recipe>(recipeEntries);

// Class gear (class-first build plan §3.6): each class's weapons become recipes for that class
// only, and its lines attach to the shared armor and charm bases they name.
for (const [archetype, gear] of Object.entries(CLASS_GEAR) as [ClassArchetype, (typeof CLASS_GEAR)[ClassArchetype]][]) {
  for (const weapon of gear.weapons) {
    if (RECIPE_DATABASE.has(weapon.id)) throw new Error(`class weapon ${weapon.id} reuses a recipe id`);
    RECIPE_DATABASE.set(weapon.id, { ...weapon, classes: [archetype] });
  }
  for (const [baseId, line] of Object.entries(gear.lines)) {
    const base = RECIPE_DATABASE.get(baseId);
    if (!base) throw new Error(`${archetype} line ${line.name} names a missing base ${baseId}`);
    base.classLines = { ...base.classLines, [archetype]: line };
  }
}
export type { Recipe } from './types';
