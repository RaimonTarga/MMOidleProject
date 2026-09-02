import {
  addRuneRuleWithReplacement,
  analyzeRuneLoadoutConflicts,
  deriveAutoConfigFromRunes,
} from "./runeDatabase";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const chase = { conditionId: "in-combat", actionId: "chase-enemy" };
const orbit = { conditionId: "in-combat", actionId: "orbit" };

const replacement = addRuneRuleWithReplacement([chase], orbit);
assert(replacement.length === 1, "same-condition movement rule replaces rather than duplicates");
assert(replacement[0]?.actionId === "orbit", "replacement keeps the newly chosen response");

const suppressed = analyzeRuneLoadoutConflicts([
  { conditionId: "always", actionId: "chase-enemy" },
  orbit,
]);
assert(suppressed[0]?.kind === "suppressed", "Always movement rule suppresses later combat movement");

const layered = analyzeRuneLoadoutConflicts([
  { conditionId: "inside-telegraph", actionId: "step-back" },
  chase,
]);
assert(layered[0]?.kind === "overlap", "narrow telegraph response remains legitimate priority layering");

const separate = analyzeRuneLoadoutConflicts([
  { conditionId: "in-combat", actionId: "chase-enemy" },
  { conditionId: "when-idle", actionId: "orbit" },
]);
assert(separate.length === 0, "mutually exclusive conditions do not receive a false conflict warning");

const composed = deriveAutoConfigFromRunes([
  { conditionId: "always", actionId: "avoid-hazards" },
  { conditionId: "in-combat", actionId: "careful-pulling" },
], {
  hpPct: 1,
  inCombat: true,
  inParty: false,
  aggroCount: 1,
});
assert(composed.avoidHazards, "hazard safety claims its independent lane");
assert(composed.carefulPulling, "careful pulling composes with hazard safety");

console.log("runeConflicts.test.ts: ok");
