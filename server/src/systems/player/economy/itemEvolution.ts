import type { EvolveMode } from "@mmo-idle/shared";
import { EVOLUTION_RETIRED_REASON, RECIPE_DATABASE } from "@mmo-idle/shared";
import type { World } from "../../../world/World";
import type { PlayerEntity } from "../../../ecs/entity";

export interface CraftResult {
  success: boolean;
  reason?: string;
}

/**
 * Evolve or reconstruct an item — RETIRED on every slot (design §24.5).
 *
 * Weapons left this path in progression rework Phase 2b (a tier-2+ weapon form
 * opens at its lineage's gate); armour, charm and boots left it in the course
 * correction (their T2+ items are plain recipes, crafted at their biome level).
 * The socket event stays wired so an old client gets a reason rather than
 * silence, and the refusal changes nothing: no spend, no item moved.
 */
export function evolveItem(
  _world: World,
  _entity: PlayerEntity,
  recipeId: string,
  _mode: EvolveMode,
): CraftResult {
  if (!RECIPE_DATABASE.has(recipeId)) return { success: false, reason: "Unknown recipe." };
  return { success: false, reason: EVOLUTION_RETIRED_REASON };
}
