import {
  ABILITY_DATABASE,
  ABILITY_RECIPE_DATABASE,
  ACTION_DATABASE,
  CONDITION_DATABASE,
  RUNE_RECIPE_DATABASE,
  RECIPE_DATABASE,
  RITE_DATABASE,
  RITE_RECIPE_DATABASE,
  STANCE_DATABASE,
  STANCE_RECIPE_DATABASE,
  abilityDef,
  isAbilityRecipeUnlocked,
  isRiteRecipeUnlocked,
  isRuneRecipeUnlocked,
  isStanceRecipeUnlocked,
  riteDef,
  stanceDef,
  type EquipmentSlot,
  type EssenceType,
  type Recipe,
} from '@mmo-idle/shared';
import { biomeName } from './common';

/**
 * Everything the player can make, in one shape. Gear and techniques stay
 * separate authoritative databases — this is a client view model that lets one
 * browser present them with a single grammar.
 */
export type MakeKind = EquipmentSlot | 'technique' | 'stance' | 'rite' | 'rune';

export const TECHNIQUE_KINDS: readonly MakeKind[] = ['technique', 'stance', 'rite', 'rune'];

export interface MakeEntry {
  /** Unique across kinds; recipe ids are only unique within their database. */
  key: string;
  recipeId: string;
  kind: MakeKind;
  name: string;
  blurb: string;
  tier: number;
  recipeGroup: string | null;
  cost: Partial<Record<EssenceType, number>>;
  catalystCost?: Partial<Record<string, number>>;
  /**
   * Gate satisfied — the recipe may be attempted at all. Locked entries are
   * hidden by default and revealed by the browser's "Show locked" filter, which
   * is the only reason they are still built.
   */
  unlocked: boolean;
  unlockHint: string;
  /** Present for gear only; carries the fields the gear detail pane needs. */
  gear?: Recipe;
  /**
   * What making this actually gives you — the ability/stance/rite/rune id, which
   * is NOT the recipe id. Absent for gear, where the recipe id is the item id.
   * Drives icon resolution and the effect table in the detail pane.
   */
  learnedId?: string;
}

export interface MakeSources {
  unlockedRecipeIds: readonly string[];
  ownedGearIds: ReadonlySet<string>;
  equippedGearIds: ReadonlySet<string>;
  knownAbilities: readonly string[];
  knownStances: readonly string[];
  knownRites: readonly string[];
  /** Rune fragments already crafted; a rune recipe yields one fragment. */
  ownedRunes: readonly string[];
  biomeLevel: Record<string, number>;
  bossesCleared: readonly string[];
  /** The test room unlocks every gear recipe regardless of progression. */
  isTestRoom: boolean;
}

/**
 * What a locked gear recipe is still waiting on. Boss clears outrank biome
 * levels because a recipe gated on both wants the harder gate named. No gear
 * currently sets `requiredBossClear` — the ultimate recipes that did were a
 * scrapped feature, removed 2026-07-26 — but the field is a live gate on
 * ability and rite recipes, so the branch stays rather than degrading silently.
 */
function gearUnlockHint(recipe: Recipe): string {
  if (recipe.requiredBossClear) return `Defeat ${recipe.requiredBossClear}`;
  if (recipe.requiredBiomeLevel > 0) {
    return `Reach ${biomeName(recipe.recipeGroup)} level ${recipe.requiredBiomeLevel}`;
  }
  return 'Not unlocked yet';
}

function gearEntries(sources: MakeSources): MakeEntry[] {
  const entries: MakeEntry[] = [];
  for (const recipe of RECIPE_DATABASE.values()) {
    const unlocked = sources.isTestRoom || sources.unlockedRecipeIds.includes(recipe.id);
    // Crafted gear leaves the make list entirely — it is managed from Inventory
    // and Upgrade after that, never re-made here.
    if (sources.ownedGearIds.has(recipe.id)) continue;

    entries.push({
      key: `gear:${recipe.id}`,
      recipeId: recipe.id,
      kind: recipe.slot,
      name: recipe.name,
      blurb: recipe.description ?? '',
      tier: recipe.tier,
      recipeGroup: recipe.recipeGroup,
      cost: recipe.cost,
      catalystCost: recipe.catalystCost,
      unlocked,
      // Locked gear is built but hidden behind the "Show locked" filter. It used
      // to be skipped outright, which left Crafting's Progress tab as the only
      // place that knew this recipe existed or what it wanted; carrying it here
      // with its requirement is what let that tab go.
      unlockHint: unlocked ? '' : gearUnlockHint(recipe),
      gear: recipe,
    });
  }
  return entries;
}

interface TechniqueSpec {
  kind: MakeKind;
  recipes: Iterable<{
    id: string;
    name: string;
    tier: number;
    cost: Partial<Record<EssenceType, number>>;
    catalystCost?: Partial<Record<string, number>>;
    recipeGroup?: string;
    requiredBiomeLevel?: number;
  }>;
  /** Id of the thing learned, for known-set and definition lookups. */
  learnedId: (recipeId: string) => string | null;
  blurb: (learnedId: string) => string;
  displayName: (recipeId: string, learnedId: string) => string | null;
  known: readonly string[];
  isUnlocked: (recipeId: string) => boolean;
}

