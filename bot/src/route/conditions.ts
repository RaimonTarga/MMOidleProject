import {
  ITEM_DATABASE,
  RECIPE_DATABASE,
  globalMasteryRequiredForUpgrade,
  requiredBiomeLevelForUpgrade,
  upgradeCatalystCostFor,
  upgradeCeilingFromGlobalMastery,
  upgradeCostFor,
  worldNodeExits,
  type EssenceType,
} from "@mmo-idle/shared";
import type { BlockReason } from "../telemetry/events";
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
    case "canEvolve":
      return obs.canEvolve(condition.recipeId, condition.mode).ok;
    case "canReconstruct":
      return obs.canReconstruct(condition.recipeId).ok;
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
    case "canEvolve":
      return `can ${condition.mode} ${condition.recipeId}`;
    case "canReconstruct":
      return `can reconstruct ${condition.recipeId}`;
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


// ── Explicit block reasons ──────────────────────────────────────────────────
//
// The 2026-08-31 economy deep-dive could only attribute an upgrade wait to
// essence-versus-catalyst by inferring it from the farm node the bot picked,
// because the block event carried a bare `{blocked:1}`. Everything below
// re-evaluates the SAME shared predicates the server uses and names each one
// that is failing, so the attribution is direct evidence rather than inference.

/** Every failing predicate behind the next `+1` on `definitionId`. */
export function upgradeBlockReasons(definitionId: string, obs: Observation): BlockReason[] {
  const self = obs.self;
  const item = ITEM_DATABASE.get(definitionId);
  const out: BlockReason[] = [];
  if (!self || !item) {
    out.push({ kind: "prerequisite", detail: `unknown item ${definitionId}` });
    return out;
  }
  if (!item.biomeGroup) {
    out.push({ kind: "prerequisite", detail: `${definitionId} has no biome group` });
    return out;
  }
  const targetPlus = obs.itemPlus(definitionId) + 1;

  const gmRequired = globalMasteryRequiredForUpgrade(item.tier, targetPlus);
  const gm = self.globalMastery;
  if (targetPlus > upgradeCeilingFromGlobalMastery(gm, item.tier)) {
    out.push({ kind: "globalMastery", current: gm, required: gmRequired, missing: gmRequired - gm });
  }

  const reqLevel = requiredBiomeLevelForUpgrade(item, targetPlus);
  const level = obs.biomeLevel(item.biomeGroup);
  if (level < reqLevel) {
    out.push({
      kind: "biomeLevel",
      biomeGroup: item.biomeGroup,
      current: level,
      required: reqLevel,
      missing: reqLevel - level,
    });
  }

  for (const [type, amount] of Object.entries(
    upgradeCostFor(item, targetPlus, obs.economyConfig?.t1Plus5EssenceCostMultiplier) ?? {},
  )) {
    const have = obs.essence(type as EssenceType);
    const need = amount ?? 0;
    if (have < need) {
      out.push({ kind: "essence", essence: type, current: have, required: need, missing: need - have });
    }
  }

  for (const [family, amount] of Object.entries(upgradeCatalystCostFor(item, targetPlus) ?? {})) {
    const have = obs.catalyst(family);
    const need = amount ?? 0;
    if (have < need) {
      out.push({ kind: "catalyst", family, current: have, required: need, missing: need - have });
    }
  }

  // A gate the shared check rejects that none of the branches above explain --
  // e.g. the item is already at its structural maximum.
  if (out.length === 0) {
    const check = obs.canUpgrade(definitionId);
    if (!check.ok) out.push({ kind: "prerequisite", detail: check.reason ?? "unknown" });
  }
  return out;
}

