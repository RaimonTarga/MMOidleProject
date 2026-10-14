import {
  RECIPE_DATABASE,
  type EssenceType,
  type Recipe,
} from '@mmo-idle/shared';
import { KIND_ORDER, type MakeKind } from '../crafting/makeEntries';

/**
 * One thing a biome hands you at one of its levels: the client view model that
 * lets the map answer "what does this place give me, and when".
 *
 * Unlike the Craft browser's `MakeEntry`, nothing is filtered out for being
 * already owned or learned: the map is the reference ladder for a biome, so it
 * has to keep showing the rungs you have already climbed.
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
  /** Present for gear (weapon/armor/recovery/mobility/relic) only. */
  gear?: Recipe;
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
      gear: recipe,
    });
  }

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