function techniqueEntries(spec: TechniqueSpec): MakeEntry[] {
  const knownSet = new Set(spec.known);
  const entries: MakeEntry[] = [];

  for (const recipe of spec.recipes) {
    const learnedId = spec.learnedId(recipe.id);
    if (!learnedId) continue;
    const name = spec.displayName(recipe.id, learnedId);
    if (!name) continue;

    // Already learned leaves the list, the same way crafted gear does: Craft
    // answers "what can I make", and a technique you own is not an answer to it.
    if (knownSet.has(learnedId)) continue;

    const unlocked = spec.isUnlocked(recipe.id);
    entries.push({
      key: `${spec.kind}:${recipe.id}`,
      recipeId: recipe.id,
      kind: spec.kind,
      name,
      blurb: spec.blurb(learnedId),
      tier: recipe.tier,
      recipeGroup: recipe.recipeGroup ?? null,
      cost: recipe.cost,
      catalystCost: recipe.catalystCost,
      unlocked,
      unlockHint: unlocked || !recipe.recipeGroup
        ? ''
        : `Reach ${recipe.recipeGroup} level ${recipe.requiredBiomeLevel ?? 0}`,
      learnedId,
    });
  }
  return entries;
}

/**
 * Sort so the same kind stays together and the best tier comes first. Every
 * `MakeKind` must be listed — a missing kind resolves to `indexOf` -1 and sorts
 * ahead of weapons, which is how relics used to lead the recipe list.
 */
export const KIND_ORDER: MakeKind[] = [
  'weapon', 'armor', 'recovery', 'mobility', 'core', 'relic',
  'technique', 'stance', 'rite', 'rune',
];

/** One name per kind, for every surface that has to say what a recipe makes. */
export const MAKE_KIND_LABELS: Record<MakeKind, string> = {
  weapon: 'Weapon',
  armor: 'Armor',
  recovery: 'Recovery',
  mobility: 'Boots',
  core: 'Core',
  relic: 'Relic',
  technique: 'Technique',
  stance: 'Stance',
  rite: 'Rite',
  rune: 'Rune',
};

export function buildMakeEntries(sources: MakeSources): MakeEntry[] {
  const entries = [
    ...gearEntries(sources),
    ...techniqueEntries({
      kind: 'technique',
      recipes: ABILITY_RECIPE_DATABASE.values(),
      learnedId: (id) => ABILITY_RECIPE_DATABASE.get(id)?.abilityId ?? null,
      blurb: (id) => abilityDef(id)?.blurb ?? '',
      displayName: (_recipeId, learnedId) => ABILITY_DATABASE.get(learnedId)?.name ?? null,
      known: sources.knownAbilities,
      isUnlocked: (id) => {
        const recipe = ABILITY_RECIPE_DATABASE.get(id);
        return !!recipe && isAbilityRecipeUnlocked(recipe, {
          biomeLevel: sources.biomeLevel,
          bossesCleared: sources.bossesCleared,
        });
      },
    }),
    ...techniqueEntries({
      kind: 'stance',
      recipes: STANCE_RECIPE_DATABASE.values(),
      learnedId: (id) => STANCE_RECIPE_DATABASE.get(id)?.stanceId ?? null,
      blurb: (id) => stanceDef(id)?.blurb ?? '',
      displayName: (_recipeId, learnedId) => STANCE_DATABASE.get(learnedId)?.name ?? null,
      known: sources.knownStances,
      isUnlocked: (id) => {
        const recipe = STANCE_RECIPE_DATABASE.get(id);
        return !!recipe && isStanceRecipeUnlocked(recipe, {
          biomeLevel: sources.biomeLevel,
          bossesCleared: sources.bossesCleared,
        });
      },
    }),
    ...techniqueEntries({
      kind: 'rite',
      recipes: RITE_RECIPE_DATABASE.values(),
      learnedId: (id) => RITE_RECIPE_DATABASE.get(id)?.riteId ?? null,
      blurb: (id) => riteDef(id)?.blurb ?? '',
      displayName: (_recipeId, learnedId) => RITE_DATABASE.get(learnedId)?.name ?? null,
      known: sources.knownRites,
      isUnlocked: (id) => {
        const recipe = RITE_RECIPE_DATABASE.get(id);
        return !!recipe && isRiteRecipeUnlocked(recipe, {
          biomeLevel: sources.biomeLevel,
          bossesCleared: sources.bossesCleared,
        });
      },
    }),
    // Rune fragments are made here too (V5): crafting a rune is making a thing,
    // and it was the last recipe kind still being spent from inside Build.
    ...techniqueEntries({
      kind: 'rune',
      recipes: [...RUNE_RECIPE_DATABASE.values()].filter((r) => !!r.runeId),
      learnedId: (id) => RUNE_RECIPE_DATABASE.get(id)?.runeId ?? null,
      blurb: (id) =>
        ACTION_DATABASE.get(id)?.blurb ?? CONDITION_DATABASE.get(id)?.blurb ?? '',
      displayName: (recipeId) => RUNE_RECIPE_DATABASE.get(recipeId)?.name ?? null,
      known: sources.ownedRunes,
      isUnlocked: (id) => {
        const recipe = RUNE_RECIPE_DATABASE.get(id);
        return !!recipe && isRuneRecipeUnlocked(recipe, {
          biomeLevel: sources.biomeLevel,
          bossesCleared: sources.bossesCleared,
        });
      },
    }),
  ];

  // Highest tier first within each kind: the thing a player is working toward is
  // what they came to look at, and low-tier recipes stay crafted long after they
  // stop being interesting.
  return entries.sort((a, b) =>
    KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind)
    || b.tier - a.tier
    || a.name.localeCompare(b.name),
  );
}

export function entryAffordable(
  entry: MakeEntry,
  essences: Record<EssenceType, number>,
  catalysts: Record<string, number>,
): boolean {
  const essenceOk = (Object.entries(entry.cost) as [EssenceType, number][])
    .every(([type, amount]) => (essences[type] ?? 0) >= amount);
  const catalystOk = (Object.entries(entry.catalystCost ?? {}) as [string, number][])
    .every(([family, amount]) => (catalysts[family] ?? 0) >= amount);
  return essenceOk && catalystOk;
}