/** Every failing predicate behind crafting `recipeId` right now. */
export function craftBlockReasons(recipeId: string, obs: Observation): BlockReason[] {
  const recipe = RECIPE_DATABASE.get(recipeId);
  const out: BlockReason[] = [];
  if (!recipe) {
    out.push({ kind: "prerequisite", detail: `unknown recipe ${recipeId}` });
    return out;
  }
  if (!obs.recipeUnlocked(recipeId)) {
    out.push({ kind: "recipeLocked", recipeId });
    const level = obs.biomeLevel(recipe.recipeGroup);
    if (level < recipe.requiredBiomeLevel) {
      out.push({
        kind: "biomeLevel",
        biomeGroup: recipe.recipeGroup,
        current: level,
        required: recipe.requiredBiomeLevel,
        missing: recipe.requiredBiomeLevel - level,
      });
    }
  }
  for (const [type, amount] of Object.entries(recipe.cost)) {
    const have = obs.essence(type as EssenceType);
    const need = amount ?? 0;
    if (have < need) {
      out.push({ kind: "essence", essence: type, current: have, required: need, missing: need - have });
    }
  }
  for (const [family, amount] of Object.entries(recipe.catalystCost ?? {})) {
    const have = obs.catalyst(family);
    const need = amount ?? 0;
    if (have < need) {
      out.push({ kind: "catalyst", family, current: have, required: need, missing: need - have });
    }
  }
  return out;
}

/** Failing predicates behind a route `Condition`, for non-craft/upgrade waits. */
export function conditionBlockReasons(condition: Condition, obs: Observation): BlockReason[] {
  const out: BlockReason[] = [];
  const visit = (c: Condition): void => {
    switch (c.type) {
      case "essenceAtLeast": {
        const have = obs.essence(c.essence);
        if (have < c.amount) {
          out.push({ kind: "essence", essence: c.essence, current: have, required: c.amount, missing: c.amount - have });
        }
        break;
      }
      case "catalystAtLeast": {
        const have = obs.catalyst(c.family);
        if (have < c.amount) {
          out.push({ kind: "catalyst", family: c.family, current: have, required: c.amount, missing: c.amount - have });
        }
        break;
      }
      case "biomeLevelAtLeast": {
        const have = obs.biomeLevel(c.biomeGroup);
        if (have < c.level) {
          out.push({ kind: "biomeLevel", biomeGroup: c.biomeGroup, current: have, required: c.level, missing: c.level - have });
        }
        break;
      }
      case "globalMasteryAtLeast": {
        const have = obs.self?.globalMastery ?? 0;
        if (have < c.value) {
          out.push({ kind: "globalMastery", current: have, required: c.value, missing: c.value - have });
        }
        break;
      }
      case "recipeUnlocked":
        if (!obs.recipeUnlocked(c.recipeId)) out.push({ kind: "recipeLocked", recipeId: c.recipeId });
        break;
      case "canCraft":
        if (!obs.canCraft(c.recipeId)) out.push(...craftBlockReasons(c.recipeId, obs));
        break;
      case "canUpgrade":
        if (!obs.canUpgrade(c.definitionId).ok) out.push(...upgradeBlockReasons(c.definitionId, obs));
        break;
      case "allOf":
      case "anyOf":
        c.of.forEach(visit);
        break;
      case "not":
        visit(c.of);
        break;
      default:
        if (!evaluate(c, { obs, elapsedMs: Number.MAX_SAFE_INTEGER })) {
          out.push({ kind: "prerequisite", detail: describe(c) });
        }
        break;
    }
  };
  visit(condition);
  return out;
}

/**
 * Lift a legacy flat `missing` map back into typed reasons, reading the current
 * holding from the wallet so `current`/`required` stay exact. Used by the
 * non-economy waits (ability / rune / evolution / stance) whose shortfall maps
 * are authored inline against their own recipe shapes.
 */
export function missingToReasons(
  missing: Record<string, number>,
  obs: Observation,
): BlockReason[] {
  const out: BlockReason[] = [];
  for (const [key, short] of Object.entries(missing)) {
    const [head, ...rest] = key.split(".");
    const name = rest.join(".");
    if (head === "essence") {
      const current = obs.essence(name as EssenceType);
      out.push({ kind: "essence", essence: name, current, required: current + short, missing: short });
    } else if (head === "catalyst") {
      const current = obs.catalyst(name);
      out.push({ kind: "catalyst", family: name, current, required: current + short, missing: short });
    } else if (head === "biomeLevel") {
      const current = obs.biomeLevel(name);
      out.push({ kind: "biomeLevel", biomeGroup: name, current, required: current + short, missing: short });
    } else if (key === "globalMasteryNeeded") {
      const current = obs.self?.globalMastery ?? 0;
      out.push({ kind: "globalMastery", current, required: current + short, missing: short });
    } else {
      out.push({ kind: "prerequisite", detail: key });
    }
  }
  return out;
}

