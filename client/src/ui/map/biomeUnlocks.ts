import {
  ABILITY_DATABASE,
  ABILITY_RECIPE_DATABASE,
  ACTION_DATABASE,
  CONDITION_DATABASE,
  RECIPE_DATABASE,
  RITE_DATABASE,
  RITE_RECIPE_DATABASE,
  RUNE_RECIPE_DATABASE,
  STANCE_DATABASE,
  STANCE_RECIPE_DATABASE,
  abilityDef,
  riteDef,
  stanceDef,
  type EssenceType,
  type Recipe,
} from '@mmo-idle/shared';
import { KIND_ORDER, type MakeKind } from '../crafting/makeEntries';

/**
 * One thing a biome hands you at one of its levels.
 *
 * Biome mastery pays out of FIVE authoritative databases — gear, abilities,
 * stances, rites and runes — and only gear lives in `RECIPE_DATABASE`. The map
 * used to read that one database and so silently omitted every technique,
 * stance, rite and rune a biome grants. This is the client view model that lets
 * the map answer "what does this place give me, and when" from all of them.
 *
 * Unlike the Craft browser's `MakeEntry`, nothing is filtered out for being
 * already owned or learned: the map is the reference ladder for a biome, so it
 * has to keep showing the rungs you have already climbed. The one exception is
 * a `deprecated` rune recipe (2026-08-28) — its reward is a starter default,
 * so it was never really a rung on the ladder and is dropped entirely.
 */
export interface BiomeUnlock {
  /** Unique across kinds; recipe ids are only unique within their database. */
  key: string;
  kind: MakeKind;
  /** Biome level in this group that opens it. */
  level: number;
  name: string;
  description: string;
  tier: number;
  cost: Partial<Record<EssenceType, number>>;
  catalystCost?: Partial<Record<string, number>>;
  /** Present for gear (weapon/armor/recovery/mobility/core/relic) only. */
  gear?: Recipe;
  /**
   * The ability/stance/rite/rune id learned, which is NOT the recipe id.
   * Absent for gear, where the recipe id is the item id.
   */
  learnedId?: string;
}

/** The fields every non-gear recipe database shares. */
interface LearnedRecipe {
  id: string;
  name: string;
  tier: number;
  cost: Partial<Record<EssenceType, number>>;
  catalystCost?: Partial<Record<string, number>>;
  recipeGroup?: string;
  requiredBiomeLevel?: number;
  /** Only rune recipes ever set this; see `RuneRecipe.deprecated`. */
  deprecated?: true;
}

function learnedUnlocks<T extends LearnedRecipe>(
  kind: MakeKind,
  group: string,
  recipes: Iterable<T>,
  learnedIdOf: (recipe: T) => string | undefined,
  nameOf: (recipe: T, learnedId: string) => string | undefined,
  blurbOf: (learnedId: string) => string,
): BiomeUnlock[] {
  const unlocks: BiomeUnlock[] = [];
  for (const recipe of recipes) {
    if (recipe.recipeGroup !== group) continue;
    // A deprecated recipe's reward is already a starter default — it is not a
    // real rung on this biome's ladder, even though the map otherwise shows
    // already-climbed rungs.
    if (recipe.deprecated) continue;
    const learnedId = learnedIdOf(recipe);
    if (!learnedId) continue;
    const name = nameOf(recipe, learnedId);
    if (!name) continue;
    unlocks.push({
      key: `${kind}:${recipe.id}`,
      kind,
      level: recipe.requiredBiomeLevel ?? 0,
      name,
      description: blurbOf(learnedId),
      tier: recipe.tier,
      cost: recipe.cost,
      catalystCost: recipe.catalystCost,
      learnedId,
    });
  }
  return unlocks;
}

/** Every unlock this biome group grants, cheapest level first. */
export function biomeUnlocks(group: string): BiomeUnlock[] {
  const unlocks: BiomeUnlock[] = [];

  for (const recipe of RECIPE_DATABASE.values()) {
    if (recipe.recipeGroup !== group) continue;
    unlocks.push({
      key: `gear:${recipe.id}`,
      kind: recipe.slot,
      level: recipe.requiredBiomeLevel,
      name: recipe.name,
      description: recipe.description ?? '',
      tier: recipe.tier,
      cost: recipe.cost,
      catalystCost: recipe.catalystCost,
      gear: recipe,
    });
  }

  unlocks.push(...learnedUnlocks(
    'technique',
    group,
    ABILITY_RECIPE_DATABASE.values(),
    (recipe) => recipe.abilityId,
    (_recipe, learnedId) => ABILITY_DATABASE.get(learnedId)?.name,
    (learnedId) => abilityDef(learnedId)?.blurb ?? '',
  ));

  unlocks.push(...learnedUnlocks(
    'stance',
    group,
    STANCE_RECIPE_DATABASE.values(),
    (recipe) => recipe.stanceId,
    (_recipe, learnedId) => STANCE_DATABASE.get(learnedId)?.name,
    (learnedId) => stanceDef(learnedId)?.blurb ?? '',
  ));

  unlocks.push(...learnedUnlocks(
    'rite',
    group,
    RITE_RECIPE_DATABASE.values(),
    (recipe) => recipe.riteId,
    (_recipe, learnedId) => RITE_DATABASE.get(learnedId)?.name,
    (learnedId) => riteDef(learnedId)?.blurb ?? '',
  ));

  // A rune recipe yields one FRAGMENT — a condition or an action — so it is
  // named by the recipe rather than by an assembled rule.
  unlocks.push(...learnedUnlocks(
    'rune',
    group,
    RUNE_RECIPE_DATABASE.values(),
    (recipe) => recipe.runeId,
    (recipe) => recipe.name,
    (learnedId) =>
      ACTION_DATABASE.get(learnedId)?.blurb ?? CONDITION_DATABASE.get(learnedId)?.blurb ?? '',
  ));

  return unlocks.sort((a, b) =>
    a.level - b.level
    || KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind)
    || a.name.localeCompare(b.name),
  );
}

/** The unlocks grouped by the level that opens them, in ascending level order. */
export function biomeUnlocksByLevel(group: string): [number, BiomeUnlock[]][] {
  const byLevel = new Map<number, BiomeUnlock[]>();
  for (const unlock of biomeUnlocks(group)) {
    const bucket = byLevel.get(unlock.level);
    if (bucket) bucket.push(unlock);
    else byLevel.set(unlock.level, [unlock]);
  }
  return [...byLevel.entries()].sort(([a], [b]) => a - b);
}
