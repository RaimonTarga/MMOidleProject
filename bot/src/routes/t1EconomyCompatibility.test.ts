import {
  ABILITY_RECIPE_DATABASE,
  ITEM_DATABASE,
  RECIPE_DATABASE,
  RUNE_RECIPE_DATABASE,
  STARTER_RUNE_IDS,
  globalMastery,
} from "@mmo-idle/shared";
import { buildConfig } from "../config";
import type { Condition, RouteStep } from "../route/types";
import { T1_CONTROLLED_ROUTES } from "./index";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`assertion failed: ${message}`);
}

function applyFarm(condition: Condition, levels: Record<string, number>): void {
  if (condition.type === "biomeLevelAtLeast") {
    levels[condition.biomeGroup] = Math.max(levels[condition.biomeGroup] ?? 0, condition.level);
  } else if (condition.type === "recipeUnlocked") {
    const recipe = RECIPE_DATABASE.get(condition.recipeId);
    assert(recipe, `farm references live item recipe ${condition.recipeId}`);
    levels[recipe.recipeGroup] = Math.max(levels[recipe.recipeGroup] ?? 0, recipe.requiredBiomeLevel);
  } else if (condition.type === "allOf" || condition.type === "anyOf") {
    condition.of.forEach((child) => applyFarm(child, levels));
  }
}

function hasHardcodedWalletThreshold(condition: Condition): boolean {
  if (condition.type === "essenceAtLeast") return true;
  if (condition.type === "allOf" || condition.type === "anyOf") {
    return condition.of.some(hasHardcodedWalletThreshold);
  }
  return condition.type === "not" && hasHardcodedWalletThreshold(condition.of);
}

for (const route of T1_CONTROLLED_ROUTES) {
  const levels: Record<string, number> = {};
  const craftedItems = new Set<string>();
  const learnedAbilities = new Set<string>();
  const ownedRunes = new Set(STARTER_RUNE_IDS);

  for (const step of route.steps) {
    if (step.type === "farm") {
      assert(!hasHardcodedWalletThreshold(step.until), `${route.id}: no stale hardcoded wallet threshold`);
      applyFarm(step.until, levels);
      continue;
    }

    if (step.type === "craft") {
      for (const recipeId of step.recipeIds) {
        const recipe = RECIPE_DATABASE.get(recipeId);
        assert(recipe, `${route.id}: recipe exists (${recipeId})`);
        assert((levels[recipe.recipeGroup] ?? 0) >= recipe.requiredBiomeLevel, `${route.id}: ${recipeId} gate is reached before craft`);
        assert(Object.values(recipe.cost).every((amount) => (amount ?? 0) >= 0), `${route.id}: ${recipeId} reads a valid live cost`);
        craftedItems.add(recipeId);
      }
      continue;
    }

    assert(step.type !== "upgrade" && step.type !== "evolveItem", `${route.id}: no retired purchases`);

    if (step.type === "equip") {
      for (const itemId of step.definitionIds) {
        assert(craftedItems.has(itemId), `${route.id}: ${itemId} acquired before equip`);
      }
      continue;
    }

    if (step.type === "learnAbility") {
      const recipe = ABILITY_RECIPE_DATABASE.get(step.recipeId);
      assert(recipe?.abilityId === step.abilityId, `${route.id}: ${step.abilityId} resolves its live recipe`);
      if (recipe.recipeGroup) {
        levels[recipe.recipeGroup] = Math.max(
          levels[recipe.recipeGroup] ?? 0,
          recipe.requiredBiomeLevel ?? 0,
        );
      }
      learnedAbilities.add(step.abilityId);
      continue;
    }

    if (step.type === "setAbilities") {
      for (const abilityId of [...step.techniques, ...step.guards]) {
        assert(learnedAbilities.has(abilityId), `${route.id}: ${abilityId} acquired before first use`);
      }
      continue;
    }

    if (step.type === "craftRune") {
      const recipe = RUNE_RECIPE_DATABASE.get(step.recipeId);
      assert(recipe?.runeId && !recipe.deprecated, `${route.id}: live Rune recipe exists (${step.recipeId})`);
      if (recipe.recipeGroup) {
        levels[recipe.recipeGroup] = Math.max(
          levels[recipe.recipeGroup] ?? 0,
          recipe.requiredBiomeLevel ?? 0,
        );
      }
      ownedRunes.add(recipe.runeId);
      continue;
    }

    if (step.type === "configureRunes") {
      for (const rule of step.rules) {
        assert(ownedRunes.has(rule.conditionId), `${route.id}: Rune condition ${rule.conditionId} acquired before use`);
        assert(ownedRunes.has(rule.actionId), `${route.id}: Rune action ${rule.actionId} acquired before use`);
      }
      continue;
    }

    if (step.type === "attemptBoss") {
      // Every authored boss kit is already acquired at full base power.
      const previousEquip = route.steps.slice(0, route.steps.indexOf(step)).reverse().find(
        (candidate) => candidate.type === "equip",
      );
      if (previousEquip?.type === "equip") {
        for (const itemId of previousEquip.definitionIds) {
          assert(craftedItems.has(itemId), `${route.id}: ${itemId} acquired for the boss loadout`);
        }
      }
    }
  }
}

const validationConfig = buildConfig({ rewardMultiplier: "25" });
assert(validationConfig.rewardMultiplier === 25, "controlled validation multiplier parses as intended");
assert(T1_CONTROLLED_ROUTES.length === 8, "all eight controlled routes pass the live economy audit");
console.log("t1EconomyCompatibility.test.ts: ok");