/** `blockReasons` collapsed to the flat `missing` map the dashboards read. */
export function reasonsToMissing(reasons: readonly BlockReason[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const reason of reasons) {
    switch (reason.kind) {
      case "essence": out[`essence.${reason.essence}`] = reason.missing; break;
      case "catalyst": out[`catalyst.${reason.family}`] = reason.missing; break;
      case "biomeLevel": out[`biomeLevel.${reason.biomeGroup}`] = reason.missing; break;
      case "globalMastery": out.globalMasteryNeeded = reason.missing; break;
      case "recipeLocked": out[`recipeLocked.${reason.recipeId}`] = 1; break;
      case "prerequisite": out.prerequisite = (out.prerequisite ?? 0) + 1; break;
    }
  }
  return out;
}

/**
 * Turn a route's content reference into a concrete node id.
 * `uncleared` prefers a node the player has not yet cleared, which is what makes
 * `clearedNodes` (and therefore the biome's completion state) actually advance.
 *
 * Among uncleared candidates it picks the NEAREST one by real hop-distance from
 * the bot's current node, not the alphabetically/numerically first id. Node ids
 * (`plains-01`, `plains-02`, ...) are assigned by the map's procedural territory
 * growth and carry no relationship to actual position -- `-01` can easily be the
 * FARTHEST node from the Clearing, or one only reachable by cutting through a
 * neighboring, more dangerous biome. A distance-blind "first" pick sent bots on
 * exactly that kind of detour (e.g. routing through Swamp on the way to a first
 * Plains leg) and got them killed in transit.
 */
export function resolveNode(ref: NodeRef, obs: Observation, rotation: number): string | null {
  return resolveNodeCandidates(ref, obs, rotation)[0] ?? null;
}

/**
 * The same choice `resolveNode` makes, but as the FULL ordered preference list.
 *
 * Element 0 is exactly what a solo/sequential run picks, so ordinary execution
 * is unchanged. The tail exists only for isolated-parallel scheduling: when the
 * head node is leased by another controlled bot, the coordinator may hand this
 * bot the next entry instead of parking it. That is not a reroute -- every T1
 * farm ref is authored as a BIOME with `pick: "uncleared"`, so which node inside
 * the biome gets used was always the executor's dynamic choice.
 *
 * Nodes are NOT interchangeable: each carries its own node modifier, which
 * rescales monster HP/attack/plating at spawn. The chosen node is therefore
 * recorded per farm span so the difficulty a run actually met stays visible.
 */
export function resolveNodeCandidates(
  ref: NodeRef,
  obs: Observation,
  rotation: number,
): string[] {
  if (ref.kind === "node") return [ref.nodeId];
  if (ref.kind === "dungeon") {
    const dungeon = dungeonNodeFor(ref.biomeGroup, ref.tier);
    return dungeon ? [dungeon] : [];
  }

  const nodes = normalNodesFor(ref.biomeGroup, ref.tier, ref.modifier);
  if (nodes.length === 0) return [];

  const pick = ref.pick ?? "first";
  // "first" and "rotate" name one specific node on purpose; widening them would
  // change what those routes were authored to measure.
  if (pick === "first") return [nodes[0]];
  if (pick === "rotate") return [nodes[rotation % nodes.length]];

  const cleared = new Set(obs.self?.clearedNodes ?? []);
  const candidates = nodes.filter((id) => !cleared.has(id));
  const pool = candidates.length > 0 ? candidates : nodes;
  const ordered = orderByProximity(obs.nodeId, pool);
  if (ordered.length > 0) return ordered;
  const start = rotation % pool.length;
  return [...pool.slice(start), ...pool.slice(0, start)];
}

