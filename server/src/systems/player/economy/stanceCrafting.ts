/**
 * Stance crafting + loadout (system rework Step 10).
 *
 * Crafting a stance recipe LEARNS the stance (adds it to
 * `TracksProgression.knownStances`), spending essence + catalysts and gating on
 * Biome Mastery — mirroring rune / ability crafting. Equipping is free slotting from
 * the learned pool as a free default; Rune rules name their own destinations.
 * resets the active posture to the (new) default and recalcs stats.
 */
import type { EssenceType } from "@mmo-idle/shared";
import {
  STANCE_DATABASE,
  STANCE_RECIPE_DATABASE,
  ESSENCE_TYPES,
  ESSENCE_LABELS,
  TEST_ROOM_NODE_ID,
  catalystLabel,
  emptyEquippedStances,
  isStanceRecipeUnlocked,
  type StanceSlot,
} from "@mmo-idle/shared";
import type { World } from "../../../world/World";
import type { PlayerEntity } from "../../../ecs/entity";
import { markSliceDirty } from "../../../ecs/dirtyHelpers";
import { recalculatePlayerStanceStats } from "../../../ecs/playerEntityFormulas";

const TEST_ROOM_ESSENCE_AMOUNT = 1_000_000_000;

export interface StanceCraftResult {
  recipeId: string;
  success: boolean;
  reason?: string;
}

export function craftStanceRecipe(
  world: World,
  entity: PlayerEntity,
  recipeId: string,
): StanceCraftResult {
  const recipe = STANCE_RECIPE_DATABASE.get(recipeId);
  if (!recipe) return { recipeId, success: false, reason: "Unknown stance recipe." };

  const prog = entity.tracksProgression;
  const known = prog.knownStances ?? [];
  if (known.includes(recipe.stanceId)) {
    return { recipeId, success: false, reason: "Stance already learned." };
  }

  const isTestRoom = entity.hasPosition.nodeId === TEST_ROOM_NODE_ID;
  if (isTestRoom) {
    for (const type of ESSENCE_TYPES) prog.essences[type] = TEST_ROOM_ESSENCE_AMOUNT;
    for (const group of Object.keys(recipe.catalystCost ?? {})) {
      prog.catalysts[group] = TEST_ROOM_ESSENCE_AMOUNT;
    }
    markSliceDirty(world, entity, "tracksProgression");
  } else if (
    !isStanceRecipeUnlocked(recipe, {
      biomeLevel: prog.biomeLevel,
      bossesCleared: prog.bossesCleared,
    })
  ) {
    const reason = recipe.recipeGroup
      ? `Reach ${recipe.recipeGroup} level ${recipe.requiredBiomeLevel} to unlock this stance.`
      : "Defeat the linked boss to unlock this stance.";
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

  prog.knownStances = [...known, recipe.stanceId];
  markSliceDirty(world, entity, "tracksProgression");
  return { recipeId, success: true };
}

export interface StanceLoadoutResult {
  success: boolean;
  reason?: string;
}

/** Equip (or clear, with `stanceId: null`) a stance in the given slot. */
export function setStanceLoadout(
  world: World,
  entity: PlayerEntity,
  slot: StanceSlot,
  stanceId: string | null,
): StanceLoadoutResult {
  const prog = entity.tracksProgression;
  if (stanceId !== null) {
    if (!STANCE_DATABASE.has(stanceId)) {
      return { success: false, reason: "Unknown stance." };
    }
    if (!(prog.knownStances ?? []).includes(stanceId)) {
      return { success: false, reason: "Stance not learned yet." };
    }
  }

  prog.equippedStances = { default: stanceId };
  // Reset immediately to the new free default. Rune arbitration may move away later.
  prog.activeStance = prog.equippedStances.default;
  markSliceDirty(world, entity, "tracksProgression");
  recalculatePlayerStanceStats(world, entity);
  return { success: true };
}
