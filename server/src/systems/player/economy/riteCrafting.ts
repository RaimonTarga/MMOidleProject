/**
 * Rite crafting + loadout (system rework Step 11).
 *
 * Crafting a rite recipe LEARNS the rite (adds it to `TracksProgression.knownRites`),
 * spending essence + catalysts and gating on Biome Mastery (T3 band) — mirroring rune /
 * ability / stance crafting. Equipping is free slotting of learned rites into the
 * interchangeable rite list (length ≤ `riteSlotCount`). Rites are always-on OOC
 * passives, so changing the loadout just recalcs stats (the `rite.*` keys re-fold).
 */
import type { EssenceType } from "@mmo-idle/shared";
import {
  RITE_DATABASE,
  RITE_RECIPE_DATABASE,
  ESSENCE_TYPES,
  ESSENCE_LABELS,
  TEST_ROOM_NODE_ID,
  catalystLabel,
  globalMastery,
  isRiteRecipeUnlocked,
  riteSlotCount,
  validRiteIds,
} from "@mmo-idle/shared";
import type { World } from "../../../world/World";
import type { PlayerEntity } from "../../../ecs/entity";
import { markSliceDirty } from "../../../ecs/dirtyHelpers";
import { recalculatePlayerEntityStats } from "../../../ecs/playerEntityFormulas";

const TEST_ROOM_ESSENCE_AMOUNT = 1_000_000_000;

export interface RiteCraftResult {
  recipeId: string;
  success: boolean;
  reason?: string;
}

export function craftRiteRecipe(
  world: World,
  entity: PlayerEntity,
  recipeId: string,
): RiteCraftResult {
  const recipe = RITE_RECIPE_DATABASE.get(recipeId);
  if (!recipe) return { recipeId, success: false, reason: "Unknown rite recipe." };

  const prog = entity.tracksProgression;
  const known = prog.knownRites ?? [];
  if (known.includes(recipe.riteId)) {
    return { recipeId, success: false, reason: "Rite already learned." };
  }

  const isTestRoom = entity.hasPosition.nodeId === TEST_ROOM_NODE_ID;
  if (isTestRoom) {
    for (const type of ESSENCE_TYPES) prog.essences[type] = TEST_ROOM_ESSENCE_AMOUNT;
    for (const group of Object.keys(recipe.catalystCost ?? {})) {
      prog.catalysts[group] = TEST_ROOM_ESSENCE_AMOUNT;
    }
    markSliceDirty(world, entity, "tracksProgression");
  } else if (
    !isRiteRecipeUnlocked(recipe, {
      biomeLevel: prog.biomeLevel,
      bossesCleared: prog.bossesCleared,
    })
  ) {
    const reason = recipe.recipeGroup
      ? `Reach ${recipe.recipeGroup} level ${recipe.requiredBiomeLevel} to unlock this rite.`
      : "Defeat the linked boss to unlock this rite.";
    return { recipeId, success: false, reason };
  }

  const costEntries = Object.entries(recipe.cost) as [EssenceType, number][];
  for (const [type, amount] of costEntries) {
    const held = prog.essences[type] ?? 0;
    if (held < amount) {
      return {
        recipeId,
        success: false,
        reason: `Not enough ${ESSENCE_LABELS[type]} essence. Need ${amount}, have ${held}.`,
      };
    }
  }

  const catalystEntries = Object.entries(recipe.catalystCost ?? {}) as [string, number][];
  for (const [group, amount] of catalystEntries) {
    const held = prog.catalysts[group] ?? 0;
    if (held < amount) {
      return {
        recipeId,
        success: false,
        reason: `Not enough ${catalystLabel(group)}. Need ${amount}, have ${held}.`,
      };
    }
  }

  for (const [type, amount] of costEntries) prog.essences[type] -= amount;
  for (const [group, amount] of catalystEntries) {
    prog.catalysts[group] = (prog.catalysts[group] ?? 0) - amount;
  }

  prog.knownRites = [...known, recipe.riteId];
  markSliceDirty(world, entity, "tracksProgression");
  return { recipeId, success: true };
}

export interface RiteLoadoutResult {
  success: boolean;
  reason?: string;
}

/**
 * Set the full equipped-rite list. Validates every id is learned, dedupes, and caps to
 * the available slot count (GM-derived). Recalcs stats so the `rite.*` keys re-fold.
 */
export function setRiteLoadout(
  world: World,
  entity: PlayerEntity,
  riteIds: string[],
): RiteLoadoutResult {
  const prog = entity.tracksProgression;
  const known = new Set(prog.knownRites ?? []);

  // Dedupe (preserve order), validate known + real, then cap to slot count.
  const seen = new Set<string>();
  const cleaned: string[] = [];
  for (const id of validRiteIds(riteIds)) {
    if (seen.has(id)) continue;
    if (!known.has(id)) return { success: false, reason: "Rite not learned yet." };
    seen.add(id);
    cleaned.push(id);
  }

  const slots = riteSlotCount(globalMastery(prog.biomeLevel));
  prog.equippedRites = cleaned.slice(0, slots);
  markSliceDirty(world, entity, "tracksProgression");
  recalculatePlayerEntityStats(world, entity);
  return { success: true };
}
