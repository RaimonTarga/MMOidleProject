import {
  ABILITY_RECIPE_DATABASE,
  ITEM_DATABASE,
  NODE_MODIFIERS,
  RECIPE_DATABASE,
  RUNE_RECIPE_DATABASE,
  STARTER_RUNE_IDS,
  globalMastery,
  upgradeCatalystCostFor,
  upgradeCeilingFromGlobalMastery,
  upgradeCostFor,
} from "@mmo-idle/shared";
import { buildConfig } from "../config";
import type { Condition, RouteStep } from "../route/types";
import { normalNodesFor } from "../state/observation";
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
  if (condition.type === "essenceAtLeast" || condition.type === "catalystAtLeast") return true;
  if (condition.type === "allOf" || condition.type === "anyOf") {
    return condition.of.some(hasHardcodedWalletThreshold);
  }
  return condition.type === "not" && hasHardcodedWalletThreshold(condition.of);
}

function farmBiome(step: Extract<RouteStep, { type: "upgrade" }>, fallback: string): string {
  return step.farmAt?.kind === "biome" ? step.farmAt.biomeGroup : fallback;
}

for (const route of T1_CONTROLLED_ROUTES) {
  const levels: Record<string, number> = {};
  const craftedItems = new Set<string>();
  const itemPlus = new Map<string, number>();
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

    if (step.type === "upgrade") {
      const item = ITEM_DATABASE.get(step.definitionId);
      const recipe = RECIPE_DATABASE.get(step.definitionId);
      assert(item && recipe, `${route.id}: upgrade item is live (${step.definitionId})`);
      assert(craftedItems.has(step.definitionId), `${route.id}: ${step.definitionId} acquired before upgrade`);
      const from = itemPlus.get(step.definitionId) ?? 0;
      const ceiling = upgradeCeilingFromGlobalMastery(globalMastery(levels), item.tier);
      const target = step.opportunistic ? Math.min(step.toPlus, ceiling) : step.toPlus;
      assert(step.opportunistic || ceiling >= target, `${route.id}: GM gate permits ${step.definitionId} +${target}`);
      for (let plus = from + 1; plus <= target; plus += 1) {
        const cost = upgradeCostFor(item, plus);
        assert(cost, `${route.id}: ${step.definitionId} +${plus} resolves live upgrade cost`);
        const authored = item.upgrades?.[plus - 1];
        if (authored && (levels[recipe.recipeGroup] ?? 0) < authored.requiredBiomeLevel) {
          // doUpgrade farms against checkUpgrade until the live gate opens.
          assert(authored.requiredBiomeLevel <= 6, `${route.id}: ${step.definitionId} +${plus} gate is reachable in T1`);
          levels[recipe.recipeGroup] = authored.requiredBiomeLevel;
        }
        for (const family of Object.keys(upgradeCatalystCostFor(item, plus) ?? {})) {
          const biomeGroup = farmBiome(step, recipe.recipeGroup);
          const supplier = normalNodesFor(biomeGroup, 1).find(
            (nodeId) => NODE_MODIFIERS[nodeId]?.modifier === family,
          );
          assert(supplier, `${route.id}: ${biomeGroup} has live ${family} catalyst supply for ${step.definitionId} +${plus}`);
        }
      }
      itemPlus.set(step.definitionId, target);
      continue;
    }

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
      // Every authored boss kit has already completed its live +5 sequence.
      const previousEquip = route.steps.slice(0, route.steps.indexOf(step)).reverse().find(
        (candidate) => candidate.type === "equip",
      );
      if (previousEquip?.type === "equip") {
        for (const itemId of previousEquip.definitionIds) {
          assert((itemPlus.get(itemId) ?? 0) === 5, `${route.id}: ${itemId} reaches intended +5 boss loadout`);
        }
      }
    }
  }
}

const validationConfig = buildConfig({ rewardMultiplier: "25" });
assert(validationConfig.rewardMultiplier === 25, "controlled validation multiplier parses as intended");
assert(T1_CONTROLLED_ROUTES.length === 8, "all eight controlled routes pass the live economy audit");
console.log("t1EconomyCompatibility.test.ts: ok");
