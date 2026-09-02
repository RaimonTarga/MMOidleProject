import {
  STANCE_DATABASE,
  NO_STANCE_ID,
  runeRuleCost,
  runicPointLoadoutCost,
  runicPointLoadoutFits,
  stanceDef,
} from "@mmo-idle/shared";
import { resolveNodeCandidates } from "./conditions";
import { normalNodesFor } from "../state/observation";
import type { Observation } from "../state/observation";
import { NODE_BIOMES } from "@mmo-idle/shared";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`assertion failed: ${message}`);
}

// A stance destination is part of the rule's RP bill, and an exact-budget
// loadout is legal while the same loadout one point over is not.
const offensiveRule = {
  conditionId: "in-combat",
  actionId: "switch-stance",
  targetStanceId: "offensive-stance",
} as const;
const withoutDestination = { conditionId: "in-combat", actionId: "switch-stance" } as const;
const stanceCost = stanceDef("offensive-stance")!.runeCost;
assert(STANCE_DATABASE.has("offensive-stance"), "stance catalog contains the RP destination");
assert(
  runeRuleCost(offensiveRule) === runeRuleCost(withoutDestination) + stanceCost,
  "stance destination cost is included exactly once",
);
const exactCost = runicPointLoadoutCost({ rules: [offensiveRule], rites: [] });
assert(runicPointLoadoutFits({ rules: [offensiveRule], rites: [] }, exactCost), "exact RP budget fits");
assert(!runicPointLoadoutFits({ rules: [offensiveRule], rites: [] }, exactCost - 1), "one point over RP budget fails");
const defensiveRule = {
  conditionId: "low-health",
  actionId: "switch-stance",
  targetStanceId: "defensive-stance",
} as const;
const repeatedDestinationRules = [offensiveRule, { ...offensiveRule, conditionId: "boss" }, defensiveRule];
assert(
  runicPointLoadoutCost({ rules: repeatedDestinationRules, rites: [] }) ===
    runeRuleCost(offensiveRule) + runeRuleCost({ ...offensiveRule, conditionId: "boss" }) + runeRuleCost(defensiveRule),
  "multiple rules pay each destination stance surcharge independently",
);
assert(
  runicPointLoadoutFits({ rules: repeatedDestinationRules, rites: [] }, runicPointLoadoutCost({ rules: repeatedDestinationRules, rites: [] })),
  "multiple destinations fit at their exact combined RP budget",
);
assert(
  runicPointLoadoutCost({ rules: [{ ...offensiveRule, targetStanceId: NO_STANCE_ID }], rites: [] }) ===
    runeRuleCost({ ...offensiveRule, targetStanceId: NO_STANCE_ID }),
  "no-stance destination remains a legal zero-surcharge destination",
);

// Modifier selectors are hard filters. A requested family with no live node is
// reported as an empty candidate set, so the executor cannot silently farm a
// different catalyst forever. Existing no-modifier selection remains unchanged.
const normalT1 = Object.entries(NODE_BIOMES).filter(([, info]) => info.kind === "normal" && info.biomeTier === 1);
const sample = normalT1.find(([, info]) => !!info.modifier);
assert(!!sample, "T1 has normal nodes with modifiers");
const [sampleNode, sampleInfo] = sample!;
const plain = normalNodesFor(sampleInfo.biomeGroup, 1);
const filtered = normalNodesFor(sampleInfo.biomeGroup, 1, sampleInfo.modifier);
assert(plain.includes(sampleNode), "modifier filter preserves the unfiltered node set");
assert(filtered.length > 0 && filtered.every((id) => NODE_BIOMES[id]?.modifier === sampleInfo.modifier), "modifier filter is exact");
const fakeObservation = { nodeId: sampleNode, self: null } as unknown as Observation;
assert(
  resolveNodeCandidates(
    { kind: "biome", biomeGroup: sampleInfo.biomeGroup, tier: 1, pick: "uncleared", modifier: "__missing_modifier__" },
    fakeObservation,
    0,
  ).length === 0,
  "missing requested modifier does not fall through to unrelated nodes",
);

console.log("readiness.semantic.test.ts: ok");