/**
 * BFS over the real map graph (`worldNodeExits`, the same orthogonal adjacency
 * the server paths `player:navigateTo` through) from `fromNodeId` to the
 * closest of `candidateIds` by hop count. Because BFS explores in increasing
 * distance order, the first candidate it reaches IS the nearest one -- and
 * since biome territories are grown contiguously, the nearest node of a biome
 * is reached by a path that stays inside (or close to) that biome, which is
 * what keeps this from routing through unrelated, more dangerous ground.
 */
/**
 * The candidates worth waiting for, rather than trekking past.
 *
 * Returns the prefix of `resolveNodeCandidates` whose hop-distance is within
 * `slackHops` of the CLOSEST candidate. The bias is relative, not absolute, so
 * it behaves correctly whether the target biome is next door or across the map:
 * it always allows the nearest cluster and never insists on waiting for
 * something that was never close to begin with.
 *
 * This exists because at 8-bot contention the plain "first free candidate" rule
 * could hand a bot a node on the far side of the world, producing a multi-biome
 * crossing that cost about a minute of walking. Waiting a while for a near node
 * is usually cheaper -- especially since a bot that owns the node it is standing
 * in keeps farming while it waits.
 */
export function resolveNearCandidates(
  ref: NodeRef,
  obs: Observation,
  rotation: number,
  slackHops: number,
): string[] {
  const ordered = resolveNodeCandidates(ref, obs, rotation);
  if (ordered.length <= 1) return ordered;
  const measured = measureByProximity(obs.nodeId ?? "", ordered);
  if (measured.length === 0) return ordered;
  const nearest = measured[0].hops;
  if (!Number.isFinite(nearest)) return ordered;
  const budget = nearest + Math.max(0, slackHops);
  const near = measured.filter((entry) => entry.hops <= budget).map((entry) => entry.nodeId);
  // Preserve the caller's ordering, and never return an empty preference.
  const allowed = new Set(near);
  const result = ordered.filter((nodeId) => allowed.has(nodeId));
  return result.length > 0 ? result : ordered;
}

function orderByProximity(fromNodeId: string, candidateIds: readonly string[]): string[] {
  return measureByProximity(fromNodeId, candidateIds).map((entry) => entry.nodeId);
}

/** BFS hop distance to each candidate, nearest first. Unreached ones get Infinity. */
function measureByProximity(
  fromNodeId: string,
  candidateIds: readonly string[],
): Array<{ nodeId: string; hops: number }> {
  if (!fromNodeId) return [];
  const targets = new Set(candidateIds);
  const found: Array<{ nodeId: string; hops: number }> = [];
  if (targets.has(fromNodeId)) {
    found.push({ nodeId: fromNodeId, hops: 0 });
    targets.delete(fromNodeId);
  }

  const visited = new Set<string>([fromNodeId]);
  let frontier = [fromNodeId];
  let hops = 0;
  const MAX_VISITED = 5_000;

  // BFS explores in increasing hop order, so appending on discovery yields the
  // candidates sorted by real map distance -- element 0 is the nearest, which
  // is the single node the previous `nearestNodeId` returned.
  while (frontier.length > 0 && visited.size < MAX_VISITED && targets.size > 0) {
    const next: string[] = [];
    hops += 1;
    for (const nodeId of frontier) {
      for (const neighborId of Object.values(worldNodeExits(nodeId))) {
        if (!neighborId || visited.has(neighborId)) continue;
        if (targets.has(neighborId)) {
          found.push({ nodeId: neighborId, hops });
          targets.delete(neighborId);
        }
        visited.add(neighborId);
        next.push(neighborId);
      }
    }
    frontier = next;
  }
  // If the walk reached nothing, report no ordering at all so the caller keeps
  // its historical rotation fallback rather than silently preferring index 0.
  if (found.length === 0) return [];
  // Anything the graph walk never reached still belongs in the pool, just last.
  for (const candidateId of candidateIds) {
    if (targets.has(candidateId)) found.push({ nodeId: candidateId, hops: Number.POSITIVE_INFINITY });
  }
  return found;
}
