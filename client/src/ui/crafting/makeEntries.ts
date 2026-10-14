import {
  RECIPE_DATABASE,
  availableToClass,
  type EquipmentSlot,
  type EssenceType,
  type Recipe,
  type CombatArchetype,
} from '@mmo-idle/shared';
import { biomeName } from './common';

/**
 * Everything the player can make, in one shape: a client view model over the
 * gear recipe database.
 */
export type MakeKind = EquipmentSlot;

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
}

export interface MakeSources {
  unlockedRecipeIds: readonly string[];
  ownedGearIds: ReadonlySet<string>;
  equippedGearIds: ReadonlySet<string>;
  /** The test room unlocks every gear recipe regardless of progression. */
  isTestRoom: boolean;
  combatArchetype: CombatArchetype;
}

/**
 * What a locked gear recipe is still waiting on. Boss clears outrank biome
 * levels because a recipe gated on both wants the harder gate named. No gear
 * currently sets `requiredBossClear` — the ultimate recipes that did were a
 * scrapped feature, removed 2026-07-26 — but the field is still a live recipe
 * gate, so the branch stays rather than degrading silently.
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

/**
 * Sort so the same kind stays together and the best tier comes first. Every
 * `MakeKind` must be listed — a missing kind resolves to `indexOf` -1 and sorts
 * ahead of weapons, which is how relics used to lead the recipe list.
 */
export const KIND_ORDER: MakeKind[] = [
  'weapon', 'armor', 'recovery', 'mobility', 'relic',
];

/** One name per kind, for every surface that has to say what a recipe makes. */
export const MAKE_KIND_LABELS: Record<MakeKind, string> = {
  weapon: 'Weapon',
  armor: 'Armor',
  recovery: 'Recovery',
  mobility: 'Boots',
  relic: 'Relic',
};

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
  return kinds;
}

export function buildMakeEntries(sources: MakeSources): MakeEntry[] {
  const entries = gearEntries(sources);

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
