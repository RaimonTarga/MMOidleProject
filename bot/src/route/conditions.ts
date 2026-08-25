import { RECIPE_DATABASE, type EssenceType } from "@mmo-idle/shared";
import type { Observation } from "../state/observation";
import { dungeonNodeFor, normalNodesFor } from "../state/observation";
import type { Condition, NodeRef } from "./types";

export interface ConditionContext {
  obs: Observation;
  elapsedMs: number;
}

export function evaluate(condition: Condition, ctx: ConditionContext): boolean {
  const { obs } = ctx;
  switch (condition.type) {
    case "biomeLevelAtLeast":
      return obs.biomeLevel(condition.biomeGroup) >= condition.level;
    case "essenceAtLeast":
      return obs.essence(condition.essence) >= condition.amount;
    case "catalystAtLeast":
      return obs.catalyst(condition.family) >= condition.amount;
    case "recipeUnlocked":
      return obs.recipeUnlocked(condition.recipeId);
    case "hasItem":
      return obs.hasItem(condition.definitionId);
    case "itemAtLeastPlus":
      return obs.itemPlus(condition.definitionId) >= condition.plus;
    case "equipped": {
      const self = obs.self;
      if (!self) return false;
      return Object.values(self.equipment).includes(condition.definitionId);
    }
    case "bossCleared":
      return obs.bossCleared(condition.biomeGroup, condition.tier);
    case "playerTierAtLeast":
      return (obs.self?.playerTier ?? 0) >= condition.tier;
    case "canCraft":
      return obs.canCraft(condition.recipeId);
    case "canUpgrade":
      return obs.canUpgrade(condition.definitionId).ok;
    case "globalMasteryAtLeast":
      return (obs.self?.globalMastery ?? 0) >= condition.value;
    case "elapsedMs":
      return ctx.elapsedMs >= condition.ms;
    case "allOf":
      return condition.of.every((c) => evaluate(c, ctx));
    case "anyOf":
      return condition.of.some((c) => evaluate(c, ctx));
    case "not":
      return !evaluate(condition.of, ctx);
  }
}

/** Human-readable form, used in stall reports and step labels. */
export function describe(condition: Condition): string {
  switch (condition.type) {
    case "biomeLevelAtLeast":
      return `${condition.biomeGroup} level >= ${condition.level}`;
    case "essenceAtLeast":
      return `${condition.essence} essence >= ${condition.amount}`;
    case "catalystAtLeast":
      return `${condition.family} catalysts >= ${condition.amount}`;
    case "recipeUnlocked":
      return `recipe ${condition.recipeId} unlocked`;
    case "hasItem":
      return `owns ${condition.definitionId}`;
    case "itemAtLeastPlus":
      return `${condition.definitionId} at +${condition.plus}`;
    case "equipped":
      return `${condition.definitionId} equipped`;
    case "bossCleared":
      return `${condition.biomeGroup} T${condition.tier} boss cleared`;
    case "playerTierAtLeast":
      return `player tier >= ${condition.tier}`;
    case "canCraft":
      return `can craft ${condition.recipeId}`;
    case "canUpgrade":
      return `can upgrade ${condition.definitionId}`;
    case "globalMasteryAtLeast":
      return `global mastery >= ${condition.value}`;
    case "elapsedMs":
      return `elapsed >= ${Math.round(condition.ms / 1000)}s`;
    case "allOf":
      return condition.of.map(describe).join(" AND ");
    case "anyOf":
      return condition.of.map(describe).join(" OR ");
    case "not":
      return `NOT (${describe(condition.of)})`;
  }
}

/**
 * What a condition is still short of, for the stall report. Only the leaf kinds
 * that name a quantity can answer this; the rest report presence.
 */
export function shortfall(condition: Condition, obs: Observation): Record<string, number> {
  const out: Record<string, number> = {};
  const visit = (c: Condition): void => {
    switch (c.type) {
      case "essenceAtLeast": {
        const missing = c.amount - obs.essence(c.essence);
        if (missing > 0) out[`essence.${c.essence}`] = missing;
        break;
      }
      case "catalystAtLeast": {
        const missing = c.amount - obs.catalyst(c.family);
        if (missing > 0) out[`catalyst.${c.family}`] = missing;
        break;
      }
      case "biomeLevelAtLeast": {
        const missing = c.level - obs.biomeLevel(c.biomeGroup);
        if (missing > 0) out[`biomeLevel.${c.biomeGroup}`] = missing;
        break;
      }
      case "allOf":
      case "anyOf":
        c.of.forEach(visit);
        break;
      case "not":
        visit(c.of);
        break;
      default:
        break;
    }
  };
  visit(condition);
  return out;
}

/** Essence and catalysts a recipe still needs, given the current wallet. */
export function recipeShortfall(recipeId: string, obs: Observation): Record<string, number> {
  const recipe = RECIPE_DATABASE.get(recipeId);
  const out: Record<string, number> = {};
  if (!recipe) return out;
  for (const [type, amount] of Object.entries(recipe.cost)) {
    const missing = (amount ?? 0) - obs.essence(type as EssenceType);
    if (missing > 0) out[`essence.${type}`] = missing;
  }
  for (const [family, amount] of Object.entries(recipe.catalystCost ?? {})) {
    const missing = (amount ?? 0) - obs.catalyst(family);
    if (missing > 0) out[`catalyst.${family}`] = missing;
  }
  return out;
}

/**
 * Turn a route's content reference into a concrete node id.
 * `uncleared` prefers a node the player has not yet cleared, which is what makes
 * `clearedNodes` (and therefore the biome's completion state) actually advance.
 */
export function resolveNode(ref: NodeRef, obs: Observation, rotation: number): string | null {
  if (ref.kind === "node") return ref.nodeId;
  if (ref.kind === "dungeon") return dungeonNodeFor(ref.biomeGroup, ref.tier);

  const nodes = normalNodesFor(ref.biomeGroup, ref.tier);
  if (nodes.length === 0) return null;

  const pick = ref.pick ?? "first";
  if (pick === "first") return nodes[0];
  if (pick === "rotate") return nodes[rotation % nodes.length];

  const cleared = new Set(obs.self?.clearedNodes ?? []);
  return nodes.find((id) => !cleared.has(id)) ?? nodes[rotation % nodes.length];
}
