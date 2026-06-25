/**
 * Ability crafting + loadout (system rework Step 7).
 *
 * Crafting an ability recipe LEARNS the ability (adds it to
 * `TracksProgression.knownAbilities`), spending essence + catalysts and gating on
 * Biome Mastery — mirroring rune crafting. Equipping is free slotting from the
 * learned pool into the Technique / Guard slot.
 */
import type { EssenceType } from "@mmo-idle/shared";
import {
  ABILITY_DATABASE,
  ABILITY_RECIPE_DATABASE,
  ESSENCE_TYPES,
  ESSENCE_LABELS,
  TEST_ROOM_NODE_ID,
  catalystLabel,
  emptyEquippedAbilities,
  isAbilityRecipeUnlocked,
  type AbilitySlot,
} from "@mmo-idle/shared";
import type { World } from "../../../world/World";
import type { PlayerEntity } from "../../../ecs/entity";
import { markSliceDirty } from "../../../ecs/dirtyHelpers";

const TEST_ROOM_ESSENCE_AMOUNT = 1_000_000_000;

export interface AbilityCraftResult {
  recipeId: string;
  success: boolean;
  reason?: string;
}

export function craftAbilityRecipe(
  world: World,
  entity: PlayerEntity,
  recipeId: string,
): AbilityCraftResult {
  const recipe = ABILITY_RECIPE_DATABASE.get(recipeId);
  if (!recipe) return { recipeId, success: false, reason: "Unknown ability recipe." };

  const prog = entity.tracksProgression;
  const known = prog.knownAbilities ?? [];
  if (known.includes(recipe.abilityId)) {
    return { recipeId, success: false, reason: "Ability already learned." };
  }

  const isTestRoom = entity.hasPosition.nodeId === TEST_ROOM_NODE_ID;
  if (isTestRoom) {
    for (const type of ESSENCE_TYPES) prog.essences[type] = TEST_ROOM_ESSENCE_AMOUNT;
    for (const group of Object.keys(recipe.catalystCost ?? {})) {
      prog.catalysts[group] = TEST_ROOM_ESSENCE_AMOUNT;
    }
    markSliceDirty(world, entity, "tracksProgression");
  } else if (
    !isAbilityRecipeUnlocked(recipe, {
      biomeLevel: prog.biomeLevel,
      bossesCleared: prog.bossesCleared,
    })
  ) {
    const reason = recipe.recipeGroup
      ? `Reach ${recipe.recipeGroup} level ${recipe.requiredBiomeLevel} to unlock this ability.`
      : "Defeat the linked boss to unlock this ability.";
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

  prog.knownAbilities = [...known, recipe.abilityId];
  markSliceDirty(world, entity, "tracksProgression");
  return { recipeId, success: true };
}

export interface AbilityLoadoutResult {
  success: boolean;
  reason?: string;
}

/** Equip (or clear, with `abilityId: null`) an ability in the given slot. */
export function setAbilityLoadout(
  world: World,
  entity: PlayerEntity,
  slot: AbilitySlot,
  abilityId: string | null,
): AbilityLoadoutResult {
  const prog = entity.tracksProgression;
  if (abilityId !== null) {
    const ability = ABILITY_DATABASE.get(abilityId);
    if (!ability) return { success: false, reason: "Unknown ability." };
    if (ability.slot !== slot) {
      return { success: false, reason: "Ability does not fit that slot." };
    }
    if (!(prog.knownAbilities ?? []).includes(abilityId)) {
      return { success: false, reason: "Ability not learned yet." };
    }
  }

  prog.equippedAbilities = {
    ...(prog.equippedAbilities ?? emptyEquippedAbilities()),
    [slot]: abilityId,
  };
  markSliceDirty(world, entity, "tracksProgression");
  return { success: true };
}
