import { clearReaperMomentum } from "../stances/stanceBehaviors";
import { runicLoadoutFromProgression, runicPointEditAllowed, attunedAbilityIds, runeBudgetForGlobalMastery, globalMastery } from "@mmo-idle/shared";
/**
 * Stance crafting + loadout (system rework Step 10).
 *
 * Crafting a stance recipe LEARNS the stance (adds it to
 * `TracksProgression.knownStances`), spending essence + catalysts and gating on
 * Biome Mastery — mirroring rune / ability crafting. Attuning learned stances
 * reserves RP once; the default and Rune destinations use that attuned pool.
 * Updating the default resets the active posture and recalculates stats.
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
import { detachComponent } from "../../../ecs/markerHelpers";

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
  attunedStances: string[] = entity.tracksProgression.attunedStances ?? [],
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

  const stances = [...new Set(attunedStances)];
  if (stances.some(id => !STANCE_DATABASE.has(id) || !(prog.knownStances ?? []).includes(id))) return { success: false, reason: "Stances must be valid and learned." };
  if (stanceId && !stances.includes(stanceId)) return { success: false, reason: "Attune this stance before choosing it as default." };
  const previous = runicLoadoutFromProgression(prog);
  const rules = prog.runesEquipped.filter(rule => rule.actionId !== "switch-stance" || rule.targetStanceId === "no-stance" || stances.includes(rule.targetStanceId ?? ""));
  if (!runicPointEditAllowed(previous, { ...previous, stances, rules }, runeBudgetForGlobalMastery(globalMastery(prog.biomeLevel)))) return { success: false, reason: "Not enough Runic Points to attune these stances." };
  clearReaperMomentum(entity.tracksCombat);
  prog.attunedStances = stances;
  prog.runesEquipped = rules;
  prog.equippedStances = { default: stanceId };
  // Build edits return live stance ownership to its ordinary AUTO baseline.
  detachComponent(world, entity, "overridesStance");
  // Reset immediately to the new attuned default. Rune arbitration may move away later.
  prog.activeStance = prog.equippedStances.default;
  markSliceDirty(world, entity, "tracksProgression");
  recalculatePlayerStanceStats(world, entity);
  return { success: true };
}
