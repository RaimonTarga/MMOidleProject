import { resolveNodeCandidates } from "./conditions";
import { normalNodesFor } from "../state/observation";
import type { Observation } from "../state/observation";
import { NODE_BIOMES } from "@mmo-idle/shared";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`assertion failed: ${message}`);
}

// Modifier selectors are hard filters. A requested family with no live node is
// reported as an empty candidate set, so the executor cannot silently farm a
// different catalyst forever. Existing no-modifier selection remains unchanged.
//
// Sampled from T2, not T1: Phase 2b deleted T1's `modifier` field outright
// once its biomes carry a family blend (progression rework design §12) -- T1
// normal nodes carry no modifier any more. T2-T4 are unaffected (no family
// tables authored yet), so they remain the modifier-selector's live ground.
const normalT2 = Object.entries(NODE_BIOMES).filter(([, info]) => info.kind === "normal" && info.biomeTier === 2);
const sample = normalT2.find(([, info]) => !!info.modifier);
assert(!!sample, "T2 has normal nodes with modifiers");
const [sampleNode, sampleInfo] = sample!;
const plain = normalNodesFor(sampleInfo.biomeGroup, 2);
const filtered = normalNodesFor(sampleInfo.biomeGroup, 2, sampleInfo.modifier);
assert(plain.includes(sampleNode), "modifier filter preserves the unfiltered node set");
assert(filtered.length > 0 && filtered.every((id) => NODE_BIOMES[id]?.modifier === sampleInfo.modifier), "modifier filter is exact");
const fakeObservation = { nodeId: sampleNode, self: null } as unknown as Observation;
assert(
  resolveNodeCandidates(
    { kind: "biome", biomeGroup: sampleInfo.biomeGroup, tier: 2, pick: "uncleared", modifier: "__missing_modifier__" },
    fakeObservation,
    0,
  ).length === 0,
  "missing requested modifier does not fall through to unrelated nodes",
);

console.log("readiness.semantic.test.ts: ok");
