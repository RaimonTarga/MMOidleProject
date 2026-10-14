import {
  ABILITY_DATABASE,
  ABILITY_RECIPE_DATABASE,
  RECIPE_DATABASE,
  availableToClass,
  RITE_DATABASE,
  RITE_RECIPE_DATABASE,
  STANCE_DATABASE,
  STANCE_RECIPE_DATABASE,
  abilityDef,
  isAbilityRecipeUnlocked,
  isRiteRecipeUnlocked,
  isStanceRecipeUnlocked,
  riteDef,
  stanceDef,
  type EquipmentSlot,
  type EssenceType,
  type Recipe,
  type CombatArchetype,
} from '@mmo-idle/shared';
import { biomeName } from './common';

/**
 * Everything the player can make, in one shape. Gear and techniques stay
 * separate authoritative databases — this is a client view model that lets one
 * browser present them with a single grammar.
 */
export type MakeKind = EquipmentSlot | 'technique' | 'stance' | 'rite';

export const TECHNIQUE_KINDS: readonly MakeKind[] = ['technique', 'stance', 'rite'];

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
   * What making this actually gives you — the ability/stance/rite id, which
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
  biomeLevel: Record<string, number>;
  bossesCleared: readonly string[];
  /** The test room unlocks every gear recipe regardless of progression. */
  isTestRoom: boolean;
  combatArchetype: CombatArchetype;
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
    // after that, never re-made here.
    if (sources.ownedGearIds.has(recipe.id)) continue;
    // Smart loot: another class's gear is never offered (class-first build plan §3.6).
    if (!availableToClass(recipe, sources.combatArchetype)) continue;

    entries.push({
      key: `gear:${recipe.id}`,
      recipeId: recipe.id,
      kind: recipe.slot,
      name: recipe.name,
      blurb: recipe.description ?? '',
      tier: recipe.tier,
      recipeGroup: recipe.recipeGroup,
      cost: recipe.cost,
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
      unlocked,
      unlockHint: unlocked || !recipe.recipeGroup
        ? ''
        : `Reach ${biomeName(recipe.recipeGroup)} level ${recipe.requiredBiomeLevel ?? 0}`,
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
  'technique', 'stance', 'rite',
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
};

/** One spec per learnable kind, shared by the entry list and `unlockedMakeKinds`. */
function techniqueSpecs(sources: MakeSources): TechniqueSpec[] {
  const gates = { biomeLevel: sources.biomeLevel, bossesCleared: sources.bossesCleared };
  return [
    {
      kind: 'technique',
      recipes: ABILITY_RECIPE_DATABASE.values(),
      learnedId: (id) => ABILITY_RECIPE_DATABASE.get(id)?.abilityId ?? null,
      blurb: (id) => abilityDef(id)?.blurb ?? '',
      displayName: (_recipeId, learnedId) => ABILITY_DATABASE.get(learnedId)?.name ?? null,
      known: sources.knownAbilities,
      isUnlocked: (id) => {
        const recipe = ABILITY_RECIPE_DATABASE.get(id);
        return !!recipe && isAbilityRecipeUnlocked(recipe, gates);
      },
    },
    {
      kind: 'stance',
      recipes: STANCE_RECIPE_DATABASE.values(),
      learnedId: (id) => STANCE_RECIPE_DATABASE.get(id)?.stanceId ?? null,
      blurb: (id) => stanceDef(id)?.blurb ?? '',
      displayName: (_recipeId, learnedId) => STANCE_DATABASE.get(learnedId)?.name ?? null,
      known: sources.knownStances,
      isUnlocked: (id) => {
        const recipe = STANCE_RECIPE_DATABASE.get(id);
        return !!recipe && isStanceRecipeUnlocked(recipe, gates);
      },
    },
    {
      kind: 'rite',
      recipes: RITE_RECIPE_DATABASE.values(),
      learnedId: (id) => RITE_RECIPE_DATABASE.get(id)?.riteId ?? null,
      blurb: (id) => riteDef(id)?.blurb ?? '',
      displayName: (_recipeId, learnedId) => RITE_DATABASE.get(learnedId)?.name ?? null,
      known: sources.knownRites,
      isUnlocked: (id) => {
        const recipe = RITE_RECIPE_DATABASE.get(id);
        return !!recipe && isRiteRecipeUnlocked(recipe, gates);
      },
    },
  ];
}

/**
 * The kinds whose first recipe has unlocked — the Crafting rail shows only
 * these. Ownership is deliberately ignored: a category you have crafted out
 * stays on the rail, and one you have never reached stays hidden.
 */
export function unlockedMakeKinds(sources: MakeSources): Set<MakeKind> {
  const kinds = new Set<MakeKind>();
  for (const recipe of RECIPE_DATABASE.values()) {
    if (sources.isTestRoom || sources.unlockedRecipeIds.includes(recipe.id)) kinds.add(recipe.slot);
  }
  for (const spec of techniqueSpecs(sources)) {
    for (const recipe of spec.recipes) {
      if (spec.isUnlocked(recipe.id)) { kinds.add(spec.kind); break; }
    }
  }
  return kinds;
}

export function buildMakeEntries(sources: MakeSources): MakeEntry[] {
  const entries = [
    ...gearEntries(sources),
    ...techniqueSpecs(sources).flatMap(techniqueEntries),
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
): boolean {
  return (Object.entries(entry.cost) as [EssenceType, number][])
    .every(([type, amount]) => (essences[type] ?? 0) >= amount);
}
