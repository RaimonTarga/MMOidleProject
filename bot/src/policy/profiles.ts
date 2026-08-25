import {
  DEFAULT_AUTOCOMBAT_CONFIG,
  DEFAULT_RUNE_LOADOUT,
  type AutocombatConfig,
  type EquippedRule,
} from "@mmo-idle/shared";
import type { Condition, RouteStep } from "../route/types";

/**
 * Policy profiles are PARAMETERS over one executor, never a second bot.
 *
 * The suboptimal profiles are deliberately *plausible*, not random: a player who
 * upgrades less and swaps gear less often produces interpretable balance
 * evidence, whereas random equipment produces noise.
 */
export interface Policy {
  id: string;
  description: string;
  /** Adjust an authored `+N` upgrade target. */
  upgradeTarget(authored: number): number;
  /** Adjust an authored farm-until condition. */
  farmCondition(condition: Condition): Condition;
  /** Whether this profile performs a step the route marked optional. */
  performsOptional(step: RouteStep): boolean;
  /** The rune loadout this profile actually equips. */
  runeLoadout(authored: EquippedRule[]): EquippedRule[];
  autocombat: AutocombatConfig;
}

/** Lower every biome-level threshold in a condition tree by `delta` (floored at 1). */
function relaxBiomeLevels(condition: Condition, delta: number): Condition {
  switch (condition.type) {
    case "biomeLevelAtLeast":
      return { ...condition, level: Math.max(1, condition.level - delta) };
    case "allOf":
    case "anyOf":
      return { ...condition, of: condition.of.map((c) => relaxBiomeLevels(c, delta)) };
    case "not":
      return { ...condition, of: relaxBiomeLevels(condition.of, delta) };
    default:
      return condition;
  }
}

const INTENDED: Policy = {
  id: "intended",
  description:
    "A knowledgeable player following the authored route with the intended gear, upgrades and rune counters.",
  upgradeTarget: (authored) => authored,
  farmCondition: (condition) => condition,
  performsOptional: () => true,
  runeLoadout: (authored) => authored,
  autocombat: { ...DEFAULT_AUTOCOMBAT_CONFIG },
};

const RUSHER: Policy = {
  id: "rusher",
  description:
    "Advances the moment a gate permits it: minimal upgrades, no optional preparation, starter runes.",
  // Craft the item, then move on — the whole point is measuring how punishing
  // under-preparation is, so upgrades stop at the crafted baseline.
  upgradeTarget: () => 0,
  farmCondition: (condition) => relaxBiomeLevels(condition, 2),
  performsOptional: () => false,
  runeLoadout: () => [...DEFAULT_RUNE_LOADOUT],
  autocombat: { ...DEFAULT_AUTOCOMBAT_CONFIG },
};

const GENERIC: Policy = {
  id: "generic",
  description:
    "A plausible player: reasonable but non-optimal gear, weaker upgrade thresholds, generic defensive runes.",
  upgradeTarget: (authored) => Math.max(0, authored - 1),
  farmCondition: (condition) => relaxBiomeLevels(condition, 1),
  // Skips the biome-specific swaps and counters, keeps the core progression.
  performsOptional: () => false,
  runeLoadout: () => [...DEFAULT_RUNE_LOADOUT],
  autocombat: {
    ...DEFAULT_AUTOCOMBAT_CONFIG,
    // A generic player leans on the flee default rather than tuned thresholds.
    fleeWhenLow: true,
  },
};

export const POLICIES = new Map<string, Policy>([
  [INTENDED.id, INTENDED],
  [RUSHER.id, RUSHER],
  [GENERIC.id, GENERIC],
]);

export function requirePolicy(id: string): Policy {
  const policy = POLICIES.get(id);
  if (!policy) {
    throw new Error(`unknown policy "${id}" (have: ${[...POLICIES.keys()].join(", ")})`);
  }
  return policy;
}
