import { runicLoadoutFromProgression, runicPointEditAllowed, attunedAbilityIds, runeBudgetForGlobalMastery, globalMastery } from "@mmo-idle/shared";
/**
 * Ability crafting + loadout (system rework Step 7).
 *
 * Crafting an ability recipe LEARNS the ability (adds it to
 * `TracksProgression.knownAbilities`), spending essence + catalysts and gating on
 * Biome Mastery — mirroring rune crafting. Attunement reserves authored RP from the same pool as Rune logic, stances and Rites.
 */
import type { EssenceType } from "@mmo-idle/shared";
import {
  ABILITY_DATABASE,
  ABILITY_RECIPE_DATABASE,
  ABILITY_FAMILIES,
  ESSENCE_TYPES,
  ESSENCE_LABELS,
  TEST_ROOM_NODE_ID,
  catalystLabel,
  attunedForFamily,
  isAbilityRecipeUnlocked,
  type AttunedAbilities,
} from "@mmo-idle/shared";
import type { World } from "../../../world/World";
import type { PlayerEntity } from "../../../ecs/entity";
import { markSliceDirty } from "../../../ecs/dirtyHelpers";
import { attachComponent, detachComponent } from "../../../ecs/markerHelpers";

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

/**
 * Replace the whole equipped-ability loadout.
 *
 * Ordered lists per semantic family — index 0 is highest fire priority — so equipping,
 * clearing and re-prioritising are all the same operation. Rejects the WHOLE
 * request rather than silently dropping entries, so the client never ends up
 * showing a loadout the server didn't accept.
 */
export function setAbilityLoadout(
  world: World,
  entity: PlayerEntity,
  equipped: AttunedAbilities,
): AbilityLoadoutResult {
  const prog = entity.tracksProgression;
  const known = new Set(prog.knownAbilities ?? []);

  for (const slot of ABILITY_FAMILIES) {
    const ids = attunedForFamily(equipped, slot);
    if (new Set(ids).size !== ids.length) {
      return { success: false, reason: "An ability can be attuned only once." };
    }
    for (const id of ids) {
      const ability = ABILITY_DATABASE.get(id);
      if (!ability) return { success: false, reason: "Unknown ability." };
      if (ability.slot !== slot) {
        return { success: false, reason: `${ability.name} is not in the ${slot} family.` };
      }
      if (!known.has(id)) {
        return { success: false, reason: `${ability.name} is not learned yet.` };
      }
    }
  }

  const previous = runicLoadoutFromProgression(prog);
  const ids = new Set(attunedAbilityIds(equipped));
  const rules = prog.runesEquipped.filter(rule => rule.actionId !== "use-ability" || ids.has(rule.targetAbilityId ?? ""));
  const next = { ...previous, abilities: equipped, rules };
  if (!runicPointEditAllowed(previous, next, runeBudgetForGlobalMastery(globalMastery(prog.biomeLevel)))) return { success: false, reason: "Not enough Runic Points to attune these abilities." };
  prog.runesEquipped = rules;
  prog.attunedAbilities = {
    techniques: [...equipped.techniques],
    guards: [...equipped.guards],
  };
  const queuedAbilityIds = (entity.queuesAbilities?.abilityIds ?? []).filter((id) => ids.has(id));
  if (queuedAbilityIds.length > 0) {
    attachComponent(world, entity, "queuesAbilities", { abilityIds: queuedAbilityIds });
  } else {
    detachComponent(world, entity, "queuesAbilities");
  }
  markSliceDirty(world, entity, "tracksProgression");
  return { success: true };
}
