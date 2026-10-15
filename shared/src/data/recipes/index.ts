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

/** Appended to a receiving base's id for its second base. */
const SECOND_BASE_SUFFIX = '-b';

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

// Second bases (bible §4): a base keeps one line per class, so when a retired biome's lines move
// to a receiving biome they ride a copy of the receiving base, `<baseId>-b`. Each class's
// `movedLines` entry becomes its line on that copy.
for (const [archetype, gear] of Object.entries(CLASS_GEAR) as [ClassArchetype, (typeof CLASS_GEAR)[ClassArchetype]][]) {
  for (const [baseId, line] of Object.entries(gear.movedLines ?? {})) {
    const base = RECIPE_DATABASE.get(baseId);
    if (!base) throw new Error(`${archetype} moved line ${line.name} names a missing base ${baseId}`);
    const secondId = `${baseId}${SECOND_BASE_SUFFIX}`;
    const second = RECIPE_DATABASE.get(secondId)
      ?? (() => {
        const copy: Recipe = { ...base, id: secondId, name: `${base.name} II`, classLines: undefined };
        RECIPE_DATABASE.set(secondId, copy);
        return copy;
      })();
    second.classLines = { ...second.classLines, [archetype]: line };
  }
}
export { SECOND_BASE_SUFFIX };
export type { Recipe } from './types';
