import {
  RECIPE_DATABASE,
  baseFormRecipeId,
  lineageForRecipeId,
  type TierEntryProfile,
} from "@mmo-idle/shared";
import type { RouteStep } from "../route/types";
import { t2, type T2BiomeGroup } from "./t2Common";

export type AcquisitionPath = "craft" | "form" | "unreachable";
export interface AcquisitionPlan {
  recipeId: string;
  path: AcquisitionPath;
  lineageId?: string;
  reason: string;
}

/** Weapon forms use lineage gates; other slots are full-power plain crafts. */
export function planAcquisition(_profile: TierEntryProfile, recipeId: string): AcquisitionPlan {
  const recipe = RECIPE_DATABASE.get(recipeId);
  if (!recipe) throw new Error(`unknown T2 recipe "${recipeId}"`);
  if (recipe.slot !== "weapon") return { recipeId, path: "craft", reason: "full-power plain craft" };
  const lineage = lineageForRecipeId(recipeId);
  if (!lineage) return { recipeId, path: "unreachable", reason: "retired: weapon has no live lineage form" };
  return { recipeId, path: "form", lineageId: lineage.id, reason: "unlock the lineage gate" };
}

/** Gate farming reads live costs in the executor, including node-shard targeting. */
export function obtainSteps(group: T2BiomeGroup, plan: AcquisitionPlan): RouteStep[] {
  const at = t2(group);
  switch (plan.path) {
    case "form": {
      // A gate opens only from the form one tier below it, and a T2 route may
      // adopt a lineage its T1 kit never held (the Squire's hammer). The base
      // form is a plain T1 craft; `doCraft` skips it when it is already owned.
      const lineage = lineageForRecipeId(plan.recipeId);
      const base = lineage ? baseFormRecipeId(lineage) : undefined;
      return [
        ...(base && base !== plan.recipeId
          ? [{ type: "craft" as const, recipeIds: [base], farmAt: at }]
          : []),
        { type: "unlockForm", lineageId: plan.lineageId!, recipeId: plan.recipeId, farmAt: at },
      ];
    }
    case "craft":
      return [
        { type: "farm", at, until: { type: "recipeUnlocked", recipeId: plan.recipeId } },
        { type: "craft", recipeIds: [plan.recipeId], farmAt: at },
      ];
    case "unreachable":
      return [{ type: "milestone", id: `retired:${plan.recipeId}`, label: plan.reason }];
  }
}
