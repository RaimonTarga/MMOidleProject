import type { EssenceType } from "@mmo-idle/shared";
import {
  ESSENCE_TYPES,
  ESSENCE_LABELS,
  RECIPE_DATABASE,
  TEST_ROOM_NODE_ID,
} from "@mmo-idle/shared";
import type { World } from "../../../world/World";
import type { PlayerEntity } from "../../../ecs/entity";
import { markSliceDirty } from "../../../ecs/dirtyHelpers";
import { syncLineagesFromInventory } from './lineageSync';
import { isGatedLineageForm } from '@mmo-idle/shared';

const TEST_ROOM_ESSENCE_AMOUNT = 1_000_000_000;

export interface CraftResult {
  success: boolean;
  reason?: string;
}

export function craftRecipe(
  world: World,
  entity: PlayerEntity,
  recipeId: string,
): CraftResult {
  const recipe = RECIPE_DATABASE.get(recipeId);
  if (!recipe) return { success: false, reason: "Unknown recipe." };
  // A live lineage's tier-2+ form is opened at its gate (boss capstone + shards),
  // never crafted for essence (design §5: the boss is the only way up; review B4).
  // One shared check, the one the Make tab reads; `evolvesFrom` survives on weapon
  // forms only and every one of them is a gated form (pinned by
  // `slotRetirement.test.ts`). A PARKED lineage's T2+ items are plain recipes,
  // crafted below at their biome level (design §24.5).
  if (isGatedLineageForm(recipe.id)) {
    return { success: false, reason: "This form is opened at its lineage's gate." };
  }

  const isTestRoom = entity.hasPosition.nodeId === TEST_ROOM_NODE_ID;
  if (isTestRoom) {
    for (const type of ESSENCE_TYPES) {
      entity.tracksProgression.essences[type] = TEST_ROOM_ESSENCE_AMOUNT;
    }
    markSliceDirty(world, entity, "tracksProgression");
  } else {
    if (recipe.requiredBossClear &&
        !entity.tracksProgression.bossesCleared.includes(recipe.requiredBossClear)) {
      return {
        success: false,
        reason: 'Defeat the Void Overlord to unlock this recipe.',
      };
    }
    if (!entity.tracksProgression.unlockedRecipes.includes(recipeId)) {
      return {
        success: false,
        reason: recipe.requiredBossClear
          ? 'Recipe locked — defeat the Void Overlord.'
          : `Recipe locked — reach ${recipe.recipeGroup} level ${recipe.requiredBiomeLevel}.`,
      };
    }
  }

  const costEntries = Object.entries(recipe.cost) as [EssenceType, number][];
  for (const [type, amount] of costEntries) {
    const held = entity.tracksProgression.essences[type] ?? 0;
    if (held < amount) {
      return {
        success: false,
        reason: `Not enough ${ESSENCE_LABELS[type]} essence. Need ${amount}, have ${held}.`,
      };
    }
  }

  for (const [type, amount] of costEntries) {
    entity.tracksProgression.essences[type] -= amount;
  }

  entity.holdsInventory.inventory = [
    ...entity.holdsInventory.inventory,
    recipe.id,
  ];
  markSliceDirty(world, entity, "holdsInventory");
  // Crafting a lineage's T1 base form IS taking that slot's lineage, so the tree
  // opens with it — there is no separate "unlock the tree" purchase (design §2).
  syncLineagesFromInventory(world, entity);
  return { success: true };
}
